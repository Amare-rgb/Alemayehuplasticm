// components/shop/ProductDetails.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

// ✅ Local type — no dependency on `@/data/products`
export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  price: number;
  discountPrice: number | null;
  unit: string;
  stock: number;
  featured?: boolean;
  badge?: string;
  images: string[];
}

type ProductDetailsProps = {
  product: Product;
};

// ────────────────────────────────────────────────────────────────────────────
// CONFIG
// ────────────────────────────────────────────────────────────────────────────
const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, "");

const DEFAULT_IMAGE = "/banners/carplastik.jpg";
const FALLBACK_REMOTE_IMAGE =
  "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=1200&q=85";

// ✅ Replace with your real business phone number
const BUSINESS_PHONE = "+251 900 000 000";
const BUSINESS_PHONE_TEL = BUSINESS_PHONE.replace(/\s/g, "");

function resolveImage(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_IMAGE;
  const s = raw.trim();
  if (!s) return DEFAULT_IMAGE;

  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("data:")) return s;
  if (s.startsWith("res.cloudinary.com/")) return `https://${s}`;

  if (s.startsWith("/uploads/") || s.startsWith("uploads/")) {
    const clean = s.startsWith("/") ? s : `/${s}`;
    return `${API_BASE_URL}${clean}`;
  }

  if (!s.includes("/") && /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(s)) {
    return `${API_BASE_URL}/uploads/products/${s}`;
  }

  return DEFAULT_IMAGE;
}

