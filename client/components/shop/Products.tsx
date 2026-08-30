// components/shop/Products.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Product, ProductCategory, products as fallbackProducts } from "@/data/products";
import { ShoppingBag, ArrowUpRight, Search } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export type { Product, ProductCategory };
export { fallbackProducts as products };

type SortOption = "featured" | "price-low" | "price-high" | "name";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export default function Products() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const initialCategoryParam = searchParams.get("category") || "All";

  const [backendProducts, setBackendProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryParam);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("featured");

  // Helper to translate category names if standard
  const getCategoryLabel = (catName: string) => {
    const lower = catName.toLowerCase();
    if (lower === "all") return t("shop.category_all", "All");
    if (lower === "vegetables") return t("home.cat_veg_title", "Vegetables");
    if (lower === "fruits") return t("home.cat_fruit_title", "Fruits");
    if (lower === "cereals") return t("home.cat_cereal_title", "Cereals");
    return catName;
  };

  // Sync category state when URL search params change
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  // Fetch public categories from backend
  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${apiBaseUrl}/api/categories/public`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data?.categories || [];
          if (isMounted && list.length > 0) {
            // Pick top-level categories
            const top = list.filter((c: any) => !c.parentId);
            const items = (top.length > 0 ? top : list).map((c: any) => ({
              id: c.id,
              name: c.name,
              slug: c.slug || c.name.toLowerCase(),
            }));
            setCategoriesList(items);
          }
        }
      } catch (err) {
        console.warn("Could not fetch categories list from backend:", err);
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch products from backend
  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        // Try primary /api/products route
        const res = await fetch(`${apiBaseUrl}/api/products?limit=50`);
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        const data = await res.json();
        const rawProducts = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : [];

        if (isMounted) {
          if (rawProducts.length > 0) {
            const mapped: Product[] = rawProducts.map((p: any) => {
              const categoryName = p.category?.name || "Produce";
              let imageList = Array.isArray(p.images) && p.images.length > 0
                ? p.images.map((img: string) =>
                    img.startsWith("http") ? img : `${apiBaseUrl}${img}`
                  )
                : [
                    "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85",
                  ];

              return {
                id: p.id,
                slug: p.slug || p.id,
                name: p.name,
                category: categoryName,
                description: p.description || "",
                price: Number(p.price) || 0,
                discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
                unit: p.unitOfMeasurement || "kg",
                stock: typeof p.stock === "number" ? p.stock : 100,
                featured: Boolean(p.discountPrice || p.isFeatured),
                badge: p.discountPrice ? "Special Offer" : undefined,
                images: imageList,
              };
            });
            setBackendProducts(mapped);
          } else {
            // If backend has 0 products yet, use fallback mock produce
            setBackendProducts(fallbackProducts);
          }
        }
      } catch (err: any) {
        console.warn("Backend products fetch note, using fallback:", err.message);
        if (isMounted) {
          setBackendProducts(fallbackProducts);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute available category tabs
  const categoryTabs = useMemo(() => {
    const set = new Set<string>(["All"]);
    if (categoriesList.length > 0) {
      categoriesList.forEach((c) => set.add(c.name));
    } else {
      set.add("Vegetables");
      set.add("Fruits");
      set.add("Cereals");
      set.add("Dairy");
    }
    return Array.from(set);
  }, [categoriesList]);

  // Filter & sort products
  const activeProducts = backendProducts.length > 0 ? backendProducts : fallbackProducts;

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();
    const normalizedCategory = selectedCategory.toLowerCase().trim();

    const filtered = activeProducts.filter((product) => {
      const productCat = (product.category || "").toLowerCase().trim();

      const matchesCategory =
        normalizedCategory === "all" ||
        productCat === normalizedCategory ||
        productCat.includes(normalizedCategory) ||
        normalizedCategory.includes(productCat);

      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.description.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      const priceA = a.discountPrice ?? a.price;
      const priceB = b.discountPrice ?? b.price;

      switch (sort) {
        case "price-low":
          return priceA - priceB;
        case "price-high":
          return priceB - priceA;
        case "name":
          return a.name.localeCompare(b.name);
        case "featured":
        default:
          return Number(b.featured) - Number(a.featured);
      }
    });
  }, [activeProducts, selectedCategory, search, sort]);

  return (
    <main className="min-h-screen bg-[var(--cream)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#123523] px-5 pb-16 pt-28 sm:px-8 lg:px-12 lg:pb-20 lg:pt-36">
        <div
          className="pointer-events-none absolute -right-24 -top-40 h-[32rem] w-[32rem] rounded-full bg-[#b9d873]/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-[#72a84d]/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h1 className="font-serif-heading text-5xl font-medium leading-[0.98] tracking-[-0.045em] text-[#f6f3e9] sm:text-6xl lg:text-7xl">
              {t("shop.hero_title_1", "Fresh Harvest,")}
              <br />
              <span className="text-[#b9d873]">
                {t("shop.hero_title_2", "straight from the source.")}
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-[#f6f3e9]/75 sm:text-lg">
              {t(
                "shop.hero_subtitle",
                "Explore nutrient-dense vegetables, orchard fruits, highland cereals, and farm produce sourced directly from farmers with zero middlemen."
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Catalogue & Controls */}
      <section className="px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto max-w-7xl">
          {/* Controls Bar */}
          <div className="mb-10 rounded-[2rem] border border-[rgba(20,33,25,.09)] bg-white p-4 shadow-[0_15px_45px_rgba(18,53,35,.06)] sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Search Bar */}
              <div className="relative w-full lg:max-w-md">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#69736b]">
                  <Search size={18} />
                </div>

                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t(
                    "shop.search_placeholder",
                    "Search fresh harvest, crops, produce..."
                  )}
                  className="h-12 w-full rounded-xl border border-[#19472d]/10 bg-[#f6f3e9]/60 pl-11 pr-4 text-sm text-[#142119] outline-none transition placeholder:text-[#69736b]/60 focus:border-[#28633e] focus:bg-white focus:ring-4 focus:ring-[#b9d873]/20"
                />
              </div>

              {/* Filter Tabs & Sort Dropdown */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Category Pills */}
                <div className="flex flex-wrap gap-2">
                  {categoryTabs.map((category) => {
                    const active =
                      selectedCategory.toLowerCase() === category.toLowerCase();

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                          active
                            ? "bg-[#123523] text-[#f6f3e9] shadow-md scale-105"
                            : "bg-[#f6f3e9] text-[#69736b] hover:bg-[#eae5d7] hover:text-[#123523]"
                        }`}
                      >
                        {getCategoryLabel(category)}
                      </button>
                    );
                  })}
                </div>

                {/* Sort Option Dropdown */}
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="h-10 rounded-full border border-[#19472d]/10 bg-[#f6f3e9] px-4 text-xs font-semibold text-[#123523] outline-none focus:border-[#28633e]"
                >
                  <option value="featured">
                    {t("shop.sort_featured", "Featured First")}
                  </option>
                  <option value="price-low">
                    {t("shop.sort_price_low", "Price: Low to High")}
                  </option>
                  <option value="price-high">
                    {t("shop.sort_price_high", "Price: High to Low")}
                  </option>
                  <option value="name">
                    {t("shop.sort_name", "Name A–Z")}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mb-7 flex items-center justify-between">
            <p className="text-sm text-[#69736b]">
              {t("shop.showing", "Showing")}{" "}
              <span className="font-bold text-[#123523]">
                {filteredProducts.length}
              </span>{" "}
              {filteredProducts.length === 1
                ? t("shop.product_singular", "product")
                : t("shop.product_plural", "products")}
              {selectedCategory.toLowerCase() !== "all" && (
                <span>
                  {" "}
                  {t("shop.in", "in")}{" "}
                  <strong className="text-[#123523] capitalize">
                    {getCategoryLabel(selectedCategory)}
                  </strong>
                </span>
              )}
            </p>

            {selectedCategory.toLowerCase() !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedCategory("All")}
                className="text-xs font-semibold text-[#28633e] hover:underline"
              >
                {t("shop.reset_filter", "Reset category filter")}
              </button>
            )}
          </div>

          {/* Loading Skeletons */}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-[2rem] border border-[rgba(20,33,25,.09)] bg-white p-4 animate-pulse"
                >
                  <div className="aspect-[1.1/1] w-full rounded-2xl bg-gray-200" />
                  <div className="mt-4 space-y-2">
                    <div className="h-6 w-3/4 rounded bg-gray-200" />
                    <div className="h-4 w-full rounded bg-gray-100" />
                    <div className="h-4 w-1/2 rounded bg-gray-100" />
                    <div className="mt-4 h-10 w-full rounded-xl bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            /* Product Cards Grid */
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => {
                const hasDiscount =
                  product.discountPrice !== null &&
                  product.discountPrice !== undefined &&
                  product.discountPrice < product.price;

                const displayPrice = hasDiscount
                  ? product.discountPrice!
                  : product.price;

                const discountPercent = hasDiscount
                  ? Math.round(
                      ((product.price - product.discountPrice!) /
                        product.price) *
                        100
                    )
                  : 0;

                const isAvailable = product.stock > 0;

                return (
                  <div
                    key={product.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-[2rem] border border-[rgba(20,33,25,.09)] bg-white shadow-[0_15px_45px_rgba(18,53,35,.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_25px_65px_rgba(18,53,35,.12)]"
                  >
                    {/* Image Link */}
                    <Link
                      href={`/shop/${encodeURIComponent(product.slug)}`}
                      className="block relative aspect-[1.15/1] overflow-hidden bg-[#0b2419]"
                    >
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85";
                        }}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b2419]/60 via-transparent to-transparent opacity-80" />

                      {/* Top Badges */}
                      <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#123523] shadow-sm backdrop-blur">
                          {getCategoryLabel(product.category)}
                        </span>

                        {hasDiscount && (
                          <span className="rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                            -{discountPercent}%
                          </span>
                        )}
                      </div>

                      {/* Stock Badge */}
                      <span className="absolute bottom-4 left-4 rounded-full bg-[#123523]/85 px-3 py-1 text-[10px] font-medium text-white backdrop-blur">
                        {isAvailable
                          ? `${t("shop.in_stock", "In Stock")} (${product.stock} ${product.unit})`
                          : t("shop.out_of_stock", "Out of stock")}
                      </span>

                      {/* Quick Detail Arrow */}
                      <span className="absolute bottom-4 right-4 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-[var(--lime)] text-[#123523] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 shadow-md">
                        <ArrowUpRight size={18} strokeWidth={2.2} />
                      </span>
                    </Link>

                    {/* Content Section */}
                    <div className="flex flex-1 flex-col justify-between p-6">
                      <div>
                        {/* Title */}
                        <Link
                          href={`/shop/${encodeURIComponent(product.slug)}`}
                          className="block"
                        >
                          <h2 className="font-serif-heading text-xl font-bold leading-tight tracking-[-0.02em] text-[#123523] transition-colors group-hover:text-[#28633e]">
                            {product.name}
                          </h2>
                        </Link>

                        {/* Description */}
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#69736b]">
                          {product.description ||
                            t(
                              "shop.default_card_desc",
                              "Naturally grown and carefully harvested farm produce."
                            )}
                        </p>
                      </div>

                      <div className="mt-5">
                        <div className="mb-4 h-px bg-[#19472d]/10" />

                        {/* Price Row */}
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="flex items-baseline gap-2">
                            <span className="font-serif-heading text-2xl font-bold text-[#123523]">
                              ETB {displayPrice.toLocaleString()}
                            </span>
                            <span className="text-xs text-[#69736b]">
                              / {product.unit}
                            </span>
                          </div>

                          {hasDiscount && (
                            <span className="text-xs text-gray-400 line-through">
                              ETB {product.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-[2rem] border border-dashed border-[#19472d]/20 bg-white px-6 py-20 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f6f3e9] text-[#28633e]">
                <Search size={24} />
              </div>

              <h3 className="font-serif-heading text-2xl font-bold text-[#123523]">
                {t("shop.no_products_title", "No agricultural products found")}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-[#69736b]">
                {t(
                  "shop.no_products_desc",
                  "We couldn't find any items matching your current filters. Try adjusting your search query or choosing another category."
                )}
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("All");
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#123523] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#f6f3e9] transition hover:bg-[#19472d]"
              >
                {t("shop.clear_filters", "Clear all filters")}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}