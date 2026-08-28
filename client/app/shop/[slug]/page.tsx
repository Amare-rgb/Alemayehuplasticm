// app/shop/[slug]/page.tsx
import ProductDetails from "@/components/shop/ProductDetails";
import { products, Product } from "@/data/products";

type ProductDetailsPageProps = {
  params: Promise<{
    slug: string;
  }> | { slug: string };
};

export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug || "";
  const slug = decodeURIComponent(rawSlug).toLowerCase().trim();

  let fetchedProduct: Product | null = null;

  try {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const res = await fetch(
      `${apiBaseUrl}/api/products/${encodeURIComponent(slug)}`,
      {
        cache: "no-store",
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (data && data.id) {
        fetchedProduct = {
          id: data.id,
          slug: data.slug || data.id,
          name: data.name,
          category: data.category?.name || "Produce",
          description: data.description || "",
          price: Number(data.price),
          discountPrice: data.discountPrice ? Number(data.discountPrice) : null,
          unit: data.unitOfMeasurement || "kg",
          stock: typeof data.stock === "number" ? data.stock : 100,
          featured: Boolean(data.discountPrice || data.isFeatured),
          badge: data.discountPrice ? "Special Offer" : undefined,
          images:
            Array.isArray(data.images) && data.images.length > 0
              ? data.images.map((img: string) =>
                  img.startsWith("http") ? img : `${apiBaseUrl}${img}`
                )
              : [
                  "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85",
                ],
        };
      }
    }
  } catch (err) {
    console.warn("Could not fetch product from backend on slug page:", err);
  }

  const finalProduct =
    fetchedProduct ||
    products.find((item) => item.slug.toLowerCase() === slug) ||
    products.find((item) => item.id.toLowerCase() === slug) ||
    products.find(
      (item) =>
        slug.includes(item.slug.toLowerCase()) ||
        item.slug.toLowerCase().includes(slug)
    ) ||
    products[0];

  return <ProductDetails product={finalProduct} />;
}
