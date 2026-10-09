// components/shop/ProductDetails.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";

type ProductDetailsProps = {
  product: Product;
};

/* -------------------------------------------------------------------------- */
/*  IMAGE RESOLUTION — same logic as Products.tsx so URLs are handled 1:1     */
/* -------------------------------------------------------------------------- */

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, "");

const DEFAULT_IMAGE = "/placeholder.svg";
const FALLBACK_REMOTE_IMAGE =
  "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85";

function resolveImage(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_IMAGE;
  const s = raw.trim();
  if (!s) return DEFAULT_IMAGE;

  // 1. Absolute URL (Cloudinary, S3, etc.)
  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  // 2. Cloudinary path without protocol
  if (s.startsWith("res.cloudinary.com/")) return `https://${s}`;

  // 3. Legacy local uploads (will 404 if backend no longer serves /uploads)
  if (s.startsWith("/uploads/") || s.startsWith("uploads/")) {
    const clean = s.startsWith("/") ? s : `/${s}`;
    return `${API_BASE_URL}${clean}`;
  }

  // 4. Bare filename
  if (!s.includes("/") && /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(s)) {
    return `${API_BASE_URL}/uploads/products/${s}`;
  }

  // 5. Anything else
  return DEFAULT_IMAGE;
}

/* -------------------------------------------------------------------------- */
/*  ICONS                                                                     */
/* -------------------------------------------------------------------------- */

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

function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M3 4h2l1.7 10.2a2 2 0 0 0 2 1.8h7.8a2 2 0 0 0 2-1.6L20 7H6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1.2" fill="currentColor" />
      <circle cx="17" cy="20" r="1.2" fill="currentColor" />
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

/* -------------------------------------------------------------------------- */
/*  STABLE IMAGE                                                              */
/*  3-stage fallback: primary → placeholder → remote → dead                   */
/*  Local/Unsplash assets skip Next.js optimizer via `unoptimized`            */
/* -------------------------------------------------------------------------- */

const ProductImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}> = ({ src, alt, className = "", priority = false }) => {
  const [prevSrc, setPrevSrc] = useState(src);
  const [imgSrc, setImgSrc] = useState(src);
  const [stage, setStage] = useState<"primary" | "placeholder" | "remote" | "dead">(
    "primary"
  );

  // Reset when parent passes a new src — React-recommended pattern
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
      <div className={`flex items-center justify-center bg-gray-200 ${className}`}>
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
      className={`object-cover object-center ${className}`}
      onError={handleError}
      sizes="(max-width: 768px) 100vw, 50vw"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
    />
  );
};

/* -------------------------------------------------------------------------- */
/*  MAIN COMPONENT                                                            */
/* -------------------------------------------------------------------------- */

