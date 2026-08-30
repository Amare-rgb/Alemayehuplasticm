// app/blog/[slug]/page.tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Leaf,
  Sprout,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface BlogPost {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  image: string | null;
  readTime: number;
  published: boolean;
  views: number;
  createdAt: string;
  author: {
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// ✅ Fetch single blog post from backend
async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const url = `${API_URL}/api/blog/${slug}`;
    console.log('📡 Fetching post from:', url);
    
    const res = await fetch(url, {
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      console.error(`Failed to fetch post: ${res.status}`);
      return null;
    }

    const data = await res.json();
    console.log('📊 Post data:', data);
    
    // Handle different response formats
    const post = data.post || data.data || data;
    
    // If post has content but no excerpt, generate one
    if (post && post.content && !post.excerpt) {
      post.excerpt = post.content.substring(0, 150) + '...';
    }
    
    return post;
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

// ✅ Fetch all posts for related posts
async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const url = `${API_URL}/api/blog?published=true&limit=50`;
    const res = await fetch(url, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.posts || [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

export default async function BlogDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Fetch the post
  const post = await getBlogPost(slug);

  // If no post found, return 404
  if (!post) {
    notFound();
  }

  // Get related posts (same category, excluding current)
  const allPosts = await getAllPosts();
  const relatedPosts = allPosts
    .filter((p) => p.id !== post.id && p.category === post.category)
    .slice(0, 3);

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Recent';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  // Get read time string
  const getReadTime = (post: BlogPost) => {
    const minutes = post.readTime || 3;
    return `${minutes} min read`;
  };

  // Get author name
  const getAuthorName = (post: BlogPost) => {
    return post.author?.name || 'Genesis Team';
  };

  // Get image URL with fallback
  const getImageUrl = (post: BlogPost) => {
    if (post.image) {
      return post.image.startsWith('http') ? post.image : `${API_URL}${post.image}`;
    }
    return 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=2200&q=90';
  };

  return (
    <main className="min-h-screen bg-[var(--cream)] text-[var(--ink)]">
      {/* =========================================================
          ARTICLE HEADER
      ========================================================= */}
      <section className="bg-[var(--green-950)] pt-8 text-white">
        <div className="mx-auto w-[min(1000px,calc(100%-48px))] pb-32">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            <Link
              href="/"
              className="transition hover:text-[var(--lime)]"
            >
              Genesis
            </Link>
            <span>/</span>
            <Link
              href="/blog"
              className="transition hover:text-[var(--lime)]"
            >
              Journal
            </Link>
            <span>/</span>
            <span className="max-w-[180px] truncate text-white/70">
              {post.category || 'General'}
            </span>
          </div>

          {/* Category */}
          <div className="mt-14 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[var(--lime)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--lime)]">
              {post.category || 'General'}
            </span>
          </div>

          {/* Title */}
          <h1
            className="
              mt-6
              max-w-[950px]
              font-serif-heading
              text-[clamp(48px,7vw,88px)]
              font-medium
              leading-[0.98]
              tracking-[-0.055em]
            "
          >
            {post.title}
          </h1>

          {/* Excerpt */}
          <p
            className="
              mt-7
              max-w-[700px]
              text-[15px]
              leading-[1.8]
              text-white/60
            "
          >
            {post.excerpt || post.content?.substring(0, 150) || ''}
          </p>

          {/* Metadata */}
          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-white/10 py-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/55">
              <CalendarDays size={13} />
              {formatDate(post.createdAt)}
            </div>
            <span className="h-4 w-px bg-white/15 max-sm:hidden" />
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/55">
              <Clock3 size={13} />
              {getReadTime(post)}
            </div>
            <span className="h-4 w-px bg-white/15 max-sm:hidden" />
            <div className="text-[10px] uppercase tracking-[0.12em] text-white/55">
              By{" "}
              <span className="text-white">
                {getAuthorName(post)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          HERO IMAGE
      ========================================================= */}
      <section className="mx-auto w-[min(1180px,calc(100%-48px))]">
        <div className="relative -mt-16 aspect-[16/8] overflow-hidden lg:aspect-[16/7.2]">
          <Image
            src={getImageUrl(post)}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
          <div className="absolute bottom-5 left-5 flex items-center gap-2 bg-[rgba(11,36,25,.8)] px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md">
            <Leaf size={12} className="text-[var(--lime)]" />
            From the Genesis fields
          </div>
        </div>
      </section>

      {/* =========================================================
          ARTICLE CONTENT
      ========================================================= */}
      <article className="mx-auto w-[min(760px,calc(100%-48px))] py-20">
        {/* Render content with proper formatting */}
        <div 
          className="prose prose-lg prose-green max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content || '' }}
        />

        {/* Article Footer */}
        <div className="mt-16 border-t border-[var(--line)] pt-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--green-950)] text-[var(--lime)]">
                <Sprout size={15} />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--green-950)]">
                  Written by Genesis
                </p>
                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  Farming with purpose.
                </p>
              </div>
            </div>
            <Link
              href="/blog"
              className="
                inline-flex
                items-center
                gap-2
                text-[10px]
                font-bold
                uppercase
                tracking-[0.13em]
                text-[var(--green-800)]
              "
            >
              <ArrowLeft size={14} />
              Back to journal
            </Link>
          </div>
        </div>
      </article>

      {/* =========================================================
          RELATED STORIES
      ========================================================= */}
      {relatedPosts.length > 0 && (
        <section className="bg-[var(--cream-dark)] py-20">
          <div className="mx-auto w-[min(1180px,calc(100%-48px))]">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[var(--lime)]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--green-700)]">
                    Keep exploring
                  </span>
                </div>
                <h2 className="mt-3 font-serif-heading text-[42px] font-medium leading-none tracking-[-0.04em]">
                  More from the journal
                </h2>
              </div>
              <Link
                href="/blog"
                className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--green-800)] sm:flex"
              >
                View all
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid gap-7 md:grid-cols-3">
              {relatedPosts.map((related) => {
                const imageUrl = related.image 
                  ? (related.image.startsWith('http') ? related.image : `${API_URL}${related.image}`)
                  : 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=2200&q=90';
                  
                return (
                  <Link
                    key={related.id}
                    href={`/blog/${related.slug}`}
                    className="group"
                  >
                    <div className="relative aspect-[1.25] overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={related.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <div className="pt-5">
                      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--green-700)]">
                        {related.category || 'General'}
                      </span>
                      <h3
                        className="
                          mt-3
                          font-serif-heading
                          text-[24px]
                          font-medium
                          leading-[1.1]
                          tracking-[-0.025em]
                          transition-colors
                          group-hover:text-[var(--green-700)]
                        "
                      >
                        {related.title}
                      </h3>
                      <div className="mt-4 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--green-800)]">
                        Read story
                        <ArrowRight
                          size={13}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          NEWSLETTER CTA
      ========================================================= */}
      <section className="bg-[var(--green-950)] px-6 py-24 text-center text-white">
        <div className="mx-auto max-w-[700px]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)]">
            <Leaf size={20} />
          </div>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--lime)]">
            The Genesis Journal
          </p>
          <h2 className="mt-5 font-serif-heading text-[clamp(40px,6vw,64px)] font-medium leading-none tracking-[-0.045em]">
            Stay connected
            <br />
            to the <em className="text-[var(--lime)]">farm.</em>
          </h2>
          <p className="mx-auto mt-6 max-w-[450px] text-sm leading-[1.8] text-white/50">
            Discover seasonal stories, farming insights, and news
            from Genesis.
          </p>
          <Link
            href="/blog"
            className="
              mt-8
              inline-flex
              items-center
              gap-3
              rounded-full
              bg-[var(--lime)]
              px-6
              py-3.5
              text-[10px]
              font-bold
              uppercase
              tracking-[0.12em]
              text-[var(--green-950)]
              transition
              hover:-translate-y-0.5
            "
          >
            Explore the journal
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  );
}