// app/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
} from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useLanguage } from "@/context/LanguageContext";

interface CategoryData {
  id?: string;
  name: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
}

interface CategoryItem {
  number: string;
  title: string;
  description: string;
  image: string;
  category: string;
}

interface ValueItem {
  number: string;
  icon: string;
  title: string;
  description: string;
}

function ProductCard({ product }: { product: CategoryItem }) {
  const { t } = useLanguage();

  return (
    <Link
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
          <span>{t("home.view_selection", "View selection")}</span>
          <span className="text-sm font-bold">→</span>
        </div>
      </div>
    </Link>
  );
}

function ProductCards() {
  const { t } = useLanguage();
  const fallbackCategories: CategoryItem[] = [
    {
      number: "01",
      title: t("home.cat_veg_title", "Vegetables"),
      description: t("home.cat_veg_desc", "Crisp, seasonal and farm-fresh."),
      image:
        "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85",
      category: "vegetables",
    },
    {
      number: "02",
      title: t("home.cat_fruit_title", "Fruits"),
      description: t("home.cat_fruit_desc", "Picked for flavor and freshness."),
      image:
        "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1200&q=85",
      category: "fruits",
    },
    {
      number: "03",
      title: t("home.cat_cereal_title", "Cereals"),
      description: t("home.cat_cereal_desc", "Reliable staples for every home."),
      image:
        "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=85",
      category: "cereals",
    },
  ];

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
            const top = raw.filter((c: CategoryData) => !c.parentId);
            const toMap = top.length > 0 ? top : raw;

            const defaultImages = [
              "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85",
              "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1200&q=85",
              "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=85",
              "https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=1200&q=85",
              "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=85",
            ];

            const mapped: CategoryItem[] = toMap.map((cat: CategoryData, i: number) => {
              let img = cat.image;
              if (img && !img.startsWith("http")) {
                img = `${apiBaseUrl}${img}`;
              }
              return {
                number: String(i + 1).padStart(2, "0"),
                title: cat.name,
                description:
                  cat.description || t("home.cat_default_desc", "Crisp, seasonal and farm-fresh produce."),
                image: img || defaultImages[i % defaultImages.length],
                category: cat.slug || cat.id || String(i),
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
  }, [t]);

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
              {t("home.products_heading_prefix", "Freshness you can")}
              <br />
              <em className="font-semibold text-[var(--green-700)]">
                {t("home.products_heading_accent", "taste.")}
              </em>
            </h2>
          </div>

          <div className="flex flex-col items-start md:items-end gap-4">
            <p className="max-w-[420px] text-[13px] leading-[1.8] text-[var(--muted)]">
              {t(
                "home.products_subtitle",
                "From nutrient-rich vegetables to naturally grown fruits and staple cereals, we bring the harvest closer to home."
              )}
            </p>

            {/* Horizontal Navigation scroll buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scroll("left")}
                aria-label={t("home.products_scroll_left", "Scroll left")}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--green-900)]/15 bg-white text-[var(--green-900)] transition-all hover:bg-[var(--lime)] hover:border-[var(--lime)] hover:text-[var(--green-950)] hover:scale-105 active:scale-95 shadow-sm"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                aria-label={t("home.products_scroll_right", "Scroll right")}
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
  const { settings } = useSettings();
  const { t } = useLanguage();

  const contactPhone = settings?.contactPhone || '+251 900 000 000';
  const contactEmail = settings?.contactEmail || 'info@genesisagri.com';
  const cleanPhone = contactPhone.replace(/\s/g, '');

  const values: ValueItem[] = [
    {
      number: "01",
      icon: "↔",
      title: t("home.v1_title", "Direct Connection"),
      description: t(
        "home.v1_desc",
        "We reduce unnecessary layers between farms and consumers, creating a simpler supply chain."
      ),
    },
    {
      number: "02",
      icon: "✦",
      title: t("home.v2_title", "Freshness First"),
      description: t(
        "home.v2_desc",
        "Shorter journeys mean our produce reaches your home fresher and closer to the harvest."
      ),
    },
    {
      number: "03",
      icon: "₿",
      title: t("home.v3_title", "Fair Prices"),
      description: t(
        "home.v3_desc",
        "By cutting out resellers and unnecessary markups, we work toward prices that make sense."
      ),
    },
    {
      number: "04",
      icon: "♧",
      title: t("home.v4_title", "Responsible Growth"),
      description: t(
        "home.v4_desc",
        "We are building an agricultural business that values quality, people and long-term sustainability."
      ),
    },
  ];

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
              {t("home.hero_title_prefix", "Fresh from our")}{" "}
              <em className="font-semibold text-[var(--lime)]">
                {t("home.hero_title_accent", "fields")}
              </em>{" "}
              {t("home.hero_title_suffix", "to your table.")}
            </h1>

            <div className="mt-8 flex items-center gap-6 max-sm:flex-col max-sm:items-start">
              <Link
                href="/shop"
                className="flex min-h-[52px] items-center gap-6 bg-[var(--lime)] px-[22px] text-xs font-bold text-[var(--green-950)] transition hover:-translate-y-1 hover:shadow-xl"
              >
                {t("home.hero_btn_explore", "Explore Our Produce")}
                <ArrowRight size={17} />
              </Link>

              <Link
                href="#about"
                className="flex items-center gap-2 border-b border-white pb-1 text-xs font-bold"
              >
                {t("home.hero_btn_story", "Discover our story")}
                <ArrowUpRight size={15} />
              </Link>
            </div>

            <div className="mt-[60px] flex items-center gap-6 max-sm:gap-3">
              <div className="grid gap-0.5">
                <strong className="text-base">{t("home.hero_stat_fresh_val", "100%")}</strong>
                <span className="text-[9px] uppercase tracking-wider text-white/60">
                  {t("home.hero_stat_fresh_lbl", "Farm Fresh")}
                </span>
              </div>

              <div className="h-[30px] w-px bg-white/25" />

              <div className="grid gap-0.5">
                <strong className="text-base">{t("home.hero_stat_direct_val", "Direct")}</strong>
                <span className="text-[9px] uppercase tracking-wider text-white/60">
                  {t("home.hero_stat_direct_lbl", "From Our Farms")}
                </span>
              </div>

              <div className="h-[30px] w-px bg-white/25" />

              <div className="grid gap-0.5">
                <strong className="text-base">{t("home.hero_stat_fair_val", "Fair")}</strong>
                <span className="text-[9px] uppercase tracking-wider text-white/60">
                  {t("home.hero_stat_fair_lbl", "Everyday Prices")}
                </span>
              </div>
            </div>
          </div>

          {/* Hero floating card */}
          <div className="w-[300px] shrink-0 bg-white/95 text-[var(--ink)] shadow-[0_25px_60px_rgba(18,53,35,.12)] backdrop-blur-md max-lg:hidden">
            <div className="border-b border-[var(--line)] px-[18px] py-[15px] text-[9px] font-bold tracking-[0.12em]">
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#6aa94c] shadow-[0_0_0_4px_rgba(106,169,76,.12)]" />
              {t("home.hero_card_badge", "HARVESTED TODAY")}
            </div>

            <div className="flex items-center gap-4 px-5 py-7">
              <span className="text-[34px]">🌿</span>

              <div>
                <strong className="text-sm">{t("home.hero_card_title", "Seasonal Produce")}</strong>
                <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                  {t("home.hero_card_subtitle", "Freshly picked, carefully selected.")}
                </p>
              </div>
            </div>

            <div className="flex justify-between bg-[var(--green-900)] px-[18px] py-3 text-[9px] uppercase tracking-wider text-white">
              <span>{t("home.hero_card_farm_to_you", "Farm → You")}</span>
              <span>{t("home.hero_card_100_fresh", "100% Fresh")}</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-7 right-9 hidden items-center text-[9px] tracking-[0.16em] opacity-65 md:flex">
          {t("home.hero_scroll", "SCROLL TO EXPLORE")}
          <ArrowDown size={15} className="ml-2" />
        </div>
      </section>

      {/* =========================================================
          INTRO
      ========================================================= */}
      <section className="bg-white py-[105px]">
        <div className="mx-auto grid w-[min(1180px,calc(100%-48px))] grid-cols-[1.15fr_.85fr] items-end gap-[100px] max-lg:grid-cols-1 max-lg:gap-12">
          <div>
            <Eyebrow>{t("home.intro_eyebrow", "THE GENESIS DIFFERENCE")}</Eyebrow>

            <h2 className="font-serif-heading text-[clamp(38px,4.4vw,59px)] font-bold leading-[1.08] tracking-[-0.04em] text-[var(--green-900)]">
              {t("home.intro_heading_prefix", "Good food shouldnt")}
              <br />
              <em className="font-semibold text-[var(--green-700)]">
                {t("home.intro_heading_accent", "cost more")}
              </em>{" "}
              {t("home.intro_heading_suffix", "than it has to.")}
            </h2>
          </div>

          <div>
            <p className="mb-6 text-sm leading-[1.8] text-[var(--muted)]">
              {t(
                "home.intro_p1",
                "We connect our farms directly with consumers, giving you fresher products at honest prices while ensuring the people who grow your food create more value."
              )}
            </p>

            <Link
              href="/about"
              className="inline-flex items-center gap-2 border-b border-[var(--green-800)] pb-1 text-xs font-bold text-[var(--green-800)]"
            >
              {t("home.intro_btn", "Learn more about Genesis")}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRODUCTS CARDS SECTION
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
          {/* Image with local file */}
          <div className="relative min-h-[580px] max-lg:min-h-[500px]">
            <div
              className="absolute right-0 top-0 h-[500px] w-full max-sm:h-[390px] bg-cover bg-center rounded-l-3xl"
              style={{
                backgroundImage: 'url("/banners/tanafarm.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <span className="absolute right-5 top-5 bg-white px-3 py-2 text-[8px] font-bold tracking-[0.12em] text-[var(--green-900)] rounded-md shadow-md">
                {t("home.tana_badge", "A SISTER COMPANY")}
              </span>
            </div>

            <div className="absolute bottom-5 left-0 flex w-[260px] items-center gap-3 bg-[var(--lime)] p-5 shadow-[0_20px_45px_rgba(18,53,35,.15)] rounded-r-xl max-sm:bottom-0 max-sm:w-[215px]">
              <span className="text-[35px]">🌱</span>

              <div className="grid">
                <strong className="font-serif-heading text-[21px]">
                  {t("home.tana_title", "Tana Farm")}
                </strong>

                <small className="text-[9px] uppercase tracking-wider">
                  {t("home.tana_motto", "Pure. Fresh. Local.")}
                </small>
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <Eyebrow>{t("home.tana_eyebrow", "MEET TANA FARM")}</Eyebrow>

            <h2 className="font-serif-heading text-[clamp(38px,4.4vw,59px)] font-bold leading-[1.08] tracking-[-0.04em] text-[var(--green-900)]">
              {t("home.tana_heading_prefix", "Straight from")}
              <br />
              <em className="font-semibold text-[var(--green-700)]">
                {t("home.tana_heading_accent", "the land.")}
              </em>
            </h2>

            <p className="mt-6 text-[18px] leading-[1.65] text-[var(--green-800)]">
              {t("home.tana_lead_1", "Our sister company,")}{" "}
              <strong className="font-semibold">{t("home.tana_title", "Tana Farm")}</strong>
              {t("home.tana_lead_2", ", produces organic products straight from its own land.")}
            </p>

            <p className="mt-4 max-w-[550px] text-sm leading-[1.85] text-[var(--muted)]">
              {t(
                "home.tana_body",
                "Tana Farm extends our farm-to-table philosophy by growing and providing fresh, organic products directly from the farm. No unnecessary middlemen. No unnecessary distance. Just products that come straight from the land to the people."
              )}
            </p>

            <div className="mt-8 grid grid-cols-4 gap-2 max-sm:grid-cols-2">
              {[
                ["🌱", t("home.tana_f1_title", "Organic"), t("home.tana_f1_sub", "Naturally grown")],
                ["🌾", t("home.tana_f2_title", "Fresh"), t("home.tana_f2_sub", "From the land")],
                ["🚜", t("home.tana_f3_title", "Local"), t("home.tana_f3_sub", "Farm produced")],
                ["🥬", t("home.tana_f4_title", "Healthy"), t("home.tana_f4_sub", "Quality focused")],
              ].map(([icon, title, subtitle]) => (
                <div
                  key={title}
                  className="grid gap-0.5 bg-[var(--cream)] p-4 text-center rounded-lg transition-all hover:scale-105 hover:shadow-md"
                >
                  <span className="text-[25px]">{icon}</span>
                  <strong className="text-[11px]">{title}</strong>
                  <small className="text-[8px] text-[var(--muted)]">
                    {subtitle}
                  </small>
                </div>
              ))}
            </div>

            <Link
              href="#contact"
              className="mt-6 inline-flex items-center gap-6 border border-[var(--green-800)] px-[22px] py-4 text-xs font-bold text-[var(--green-800)] transition hover:bg-[var(--green-800)] hover:text-white rounded-lg"
            >
              {t("home.tana_btn", "Connect with Tana Farm")}
              <ArrowRight size={17} />
            </Link>
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
            <Eyebrow light>{t("home.values_eyebrow", "WHY GENESIS")}</Eyebrow>

            <h2 className="font-serif-heading text-[clamp(38px,4.4vw,59px)] font-bold leading-[1.08] tracking-[-0.04em] text-white">
              {t("home.values_heading_line1", "A simpler food system.")}
              <br />
              <em className="font-semibold text-[var(--lime)]">
                {t("home.values_heading_line2", "A better deal for everyone.")}
              </em>
            </h2>

            <p className="mt-5 max-w-[560px] text-sm leading-[1.8] text-white/60">
              {t(
                "home.values_subtitle",
                "We believe agriculture works best when the distance between the farmer and the family buying their food is kept short."
              )}
            </p>
          </div>

          {/* Values Cards */}
          <div className="mt-16 grid grid-cols-4 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
            {values.map((value, index) => (
              <div
                key={value.number}
                className="group relative min-h-[280px] bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:bg-white cursor-default"
                style={{
                  transitionDelay: `${index * 0.1}s`,
                }}
              >
                {/* Decorative accent line */}
                <div className="absolute top-0 left-8 right-8 h-1 bg-[var(--lime)] rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                <span className="text-[9px] tracking-wider text-[var(--green-700)]/40 font-mono">
                  {value.number}
                </span>

                <span className="my-4 block text-[28px] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  {value.icon}
                </span>

                <h3 className="font-serif-heading text-[22px] font-bold text-[var(--green-900)] transition-colors duration-300 group-hover:text-[var(--green-700)]">
                  {value.title}
                </h3>

                <p className="mt-3 text-[12px] leading-[1.7] text-[var(--muted)] transition-colors duration-300 group-hover:text-[var(--green-800)]/80">
                  {value.description}
                </p>

                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--lime)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

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
            {t("home.cta_heading_prefix", "Bring the farm")}
            <br />
            <em className="font-semibold text-[var(--lime)]">
              {t("home.cta_heading_accent", "closer to home.")}
            </em>
          </h2>

          <p className="mx-auto mt-5 max-w-[510px] text-[13px] leading-[1.8] text-white/65">
            {t(
              "home.cta_subtitle",
              "Interested in our products, availability or a direct order? We'd love to hear from you."
            )}
          </p>

          <div className="mt-7 flex justify-center gap-6 max-sm:flex-col max-sm:items-center">
            <Link
              href={`tel:${cleanPhone}`}
              className="flex min-h-[52px] w-[160px] items-center justify-center gap-6 bg-white px-5 text-xs font-bold text-[var(--green-900)] transition hover:-translate-y-1 rounded-lg"
            >
              {t("home.cta_btn_call", "Call Us")}
              <ArrowRight size={17} />
            </Link>

            <Link
              href={`mailto:${contactEmail}`}
              className="flex min-h-[52px] w-[160px] items-center justify-center gap-6 border border-white/35 px-5 text-xs font-bold text-white transition hover:bg-white/10 rounded-lg"
            >
              {t("home.cta_btn_email", "Send an Email")}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          BACK TO TOP
      ========================================================= */}
      <button
        type="button"
        aria-label={t("home.back_to_top", "Back to top")}
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