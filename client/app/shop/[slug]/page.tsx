// app/shop/[slug]/page.tsx
import ProductDetails from "@/components/shop/ProductDetails";
import { notFound } from "next/navigation";

// Optional: local fallback data (comment out if you don't have this file)
// import { products, Product } from "@/data/products";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
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
  featured: boolean;
  badge?: string;
  images: string[];
}

type ProductDetailsPageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

// ─────────────────────────────────────────────────────────────────────────────
// API base
// ─────────────────────────────────────────────────────────────────────────────
const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, "");

const DEFAULT_IMAGE = "/banners/carplastik.jpg";

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

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug || "";
  const slug = decodeURIComponent(rawSlug).toLowerCase().trim();

  let fetchedProduct: Product | null = null;

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/products/${encodeURIComponent(slug)}`,
      { cache: "no-store" }
    );

    if (res.ok) {
      const data = await res.json();

      // Backend sometimes wraps product in { product: ... } or { data: ... }
      const raw = data?.product ?? data?.data ?? data;

      if (raw && raw.id) {
        const imageList: string[] =
          Array.isArray(raw.images) && raw.images.length > 0
            ? raw.images.map(resolveImage)
            : [DEFAULT_IMAGE];

        fetchedProduct = {
          id: raw.id,
          slug: raw.slug || raw.id,
          name: raw.name,
          // ✅ Plastic-manufacturing fallback category
          category: raw.category?.name || "Plastic Products",
          description: raw.description || "",
          price: Number(raw.price),
          discountPrice: raw.discountPrice
            ? Number(raw.discountPrice)
            : null,
          // ✅ Default to "pcs" (plastic products sold by the piece)
          unit: raw.unitOfMeasurement || "pcs",
          stock: typeof raw.stock === "number" ? raw.stock : 0,
          featured: Boolean(raw.discountPrice || raw.isFeatured),
          badge: raw.discountPrice ? "Sale" : undefined,
          images: imageList,
        };
      }
    } else if (res.status === 404) {
      console.log(`Product with slug "${slug}" not found`);
    }
  } catch (err) {
    console.warn("Could not fetch product from backend on slug page:", err);
  }

  

  if (!fetchedProduct) {
    notFound();
  }

  return <ProductDetails product={fetchedProduct} />;
}