// ────────────────────────────────────────────────────────────────────────────
// Icons
// ────────────────────────────────────────────────────────────────────────────
function ArrowLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="m15 18-6-6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M3 6h11v10H3zM14 10h3l4 4v2h-7z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="18" r="1.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="18" cy="18" r="1.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M7 3h2l1.2 4-2 1.5a15 15 0 0 0 7.3 7.3L17 13.8 21 15v2c0 1.1-.9 2-2 2C10.2 19 5 13.8 5 5c0-1.1.9-2 2-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m20 20-3.5-3.5M11 8v6M8 11h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Stable image with 3-stage fallback
// ────────────────────────────────────────────────────────────────────────────
const ProductImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  contain?: boolean;
}> = ({ src, alt, className = "", priority = false, contain = false }) => {
  const [prevSrc, setPrevSrc] = useState(src);
  const [imgSrc, setImgSrc] = useState(src);
  const [stage, setStage] = useState<
    "primary" | "placeholder" | "remote" | "dead"
  >("primary");

  if (src !== prevSrc) {
    setPrevSrc(src);
    setImgSrc(src);
    setStage("primary");
  }

  const handleError = () => {
    if (stage === "primary") {
      setStage("placeholder");
      setImgSrc(DEFAULT_IMAGE);
    } else if (stage === "placeholder") {
      setStage("remote");
      setImgSrc(FALLBACK_REMOTE_IMAGE);
    } else {
      setStage("dead");
    }
  };

  if (stage === "dead") {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 ${className}`}
      >
        <span className="text-xs text-gray-400">No image</span>
      </div>
    );
  }

  const isLocalAsset = imgSrc.startsWith("/");
  const isUnsplash = imgSrc.includes("images.unsplash.com");

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      unoptimized={isLocalAsset || isUnsplash}
      className={`${
        contain ? "object-contain" : "object-cover"
      } object-center ${className}`}
      onError={handleError}
      sizes="(max-width: 768px) 100vw, 50vw"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
    />
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Fullscreen image viewer (lightbox)
// ────────────────────────────────────────────────────────────────────────────
function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close fullscreen image"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <CloseIcon />
      </button>

      <div
        className="relative h-full w-full max-h-[92vh] max-w-[92vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          className="object-contain"
          sizes="100vw"
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────
export default function ProductDetails({ product }: ProductDetailsProps) {
  const { t } = useLanguage();

  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const effectivePrice =
    product.discountPrice !== null &&
    product.discountPrice !== undefined &&
    product.discountPrice < product.price
      ? product.discountPrice
      : product.price;

  const images = useMemo(() => {
    const raw = Array.isArray(product.images) ? product.images : [];
    const resolved = raw.map(resolveImage).filter(Boolean);
    return resolved.length > 0 ? resolved : [DEFAULT_IMAGE];
  }, [product.images]);

  const safeIndex = Math.min(Math.max(selectedImage, 0), images.length - 1);
  const currentImage = images[safeIndex];

  return (
    <main className="min-h-screen bg-[#faf6ee]">
      {/* Top navigation */}
      <div className="border-b border-[#3a2a1e]/10 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-3 sm:px-8 lg:px-12">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#b98a3e] transition hover:text-[#1a1410]"
          >
            <ArrowLeft />
            {t("product.back_to_products", "Back to products")}
          </Link>
        </div>
      </div>

      <section className="px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            {/* Image Gallery */}
            <div>
              {/* Main image — no white background, click to open fullscreen */}
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label={t("product.view_fullscreen", "View full image")}
                className="group relative block w-full overflow-hidden rounded-2xl bg-[#f5f0e6] shadow-[0_20px_65px_rgba(58,42,30,.09)]"
              >
                <div className="relative aspect-square overflow-hidden">
                  <ProductImage
                    key={currentImage}
                    src={currentImage}
                    alt={product.name}
                    className="w-full h-full"
                    priority={true}
                    contain
                  />

                  {product.badge && (
                    <span className="absolute left-4 top-4 rounded-full bg-[#faf6ee]/95 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[#b98a3e] shadow-sm backdrop-blur">
                      {product.badge === "Special Offer" ||
                      product.badge === "Sale"
                        ? t("product.special_offer", "Sale")
                        : product.badge}
                    </span>
                  )}

                  {/* Zoom hint */}
                  <span className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[10px] font-semibold text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                    <ZoomInIcon />
                    {t("product.tap_to_zoom", "Tap to zoom")}
                  </span>
                </div>
              </button>

              {/* Thumbnails — click to select + open fullscreen */}
              {images.length > 1 && (
                <div className="mt-3 grid grid-cols-4 gap-2.5">
                  {images.map((image, index) => {
                    const active = safeIndex === index;

                    return (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => {
                          setSelectedImage(index);
                          setLightboxOpen(true);
                        }}
                        className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-[#f5f0e6] transition-all ${
                          active
                            ? "border-[#b98a3e] shadow-md"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        aria-label={`View image ${index + 1}`}
                      >
                        <ProductImage
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full"
                          priority={false}
                          contain
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="flex flex-col justify-center">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="rounded-full bg-[#1a1410] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-[#e0a83c]">
                  {product.category}
                </span>

                <span className="text-[11px] font-medium text-[#7a6a58]">
                  {t("product.direct_from_factory", "Direct from our factory")}
                </span>
              </div>

              <h1 className="font-serif-heading text-3xl sm:text-4xl font-medium leading-[1.02] tracking-[-0.04em] text-[#1a1410]">
                {product.name}
              </h1>

              <p className="mt-4 text-sm leading-6 text-[#7a6a58]">
                {product.description}
              </p>

              <div className="my-5 h-px bg-[#3a2a1e]/10" />

              {/* Price */}
              <div className="flex items-baseline gap-2.5">
                <span className="font-serif-heading text-3xl font-semibold tracking-[-0.035em] text-[#1a1410]">
                  ETB {effectivePrice.toLocaleString()}
                </span>

                <span className="text-xs text-[#7a6a58]">
                  {t("product.per", "per")} {product.unit}
                </span>

                {product.discountPrice &&
                  product.discountPrice < product.price && (
                    <span className="text-xs text-gray-400 line-through">
                      ETB {product.price.toLocaleString()}
                    </span>
                  )}
              </div>

              {/* Stock */}
              <div className="mt-2.5 flex items-center gap-2 text-xs">
                <span
                  className={`h-2 w-2 rounded-full ${
                    product.stock > 0 ? "bg-[#e0a83c]" : "bg-red-500"
                  }`}
                />

                <span className="text-[#7a6a58] font-medium">
                  {product.stock > 0
                    ? `${product.stock} ${product.unit} ${t(
                        "product.in_production_stock",
                        "currently in production stock"
                      )}`
                    : t("product.out_of_stock", "Currently out of stock")}
                </span>
              </div>

              {/* Contact CTA */}
              <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href="/contact"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1a1410] px-6 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:bg-[#2a1f18] hover:text-[#e0a83c] hover:shadow-xl"
                >
                  <span>{t("product.request_quote", "Request a Quote")}</span>
                  <span className="text-base font-bold">→</span>
                </Link>
              </div>

              {/* Benefits */}
              <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-3.5">
                  <TruckIcon />
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#1a1410]">
                    {t("product.benefit_delivery_title", "Fast Delivery")}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-4 text-[#7a6a58]">
                    {t(
                      "product.benefit_delivery_desc",
                      "Direct from our factory."
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-3.5">
                  <CheckIcon />
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#1a1410]">
                    {t("product.benefit_price_title", "Fair Price")}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-4 text-[#7a6a58]">
                    {t("product.benefit_price_desc", "No reseller markup.")}
                  </p>
                </div>

                {/* Phone card — clickable tel: link */}
                <a
                  href={`tel:${BUSINESS_PHONE_TEL}`}
                  className="rounded-xl bg-white p-3.5 transition hover:bg-[#faf6ee]"
                  aria-label={`Call ${BUSINESS_PHONE}`}
                >
                  <PhoneIcon />
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#1a1410]">
                    {t("product.benefit_phone_title", "Call Us")}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-4 font-semibold text-[#b98a3e]">
                    {BUSINESS_PHONE}
                  </p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fullscreen lightbox */}
      {lightboxOpen && (
        <ImageLightbox
          src={currentImage}
          alt={product.name}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </main>
  );
}