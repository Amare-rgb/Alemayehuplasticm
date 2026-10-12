// app/shop/page.tsx
import { Suspense } from "react";
import Products from "@/components/shop/Products";

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3a2a1e] border-t-transparent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#3a2a1e]">
              Loading products...
            </span>
          </div>
        </div>
      }
    >
      <Products />
    </Suspense>
  );
}