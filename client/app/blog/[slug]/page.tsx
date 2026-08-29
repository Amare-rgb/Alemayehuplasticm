// app/blog/[slug]/page.tsx
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Leaf,
  Sprout,
} from "lucide-react";

interface BlogPost {
  slug: string;
  category: string;
  date: string;
  readTime: string;
  title: string;
  excerpt: string;
  image: string;
  author: string;
}

const posts: BlogPost[] = [
  {
    slug: "what-makes-truly-farm-fresh-produce-different",
    category: "Farming",
    date: "August 18, 2026",
    readTime: "5 min read",
    title: "What makes truly farm-fresh produce different?",
    excerpt:
      "Freshness starts long before produce reaches your kitchen. Here's how thoughtful farming, careful harvesting, and a shorter journey make a difference.",
    image:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=2200&q=90",
    author: "Genesis Farm Team",
  },
  {
    slug: "growing-with-the-land-not-against-it",
    category: "Sustainability",
    date: "August 12, 2026",
    readTime: "6 min read",
    title: "Growing with the land, not against it",
    excerpt:
      "Healthy soil is at the heart of every healthy harvest.",
    image:
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=2200&q=90",
    author: "Genesis Farm Team",
  },
  {
    slug: "from-sunrise-harvest-to-your-table",
    category: "Fresh Produce",
    date: "August 05, 2026",
    readTime: "4 min read",
    title: "From sunrise harvest to your table",
    excerpt:
      "A look behind the scenes at what happens between the moment a crop is picked and the moment it reaches you.",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2200&q=90",
    author: "Genesis Farm Team",
  },
  {
    slug: "a-morning-in-the-fields-at-genesis",
    category: "Our Farm",
    date: "July 28, 2026",
    readTime: "7 min read",
    title: "A morning in the fields at Genesis",
    excerpt:
      "Walk with us through an ordinary morning on the farm.",
    image:
      "https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=2200&q=90",
    author: "Genesis Farm Team",
  },
  {
    slug: "the-people-behind-every-harvest",
    category: "Stories",
    date: "July 19, 2026",
    readTime: "5 min read",
    title: "The people behind every harvest",
    excerpt:
      "Farming is more than soil and sunshine. Meet some of the people whose knowledge and dedication keep Genesis growing.",
    image:
      "https://images.unsplash.com/photo-1592982537447-6f8f2b2d6e0f?auto=format&fit=crop&w=2200&q=90",
    author: "Genesis Farm Team",
  },
  {
    slug: "why-healthy-soil-means-a-healthier-future",
    category: "Sustainability",
    date: "July 10, 2026",
    readTime: "6 min read",
    title: "Why healthy soil means a healthier future",
    excerpt:
      "Good agriculture begins underground.",
    image:
      "https://images.unsplash.com/photo-1523742813107-8f0b6f6e5b6a?auto=format&fit=crop&w=2200&q=90",
    author: "Genesis Farm Team",
  },
];

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogDetailsPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const post = posts.find((item) => item.slug === slug);

  if (!post) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--cream)] px-6">
        <div className="text-center">
          <Leaf
            size={32}
            className="mx-auto mb-5 text-[var(--green-700)]"
          />

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--green-700)]">
            Genesis Journal
          </p>

          <h1 className="mt-4 font-serif-heading text-4xl">
            Story not found
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm text-[var(--muted)]">
            The article youre looking for may have been moved or
            is no longer available.
          </p>

          <Link
            href="/blog"
            className="
              mt-8
              inline-flex
              items-center
              gap-2
              rounded-full
              bg-[var(--green-950)]
              px-6
              py-3
              text-[10px]
              font-bold
              uppercase
              tracking-[0.12em]
              text-white
            "
          >
            <ArrowLeft size={14} />
            Back to Journal
          </Link>
        </div>
      </main>
    );
  }

  const relatedPosts = posts
    .filter((item) => item.slug !== post.slug)
    .slice(0, 3);

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
              {post.category}
            </span>
          </div>

          {/* Category */}
          <div className="mt-14 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[var(--lime)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--lime)]">
              {post.category}
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
            {post.excerpt}
          </p>

          {/* Metadata */}
          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-white/10 py-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/55">
              <CalendarDays size={13} />
              {post.date}
            </div>
            <span className="h-4 w-px bg-white/15 max-sm:hidden" />
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/55">
              <Clock3 size={13} />
              {post.readTime}
            </div>
            <span className="h-4 w-px bg-white/15 max-sm:hidden" />
            <div className="text-[10px] uppercase tracking-[0.12em] text-white/55">
              By{" "}
              <span className="text-white">
                {post.author}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          HERO IMAGE - FIXED with Next.js Image
      ========================================================= */}
      <section className="mx-auto w-[min(1180px,calc(100%-48px))]">
        <div className="relative -mt-16 aspect-[16/8] overflow-hidden lg:aspect-[16/7.2]">
          <Image
            src={post.image}
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
        {/* Intro */}
        <p
          className="
            font-serif-heading
            text-[25px]
            leading-[1.55]
            tracking-[-0.015em]
            text-[var(--green-900)]
          "
        >
          At Genesis, we believe that good food begins long before
          it reaches the kitchen. It begins with healthy soil,
          thoughtful farming, and a commitment to doing things
          properly.
        </p>

        {/* Paragraph */}
        <p className="mt-8 text-[15px] leading-[2] text-[var(--muted)]">
          When we talk about farm-fresh produce, were talking about
          more than a label. Freshness is a journey — one that starts
          in the field and continues through every decision made
          during cultivation, harvesting, selection, and delivery.
        </p>

        {/* Heading */}
        <h2 className="mt-14 font-serif-heading text-[36px] font-medium leading-tight tracking-[-0.035em] text-[var(--green-950)]">
          Freshness starts in the field
        </h2>

        <p className="mt-5 text-[15px] leading-[2] text-[var(--muted)]">
          The quality of produce is closely connected to how it is
          grown. Healthy crops require healthy soil, appropriate
          growing conditions, careful monitoring, and farmers who
          understand the land they work with.
        </p>

        <p className="mt-5 text-[15px] leading-[2] text-[var(--muted)]">
          At Genesis, we pay attention to the details. From
          preparing the soil to monitoring crops throughout the
          growing season, our approach is centered around producing
          food that we would be proud to put on our own table.
        </p>

        {/* Quote */}
        <blockquote
          className="
            my-14
            border-l-2
            border-[var(--lime)]
            bg-[var(--cream-dark)]
            px-7
            py-8
            sm:px-10
          "
        >
          <p
            className="
              font-serif-heading
              text-[25px]
              leading-[1.4]
              tracking-[-0.02em]
              text-[var(--green-900)]
            "
          >
            When we take care of the land, the land takes care
            of the harvest.
          </p>
          <footer className="mt-5 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--green-700)]">
            — Genesis Farm Team
          </footer>
        </blockquote>

        {/* Heading */}
        <h2 className="mt-14 font-serif-heading text-[36px] font-medium leading-tight tracking-[-0.035em] text-[var(--green-950)]">
          A shorter journey from farm to table
        </h2>

        <p className="mt-5 text-[15px] leading-[2] text-[var(--muted)]">
          One of the simplest advantages of buying directly from a
          farm is the shorter distance between where food is grown
          and where it is enjoyed.
        </p>

        <p className="mt-5 text-[15px] leading-[2] text-[var(--muted)]">
          Fewer unnecessary steps can mean better freshness, better
          visibility into where food comes from, and a stronger
          relationship between farmers and the people they feed.
        </p>

        {/* =====================================================
            INLINE IMAGE - FIXED with Next.js Image
        ====================================================== */}
        <figure className="my-14">
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=85"
              alt="Agricultural field"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <figcaption className="mt-3 flex items-center justify-between text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]">
            <span>Genesis agricultural fields</span>
            <span>Growing with purpose</span>
          </figcaption>
        </figure>

        {/* Heading */}
        <h2 className="mt-14 font-serif-heading text-[36px] font-medium leading-tight tracking-[-0.035em] text-[var(--green-950)]">
          More than produce
        </h2>

        <p className="mt-5 text-[15px] leading-[2] text-[var(--muted)]">
          Farming connects people to the land, to the seasons, and
          to one another. Every harvest represents countless hours
          of work and a relationship with nature that cannot be
          rushed.
        </p>

        <p className="mt-5 text-[15px] leading-[2] text-[var(--muted)]">
          Thats why our work at Genesis is about more than simply
          growing crops. It is about building a food system that
          values quality, responsibility, and the people behind
          every harvest.
        </p>

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
            {relatedPosts.map((related) => (
              <Link
                key={related.slug}
                href={`/blog/${related.slug}`}
                className="group"
              >
                <div className="relative aspect-[1.25] overflow-hidden">
                  <Image
                    src={related.image}
                    alt={related.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="pt-5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--green-700)]">
                    {related.category}
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
            ))}
          </div>
        </div>
      </section>

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