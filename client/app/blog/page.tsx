"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Leaf,
  Search,
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
  featured?: boolean;
}

// Default image for fallback
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=2200&q=90';

// Helper function to get image URL
const getImageUrl = (image: string | null): string => {
  if (!image) return DEFAULT_IMAGE;
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  return `${API_URL}${image}`;
};

// Image Component with Next.js Image
const BlogImage: React.FC<{ src: string; alt: string; className?: string; priority?: boolean }> = ({
  src,
  alt,
  className = '',
  priority = false
}) => {
  const [error, setError] = useState(false);
  const imageUrl = getImageUrl(src);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 ${className}`}>
        <Leaf className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      fill
      className={`object-cover ${className}`}
      onError={() => setError(true)}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority={priority}
      unoptimized={imageUrl.startsWith('http')}
    />
  );
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch blog posts from backend API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const url = `${API_URL}/api/blog?published=true&limit=50`;
        console.log('📡 Fetching posts from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch posts: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Blog posts from API:', data);
        
        let postsData: BlogPost[] = [];
        if (data && data.posts) {
          postsData = data.posts;
        } else if (Array.isArray(data)) {
          postsData = data;
        }
        
        // Mark the first post as featured if none is marked
        if (postsData.length > 0 && !postsData.some(p => p.featured)) {
          postsData[0] = { ...postsData[0], featured: true };
        }
        
        setPosts(postsData);
      } catch (err) {
        console.error('❌ Error fetching blog posts:', err);
        setError('Failed to load blog posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, []);

  // Get unique categories from posts
  const availableCategories = ["All", ...new Set(posts.map(p => p.category).filter(Boolean))];

  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      activeCategory === "All" || post.category === activeCategory;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      post.title.toLowerCase().includes(query) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(query)) ||
      false;

    return matchesCategory && matchesSearch;
  });

  const featuredPost = posts.find((post) => post.featured);
  const regularPosts = filteredPosts.filter((post) => !post.featured);

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

  const getReadTime = (post: BlogPost) => {
    const minutes = post.readTime || 3;
    return `${minutes} min read`;
  };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--cream)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading stories...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen bg-[var(--cream)] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Leaf className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--cream)] text-[var(--ink)]">

      {/* =========================================================
          BLOG HERO
      ========================================================= */}
      <section className="relative overflow-hidden bg-[var(--green-950)] text-white">

        {/* Decorative circle */}
        <div
          className="
            absolute
            -right-40
            -top-40
            h-[520px]
            w-[520px]
            rounded-full
            bg-[var(--green-800)]
            opacity-40
            blur-3xl
          "
        />

        <div
          className="
            absolute
            bottom-[-180px]
            left-[-120px]
            h-[400px]
            w-[400px]
            rounded-full
            bg-[var(--lime)]
            opacity-10
            blur-3xl
          "
        />

        <div className="relative mx-auto w-[min(1180px,calc(100%-48px))]">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 pt-36 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            <Link
              href="/"
              className="transition hover:text-[var(--lime)]"
            >
              Genesis
            </Link>

            <span>/</span>

            <span className="text-white/75">Journal</span>
          </div>

          <div className="grid items-end gap-12 pb-20 pt-8 lg:grid-cols-[1fr_380px]">

            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)]">
                  <Leaf size={16} />
                </span>

                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--lime)]">
                  The Genesis Journal
                </span>
              </div>

              <h1 className="max-w-[780px] font-serif-heading text-[clamp(56px,8vw,100px)] font-medium leading-[0.92] tracking-[-0.055em]">
                Stories from
                <br />
                the <em className="text-[var(--lime)]">field.</em>
              </h1>
            </div>

            <div className="lg:pb-2">
              <p className="max-w-[360px] text-[15px] leading-[1.8] text-white/65">
                Ideas, stories, and insights from Genesis — about
                farming, sustainability, fresh food, and the people
                who make it all possible.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* =========================================================
          FEATURED ARTICLE
      ========================================================= */}
      {featuredPost && (
        <section className="relative mx-auto w-[min(1180px,calc(100%-48px))] py-20">

          <div className="mb-7 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[var(--lime)]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--green-700)]">
                Featured story
              </span>
            </div>

            <span className="hidden text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--muted)] md:block">
              01 / Featured
            </span>
          </div>

          <Link
            href={`/blog/${featuredPost.slug}`}
            className="
              group
              grid
              overflow-hidden
              bg-[var(--green-900)]
              lg:grid-cols-[1.2fr_0.8fr]
            "
          >
            {/* Image */}
            <div className="relative min-h-[430px] overflow-hidden lg:min-h-[540px]">
              <BlogImage
                src={featuredPost.image || DEFAULT_IMAGE}
                alt={featuredPost.title}
                priority={true}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              <span
                className="
                  absolute
                  left-6
                  top-6
                  bg-[var(--lime)]
                  px-3
                  py-2
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.15em]
                  text-[var(--green-950)]
                "
              >
                {featuredPost.category || 'Featured'}
              </span>

            </div>

            {/* Content */}
            <div className="flex flex-col justify-between p-8 text-white sm:p-12 lg:p-14">

              <div>
                <div className="mb-10 flex items-center gap-4 text-[9px] uppercase tracking-[0.13em] text-white/45">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={12} />
                    {formatDate(featuredPost.createdAt)}
                  </span>

                  <span className="h-3 w-px bg-white/20" />

                  <span className="flex items-center gap-1.5">
                    <Clock3 size={12} />
                    {getReadTime(featuredPost)}
                  </span>
                </div>

                <h2 className="max-w-[520px] font-serif-heading text-[clamp(34px,4vw,54px)] font-medium leading-[1.02] tracking-[-0.04em]">
                  {featuredPost.title}
                </h2>

                <p className="mt-7 max-w-[430px] text-sm leading-[1.8] text-white/60">
                  {featuredPost.excerpt || featuredPost.content?.substring(0, 150) || ''}
                </p>
              </div>

              <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-6">

                <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
                  Read article
                </span>

                <span
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-full
                    bg-[var(--lime)]
                    text-[var(--green-950)]
                    transition-transform
                    duration-300
                    group-hover:rotate-45
                  "
                >
                  <ArrowUpRight size={18} />
                </span>

              </div>

            </div>
          </Link>
        </section>
      )}


      {/* =========================================================
          ARTICLES / FILTERS
      ========================================================= */}
      <section
        id="articles"
        className="mx-auto w-[min(1180px,calc(100%-48px))] pb-24"
      >

        {/* Section heading */}
        <div className="mb-10 flex flex-col justify-between gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end">

          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--green-700)]">
              Explore the journal
            </span>

            <h2 className="mt-3 font-serif-heading text-[clamp(38px,5vw,56px)] font-medium leading-none tracking-[-0.04em]">
              Latest stories
            </h2>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-[250px]">
            <Search
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            />

            <input
              type="text"
              placeholder="Search stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                h-11
                w-full
                rounded-full
                border
                border-[var(--line)]
                bg-white/60
                pl-10
                pr-4
                text-xs
                outline-none
                transition
                placeholder:text-[var(--muted)]
                focus:border-[var(--green-700)]
                focus:bg-white
              "
            />
          </div>
        </div>


        {/* Category filters */}
        <div className="mb-12 flex gap-2 overflow-x-auto pb-2">

          {availableCategories.map((category) => {
            const active = activeCategory === category;

            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`
                  shrink-0
                  rounded-full
                  border
                  px-5
                  py-2.5
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.08em]
                  transition-all
                  duration-300

                  ${
                    active
                      ? "border-[var(--green-950)] bg-[var(--green-950)] text-white"
                      : "border-[var(--line)] bg-transparent text-[var(--green-800)] hover:border-[var(--green-700)] hover:bg-white"
                  }
                `}
              >
                {category}
              </button>
            );
          })}

        </div>


        {/* =====================================================
            ARTICLE GRID
        ====================================================== */}
        {regularPosts.length > 0 ? (
          <div className="grid gap-x-7 gap-y-14 md:grid-cols-2 lg:grid-cols-3">

            {regularPosts.map((post, index) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group"
              >

                {/* Image */}
                <div className="relative aspect-[1.18] overflow-hidden bg-[var(--cream-dark)]">
                  <BlogImage
                    src={post.image || DEFAULT_IMAGE}
                    alt={post.title}
                  />

                  <div className="absolute left-4 top-4">
                    <span className="bg-[var(--cream)] px-3 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--green-800)]">
                      {post.category || 'General'}
                    </span>
                  </div>

                  {/* Number */}
                  <div className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(11,36,25,.8)] text-[9px] font-bold text-white backdrop-blur-md">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                </div>


                {/* Content */}
                <div className="pt-5">

                  <div className="flex items-center gap-3 text-[9px] font-medium uppercase tracking-[0.1em] text-[var(--muted)]">
                    <span>{formatDate(post.createdAt)}</span>

                    <span className="h-3 w-px bg-[var(--line)]" />

                    <span>{getReadTime(post)}</span>
                  </div>

                  <h3
                    className="
                      mt-4
                      font-serif-heading
                      text-[25px]
                      font-medium
                      leading-[1.08]
                      tracking-[-0.025em]
                      transition-colors
                      duration-300
                      group-hover:text-[var(--green-700)]
                    "
                  >
                    {post.title}
                  </h3>

                  <p className="mt-3 line-clamp-2 text-[12px] leading-[1.7] text-[var(--muted)]">
                    {post.excerpt || post.content?.substring(0, 120) || ''}
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.13em] text-[var(--green-800)]">
                    Read story

                    <ArrowRight
                      size={13}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </div>

                </div>

              </Link>
            ))}

          </div>
        ) : (
          /* Empty state */
          <div className="flex min-h-[300px] flex-col items-center justify-center border border-dashed border-[var(--line)] text-center">

            <Leaf
              size={28}
              className="mb-4 text-[var(--green-700)]"
            />

            <h3 className="font-serif-heading text-2xl">
              No stories found
            </h3>

            <p className="mt-2 text-xs text-[var(--muted)]">
              {searchQuery || activeCategory !== "All" 
                ? "Try another category or search term." 
                : "Check back soon for new stories."}
            </p>

          </div>
        )}

      </section>


      {/* =========================================================
          FROM THE FIELD
      ========================================================= */}
      <section className="overflow-hidden bg-[var(--cream-dark)] py-24">

        <div className="mx-auto w-[min(1180px,calc(100%-48px))]">

          <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">

            {/* Text */}
            <div>

              <div className="mb-5 flex items-center gap-3">
                <Sprout
                  size={17}
                  className="text-[var(--green-700)]"
                />

                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--green-700)]">
                  From the field
                </span>
              </div>

              <h2 className="max-w-[470px] font-serif-heading text-[clamp(42px,5vw,64px)] font-medium leading-[0.98] tracking-[-0.045em]">
                There is a story behind
                <em className="text-[var(--green-700)]">
                  {" "}every harvest.
                </em>
              </h2>

              <p className="mt-6 max-w-[420px] text-sm leading-[1.8] text-[var(--muted)]">
                We believe people should know where their food comes
                from. Our journal takes you closer to the fields,
                the farmers, and the ideas shaping the future of
                agriculture.
              </p>

              <Link
                href="#articles"
                className="
                  mt-8
                  inline-flex
                  items-center
                  gap-3
                  border-b
                  border-[var(--green-800)]
                  pb-2
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.13em]
                  text-[var(--green-800)]
                "
              >
                Explore all stories

                <ArrowUpRight size={14} />
              </Link>

            </div>


            {/* Image composition - using static images since these are fixed decorative images */}
            <div className="grid grid-cols-[1.2fr_.8fr] gap-4">

              <div className="aspect-[0.85] overflow-hidden relative">
                <Image
                  src="https://images.unsplash.com/photo-1644101211459-7f9be46fad04?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Farmer working in a field"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              <div className="mt-16 aspect-[0.75] overflow-hidden relative">
                <Image
                  src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=85"
                  alt="Fresh agricultural field"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =========================================================
          NEWSLETTER
      ========================================================= */}
      <section className="bg-[var(--green-950)] py-24 text-white">

        <div className="mx-auto w-[min(900px,calc(100%-48px))] text-center">

          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)]">
            <Leaf size={20} />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--lime)]">
            Stay close to the farm
          </span>

          <h2 className="mx-auto mt-5 max-w-[700px] font-serif-heading text-[clamp(42px,6vw,68px)] font-medium leading-[0.98] tracking-[-0.045em]">
            Fresh stories,
            <br />
            <em className="text-[var(--lime)]">straight to you.</em>
          </h2>

          <p className="mx-auto mt-6 max-w-[480px] text-sm leading-[1.8] text-white/55">
            Get occasional stories from Genesis — farm updates,
            seasonal produce, sustainability ideas, and more.
          </p>

          <form className="mx-auto mt-9 flex max-w-[500px] gap-2 max-sm:flex-col">

            <input
              type="email"
              placeholder="Your email address"
              className="
                h-14
                flex-1
                rounded-full
                border
                border-white/10
                bg-white/10
                px-6
                text-sm
                text-white
                outline-none
                placeholder:text-white/35
                focus:border-[var(--lime)]
              "
            />

            <button
              type="submit"
              className="
                flex
                h-14
                items-center
                justify-center
                gap-2
                rounded-full
                bg-[var(--lime)]
                px-7
                text-[10px]
                font-bold
                uppercase
                tracking-[0.1em]
                text-[var(--green-950)]
                transition
                hover:-translate-y-0.5
                hover:shadow-lg
              "
            >
              Subscribe
              <ArrowUpRight size={15} />
            </button>

          </form>

        </div>

      </section>

    </main>
  );
}