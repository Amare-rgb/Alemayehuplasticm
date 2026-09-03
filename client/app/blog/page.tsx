// app/blog/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Leaf,
  Search,
  Eye,
  RefreshCw,
  Film,
} from "lucide-react";
import {
  BlogPost,
  FALLBACK_BLOG_POSTS,
  formatBlogImage,
  formatBlogDate,
} from "@/data/blog";
import { useLanguage } from "@/context/LanguageContext";

// ✅ NEW: same regex-based video detection used across the admin panel and
// the backend, so this public page renders videos the same way they were
// saved. `BlogPost` needs a `video: string | null` field for this to work —
// add it in @/data/blog.ts if it isn't there yet, mirroring what the API
// already returns.
const YOUTUBE_ID_REGEX = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
const VIMEO_ID_REGEX = /vimeo\.com\/(?:video\/)?(\d+)/i;
const DAILYMOTION_ID_REGEX = /dailymotion\.com\/(?:video|embed\/video)\/([a-zA-Z0-9]+)/i;
const DIRECT_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];

const getKnownPlatformEmbedUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  const yt = url.match(YOUTUBE_ID_REGEX);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;

  const vm = url.match(VIMEO_ID_REGEX);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;

  const dm = url.match(DAILYMOTION_ID_REGEX);
  if (dm) return `https://www.dailymotion.com/embed/video/${dm[1]}`;

  return null;
};

const isVideoUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  if (getKnownPlatformEmbedUrl(url)) return true;
  const lowerUrl = url.toLowerCase();
  return DIRECT_VIDEO_EXTENSIONS.some(ext => lowerUrl.includes(ext));
};

