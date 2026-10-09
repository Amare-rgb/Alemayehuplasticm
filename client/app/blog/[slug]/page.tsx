// app/blog/[slug]/page.tsx
import { BlogPost, FALLBACK_BLOG_POSTS } from "@/data/blog";
import BlogArticleDetails from "@/components/blog/BlogArticleDetails";
import { notFound } from "next/navigation";

type BlogDetailsPageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

/* ────────────────────────────────────────────────────────────
   API base — strip trailing slash so `${base}${path}` never double-slashes
   ──────────────────────────────────────────────────────────── */
const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, "");

const DEFAULT_IMAGE = "/placeholder.svg";

/**
 * Normalize image URLs inside a fetched BlogPost so the client component
 * never has to deal with unresolved "/uploads/..." paths.
 *
 * - Cloudinary / absolute URL  → keep as-is
 * - /uploads/...               → keep as-is (client's resolveImage will
 *                                handle the fallback if it 404s)
 * - empty / missing            → leave undefined (client shows placeholder)
 */
function normalizePost(post: BlogPost): BlogPost {
  const rawImage = (post as { image?: string | null }).image;
  const rawVideo = (post as { video?: string | null }).video;

  return {
    ...post,
    image:
      typeof rawImage === "string" && rawImage.trim().length > 0
        ? rawImage.trim()
        : undefined,
    // keep video as-is; the client detects platform embeds
    ...(rawVideo !== undefined ? { video: rawVideo } : {}),
  } as BlogPost;
}

export default async function BlogDetailsPage({ params }: BlogDetailsPageProps) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug || "";
  const slug = decodeURIComponent(rawSlug).toLowerCase().trim();

  if (!slug) notFound();

  let fetchedPost: BlogPost | null = null;
  let allPosts: BlogPost[] = FALLBACK_BLOG_POSTS;

  // 1. Fetch single post from backend
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/blog/${encodeURIComponent(slug)}`,
      { cache: "no-store" }
    );

    if (res.ok) {
      const data = await res.json();
      if (data && data.post) {
        fetchedPost = normalizePost(data.post as BlogPost);
      }
    } else if (res.status === 404) {
      console.log(`Blog post "${slug}" not found on backend`);
    }
  } catch (err) {
    console.warn("Could not fetch blog post from backend on details page:", err);
  }

  // 2. Fetch list of posts for related articles
  try {
    const listRes = await fetch(
      `${API_BASE_URL}/api/blog?published=true&limit=10`,
      { cache: "no-store" }
    );
    if (listRes.ok) {
      const listData = await listRes.json();
      if (
        listData &&
        Array.isArray(listData.posts) &&
        listData.posts.length > 0
      ) {
        allPosts = listData.posts.map(normalizePost);
      }
    }
  } catch (err) {
    console.warn("Could not fetch related blog posts from backend:", err);
  }

  // 3. Resolve final post (fetched or fallback)
  const post: BlogPost | undefined =
    fetchedPost ||
    FALLBACK_BLOG_POSTS.find((item) => item.slug.toLowerCase() === slug) ||
    FALLBACK_BLOG_POSTS.find((item) => item.id?.toLowerCase() === slug) ||
    FALLBACK_BLOG_POSTS.find(
      (item) =>
        slug.includes(item.slug.toLowerCase()) ||
        item.slug.toLowerCase().includes(slug)
    );

  // ✅ If still not found, render Next.js 404 page
  if (!post) {
    notFound();
  }

  // 4. Related posts (exclude current)
  const relatedPosts = allPosts
    .filter((item) => item.slug !== post.slug && item.id !== post.id)
    .slice(0, 3);

  return <BlogArticleDetails post={post} relatedPosts={relatedPosts} />;
}