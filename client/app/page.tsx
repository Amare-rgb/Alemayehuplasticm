// app/page.tsx
"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useLanguage } from "@/context/LanguageContext";

// ============================================================
// Types
// ============================================================
interface CategoryData {
  id?: string;
  name: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  images?: string[] | null;
  parentId?: string | null;
}

interface ProductData {
  id?: string;
  name?: string;
  image?: string | null;
  images?: string[] | null;
  categoryId?: string | null;
  category?: string | null;
}

interface CategoryItem {
  id: string;
  title: string;
  slug: string;
  images: string[];
}

// ============================================================
// API base
// ============================================================
const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, "");

const DEFAULT_IMAGE = "/placeholder.svg";

// ============================================================
// HERO VIDEO
// ============================================================
const HERO_VIDEO = "/banners/her.mp4";
const HERO_POSTER = "/banners/carplastik.jpg";

// ============================================================
// Mounted detection (server-safe)
// ============================================================
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useMounted() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

// ============================================================
// Image resolver
// ============================================================
function resolveImage(raw?: string | null): string {
  if (!raw) return DEFAULT_IMAGE;
  const s = String(raw).trim();
  if (!s) return DEFAULT_IMAGE;

  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("data:")) return s;
  if (s.startsWith("res.cloudinary.com/")) return `https://${s}`;

  if (s.startsWith("/uploads/")) return `${API_BASE_URL}${s}`;
  if (s.startsWith("uploads/")) return `${API_BASE_URL}/${s}`;

  if (!s.includes("/") && /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(s)) {
    return `${API_BASE_URL}/uploads/categories/${s}`;
  }

  return DEFAULT_IMAGE;
}

// ============================================================
// Build the mosaic images for ONE category
// ============================================================
function buildCategoryMosaic(
  cat: CategoryData,
  productsForCategory: ProductData[]
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  const add = (raw?: string | null) => {
    if (!raw) return;
    const s = String(raw).trim();
    if (!s) return;
    if (seen.has(s)) return;
    seen.add(s);
    result.push(s);
  };

  add(cat.image);

  if (Array.isArray(cat.images)) {
    for (const img of cat.images) add(img);
  }

  for (const p of productsForCategory) {
    if (result.length >= 4) break;
    if (Array.isArray(p.images)) {
      for (const img of p.images) {
        if (result.length >= 4) break;
        add(img);
      }
    }
    add(p.image);
  }

  while (result.length < 4) {
    result.push(DEFAULT_IMAGE);
  }

  return result.slice(0, 4);
}

