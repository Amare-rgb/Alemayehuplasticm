// src/app/shop/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ShoppingBag, Sprout } from 'lucide-react'
import ProductCard from '@/components/shop/ProductCard'

type Props = { searchParams?: { [key: string]: string | string[] | undefined } }

export default async function ShopListing({ searchParams }: Props) {
  const category = Array.isArray(searchParams?.category)
    ? searchParams?.category[0]
    : searchParams?.category

  const search = Array.isArray(searchParams?.search)
    ? searchParams?.search[0]
    : searchParams?.search

  const where: any = { status: 'APPROVED' }
  if (category) {
    where.category = { slug: category }
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 48,
      include: { category: { select: { id: true, name: true, slug: true, image: true } } },
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      take: 12,
    })
  ])

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ✅ CHANGED: Banner is now CLEAN WHITE (no dark green) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 mb-8 shadow-sm">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              <Sprout size={14} className="text-green-600" />
              Agricultural Marketplace
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Shop Farming & Agricultural Supplies
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              High-yield seeds, premium fertilizers, tools, organic compost, and equipment delivered directly to your farm.
            </p>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          <Link
            href="/shop"
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${!category ? 'bg-green-700 text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            All Products ({products.length})
          </Link>
          {categories.map(c => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${category === c.slug ? 'bg-green-700 text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {/* Filter / Search Status */}
        {(category || search) && (
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 mb-6 text-sm text-gray-600">
            <div>
              {category && <span>Category: <strong className="text-gray-900">{category}</strong> </span>}
              {search && <span>Search: <strong className="text-gray-900">"{search}"</strong></span>}
            </div>
            <Link href="/shop" className="text-green-600 hover:underline font-semibold text-xs">
              Clear Filters
            </Link>
          </div>
        )}

        {/* ✅ Product Grid - 4 per row, stacks vertically (already correct) */}
        {products.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-gray-200">
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-bold text-gray-800">No agricultural products found</h3>
            <p className="text-gray-500 text-sm mt-1">Try another category or search term.</p>
            <Link href="/shop" className="inline-block mt-4 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl">
              View All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                slug={p.slug}
                price={Number(p.price)}
                discountPrice={p.discountPrice ? Number(p.discountPrice) : null}
                stock={p.stock}
                images={p.images}
                category={p.category ? { name: p.category.name, slug: p.category.slug } : undefined}
                unitOfMeasurement={p.unitOfMeasurement || 'pcs'}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}