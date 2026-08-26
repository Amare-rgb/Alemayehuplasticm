// // src/app/blog/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';
// import Image from 'next/image';
// import { Calendar, User, ArrowRight, Clock } from 'lucide-react';

// interface BlogPost {
//   id: string;
//   title: string;
//   slug: string;
//   excerpt: string;
//   content: string;
//   image: string;
//   author: string;
//   category: string;
//   createdAt: string;
//   readTime: number;
//   published: boolean;
// }

// export default function BlogPage() {
//   const [posts, setPosts] = useState<BlogPost[]>([]);
//   const [loading, setLoading] = useState(true);

//   // ✅ Fetch blog posts from your Admin API
//   useEffect(() => {
//     const fetchPosts = async () => {
//       try {
//         const res = await fetch('/api/blog?published=true');
//         if (!res.ok) throw new Error('Failed to fetch blog posts');
//         const data = await res.json();
//         setPosts(data.posts || []);
//       } catch (err) {
//         console.error('Error fetching blog posts:', err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchPosts();
//   }, []);

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       month: 'long',
//       day: 'numeric',
//       year: 'numeric'
//     });
//   };

//   return (
//     <main className="min-h-screen bg-gray-50 py-12">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6">
//         {/* Header */}
//         <div className="text-center mb-12">
//           <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
//             GenesisAgri <span className="text-green-600">Blog</span>
//           </h1>
//           <p className="text-xl text-gray-600 max-w-2xl mx-auto">
//             Insights, news, and stories from the forefront of agricultural transformation.
//           </p>
//         </div>

//         {/* Blog Posts Grid */}
//         {loading ? (
//           <div className="flex justify-center items-center py-20">
//             <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
//           </div>
//         ) : posts.length === 0 ? (
//           <div className="text-center py-20">
//             <h3 className="text-xl font-semibold text-gray-800 mb-2">No blog posts yet</h3>
//             <p className="text-gray-600">Check back soon for updates!</p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {posts.map((post) => (
//               <article
//                 key={post.id}
//                 className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
//               >
//                 {/* Post Image */}
//                 <div className="relative h-48 w-full bg-gray-200 overflow-hidden">
//                   {post.image ? (
//                     <img
//                       src={post.image}
//                       alt={post.title}
//                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
//                     />
//                   ) : (
//                     <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
//                       🌾
//                     </div>
//                   )}
//                   {/* Category Badge */}
//                   <span className="absolute top-3 left-3 bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
//                     {post.category || 'Agriculture'}
//                   </span>
//                 </div>

//                 {/* Post Content */}
//                 <div className="p-6">
//                   <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
//                     <span className="flex items-center gap-1">
//                       <Calendar size={14} />
//                       {formatDate(post.createdAt)}
//                     </span>
//                     <span className="flex items-center gap-1">
//                       <Clock size={14} />
//                       {post.readTime || 3} min read
//                     </span>
//                   </div>

//                   <Link href={`/blog/${post.slug}`}>
//                     <h2 className="text-xl font-bold text-gray-900 hover:text-green-600 transition-colors line-clamp-2 mb-2">
//                       {post.title}
//                     </h2>
//                   </Link>

//                   <p className="text-gray-600 text-sm line-clamp-3 mb-4">
//                     {post.excerpt || post.content?.substring(0, 120) + '...'}
//                   </p>

//                   <div className="flex items-center justify-between">
//                     <span className="text-sm text-gray-500 flex items-center gap-1">
//                       <User size={14} />
//                       {post.author || 'GenesisAgri'}
//                     </span>
//                     <Link
//                       href={`/blog/${post.slug}`}
//                       className="text-green-600 hover:text-green-700 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all"
//                     >
//                       Read More
//                       <ArrowRight size={16} />
//                     </Link>
//                   </div>
//                 </div>
//               </article>
//             ))}
//           </div>
//         )}
//       </div>
//     </main>
//   );
// }

"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Leaf,
  Search,
  Sprout,
} from "lucide-react";

const categories = [
  "All",
  "Farming",
  "Sustainability",
  "Fresh Produce",
  "Our Farm",
  "Stories",
];

const posts = [
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
    featured: true,
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

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      activeCategory === "All" || post.category === activeCategory;

    const query = searchQuery.toLowerCase();

    const matchesSearch =
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  const featuredPost = posts.find((post) => post.featured);

  const regularPosts = filteredPosts.filter(
    (post) => !post.featured
  );

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

              <img
                src={featuredPost.image}
                alt={featuredPost.title}
                className="
                  absolute
                  inset-0
                  h-full
                  w-full
                  object-cover
                  transition-transform
                  duration-700
                  group-hover:scale-105
                "
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
                {featuredPost.category}
              </span>

            </div>

            {/* Content */}
            <div className="flex flex-col justify-between p-8 text-white sm:p-12 lg:p-14">

              <div>
                <div className="mb-10 flex items-center gap-4 text-[9px] uppercase tracking-[0.13em] text-white/45">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={12} />
                    {featuredPost.date}
                  </span>

                  <span className="h-3 w-px bg-white/20" />

                  <span className="flex items-center gap-1.5">
                    <Clock3 size={12} />
                    {featuredPost.readTime}
                  </span>
                </div>

                <h2 className="max-w-[520px] font-serif-heading text-[clamp(34px,4vw,54px)] font-medium leading-[1.02] tracking-[-0.04em]">
                  {featuredPost.title}
                </h2>

                <p className="mt-7 max-w-[430px] text-sm leading-[1.8] text-white/60">
                  {featuredPost.excerpt}
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

          {categories.map((category) => {
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
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group"
              >

                {/* Image */}
                <div className="relative aspect-[1.18] overflow-hidden bg-[var(--cream-dark)]">

                  <img
                    src={post.image}
                    alt={post.title}
                    className="
                      h-full
                      w-full
                      object-cover
                      transition-transform
                      duration-700
                      group-hover:scale-105
                    "
                  />

                  <div className="absolute left-4 top-4">
                    <span className="bg-[var(--cream)] px-3 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--green-800)]">
                      {post.category}
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
                    <span>{post.date}</span>

                    <span className="h-3 w-px bg-[var(--line)]" />

                    <span>{post.readTime}</span>
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
                    {post.excerpt}
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
              Try another category or search term.
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


            {/* Image composition */}
            <div className="grid grid-cols-[1.2fr_.8fr] gap-4">

              <div className="aspect-[0.85] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1644101211459-7f9be46fad04?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Farmer working in a field"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="mt-16 aspect-[0.75] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=85"
                  alt="Fresh agricultural field"
                  className="h-full w-full object-cover"
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