// ============================================================
// CategoryCard — clean 2×2 mosaic with DISTINCT images
// ✅ Title pill REMOVED from the mosaic (no overlay text)
// ============================================================
function CategoryCard({ product }: { product: CategoryItem }) {
  const cells: (string | null)[] = [...product.images];
  while (cells.length < 4) cells.push(null);

  return (
    <Link
      href={`/shop?category=${encodeURIComponent(product.slug)}`}
      className="group relative flex w-full flex-col overflow-hidden rounded-[14px] border border-[#eee6d8] bg-white shadow-[0_2px_10px_rgba(58,42,30,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(58,42,30,0.14)]"
    >
      {/* 2×2 mosaic — no overlay pill, just clean images */}
      <div className="relative grid h-[220px] w-full grid-cols-2 grid-rows-2 gap-[2px] bg-[#eee6d8]">
        {cells.map((src, i) => {
          const url = src ? resolveImage(src) : "";
          const hasImg = !!url && url !== DEFAULT_IMAGE;
          return (
            <div key={i} className="relative overflow-hidden bg-[#f5eee1]">
              {hasImg ? (
                <Image
                  src={url}
                  alt={`${product.title} ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 25vw, 12vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                  loading="lazy"
                  unoptimized={
                    url.startsWith("/") ||
                    url.includes("images.unsplash.com")
                  }
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#f5eee1] text-[10px] font-semibold tracking-wider text-[#b98a3e]/40">
                  {product.title.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer — the category name, slug, and arrow live HERE, not on
          the mosaic. This is the only place the name is shown now. */}
      <div className="flex items-center justify-between gap-2 border-t border-[#f0e8d8] bg-[#faf6ee] px-3.5 py-2.5">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[12px] font-semibold leading-tight text-[#2a1f18]">
            {product.title}
          </h3>
          <p className="mt-0.5 truncate text-[10px] text-[#7a6a58]">
            {product.slug}
          </p>
        </div>

        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:bg-[#e0a83c] group-hover:text-[#1a1410]">
          <ChevronRight size={14} strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  );
}

// ============================================================
// ProductCards — fetch categories AND products, build mosaics
// ============================================================
function ProductCards() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [catRes, prodRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/categories/public`, {
            cache: "no-store",
          }),
          fetch(`${API_BASE_URL}/api/products?limit=200`, {
            cache: "no-store",
          }).catch(() => null),
        ]);

        if (!catRes.ok) {
          throw new Error(`Categories API returned ${catRes.status}`);
        }

        const catData = await catRes.json();
        const rawCats: CategoryData[] = Array.isArray(catData)
          ? catData
          : catData?.categories || catData?.data || [];

        let rawProducts: ProductData[] = [];
        if (prodRes && prodRes.ok) {
          try {
            const prodData = await prodRes.json();
            rawProducts = Array.isArray(prodData)
              ? prodData
              : prodData?.products || prodData?.data || [];
          } catch {
            rawProducts = [];
          }
        }

        if (!isMounted) return;

        if (!Array.isArray(rawCats) || rawCats.length === 0) {
          setCategories([]);
          return;
        }

        const top = rawCats.filter((c) => !c.parentId);
        const toMap = top.length > 0 ? top : rawCats;

        const mapped: CategoryItem[] = toMap.map((cat, i) => {
          const slug = (cat.slug || cat.id || `category-${i}`)
            .toString()
            .toLowerCase();

          const productsForCategory = rawProducts.filter((p) => {
            const pCat = (p.categoryId || p.category || "")
              .toString()
              .toLowerCase();
            return (
              pCat === slug ||
              pCat === (cat.id || "").toString().toLowerCase()
            );
          });

          const images = buildCategoryMosaic(cat, productsForCategory);

          return {
            id: cat.id || slug,
            title: cat.name || "Untitled",
            slug,
            images,
          };
        });

        setCategories(mapped);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        if (isMounted) {
          setCategories([]);
          setError(
            err instanceof Error ? err.message : "Failed to load categories"
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section
        id="products"
        className="w-full scroll-mt-20 overflow-hidden bg-[#fbf8f1] px-4 py-12 sm:px-6 lg:px-10"
      >
        <div className="w-full">
          <div className="mb-6">
            <h2 className="text-[20px] font-semibold leading-tight text-[#2a1f18]">
              {t("home.featured_title", "Featured Categories")}
            </h2>
            <p className="mt-1 text-[12px] text-[#7a6a58]">
              {t("home.featured_subtitle", "Explore top categories")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-[270px] w-full animate-pulse rounded-[14px] bg-gray-200"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || categories.length === 0) {
    return (
      <section
        id="products"
        className="w-full scroll-mt-20 overflow-hidden bg-[#fbf8f1] px-4 py-12 sm:px-6 lg:px-10"
      >
        <div className="w-full text-center">
          <h2 className="text-[20px] font-semibold leading-tight text-[#2a1f18]">
            {t("home.featured_title", "Featured Categories")}
          </h2>
          <p className="mt-2 text-[13px] text-[#7a6a58]">
            {t(
              "home.no_categories",
              "No categories available yet. Please check back soon."
            )}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="products"
      className="w-full scroll-mt-20 overflow-hidden bg-[#fbf8f1] px-4 py-12 sm:px-6 lg:px-10"
    >
      <div className="w-full">
        <div className="mb-6">
          <h2 className="text-[20px] font-semibold leading-tight text-[#2a1f18] sm:text-[22px]">
            {t("home.featured_title", "Featured Categories")}
          </h2>
          <p className="mt-1 text-[12px] text-[#7a6a58]">
            {t("home.featured_subtitle", "Explore top categories")}
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {categories.map((product) => (
            <CategoryCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Eyebrow
// ============================================================
function Eyebrow({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <div
      className={`mb-3 flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] ${
        light ? "text-[#f0c872]" : "text-[#b98a3e]"
      }`}
    >
      <span className="h-px w-5 bg-current" />
      {children}
    </div>
  );
}

// ============================================================
// HomePage
// ============================================================
export default function HomePage() {
  const [showBackTop, setShowBackTop] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mounted = useMounted();
  const { settings } = useSettings();
  const { t } = useLanguage();

  const DEFAULT_PHONE = "+251 900 000 000";
  const DEFAULT_EMAIL = "info@alemayehplastic.com";

  const contactPhone = mounted
    ? settings?.contactPhone || DEFAULT_PHONE
    : DEFAULT_PHONE;
  const contactEmail = mounted
    ? settings?.contactEmail || DEFAULT_EMAIL
    : DEFAULT_EMAIL;
  const cleanPhone = contactPhone.replace(/\s/g, "");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;

    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {});
      }
    };

    tryPlay();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") tryPlay();
      else video.pause();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackTop(window.scrollY > 500);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="overflow-hidden bg-[var(--cream)] text-[var(--ink)]">
      {/* HERO */}
      <section
        id="home"
        className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#1a1410] text-white"
      >
        <div className="absolute inset-0 z-0">
          {videoFailed ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${HERO_POSTER}')` }}
            />
          ) : (
            <video
              ref={videoRef}
              src={HERO_VIDEO}
              poster={HERO_POSTER}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              disablePictureInPicture
              onError={() => setVideoFailed(true)}
            />
          )}
        </div>

        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(90deg, rgba(26,20,16,.94) 0%, rgba(26,20,16,.72) 45%, rgba(26,20,16,.30) 100%)",
          }}
        />
        <div className="absolute inset-0 z-[2] bg-[radial-gradient(circle_at_72%_48%,rgba(224,168,60,.18),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[140px] bg-gradient-to-b from-black/50 to-transparent" />

        <div className="relative z-10 mx-auto flex w-[min(1180px,calc(100%-48px))] items-end justify-between gap-[70px] pb-[72px] pt-[110px]">
          <div className="max-w-[620px] animate-fade-in-up">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e0a83c]/40 bg-[#2a1f18]/70 px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-[#f0c872] backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e0a83c]" />
              {t("home.hero_badge", "PLASTIC MANUFACTURING")}
            </div>

            <h1 className="mb-5 text-[clamp(30px,3.6vw,48px)] font-bold leading-[1.1] tracking-[-0.02em] text-[#faf6ee]">
              {t("home.hero_title_prefix", "Alemayehu")}
              <span className="mt-1.5 block text-[clamp(15px,1.4vw,20px)] font-medium tracking-[0.06em] text-[#e0a83c]">
                {t("home.hero_title_accent", "Plastic")}
              </span>
            </h1>

            <p className="mb-7 max-w-[540px] text-[14px] leading-[1.75] text-white/80">
              {t(
                "home.hero_subtitle",
                "Manufacturing high-quality plastic products for homes, businesses and industries across Ethiopia."
              )}
            </p>

            <div className="flex items-center gap-4 max-sm:flex-col max-sm:items-start">
              <Link
                href="/shop"
                className="flex min-h-[44px] items-center justify-center gap-2.5 rounded-xl border border-[#e7b14d] bg-[linear-gradient(135deg,#e8aa3d,#d88d1d)] px-6 text-[13px] font-semibold text-[#1d1408] shadow-[0_10px_26px_rgba(216,141,29,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(216,141,29,0.42)]"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-[#1d1408]/30 bg-[#f8d38d] text-[9px]">
                  ✓
                </span>
                {t("home.hero_btn_explore", "Shop Collection")}
              </Link>

              <Link
                href="#contact"
                className="flex min-h-[44px] items-center justify-center gap-2.5 rounded-xl border border-white/25 bg-white/5 px-6 text-[13px] font-semibold text-white backdrop-blur-sm transition hover:border-[#f0c872]/70 hover:bg-white/10"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-white/30 text-[9px]">
                  ✦
                </span>
                {t("home.hero_btn_story", "Custom Order")}
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 text-[10px] tracking-[0.2em] text-white/70 md:flex">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/25 text-[9px]">
            ◌
          </span>
          {t("home.hero_scroll", "SCROLL TO EXPLORE")}
          <ArrowDown size={14} className="ml-1" />
        </div>
      </section>

      {/* INTRO */}
      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto grid w-[min(1180px,calc(100%-48px))] grid-cols-[1.1fr_.9fr] items-center gap-10 max-lg:grid-cols-1 max-lg:gap-5">
          <div>
            <Eyebrow>
              {t("home.intro_eyebrow", "THE ALEMAYEHU DIFFERENCE")}
            </Eyebrow>

            <h2 className="text-[clamp(20px,2.1vw,28px)] font-semibold leading-[1.25] tracking-[-0.015em] text-[#2a1f18]">
              {t("home.intro_heading_prefix", "Quality plastic")}{" "}
              <em className="font-semibold not-italic text-[#b98a3e]">
                {t("home.intro_heading_accent", "built to perform")}
              </em>{" "}
              {t("home.intro_heading_suffix", "for everyday life.")}
            </h2>
          </div>

          <div>
            <p className="mb-3 text-[13px] leading-[1.7] text-[var(--muted)]">
              {t(
                "home.intro_p1",
                "We manufacture durable plastic products with modern production methods, strict quality control and dependable service for homes, businesses and industrial buyers across Ethiopia."
              )}
            </p>

            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 border-b border-[#b98a3e] pb-0.5 text-[12px] font-semibold text-[#b98a3e]"
            >
              {t(
                "home.intro_btn",
                "Learn more about Alemayehu Plastic Manufacturing"
              )}
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED CATEGORIES */}
      <ProductCards />

      {/* FACILITY SECTION */}
      <section id="facility" className="scroll-mt-20 bg-white py-14 sm:py-16">
        <div className="mx-auto grid w-[min(1180px,calc(100%-48px))] grid-cols-[.95fr_1.05fr] items-center gap-12 max-lg:grid-cols-1 max-lg:gap-8">
          <div className="relative h-[380px] w-full max-lg:h-[320px]">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#f6f0e2]">
              <Image
                src="/banners/carplastik.jpg"
                alt="Alemayehu Plastic Manufacturing Facility"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority={false}
                unoptimized
              />
            </div>

            <div className="absolute bottom-4 left-0 z-10 flex w-[180px] items-center gap-2 rounded-r-xl bg-[#e0a83c] p-3 shadow-[0_16px_36px_rgba(58,42,30,.25)] max-sm:bottom-0 max-sm:w-[160px] max-sm:p-2.5">
              <div className="grid">
                <strong className="text-[13px] font-semibold leading-tight text-[#1a1410]">
                  {t("home.facility_title", "Alemayehu Plastic")}
                </strong>
                <small className="mt-0.5 text-[8px] uppercase tracking-wider text-[#1a1410]/80">
                  {t("home.facility_motto", "Strong. Safe. Lasting.")}
                </small>
              </div>
            </div>
          </div>

          <div>
            <Eyebrow>{t("home.facility_eyebrow", "INSIDE OUR FACTORY")}</Eyebrow>

            <h2 className="text-[clamp(20px,2.1vw,28px)] font-semibold leading-[1.25] tracking-[-0.015em] text-[#2a1f18]">
              {t("home.facility_heading_prefix", "Engineered")}{" "}
              <em className="font-semibold not-italic text-[#b98a3e]">
                {t("home.facility_heading_accent", "from the ground up.")}
              </em>
            </h2>

            <p className="mt-4 text-[15px] leading-[1.65] text-[#3a2a1e]">
              {t("home.facility_lead_1", "At")}{" "}
              <strong className="font-semibold">
                {t("home.facility_title", "Alemayehu Plastic Manufacturing")}
              </strong>
              {t(
                "home.facility_lead_2",
                ", every product is built with precision using modern machinery and tested materials."
              )}
            </p>

            <p className="mt-3 max-w-[520px] text-[13px] leading-[1.75] text-[var(--muted)]">
              {t(
                "home.facility_body",
                "From raw material selection to final packaging, our production line follows strict quality standards. We focus on durability, safety and sustainability — creating plastic products that serve Ethiopian homes, businesses and industries reliably."
              )}
            </p>

            <Link
              href="#contact"
              className="mt-6 inline-flex items-center gap-4 rounded-lg border border-[#b98a3e] px-4 py-2.5 text-[12px] font-semibold text-[#b98a3e] transition hover:bg-[#b98a3e] hover:text-white"
            >
              {t("home.facility_btn", "Request a Quote")}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section
        id="contact"
        className="relative overflow-hidden bg-[#2a1f18] py-14 text-white sm:py-16"
      >
        <div className="pointer-events-none absolute -right-[250px] -top-[270px] h-[700px] w-[700px] rounded-full border border-[rgba(224,168,60,.1)]">
          <div className="absolute inset-[70px] rounded-full border border-[rgba(224,168,60,.08)]" />
        </div>

        <div className="relative mx-auto max-w-[720px] px-6 text-center">
          <h2 className="text-[clamp(22px,2.6vw,32px)] font-semibold leading-[1.2] tracking-[-0.015em] text-white">
            {t("home.cta_heading_prefix", "Need plastic products")}{" "}
            <em className="font-semibold not-italic text-[#e0a83c]">
              {t("home.cta_heading_accent", "at scale?")}
            </em>
          </h2>

          <p className="mx-auto mt-3 max-w-[480px] text-[13px] leading-[1.75] text-white/65">
            {t(
              "home.cta_subtitle",
              "Interested in our products, bulk pricing or a custom manufacturing order? We'd love to hear from you."
            )}
          </p>

          <div className="mt-6 flex justify-center gap-4 max-sm:flex-col max-sm:items-center">
            <Link
              href={`tel:${cleanPhone}`}
              className="flex min-h-[44px] w-[150px] items-center justify-center gap-4 rounded-lg bg-white px-4 text-[12px] font-semibold text-[#2a1f18] transition hover:-translate-y-0.5"
            >
              {t("home.cta_btn_call", "Call Us")}
              <ArrowRight size={15} />
            </Link>

            <Link
              href={`mailto:${contactEmail}`}
              className="flex min-h-[44px] w-[150px] items-center justify-center gap-4 rounded-lg border border-white/35 px-4 text-[12px] font-semibold text-white transition hover:bg-white/10"
            >
              {t("home.cta_btn_email", "Send an Email")}
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* BACK TO TOP */}
      <button
        type="button"
        aria-label={t("home.back_to_top", "Back to top")}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-5 right-5 z-40 grid h-[40px] w-[40px] place-items-center rounded-full bg-[#e0a83c] text-[#1a1410] shadow-lg transition-all duration-300 ${
          showBackTop
            ? "visible translate-y-0 opacity-100"
            : "invisible translate-y-4 opacity-0"
        }`}
      >
        <ArrowUp size={17} />
      </button>
    </main>
  );
}