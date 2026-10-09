// app/shop/[slug]/page.tsx
import ProductDetails from "@/components/shop/ProductDetails";
import { products, Product } from "@/data/products";
import { notFound } from "next/navigation";

type ProductDetailsPageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, "");

const DEFAULT_IMAGE = "/placeholder.svg";

/**
 * Resolve a stored image path into a usable URL.
 * Priority:
 *   1. Absolute http(s) URL (Cloudinary, S3, Unsplash, …)  → as-is
 *   2. Cloudinary host without protocol                    → prepend https://
 *   3. Legacy "/uploads/..." path                          → prepend backend origin
 *   4. Bare filename                                       → assume product image
 *   5. Anything else                                        → placeholder
 */
function resolveImage(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_IMAGE;
  const s = raw.trim();
  if (!s) return DEFAULT_IMAGE;

  if (s.startsWith("http://") || s.startsWith("https://")) return s;
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

      if (data && data.id) {
        const imageList: string[] =
          Array.isArray(data.images) && data.images.length > 0
            ? data.images.map(resolveImage)
            : [DEFAULT_IMAGE];

        fetchedProduct = {
          id: data.id,
          slug: data.slug || data.id,
          name: data.name,
          category: data.category?.name || "Produce",
          description: data.description || "",
          price: Number(data.price),
          discountPrice: data.discountPrice ? Number(data.discountPrice) : null,
          unit: data.unitOfMeasurement || "kg",
          stock: typeof data.stock === "number" ? data.stock : 0,
          featured: Boolean(data.discountPrice || data.isFeatured),
          badge: data.discountPrice ? "Special Offer" : undefined,
          images: imageList,
        };
      }
    } else if (res.status === 404) {
      console.log(`Product with slug "${slug}" not found or is hidden`);
    }
  } catch (err) {
    console.warn("Could not fetch product from backend on slug page:", err);
  }

  let finalProduct = fetchedProduct;

  if (!finalProduct) {
    const localProduct =
      products.find((item) => item.slug.toLowerCase() === slug) ||
      products.find((item) => item.id.toLowerCase() === slug) ||
      products.find(
        (item) =>
          slug.includes(item.slug.toLowerCase()) ||
          item.slug.toLowerCase().includes(slug)
      );

    if (localProduct) {
      finalProduct = localProduct;
    }
  }

  if (!finalProduct) {
    notFound();
  }

  return <ProductDetails product={finalProduct} />;
}