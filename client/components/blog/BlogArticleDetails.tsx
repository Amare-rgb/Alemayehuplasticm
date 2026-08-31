// components/blog/BlogArticleDetails.tsx
"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Leaf,
  Eye,
} from "lucide-react";
import {
  BlogPost,
  formatBlogImage,
  formatBlogDate,
} from "@/data/blog";
import { useLanguage } from "@/context/LanguageContext";

interface BlogArticleDetailsProps {
  post?: BlogPost;
  relatedPosts: BlogPost[];
}

function FormattedArticleContent({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-6 text-[15px] sm:text-base leading-[1.9] text-[#2c3d32]">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Heading 3 / ###
        if (trimmed.startsWith("### ")) {
          return (
            <h3
              key={idx}
              className="font-serif-heading text-2xl sm:text-3xl font-medium tracking-tight text-[#123523] pt-6 pb-2"
            >
              {trimmed.replace(/^###\s+/, "")}
            </h3>
          );
        }

        // Heading 2 / ##
        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={idx}
              className="font-serif-heading text-3xl sm:text-4xl font-medium tracking-tight text-[#123523] pt-8 pb-3"
            >
              {trimmed.replace(/^##\s+/, "")}
            </h2>
          );
        }

        // Blockquote / >
        if (trimmed.startsWith(">")) {
          return (
            <blockquote
              key={idx}
              className="my-8 border-l-4 border-[var(--lime)] bg-[#f6f3e9] p-6 sm:p-8 rounded-r-2xl font-serif-heading text-lg sm:text-xl italic text-[#123523] shadow-sm"
            >
              {trimmed.replace(/^>\s*/gm, "")}
            </blockquote>
          );
        }

        // Regular Paragraph
        return (
          <p key={idx} className="text-[#3c4a40]">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default function BlogArticleDetails({ post, relatedPosts }: BlogArticleDetailsProps) {
  const { t } = useLanguage();

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

  if (!post) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--cream)] px-6 pt-24 pb-16">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f6f3e9] text-[#28633e] shadow-sm">
            <Leaf size={32} />
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--green-700)]">
            {t("blog.hero_badge", "The Genesis Journal")}
          </p>

          <h1 className="mt-3 font-serif-heading text-3xl sm:text-4xl font-bold text-[#123523]">
            {t("blog.not_found_title", "Article Not Found")}
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-[#69736b]">
            {t(
              "blog.not_found_desc",
              "The article you are looking for may have been updated or moved. You can browse other stories in our journal."
            )}
          </p>

          <Link
            href="/blog"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#123523] px-7 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#19472d] transition shadow-md"
          >
            <ArrowLeft size={14} />
            {t("blog.back_to_journal", "Back to Journal")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--cream)] text-[var(--ink)]">
      {/* =========================================================
          ARTICLE HERO HEADER
      ========================================================= */}
      <section className="relative overflow-hidden bg-[var(--green-950)] pt-32 pb-24 text-white">
        {/* Decorative ambient background glows */}
        <div className="absolute -right-32 -top-32 h-[450px] w-[450px] rounded-full bg-[var(--green-800)] opacity-40 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-[350px] w-[350px] rounded-full bg-[var(--lime)] opacity-10 blur-3xl" />

        <div className="relative mx-auto w-[min(960px,calc(100%-48px))]">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
            <Link href="/" className="transition hover:text-[var(--lime)]">
              {t("blog.breadcrumb_home", "Genesis")}
            </Link>
            <span>/</span>
            <Link href="/blog" className="transition hover:text-[var(--lime)]">
              {t("blog.breadcrumb_journal", "Journal")}
            </Link>
            <span>/</span>
            <span className="truncate text-white/80">{getCategoryLabel(post.category)}</span>
          </div>

          {/* Category Pill */}
          <div className="mt-8 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[var(--lime)]" />
            <span className="rounded-full bg-white/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--lime)] backdrop-blur-md">
              {getCategoryLabel(post.category)}
            </span>
          </div>

          {/* Article Title */}
          <h1 className="mt-6 font-serif-heading text-[clamp(36px,5.5vw,72px)] font-medium leading-[1.05] tracking-[-0.045em] text-white">
            {post.title}
          </h1>

          {/* Excerpt Lead */}
          {post.excerpt && (
            <p className="mt-6 max-w-[760px] text-sm sm:text-base leading-[1.8] text-white/75 font-normal">
              {post.excerpt}
            </p>
          )}

          {/* Article Metadata Bar */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/15 pt-6 text-[10px] uppercase tracking-[0.12em] text-white/60">
            <div className="flex items-center gap-1.5">
              <CalendarDays size={13} className="text-[var(--lime)]" />
              <span>{formatBlogDate(post.createdAt)}</span>
            </div>

            <span className="h-3 w-px bg-white/20 max-sm:hidden" />

            <div className="flex items-center gap-1.5">
              <Clock3 size={13} className="text-[var(--lime)]" />
              <span>{post.readTime || 4} {t("blog.min_read", "min read")}</span>
            </div>

            {post.views > 0 && (
              <>
                <span className="h-3 w-px bg-white/20 max-sm:hidden" />
                <div className="flex items-center gap-1.5">
                  <Eye size={13} className="text-[var(--lime)]" />
                  <span>{post.views} {t("blog.views", "views")}</span>
                </div>
              </>
            )}

            <span className="h-3 w-px bg-white/20 max-sm:hidden" />

            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)] text-[9px] font-bold">
                {post.author?.name ? post.author.name.charAt(0).toUpperCase() : "G"}
              </div>
              <span className="text-white font-semibold">
                {t("blog.by", "By")} {post.author?.name || "Genesis Farm Team"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          HERO COVER IMAGE
      ========================================================= */}
      <section className="mx-auto w-[min(1080px,calc(100%-48px))] -mt-10 sm:-mt-14 relative z-10">
        <div className="relative aspect-[16/9] sm:aspect-[16/8] overflow-hidden rounded-[2.5rem] bg-[#071a11] shadow-[0_25px_70px_rgba(18,53,35,.16)] border border-white/10">
          <img
            src={formatBlogImage(post.image)}
            alt={post.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-xl bg-[rgba(11,36,25,.85)] px-4 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md border border-white/10">
            <Leaf size={12} className="text-[var(--lime)]" />
            <span>{t("blog.verified_journal", "Verified Farm Journal")}</span>
          </div>
        </div>
      </section>

      {/* =========================================================
          ARTICLE BODY CONTENT
      ========================================================= */}
      <article className="mx-auto w-[min(780px,calc(100%-48px))] py-16 sm:py-20">
        <FormattedArticleContent content={post.content || post.excerpt || ""} />

        {/* Article Author Footer Card */}
        <div className="mt-16 rounded-3xl bg-white p-6 sm:p-8 border border-[rgba(20,33,25,.08)] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--lime)] text-[var(--green-950)] font-serif-heading text-xl font-bold shadow-sm">
                {post.author?.name ? post.author.name.charAt(0).toUpperCase() : "G"}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#28633e]">
                  {t("blog.published_author", "Published Author")}
                </span>
                <h4 className="font-serif-heading text-lg font-bold text-[#123523]">
                  {post.author?.name || "Genesis Farm Agronomy Team"}
                </h4>
                <p className="text-xs text-[#69736b] mt-0.5">
                  {t("blog.author_desc", "Agronomy, agricultural research & fresh food supply.")}
                </p>
              </div>
            </div>

            <Link
              href="/blog"
              className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full bg-[#f6f3e9] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#123523] hover:bg-[#123523] hover:text-white transition"
            >
              <ArrowLeft size={13} />
              {t("blog.all_articles", "All Articles")}
            </Link>
          </div>
        </div>
      </article>

      {/* =========================================================
          RELATED STORIES SECTION
      ========================================================= */}
      {relatedPosts.length > 0 && (
        <section className="bg-white py-20 border-t border-[#19472d]/10">
          <div className="mx-auto w-[min(1180px,calc(100%-48px))]">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[var(--lime)]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--green-700)]">
                    {t("blog.keep_exploring", "Keep Exploring")}
                  </span>
                </div>
                <h2 className="mt-2 font-serif-heading text-3xl sm:text-4xl font-medium tracking-tight text-[#123523]">
                  {t("blog.more_from_journal", "More from the journal")}
                </h2>
              </div>

              <Link
                href="/blog"
                className="hidden items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#28633e] hover:text-[#123523] sm:flex"
              >
                {t("blog.view_all_stories", "View all stories")}
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid gap-7 sm:grid-cols-2 md:grid-cols-3">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id || related.slug}
                  href={`/blog/${encodeURIComponent(related.slug)}`}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-[rgba(20,33,25,.08)] bg-[#fdfbf7] p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#071a11]">
                    <img
                      src={formatBlogImage(related.image)}
                      alt={related.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-[#123523]/90 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--lime)]">
                      {getCategoryLabel(related.category)}
                    </span>
                  </div>

                  <div className="pt-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-semibold text-[#69736b] mb-1.5">
                        {formatBlogDate(related.createdAt)} • {related.readTime || 3} {t("blog.min_read", "min")}
                      </div>
                      <h3 className="font-serif-heading text-lg font-bold leading-snug text-[#123523] group-hover:text-[#28633e] transition-colors line-clamp-2">
                        {related.title}
                      </h3>
                    </div>

                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#28633e] group-hover:translate-x-1 transition-transform">
                      {t("blog.read_story", "Read Story")}
                      <ArrowRight size={13} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
              "Explore our fresh produce marketplace or subscribe for weekly harvest updates."
            )}
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--lime)] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--green-950)] transition hover:-translate-y-0.5 shadow-lg"
            >
              {t("blog.cta_btn_market", "Explore Produce Marketplace")}
              <ArrowUpRight size={15} />
            </Link>

            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-white/10 transition"
            >
              {t("blog.cta_btn_all_stories", "Browse All Stories")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
