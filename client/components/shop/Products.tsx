"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Product, ProductCategory, products } from "@/data/products";
export type { Product, ProductCategory };
export { products };

const categories: ("All" | ProductCategory)[] = [
  "All",
  "Vegetables",
  "Fruits",
  "Cereals",
];

type SortOption = "featured" | "price-low" | "price-high" | "name";

function LeafIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M20.5 3.5C11.8 3.9 6.1 7 4.2 11.5c-1.5 3.5.4 6.7 3.6 7.2 4.4.7 8.1-3.3 9.1-7.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M4.5 20c2.5-5.5 6.2-8.8 11.4-11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m16 16 4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowUpRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M7 17 17 7M8 7h9v9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Products() {
  const [selectedCategory, setSelectedCategory] =
    useState<(typeof categories)[number]>("All");

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("featured");

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    const filtered = products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" ||
        product.category === selectedCategory;

      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.description.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "price-low":
          return a.price - b.price;

        case "price-high":
          return b.price - a.price;

        case "name":
          return a.name.localeCompare(b.name);

        case "featured":
        default:
          return Number(b.featured) - Number(a.featured);
      }
    });
  }, [selectedCategory, search, sort]);

  return (
    <main className="min-h-screen bg-[var(--cream)]">
      {/* Hero */}
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
              Good food,
              <br />
              <span className="text-[#b9d873]">straight from the source.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-[#f6f3e9]/65 sm:text-lg">
              Browse fresh vegetables, fruits and cereals sourced directly
              from farms. No unnecessary middlemen. No inflated reseller
              markups.
            </p>
          </div>
        </div>
      </section>

      {/* Catalogue */}
      <section className="px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto max-w-7xl">
          {/* Controls */}
          <div className="mb-10 rounded-[2rem] border border-[rgba(20,33,25,.09)] bg-white p-4 shadow-[0_15px_45px_rgba(18,53,35,.06)] sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="relative w-full lg:max-w-md">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#69736b]">
                  <SearchIcon />
                </div>

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products..."
                  className="h-12 w-full rounded-xl border border-[#19472d]/10 bg-[#f6f3e9]/60 pl-11 pr-4 text-sm text-[#142119] outline-none transition placeholder:text-[#69736b]/60 focus:border-[#28633e] focus:bg-white focus:ring-4 focus:ring-[#b9d873]/20"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {/* Categories */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const active = selectedCategory === category;

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                          active
                            ? "bg-[#123523] text-[#f6f3e9] shadow-md"
                            : "bg-[#f6f3e9] text-[#69736b] hover:bg-[#eae5d7] hover:text-[#123523]"
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>

                {/* Sort */}
                <select
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value as SortOption)
                  }
                  className="h-11 rounded-full border border-[#19472d]/10 bg-[#f6f3e9] px-4 text-sm font-semibold text-[#123523] outline-none focus:border-[#28633e]"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name A–Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="mb-7 flex items-center justify-between">
            <p className="text-sm text-[#69736b]">
              Showing{" "}
              <span className="font-bold text-[#123523]">
                {filteredProducts.length}
              </span>{" "}
              {filteredProducts.length === 1 ? "product" : "products"}
            </p>
          </div>

          {/* Product grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/shop/${product.slug}`}
                  className="group overflow-hidden rounded-[2rem] border border-[rgba(20,33,25,.09)] bg-white shadow-[0_15px_45px_rgba(18,53,35,.07)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_25px_65px_rgba(18,53,35,.13)]"
                >
                  {/* Image */}
                  <div className="relative aspect-[1.08/1] overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b2419]/50 via-transparent to-transparent" />

                    {product.badge && (
                      <span className="absolute left-5 top-5 rounded-full bg-[#f6f3e9]/95 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#28633e] backdrop-blur">
                        {product.badge}
                      </span>
                    )}

                    <span className="absolute bottom-5 left-5 rounded-full bg-[#123523]/80 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#f6f3e9] backdrop-blur">
                      {product.category}
                    </span>

                    <span className="absolute bottom-5 right-5 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-[#b9d873] text-[#123523] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <ArrowUpRight />
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h2 className="font-serif-heading text-2xl leading-tight tracking-[-0.025em] text-[#123523]">
                        {product.name}
                      </h2>

                      <span className="shrink-0 rounded-full bg-[#f6f3e9] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#28633e]">
                        Direct
                      </span>
                    </div>

                    <p className="line-clamp-2 text-sm leading-6 text-[#69736b]">
                      {product.description}
                    </p>

                    <div className="my-5 h-px bg-[#19472d]/10" />

                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <span className="font-serif-heading text-2xl font-semibold text-[#123523]">
                          ETB {product.price.toLocaleString()}
                        </span>

                        <span className="ml-1 text-xs text-[#69736b]">
                          / {product.unit}
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-[#28633e]">
                        {product.stock > 0
                          ? `${product.stock} ${product.unit}s available`
                          : "Out of stock"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-[#19472d]/15 bg-white px-6 py-20 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#f6f3e9] text-[#28633e]">
                <SearchIcon />
              </div>

              <h3 className="font-serif-heading text-3xl text-[#123523]">
                No products found
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#69736b]">
                Try another search term or choose a different category.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("All");
                }}
                className="mt-6 rounded-full bg-[#123523] px-6 py-3 text-sm font-semibold text-[#f6f3e9] transition hover:bg-[#19472d]"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}