export default function ProductDetails({ product }: ProductDetailsProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { t } = useLanguage();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const effectivePrice =
    product.discountPrice !== null &&
    product.discountPrice !== undefined &&
    product.discountPrice < product.price
      ? product.discountPrice
      : product.price;

  const total = useMemo(
    () => effectivePrice * quantity,
    [effectivePrice, quantity]
  );

  // ✅ Resolve every image URL exactly once
  const images = useMemo(() => {
    const raw = Array.isArray(product.images) ? product.images : [];
    const resolved = raw.map(resolveImage).filter(Boolean);
    return resolved.length > 0 ? resolved : [DEFAULT_IMAGE];
  }, [product.images]);

  const safeIndex = Math.min(Math.max(selectedImage, 0), images.length - 1);
  const currentImage = images[safeIndex];

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const increaseQuantity = () => {
    setQuantity((current) =>
      product.stock > 0 ? Math.min(product.stock, current + 1) : current + 1
    );
  };

  const handleQuantityInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
      setQuantity(1);
    } else if (product.stock > 0 && val > product.stock) {
      setQuantity(product.stock);
    } else {
      setQuantity(val);
    }
  };

  const handleAddToCart = () => {
    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        discountPrice: product.discountPrice,
        unit: product.unit,
        images: product.images,
        stock: product.stock,
        category: product.category,
      },
      quantity,
      true
    );
  };

  const handleBuyNow = () => {
    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        discountPrice: product.discountPrice,
        unit: product.unit,
        images: product.images,
        stock: product.stock,
        category: product.category,
      },
      quantity,
      false
    );
    router.push("/cart");
  };

  return (
    <main className="min-h-screen bg-[var(--cream)]">
      {/* Top navigation */}
      <div className="border-b border-[#19472d]/10 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-4 sm:px-8 lg:px-12">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#28633e] transition hover:text-[#123523]"
          >
            <ArrowLeft />
            {t("product.back_to_products", "Back to products")}
          </Link>
        </div>
      </div>

      <section className="px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            {/* Image Gallery */}
            <div>
              <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_65px_rgba(18,53,35,.09)]">
                <div className="relative aspect-square overflow-hidden bg-[#0b2419]">
                  <ProductImage
                    key={currentImage}
                    src={currentImage}
                    alt={product.name}
                    className="w-full h-full"
                    priority={true}
                  />

                  {product.badge && (
                    <span className="absolute left-6 top-6 rounded-full bg-[#f6f3e9]/95 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#28633e] shadow-sm backdrop-blur">
                      {product.badge === "Special Offer"
                        ? t("product.special_offer", "Special Offer")
                        : product.badge}
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {images.map((image, index) => {
                    const active = safeIndex === index;

                    return (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(index)}
                        className={`relative aspect-square overflow-hidden rounded-2xl border-2 transition-all ${
                          active
                            ? "border-[#28633e] shadow-md"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        aria-label={`View image ${index + 1}`}
                      >
                        <ProductImage
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full"
                          priority={false}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="flex flex-col justify-center">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-full bg-[#123523] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#f6f3e9]">
                  {product.category}
                </span>

                <span className="text-xs font-medium text-[#69736b]">
                  {t("product.direct_from_farm", "Direct from verified farm")}
                </span>
              </div>

              <h1 className="font-serif-heading text-4xl sm:text-5xl font-medium leading-[0.98] tracking-[-0.045em] text-[#123523]">
                {product.name}
              </h1>

              <p className="mt-5 text-base leading-7 text-[#69736b]">
                {product.description}
              </p>

              <div className="my-6 h-px bg-[#19472d]/10" />

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="font-serif-heading text-4xl font-semibold tracking-[-0.035em] text-[#123523]">
                  ETB {effectivePrice.toLocaleString()}
                </span>

                <span className="text-sm text-[#69736b]">
                  {t("product.per", "per")} {product.unit}
                </span>

                {product.discountPrice && product.discountPrice < product.price && (
                  <span className="text-sm text-gray-400 line-through">
                    ETB {product.price.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Stock */}
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    product.stock > 0 ? "bg-[#72a84d]" : "bg-red-500"
                  }`}
                />

                <span className="text-[#69736b] font-medium text-xs">
                  {product.stock > 0
                    ? `${product.stock} ${product.unit}s ${t(
                        "product.in_harvest_stock",
                        "currently in harvest stock"
                      )}`
                    : t("product.out_of_stock", "Currently out of stock")}
                </span>
              </div>

              {/* Quantity Selector */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#28633e]">
                    {t("product.select_quantity", "Select Quantity")} ({product.unit})
                  </label>
                  <span className="text-[11px] text-[#69736b]">
                    {t("product.quantity_hint", "Type directly or use + / -")}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center rounded-2xl border border-[#19472d]/15 bg-white p-1 shadow-sm focus-within:ring-2 focus-within:ring-[#b9d873]">
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-[#123523] transition hover:bg-[#f6f3e9] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <MinusIcon />
                    </button>

                    <input
                      type="number"
                      min={1}
                      max={product.stock > 0 ? product.stock : 9999}
                      value={quantity}
                      onChange={handleQuantityInputChange}
                      className="h-11 w-20 text-center text-base font-bold text-[#123523] bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />

                    <button
                      type="button"
                      onClick={increaseQuantity}
                      disabled={product.stock > 0 && quantity >= product.stock}
                      aria-label="Increase quantity"
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-[#123523] transition hover:bg-[#f6f3e9] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <PlusIcon />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="block text-xs uppercase tracking-[0.12em] text-[#69736b]">
                      {t("product.subtotal", "Subtotal")}
                    </span>

                    <span className="font-serif-heading text-2xl font-bold text-[#123523]">
                      ETB {total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-7 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="flex h-14 w-full sm:flex-1 items-center justify-center gap-2.5 rounded-2xl border-2 border-[#123523] bg-white px-6 text-sm font-bold text-[#123523] shadow-sm transition-all duration-200 hover:bg-[#f6f3e9] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <CartIcon />
                  <span>{t("product.add_to_cart", "Add to Cart")}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className="flex h-14 w-full sm:flex-1 items-center justify-center gap-2.5 rounded-2xl bg-[#123523] px-6 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:bg-[#19472d] hover:text-[var(--lime)] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>{t("product.buy_now", "Buy Now")}</span>
                  <span className="text-base font-bold">→</span>
                </button>
              </div>

              {/* Benefits */}
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4">
                  <TruckIcon />
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#123523]">
                    {t("product.benefit_fresh_title", "Farm Fresh")}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#69736b]">
                    {t("product.benefit_fresh_desc", "Freshly sourced.")}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <CheckIcon />
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#123523]">
                    {t("product.benefit_price_title", "Fair Price")}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#69736b]">
                    {t("product.benefit_price_desc", "No reseller markup.")}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <PhoneIcon />
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#123523]">
                    {t("product.benefit_support_title", "Support")}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#69736b]">
                    {t("product.benefit_support_desc", "We're here to help.")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}