export default function BlogPage() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>(FALLBACK_BLOG_POSTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // ✅ NEW: resolves a post's media into either a video (with a ready-to-use
  // embed URL for known platforms) or an image, so both render spots below
  // can share the same decision instead of duplicating it.
  const getPostMedia = (post: BlogPost) => {
    const video = (post as { video?: string | null }).video;
    const media = video || post.image;
    const isVideo = video ? true : isVideoUrl(post.image);

    if (isVideo && media) {
      const knownEmbed = getKnownPlatformEmbedUrl(media);
      if (knownEmbed) {
        return { type: 'iframe' as const, url: knownEmbed };
      }
      const fullUrl = media.startsWith('http') ? media : `${apiBaseUrl}${media}`;
      return { type: 'video' as const, url: fullUrl };
    }

    return { type: 'image' as const, url: formatBlogImage(post.image) };
  };

  // Helper for category label
  const getCategoryLabel = (cat: string) => {
    const lower = (cat || "").toLowerCase().trim();
    if (lower === "all") return t("blog.cat_all", "All");
    if (lower === "farming") return t("blog.cat_farming", "Farming");
    if (lower === "sustainability") return t("blog.cat_sustainability", "Sustainability");
    if (lower === "fresh produce" || lower === "produce") return t("blog.cat_fresh_produce", "Fresh Produce");
    if (lower === "our farm" || lower === "farm") return t("blog.cat_our_farm", "Our Farm");
    if (lower === "stories" || lower === "story") return t("blog.cat_stories", "Stories");
    return cat;
  };

  // Fetch blog posts from backend
  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBaseUrl}/api/blog?published=true&limit=50`, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to load blog posts (Status: ${res.status})`);
        }

        const data = await res.json();
        if (isMounted) {
          if (data && Array.isArray(data.posts) && data.posts.length > 0) {
            setPosts(data.posts);
          } else {
            // Keep fallback posts if backend has no posts yet
            setPosts(FALLBACK_BLOG_POSTS);
          }
        }
      } catch (err) {
        const error = err as Error;
        console.warn("Backend blog fetch error, using fallback posts:", error.message);
        if (isMounted) {
          setPosts(FALLBACK_BLOG_POSTS);
          setError("Using cached journal articles (backend connecting...)");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl]);

  // Extract unique categories dynamically from loaded posts
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add("All");
    posts.forEach((p) => {
      if (p.category && typeof p.category === "string" && p.category.trim() !== "") {
        cats.add(p.category.trim());
      }
    });
    return Array.from(cats);
  }, [posts]);

  // Filter posts by category and search term
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory =
        activeCategory === "All" ||
        post.category?.toLowerCase() === activeCategory.toLowerCase();

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === "" ||
        post.title.toLowerCase().includes(query) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(query)) ||
        (post.content && post.content.toLowerCase().includes(query)) ||
        (post.category && post.category.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [posts, activeCategory, searchQuery]);

  // Determine featured post
  const featuredPost = useMemo(() => {
    if (filteredPosts.length === 0) return null;
    return filteredPosts.find((p) => p.featured) || filteredPosts[0];
  }, [filteredPosts]);

  // Regular posts (excluding the featured one)
  const regularPosts = useMemo(() => {
    if (!featuredPost) return filteredPosts;
    return filteredPosts.filter((p) => (p.id ? p.id !== featuredPost.id : p.slug !== featuredPost.slug));
  }, [filteredPosts, featuredPost]);

  return (
    <main className="min-h-screen bg-[var(--cream)] text-[var(--ink)]">
      {/* =========================================================
          BLOG HERO SECTION
      ========================================================= */}
      <section className="relative overflow-hidden bg-[var(--green-950)] text-white">
        {/* Decorative ambient glows */}
        <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[var(--green-800)] opacity-40 blur-3xl" />
        <div className="absolute bottom-[-180px] left-[-120px] h-[400px] w-[400px] rounded-full bg-[var(--lime)] opacity-10 blur-3xl" />

        <div className="relative mx-auto w-[min(1180px,calc(100%-48px))]">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 pt-32 sm:pt-36 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            <Link href="/" className="transition hover:text-[var(--lime)]">
              {t("blog.breadcrumb_home", "Genesis")}
            </Link>
            <span>/</span>
            <span className="text-white/75">{t("blog.breadcrumb_journal", "Journal")}</span>
          </div>

          <div className="grid items-end gap-10 pb-20 pt-8 lg:grid-cols-[1fr_380px]">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)]">
                  <Leaf size={16} />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--lime)]">
                  {t("blog.hero_badge", "The Genesis Journal")}
                </span>
              </div>

              <h1 className="max-w-[780px] font-serif-heading text-[clamp(46px,7vw,92px)] font-medium leading-[0.92] tracking-[-0.055em]">
                {t("blog.hero_title_prefix", "Stories from")}
                <br />
                <em className="text-[var(--lime)]">
                  {t("blog.hero_title_accent", "the field.")}
                </em>
              </h1>
            </div>

            <div className="lg:pb-2">
              <p className="max-w-[360px] text-[15px] leading-[1.8] text-white/65">
                {t(
                  "blog.hero_subtitle",
                  "Ideas, stories, and agronomy insights from Genesis — about regenerative farming, harvest logistics, and local agriculture."
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURED ARTICLE
      ========================================================= */}
      {featuredPost && (
        <section className="relative mx-auto w-[min(1180px,calc(100%-48px))] py-16 sm:py-20">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[var(--lime)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--green-700)]">
                {t("blog.featured_story", "Featured story")}
              </span>
            </div>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--muted)] md:block">
              {t("blog.highlights", "01 / Highlights")}
            </span>
          </div>

          <Link
            href={`/blog/${encodeURIComponent(featuredPost.slug)}`}
            className="group grid overflow-hidden rounded-[2.5rem] bg-[#071a11] shadow-[0_20px_60px_rgba(18,53,35,.12)] lg:grid-cols-[1.2fr_0.8fr]"
          >
            {/* Featured Media - image or video */}
            <div className="relative min-h-[380px] overflow-hidden lg:min-h-[480px]">
              {(() => {
                const media = getPostMedia(featuredPost);
                if (media.type === 'iframe') {
                  return (
                    <>
                      {/* Iframes can't sit inside a <Link>'s click target cleanly,
                          so we disable pointer events on it — clicking the
                          featured block still navigates to the article, and
                          the video is playable from the article page itself. */}
                      <iframe
                        src={media.url}
                        className="absolute inset-0 h-full w-full pointer-events-none"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        title={featuredPost.title}
                      />
                      <span className="absolute right-6 top-6 z-10 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white">
                        <Film size={11} />
                        {t("blog.video_badge", "Video")}
                      </span>
                    </>
                  );
                }
                if (media.type === 'video') {
                  return (
                    <>
                      <video
                        src={media.url}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        muted
                        loop
                        playsInline
                        autoPlay
                      />
                      <span className="absolute right-6 top-6 z-10 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white">
                        <Film size={11} />
                        {t("blog.video_badge", "Video")}
                      </span>
                    </>
                  );
                }
                return (
                  <Image
                    src={media.url}
                    alt={featuredPost.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.src =
                        "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=2200&q=90";
                    }}
                  />
                );
              })()}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none" />
              <span className="absolute left-6 top-6 rounded-full bg-[var(--lime)] px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--green-950)] shadow-md">
                {getCategoryLabel(featuredPost.category)}
              </span>
            </div>

            {/* Featured Content */}
            <div className="flex flex-col justify-between p-8 text-white sm:p-10 lg:p-12">
              <div>
                <div className="mb-8 flex items-center gap-4 text-[9px] uppercase tracking-[0.13em] text-white/50">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={12} className="text-[var(--lime)]" />
                    {formatBlogDate(featuredPost.createdAt)}
                  </span>
                  <span className="h-3 w-px bg-white/20" />
                  <span className="flex items-center gap-1.5">
                    <Clock3 size={12} className="text-[var(--lime)]" />
                    {featuredPost.readTime || 4} {t("blog.min_read", "min read")}
                  </span>
                  {featuredPost.views && featuredPost.views > 0 && (
                    <>
                      <span className="h-3 w-px bg-white/20" />
                      <span className="flex items-center gap-1">
                        <Eye size={12} className="text-[var(--lime)]" />
                        {featuredPost.views} {t("blog.views", "views")}
                      </span>
                    </>
                  )}
                </div>

                <h2 className="font-serif-heading text-[clamp(28px,3.5vw,46px)] font-medium leading-[1.05] tracking-[-0.04em] group-hover:text-[var(--lime)] transition-colors">
                  {featuredPost.title}
                </h2>

                <p className="mt-5 text-sm leading-[1.8] text-white/70 line-clamp-3">
                  {featuredPost.excerpt}
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)] font-bold text-xs">
                    {featuredPost.author?.name ? featuredPost.author.name.charAt(0).toUpperCase() : "G"}
                  </div>
                  <span className="text-xs font-semibold text-white/90">
                    {featuredPost.author?.name || "Genesis Farm Team"}
                  </span>
                </div>

                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--lime)] group-hover:translate-x-1 transition-transform">
                  {t("blog.read_article", "Read Article")}
                  <ArrowRight size={15} />
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* =========================================================
          CONTROLS: SEARCH & CATEGORY FILTER TABS
      ========================================================= */}
      <section className="border-y border-[#19472d]/10 bg-white py-6">
        <div className="mx-auto w-[min(1180px,calc(100%-48px))]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => {
                const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[#123523] text-white shadow-md"
                        : "bg-gray-100/80 text-[#123523] hover:bg-[#f6f3e9] hover:text-[#28633e]"
                    }`}
                  >
                    {getCategoryLabel(cat)}
                  </button>
                );
              })}
            </div>

            {/* Search Input Box */}
            <div className="relative min-w-[260px] max-w-sm">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#69736b]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("blog.search_placeholder", "Search farm stories & insights...")}
                className="w-full rounded-full border border-gray-200 bg-gray-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-[#123523] outline-none transition focus:border-[#28633e] focus:bg-white focus:ring-2 focus:ring-[#b9d873]/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-700"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          ARTICLE GRID SECTION
      ========================================================= */}
      <section className="mx-auto w-[min(1180px,calc(100%-48px))] py-16 sm:py-20">
        {loading ? (
          /* Loading Skeletons */
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-[2rem] border border-[rgba(20,33,25,.07)] bg-white p-5 animate-pulse"
              >
                <div className="aspect-[16/10] w-full rounded-2xl bg-gray-200" />
                <div className="mt-5 space-y-3">
                  <div className="h-4 w-20 rounded bg-gray-200" />
                  <div className="h-6 w-full rounded bg-gray-200" />
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          /* Empty Search Result */
          <div className="rounded-[2.5rem] border border-[rgba(20,33,25,.08)] bg-white p-12 text-center shadow-sm">
            <Leaf size={36} className="mx-auto mb-4 text-[#28633e]" />
            <h3 className="font-serif-heading text-2xl font-bold text-[#123523]">
              {t("blog.no_articles_found", "No matching articles found")}
            </h3>
            <p className="mt-2 text-xs text-[#69736b]">
              {t("blog.no_articles_desc", "Try adjusting your search keywords or switching category filters.")}
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory("All");
                setSearchQuery("");
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#123523] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#19472d] transition"
            >
              <RefreshCw size={13} />
              {t("blog.reset_filters", "Reset Filters")}
            </button>
          </div>
        ) : (
          /* Posts Grid */
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {regularPosts.map((post) => {
              const media = getPostMedia(post);
              return (
                <article
                  key={post.id || post.slug}
                  className="group flex flex-col justify-between overflow-hidden rounded-[2rem] border border-[rgba(20,33,25,.08)] bg-white shadow-[0_10px_30px_rgba(18,53,35,.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(18,53,35,.09)]"
                >
                  <div>
                    {/* Article Thumbnail - image or video */}
                    <Link
                      href={`/blog/${encodeURIComponent(post.slug)}`}
                      className="relative block aspect-[16/10] overflow-hidden bg-[#071a11]"
                    >
                      {media.type === 'iframe' ? (
                        <>
                          <iframe
                            src={media.url}
                            className="absolute inset-0 h-full w-full pointer-events-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            title={post.title}
                          />
                          <span className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
                            <Film size={10} />
                            {t("blog.video_badge", "Video")}
                          </span>
                        </>
                      ) : media.type === 'video' ? (
                        <>
                          <video
                            src={media.url}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            muted
                            loop
                            playsInline
                            autoPlay
                          />
                          <span className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
                            <Film size={10} />
                            {t("blog.video_badge", "Video")}
                          </span>
                        </>
                      ) : (
                        <Image
                          src={media.url}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.src =
                              "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=85";
                          }}
                        />
                      )}
                      <span className="absolute left-4 top-4 rounded-full bg-[#123523]/90 backdrop-blur-md px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[var(--lime)] shadow-sm">
                        {getCategoryLabel(post.category)}
                      </span>
                    </Link>

                    {/* Body Info */}
                    <div className="p-6">
                      <div className="mb-3 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-[#69736b]">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={12} className="text-[#28633e]" />
                          {formatBlogDate(post.createdAt)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock3 size={12} className="text-[#28633e]" />
                          {post.readTime || 3} {t("blog.min_read", "min read")}
                        </span>
                      </div>

                      <Link href={`/blog/${encodeURIComponent(post.slug)}`}>
                        <h3 className="font-serif-heading text-xl font-bold leading-snug text-[#123523] group-hover:text-[#28633e] transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                      </Link>

                      <p className="mt-2.5 text-xs leading-relaxed text-[#69736b] line-clamp-3">
                        {post.excerpt || post.content}
                      </p>
                    </div>
                  </div>

                  {/* Footer Author & Action */}
                  <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)] text-[10px] font-bold">
                        {post.author?.name ? post.author.name.charAt(0).toUpperCase() : "G"}
                      </div>
                      <span className="text-[11px] font-medium text-[#123523] truncate max-w-[110px]">
                        {post.author?.name || "Genesis Farm"}
                      </span>
                    </div>

                    <Link
                      href={`/blog/${encodeURIComponent(post.slug)}`}
                      className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#28633e] group-hover:text-[#123523] transition-colors"
                    >
                      <span>{t("blog.read_card", "Read")}</span>
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================================
          NEWSLETTER / STAY CONNECTED CTA
      ========================================================= */}
      <section className="bg-[var(--green-950)] px-6 py-20 text-center text-white">
        <div className="mx-auto max-w-[700px]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)]">
            <Leaf size={20} />
          </div>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--lime)]">
            {t("blog.hero_badge", "The Genesis Journal")}
          </p>
          <h2 className="mt-4 font-serif-heading text-[clamp(36px,5.5vw,58px)] font-medium leading-none tracking-[-0.045em]">
            {t("blog.cta_title_prefix", "Stay connected")}
            <br />
            <em className="text-[var(--lime)]">{t("blog.cta_title_accent", "to the harvest.")}</em>
          </h2>
          <p className="mx-auto mt-5 max-w-[450px] text-xs leading-[1.8] text-white/60">
            {t(
              "blog.cta_subtitle",
              "Discover seasonal agricultural updates, farming insights, and local marketplace stories from Genesis."
            )}
          </p>
          <Link
            href="/shop"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[var(--lime)] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--green-950)] transition hover:-translate-y-0.5 shadow-lg"
          >
            {t("blog.cta_btn", "Explore Fresh Marketplace")}
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  );
}