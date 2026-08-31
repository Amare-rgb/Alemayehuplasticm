// app/blog/[slug]/page.tsx
import {
  BlogPost,
  FALLBACK_BLOG_POSTS,
} from "@/data/blog";
import BlogArticleDetails from "@/components/blog/BlogArticleDetails";

type BlogDetailsPageProps = {
  params: Promise<{
    slug: string;
  }> | { slug: string };
};

export default async function BlogDetailsPage({ params }: BlogDetailsPageProps) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug || "";
  const slug = decodeURIComponent(rawSlug).toLowerCase().trim();

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  let fetchedPost: BlogPost | null = null;
  let allPosts: BlogPost[] = FALLBACK_BLOG_POSTS;

  // 1. Fetch single post from backend
  try {
    const res = await fetch(`${apiBaseUrl}/api/blog/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.post) {
        fetchedPost = data.post;
      }
    }
  } catch (err) {
    console.warn("Could not fetch blog post from backend on details page:", err);
  }

  // 2. Fetch list of posts for related articles
  try {
    const listRes = await fetch(`${apiBaseUrl}/api/blog?published=true&limit=10`, {
      cache: "no-store",
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      if (listData && Array.isArray(listData.posts) && listData.posts.length > 0) {
        allPosts = listData.posts;
      }
    }
  } catch (err) {
    console.warn("Could not fetch related blog posts from backend:", err);
  }

  // Resolve final post (fetched or fallback)
  const post: BlogPost | undefined =
    fetchedPost ||
    FALLBACK_BLOG_POSTS.find((item) => item.slug.toLowerCase() === slug) ||
    FALLBACK_BLOG_POSTS.find((item) => item.id.toLowerCase() === slug) ||
    FALLBACK_BLOG_POSTS.find(
      (item) =>
        slug.includes(item.slug.toLowerCase()) ||
        item.slug.toLowerCase().includes(slug)
    );

  // Related posts (excluding the active one)
  const relatedPosts = post
    ? allPosts
        .filter((item) => item.slug !== post.slug && item.id !== post.id)
        .slice(0, 3)
    : [];

  return <BlogArticleDetails post={post} relatedPosts={relatedPosts} />;
}