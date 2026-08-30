// app/shop/[slug]/page.tsx
import ProductDetails from "@/components/shop/ProductDetails";
import { products, Product } from "@/data/products";
import { notFound } from "next/navigation";

type ProductDetailsPageProps = {
  params: Promise<{
    slug: string;
  }> | { slug: string };
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
      {
        cache: "no-store",
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (data && data.id) {
        // Properly handle images
        let imageList: string[] = [];
        if (Array.isArray(data.images) && data.images.length > 0) {
          imageList = data.images.map((img: string) => {
            if (!img) return "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85";
            if (img.startsWith("http://") || img.startsWith("https://")) {
              return img;
            }
            if (img.startsWith("/uploads/")) {
              return `${API_BASE_URL}${img}`;
            }
            if (img.startsWith("uploads/")) {
              return `${API_BASE_URL}/${img}`;
            }
            return `${API_BASE_URL}/uploads/products/${img}`;
          });
        } else {
          imageList = ["https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85"];
        }

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
      // Product not found or hidden - will trigger 404
      console.log(`Product with slug "${slug}" not found or is hidden`);
    }
  } catch (err) {
    console.warn("Could not fetch product from backend on slug page:", err);
  }

  // If we couldn't fetch from backend, check local data as fallback
  // BUT ONLY if the product is NOT hidden in the backend
  let finalProduct = fetchedProduct;

  if (!finalProduct) {
    // Try to find in local data
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

  // If still no product found, return 404
  if (!finalProduct) {
    notFound();
  }

  return <ProductDetails product={finalProduct} />;
}