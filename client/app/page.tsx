"use client";

import { useEffect, useState, useRef } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
} from "lucide-react";

type CategoryItem = {
  number: string;
  title: string;
  description: string;
  image: string;
  category: string;
};

const fallbackCategories: CategoryItem[] = [
  {
    number: "01",
    title: "Vegetables",
    description: "Crisp, seasonal and farm-fresh.",
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85",
    category: "vegetables",
  },
  {
    number: "02",
    title: "Fruits",
    description: "Picked for flavor and freshness.",
    image:
      "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1200&q=85",
    category: "fruits",
  },
  {
    number: "03",
    title: "Cereals",
    description: "Reliable staples for every home.",
    image:
      "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=85",
    category: "cereals",
  },
];

function ProductCard({ product }: { product: CategoryItem }) {
  return (
    <a
      href={`/shop?category=${encodeURIComponent(product.category)}`}
      className="group relative block h-[70vh] lg:h-[80vh] w-full overflow-hidden rounded-[28px] bg-[#0b2419] shadow-lg transition-all duration-500 hover:shadow-2xl"
    >
      {/* Background Image */}
      <img
        src={product.image}
        alt={product.title}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[101%]"
        onError={(e) => {
          e.currentTarget.src =
            "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85";
        }}
      />

      {/* Dark gradient overlay at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Card Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
        <span className="mb-2 block text-xs font-mono tracking-widest text-white/70">
          {product.number}
        </span>

        <h3 className="font-serif-heading text-4xl font-normal leading-tight text-white mb-2 sm:text-5xl">
          {product.title}
        </h3>

        <p className="text-xs sm:text-sm text-white/80 font-sans mb-5 leading-relaxed max-w-[480px]">
          {product.description}
        </p>

        <div className="inline-flex items-center gap-2 text-xs font-semibold text-white/90 group-hover:text-[var(--lime)] group-hover:translate-x-1 transition-all duration-300">
          <span>View selection</span>
          <span className="text-sm font-bold">→</span>
        </div>
      </div>
    </a>
  );
}

function ProductCards() {
  const [categories, setCategories] = useState<CategoryItem[]>(fallbackCategories);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${apiBaseUrl}/api/categories/public`);
        if (res.ok) {
          const data = await res.json();
          const raw = Array.isArray(data)
            ? data
            : data?.categories || data?.data || [];

          if (isMounted && raw.length > 0) {
            const top = raw.filter((c: any) => !c.parentId);
            const toMap = top.length > 0 ? top : raw;

            const defaultImages = [
              "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85",
              "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1200&q=85",
              "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=85",
              "https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=1200&q=85",
              "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=85",
            ];

            const mapped: CategoryItem[] = toMap.map((cat: any, i: number) => {
              let img = cat.image;
              if (img && !img.startsWith("http")) {
                img = `${apiBaseUrl}${img}`;
              }
              return {
                number: String(i + 1).padStart(2, "0"),
                title: cat.name,
                description:
                  cat.description || "Crisp, seasonal and farm-fresh produce.",
                image: img || defaultImages[i % defaultImages.length],
                category: cat.slug || cat.id,
              };
            });

            setCategories(mapped);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch categories for home page:", err);
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = scrollContainerRef.current.clientWidth * 0.75;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -offset : offset,
        behavior: "smooth",
      });
    }
  };

  return (
    <section
      id="products"
      className="scroll-mt-20 bg-[var(--cream)] py-[105px] px-4 sm:px-6 lg:px-10 w-full overflow-hidden"
    >
      <div className="w-full">
        <div className="mb-[50px] flex items-end justify-between gap-14 max-md:flex-col max-md:items-start max-md:gap-5">
          <div>
            <h2 className="font-serif-heading text-[clamp(38px,4.4vw,59px)] font-bold leading-[1.08] tracking-[-0.04em] text-[var(--green-900)]">
              Freshness you can
              <br />
              <em className="font-semibold text-[var(--green-700)]">
                taste.
              </em>
            </h2>
          </div>

          <div className="flex flex-col items-start md:items-end gap-4">
            <p className="max-w-[420px] text-[13px] leading-[1.8] text-[var(--muted)]">
              From nutrient-rich vegetables to naturally grown fruits and
              staple cereals, we bring the harvest closer to home.
            </p>

            {/* Horizontal Navigation scroll buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scroll("left")}
                aria-label="Scroll left"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--green-900)]/15 bg-white text-[var(--green-900)] transition-all hover:bg-[var(--lime)] hover:border-[var(--lime)] hover:text-[var(--green-950)] hover:scale-105 active:scale-95 shadow-sm"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                aria-label="Scroll right"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--green-900)]/15 bg-white text-[var(--green-900)] transition-all hover:bg-[var(--lime)] hover:border-[var(--lime)] hover:text-[var(--green-950)] hover:scale-105 active:scale-95 shadow-sm"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal scrollable cards container */}
        <div
          ref={scrollContainerRef}
          className="flex w-full gap-6 overflow-x-auto pb-6 pt-2 scroll-smooth scrollbar-none snap-x snap-mandatory"
        >
          {categories.map((product) => (
            <div
              key={product.number}
              className="w-[85vw] sm:w-[380px] md:w-[440px] lg:w-[480px] shrink-0 snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const values = [
  {
    number: "01",
    icon: "↔",
    title: "Direct Connection",
    description:
      "We reduce unnecessary layers between farms and consumers, creating a simpler supply chain.",
  },
  {
    number: "02",
    icon: "✦",
    title: "Freshness First",
    description:
      "Shorter journeys mean our produce reaches your home fresher and closer to the harvest.",
  },
  {
    number: "03",
    icon: "₿",
    title: "Fair Prices",
    description:
      "By cutting out resellers and unnecessary markups, we work toward prices that make sense.",
  },
  {
    number: "04",
    icon: "♧",
    title: "Responsible Growth",
    description:
      "We are building an agricultural business that values quality, people and long-term sustainability.",
  },
];

const journey = [
  {
    number: "01",
    icon: "🌱",
    title: "We Grow",
    description:
      "Quality produce starts with healthy soil and careful farming.",
  },
  {
    number: "02",
    icon: "🧺",
    title: "We Harvest",
    description:
      "Produce is selected and prepared for its journey to consumers.",
  },
  {
    number: "03",
    icon: "🚚",
    title: "We Deliver",
    description:
      "We shorten the chain and move products closer to the people.",
  },
  {
    number: "04",
    icon: "🍽️",
    title: "You Enjoy",
    description:
      "Fresh farm products become part of your everyday table.",
  },
];

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span className="leaf leaf-one" />
      <span className="leaf leaf-two" />
      <span className="stem" />
    </span>
  );
}

function Eyebrow({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <div
      className={`mb-5 flex items-center gap-2.5 text-[10px] font-bold tracking-[0.18em] ${
        light ? "text-[var(--lime)]" : "text-[var(--green-700)]"
      }`}
    >
      <span className="h-px w-[26px] bg-current" />
      {children}
    </div>
  );
}

export default function HomePage() {
  const [showBackTop, setShowBackTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackTop(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="overflow-hidden bg-[var(--cream)] text-[var(--ink)]">
      {/* =========================================================
          HERO
      ========================================================= */}
      <section
        id="home"
        className="relative flex min-h-[760px] items-center bg-cover bg-center text-white"
        style={{
          backgroundImage: `
            linear-gradient(
              90deg,
              rgba(7,26,17,.92) 0%,
              rgba(7,26,17,.68) 45%,
              rgba(7,26,17,.18) 100%
            ),
            url("https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=2200&q=85")
          `,
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_48%,rgba(180,216,115,.16),transparent_28%)]" />

        <div className="relative mx-auto flex w-[min(1180px,calc(100%-48px))] items-center justify-between gap-[70px] pt-[90px]">
          <div className="max-w-[720px] animate-fade-in-up">
            <h1 className="font-serif-heading text-[clamp(48px,6vw,80px)] font-extrabold leading-[1.03] tracking-[-0.045em] mb-[10rem]">
              Fresh from our{" "}
              <em className="font-semibold text-[var(--lime)]">
                fields
              </em>{" "}
              to your table.
            </h1>

            <p className="mt-6 max-w-[580px] text-[16px] leading-[1.8] text-white/75">
            </p>

            <div className="mt-8 flex items-center gap-6 max-sm:flex-col max-sm:items-start">
              <a
                href="/shop"
                className="flex min-h-[52px] items-center gap-6 bg-[var(--lime)] px-[22px] text-xs font-bold text-[var(--green-950)] transition hover:-translate-y-1 hover:shadow-xl"
              >
                Explore Our Produce
                <ArrowRight size={17} />
              </a>

              <a
                href="#about"
                className="flex items-center gap-2 border-b border-white pb-1 text-xs font-bold"
              >
                Discover our story
                <ArrowUpRight size={15} />
              </a>
            </div>

            <div className="mt-[60px] flex items-center gap-6 max-sm:gap-3">
              <div className="grid gap-0.5">
                <strong className="text-base">100%</strong>
                <span className="text-[9px] uppercase tracking-wider text-white/60">
                  Farm Fresh
                </span>
              </div>

              <div className="h-[30px] w-px bg-white/25" />

              <div className="grid gap-0.5">
                <strong className="text-base">Direct</strong>
                <span className="text-[9px] uppercase tracking-wider text-white/60">
                  From Our Farms
                </span>
              </div>

              <div className="h-[30px] w-px bg-white/25" />

              <div className="grid gap-0.5">
                <strong className="text-base">Fair</strong>
                <span className="text-[9px] uppercase tracking-wider text-white/60">
                  Everyday Prices
                </span>
              </div>
            </div>
          </div>

          {/* Hero floating card */}
          <div className="w-[300px] shrink-0 bg-white/95 text-[var(--ink)] shadow-[0_25px_60px_rgba(18,53,35,.12)] backdrop-blur-md max-lg:hidden">
            <div className="border-b border-[var(--line)] px-[18px] py-[15px] text-[9px] font-bold tracking-[0.12em]">
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#6aa94c] shadow-[0_0_0_4px_rgba(106,169,76,.12)]" />
              HARVESTED TODAY
            </div>

            <div className="flex items-center gap-4 px-5 py-7">
              <span className="text-[34px]">🌿</span>

              <div>
                <strong className="text-sm">Seasonal Produce</strong>
                <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                  Freshly picked, carefully selected.
                </p>
              </div>
            </div>

            <div className="flex justify-between bg-[var(--green-900)] px-[18px] py-3 text-[9px] uppercase tracking-wider text-white">
              <span>Farm → You</span>
              <span>100% Fresh</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-7 right-9 hidden items-center text-[9px] tracking-[0.16em] opacity-65 md:flex">
          SCROLL TO EXPLORE
          <ArrowDown size={15} className="ml-2" />
        </div>
      </section>

      {/* =========================================================
          INTRO
      ========================================================= */}
      <section className="bg-white py-[105px]">
        <div className="mx-auto grid w-[min(1180px,calc(100%-48px))] grid-cols-[1.15fr_.85fr] items-end gap-[100px] max-lg:grid-cols-1 max-lg:gap-12">
          <div>
            <Eyebrow>THE GENESIS DIFFERENCE</Eyebrow>

            <h2 className="font-serif-heading text-[clamp(38px,4.4vw,59px)] font-bold leading-[1.08] tracking-[-0.04em] text-[var(--green-900)]">
              Good food shouldnt
              <br />
              <em className="font-semibold text-[var(--green-700)]">
                cost more
              </em>{" "}
              than it has to.
            </h2>
          </div>

          <div>
            
            <p className="mb-6 text-sm leading-[1.8] text-[var(--muted)]">
              We connect our farms directly with consumers, giving you fresher
              products at honest prices while ensuring the people who grow your
              food create more value.
            </p>

            <a
              href="/about"
              className="inline-flex items-center gap-2 border-b border-[var(--green-800)] pb-1 text-xs font-bold text-[var(--green-800)]"
            >
              Learn more about Genesis
              <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRODUCTS CARDS SECTION (New ProductCards Component)
      ========================================================= */}
      <ProductCards />

      {/* =========================================================
          TANA FARM
      ========================================================= */}
      <section
        id="tana-farm"
        className="scroll-mt-20 bg-white py-[105px]"
      >
        <div className="mx-auto grid w-[min(1180px,calc(100%-48px))] grid-cols-[.95fr_1.05fr] items-center gap-[100px] max-lg:grid-cols-1 max-lg:gap-12">
          {/* Image */}
          <div className="relative min-h-[580px] max-lg:min-h-[500px]">
            <div
              className="absolute right-0 top-0 h-[500px] w-[78%] bg-cover bg-center max-sm:h-[390px] max-sm:w-[86%]"
              style={{
                backgroundImage:
                  'url("https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1100&q=85")',
              }}
            >
              <span className="absolute right-5 top-5 bg-white px-3 py-2 text-[8px] font-bold tracking-[0.12em] text-[var(--green-900)]">
                A SISTER COMPANY
              </span>
            </div>

            <div className="absolute bottom-5 left-0 flex w-[260px] items-center gap-3 bg-[var(--lime)] p-5 shadow-[0_20px_45px_rgba(18,53,35,.15)] max-sm:bottom-0 max-sm:w-[215px]">
              <span className="text-[35px]">🌱</span>

              <div className="grid">
                <strong className="font-serif-heading text-[21px]">
                  Tana Farm
                </strong>

                <small className="text-[9px] uppercase tracking-wider">
                  Pure. Fresh. Local.
                </small>
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <Eyebrow>MEET TANA FARM</Eyebrow>

            <h2 className="font-serif-heading text-[clamp(38px,4.4vw,59px)] font-bold leading-[1.08] tracking-[-0.04em] text-[var(--green-900)]">
              Straight from
              <br />
              the land.
            </h2>

            <p className="mt-6 text-[18px] leading-[1.65] text-[var(--green-800)]">
              Our sister company,{" "}
              <strong className="font-semibold">Tana Farm</strong>, produces
              organic products straight from its own land.
            </p>

            <p className="mt-4 max-w-[550px] text-sm leading-[1.85] text-[var(--muted)]">
              Tana Farm extends our farm-to-table philosophy by growing and
              providing fresh, organic products directly from the farm. No
              unnecessary middlemen. No unnecessary distance. Just products
              that come straight from the land to the people.
            </p>

            <div className="mt-8 grid grid-cols-4 gap-2 max-sm:grid-cols-2">
              {[
                ["🌱", "Organic", "Naturally grown"],
                ["🌾", "Fresh", "From the land"],
                ["🚜", "Local", "Farm produced"],
                ["🥬", "Healthy", "Quality focused"],
              ].map(([icon, title, subtitle]) => (
                <div
                  key={title}
                  className="grid gap-0.5 bg-[var(--cream)] p-4 text-center"
                >
                  <span className="text-[25px]">{icon}</span>
                  <strong className="text-[11px]">{title}</strong>
                  <small className="text-[8px] text-[var(--muted)]">
                    {subtitle}
                  </small>
                </div>
              ))}
            </div>

            <a
              href="#contact"
              className="mt-6 inline-flex items-center gap-6 border border-[var(--green-800)] px-[22px] py-4 text-xs font-bold text-[var(--green-800)] transition hover:bg-[var(--green-800)] hover:text-white"
            >
              Connect with Tana Farm
              <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================
          VALUES
      ========================================================= */}
      <section
        id="about"
        className="scroll-mt-20 bg-[var(--green-800)] py-[105px] text-white"
        style={{
          backgroundImage: `
            linear-gradient(
              120deg,
              rgba(8,35,21,.97),
              rgba(21,65,40,.93)
            ),
            url("https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1800&q=80")
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto w-[min(1180px,calc(100%-48px))]">
          <div className="max-w-[850px]">
            <Eyebrow light>WHY GENESIS</Eyebrow>

            <h2 className="font-serif-heading text-[clamp(38px,4.4vw,59px)] font-bold leading-[1.08] tracking-[-0.04em] text-white">
              A simpler food system.
              <br />
              <em className="font-semibold text-[var(--lime)]">
                A better deal for everyone.
              </em>
            </h2>

            <p className="mt-5 max-w-[560px] text-sm leading-[1.8] text-white/60">
              We believe agriculture works best when the distance between the
              farmer and the family buying their food is kept short.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-4 border-t border-white/15 max-lg:grid-cols-2 max-sm:grid-cols-1">
            {values.map((value, index) => (
              <div
                key={value.number}
                className={`min-h-[260px] border-r border-white/15 py-6 ${
                  index !== 0 ? "pl-6" : "pr-6"
                } max-lg:border-b max-sm:border-r-0 max-sm:min-h-0 max-sm:px-0`}
              >
                <span className="text-[9px] tracking-wider text-white/40">
                  {value.number}
                </span>

                <span className="my-6 block text-[25px] text-[var(--lime)]">
                  {value.icon}
                </span>

                <h3 className="font-serif-heading text-[23px] font-bold">
                  {value.title}
                </h3>

                <p className="mt-2 max-w-[220px] text-[11px] leading-[1.75] text-white/55">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          JOURNEY
      ========================================================= */}
      {/* <section className="bg-[var(--cream)] py-[105px]">
        <div className="mx-auto w-[min(1180px,calc(100%-48px))]">
          <div className="mb-10 flex flex-col items-center text-center">
            <Eyebrow>THE JOURNEY</Eyebrow>

            <h2 className="font-serif-heading text-[clamp(38px,4.4vw,59px)] font-bold leading-[1.08] tracking-[-0.04em] text-[var(--green-900)]">
              We keep the route{" "}
              <em className="font-semibold text-[var(--green-700)]">
                straightforward.
              </em>
            </h2>

            <p className="mt-5 max-w-[470px] text-[13px] leading-[1.8] text-[var(--muted)]">
              the value stays where it
              belongs.
            </p>
          </div>

          <div className="relative grid grid-cols-4 gap-9 max-md:grid-cols-2 max-sm:grid-cols-1">
            <div className="absolute left-[8%] right-[8%] top-10 border-t border-dashed border-[rgba(40,99,62,.3)] max-md:hidden" />

            {journey.map((step) => (
              <div key={step.number} className="relative z-10 text-center">
                <div className="mx-auto mb-[18px] grid h-20 w-20 place-items-center rounded-full border border-[var(--line)] bg-white text-[28px]">
                  {step.icon}
                </div>

                <strong className="text-[9px] tracking-[0.15em] text-[var(--green-700)]">
                  {step.number}
                </strong>

                <h3 className="mt-1 font-serif-heading text-[22px] font-bold">
                  {step.title}
                </h3>

                <p className="mx-auto mt-1 max-w-[190px] text-[11px] text-[var(--muted)]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* =========================================================
          CONTACT CTA
      ========================================================= */}
      <section
        id="contact"
        className="relative overflow-hidden bg-[var(--green-800)] py-[105px] text-white"
      >
        <div className="pointer-events-none absolute -right-[250px] -top-[270px] h-[700px] w-[700px] rounded-full border border-[rgba(185,216,115,.1)]">
          <div className="absolute inset-[70px] rounded-full border border-[rgba(185,216,115,.08)]" />
        </div>

        <div className="relative mx-auto max-w-[800px] px-6 text-center">

          <h2 className="font-serif-heading text-[clamp(38px,4.4vw,59px)] font-bold leading-[1.08] tracking-[-0.04em] text-white">
            Bring the farm
            <br />
            <em className="font-semibold text-[var(--lime)]">
              closer to home.
            </em>
          </h2>

          <p className="mx-auto mt-5 max-w-[510px] text-[13px] leading-[1.8] text-white/65">
            Interested in our products, availability or a direct order?
            We&apos;d love to hear from you.
          </p>

          <div className="mt-7 flex justify-center gap-6 max-sm:flex-col max-sm:items-center">
            <a
              href="tel:+251900000000"
              className="flex min-h-[52px] w-[160px] items-center justify-center gap-6 bg-white px-5 text-xs font-bold text-[var(--green-900)] transition hover:-translate-y-1"
            >
              Call Us
              <ArrowRight size={17} />
            </a>

            <a
              href="mailto:info@genesisagrobusiness.com"
              className="flex min-h-[52px] w-[160px] items-center justify-center gap-6 border border-white/35 px-5 text-xs font-bold text-white transition hover:bg-white/10"
            >
              Send an Email
              <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================
          BACK TO TOP
      ========================================================= */}
      <button
        type="button"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-5 right-5 z-40 grid h-[42px] w-[42px] place-items-center rounded-full bg-[var(--lime)] text-[var(--green-950)] shadow-lg transition-all duration-300 ${
          showBackTop
            ? "visible translate-y-0 opacity-100"
            : "invisible translate-y-4 opacity-0"
        }`}
      >
        <ArrowUp size={18} />
      </button>
    </main>
  );
}