import ProductDetails from "@/components/shop/ProductDetails";
import { products } from "@/data/products";

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

  const product =
    products.find((item) => item.slug.toLowerCase() === slug) ||
    products.find((item) => item.id.toLowerCase() === slug) ||
    products.find(
      (item) =>
        slug.includes(item.slug.toLowerCase()) ||
        item.slug.toLowerCase().includes(slug)
    ) ||
    products[0];

  return <ProductDetails product={product} />;
}
