// src/app/shop/[slug]/page.tsx
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AddToCartButton from '@/components/cart/AddToCartButton'
import ProductGallery from '@/components/pyement/ProductGallery'
import Picture from '@/components/ui/Picture'
import dynamic from 'next/dynamic'
const BuyNowForm = dynamic(() => import('@/components/pyement/BuyNowForm'), { ssr: false })
import { Decimal } from '@prisma/client/runtime/library'
import {
  Shield,
  Truck,
  Star,
  Package,
  Info,
  MapPin,
  TrendingUp,
  CheckCircle,
  ChevronRight,
  Lock,
  RefreshCw,
} from 'lucide-react'

type ReviewBase = {
  id: string
  rating: number
  comment?: string | null
  createdAt: Date
  user?: { name?: string } | null
}

type ReviewWithUser = ReviewBase

type RelatedItem = {
  id: string
  name: string
  slug: string
  price: Decimal | number | string
  images: string[]
  discountPrice?: Decimal | number | null
}

// Fix: Use correct Next.js 14 App Router params type
type Props = {
  params: Promise<{ slug: string }> | { slug: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}

function fmtEUR(value: Decimal | number | string | null | undefined) {
  if (!value) return '€0.00'
  let num: number
  if (value instanceof Decimal) {
    num = Number(value)
  } else if (typeof value === 'string') {
    num = Number(value)
  } else {
    num = value
  }
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(num)
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export default async function ProductPage({ params }: Props) {
  // Fix: Await params if it's a Promise (Next.js 15+) or use directly
  const resolvedParams = await params
  const { slug } = resolvedParams
  
  // Validate slug
  if (!slug || typeof slug !== 'string') {
    return notFound()
  }

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      subCategory: true,
      seller: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  const session = (await getServerSession(authOptions as any)) as Session | null

  if (!product) return notFound()

  if (product.status !== 'APPROVED') {
    const isOwner =
      session?.user && product.seller?.user && session.user.id === product.seller.user.id
    const isAdmin = session?.user && session.user.role === 'ADMIN'
    if (!isOwner && !isAdmin) return notFound()
  }

  const avgRating = product.reviews.length
    ? product.reviews.reduce((s: number, r: ReviewWithUser) => s + r.rating, 0) /
      product.reviews.length
    : null
  const ratingCount = product.reviews.length
  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    stars: s,
    count: product.reviews.filter((r: ReviewWithUser) => r.rating === s).length,
  }))

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, status: 'APPROVED', NOT: { id: product.id } },
    take: 4,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, slug: true, price: true, images: true, discountPrice: true },
  })

  let tags: string[] = []
  if (product.tags) {
    try {
      tags = Array.isArray(product.tags) ? product.tags : JSON.parse(product.tags as string)
    } catch {
      tags = []
    }
  }

  const sizes = product.sizes ? product.sizes.split(',').map((s: string) => s.trim()) : []
  const colors = product.colors ? product.colors.split(',').map((c: string) => c.trim()) : []

  const hasDiscount = product.discountPrice && product.discountPrice < product.price
  const discountPriceValue = hasDiscount ? Number(product.discountPrice) : null
  const savingsPercent =
    hasDiscount && discountPriceValue
      ? Math.round(
          ((Number(product.price) - discountPriceValue) / Number(product.price)) * 100
        )
      : 0

  const deliveryStart = new Date()
  deliveryStart.setDate(deliveryStart.getDate() + 5)
  const deliveryEnd = new Date()
  deliveryEnd.setDate(deliveryEnd.getDate() + 10)
  const deliveryDateString = `${deliveryStart.getDate()} ${deliveryStart.toLocaleString('default', { month: 'long' })} – ${deliveryEnd.getDate()} ${deliveryEnd.toLocaleString('default', { month: 'long' })}`

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-5" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-emerald-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
          <Link href="/shop" className="hover:text-emerald-600 transition-colors">
            Shop
          </Link>
          {product.category && (
            <>
              <ChevronRight className="w-3 h-3" aria-hidden="true" />
              <Link 
                href={`/shop?category=${product.category.slug}`} 
                className="hover:text-emerald-600 transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
          <span className="text-gray-700 font-medium line-clamp-1 max-w-[200px]">{product.name}</span>
        </nav>

        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_320px] gap-6 lg:gap-8 items-start">

          {/* Left Column - Gallery */}
          <div className="w-full lg:w-[420px]">
            <ProductGallery images={product.images} name={product.name} />
          </div>

          {/* Middle Column - Product Info */}
          <div className="space-y-4 min-w-0">
            {/* Title & Brand */}
            <div>
              {product.brand && (
                <Link
                  href={`/shop?brand=${encodeURIComponent(product.brand)}`}
                  className="text-xs font-semibold text-emerald-600 hover:underline uppercase tracking-wider"
                >
                  {product.brand}
                </Link>
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug mt-1">
                {product.name}
              </h1>
            </div>

            {/* Rating row */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      avgRating && i < Math.floor(avgRating)
                        ? 'text-amber-400 fill-current'
                        : 'text-gray-300 fill-current'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              {avgRating && (
                <span className="text-sm font-semibold text-amber-600">{avgRating.toFixed(1)}</span>
              )}
              <Link href="#reviews" className="text-sm text-blue-600 hover:underline">
                {ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}
              </Link>
              {product.brand && (
                <>
                  <span className="text-gray-300" aria-hidden="true">|</span>
                  <Link
                    href={`/shop?brand=${encodeURIComponent(product.brand)}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {product.brand}
                  </Link>
                </>
              )}
            </div>

            {/* Price block */}
            <div className="pb-3 border-b border-gray-200">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-bold text-gray-900">{fmtEUR(product.price)}</span>
                {hasDiscount && discountPriceValue && (
                  <>
                    <span className="text-base line-through text-gray-400">{fmtEUR(discountPriceValue)}</span>
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                      -{savingsPercent}% OFF
                    </span>
                  </>
                )}
              </div>
              {hasDiscount && discountPriceValue && (
                <p className="text-sm text-gray-500 mt-1">
                  You save{' '}
                  <span className="text-green-600 font-semibold">
                    {fmtEUR(Number(product.price) - discountPriceValue)}
                  </span>
                </p>
              )}
            </div>

            {/* About this item */}
            <div className="pb-3 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-2">About this item</h3>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>{product.description}</span>
                </li>
                {product.condition && (
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>
                      Condition:{' '}
                      <strong>
                        {product.condition === 'NEW'
                          ? 'New'
                          : product.condition === 'USED'
                          ? 'Used'
                          : 'Refurbished'}
                      </strong>
                    </span>
                  </li>
                )}
                {product.warranty && (
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>Warranty: <strong>{product.warranty}</strong></span>
                  </li>
                )}
                {sizes.length > 0 && (
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>Available sizes: <strong>{sizes.join(', ')}</strong></span>
                  </li>
                )}
                {colors.length > 0 && (
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>Available colors: <strong>{colors.join(', ')}</strong></span>
                  </li>
                )}
                {product.weight && (
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>Item weight: <strong>{product.weight} kg</strong></span>
                  </li>
                )}
              </ul>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="bg-gray-100 hover:bg-gray-200 transition-colors px-3 py-1 rounded-full text-xs text-gray-600 font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Seller info */}
            {product.seller?.user?.name && (
              <p className="text-sm text-gray-600">
                Sold by{' '}
                <span className="text-blue-600 font-medium">{product.seller.user.name}</span>
              </p>
            )}
          </div>

          {/* Right Column - Sticky Buy Box */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              {/* Price in card */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-bold text-gray-900">{fmtEUR(product.price)}</span>
                  {hasDiscount && discountPriceValue && (
                    <span className="text-sm line-through text-gray-400">{fmtEUR(discountPriceValue)}</span>
                  )}
                </div>
                {hasDiscount && discountPriceValue && (
                  <p className="text-xs text-green-600 font-semibold mt-0.5">
                    Save {fmtEUR(Number(product.price) - discountPriceValue)} ({savingsPercent}%)
                  </p>
                )}
              </div>

              <div className="p-5 space-y-4">
                {/* Delivery */}
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Truck className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold">€0.48 delivery</span>{' '}
                        <span className="text-gray-600">{deliveryDateString}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <p className="text-xs text-gray-500">
                      Delivering to Amsterdam 1079 CK ·{' '}
                      <button className="text-blue-600 hover:underline" aria-label="Update location">
                        Update location
                      </button>
                    </p>
                  </div>
                </div>

                {/* Stock status */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      product.stock > 10
                        ? 'bg-green-500'
                        : product.stock > 0
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    aria-hidden="true"
                  />
                  <p
                    className={`text-sm font-semibold ${
                      product.stock > 10
                        ? 'text-green-600'
                        : product.stock > 0
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }`}
                  >
                    {product.stock > 10
                      ? 'In stock'
                      : product.stock > 0
                      ? `Only ${product.stock} left in stock`
                      : 'Out of stock'}
                  </p>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-3">
                  <label htmlFor="qty" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Qty:
                  </label>
                  <select
                    id="qty"
                    name="quantity"
                    defaultValue="1"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50"
                    aria-label="Product quantity"
                    title="Select quantity"
                  >
                    {[...Array(Math.min(product.stock, 10))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2.5 pt-1">
                  <div className="[&>button]:w-full [&>button]:py-3 [&>button]:rounded-full [&>button]:font-semibold [&>button]:text-sm [&>button]:bg-amber-400 [&>button]:hover:bg-amber-500 [&>button]:text-gray-900 [&>button]:transition-all [&>button]:shadow-sm [&>button]:border-0">
                    <AddToCartButton productId={product.id} />
                  </div>

                  <div className="[&>button]:w-full [&>button]:py-3 [&>button]:rounded-full [&>button]:font-semibold [&>button]:text-sm [&>button]:bg-emerald-600 [&>button]:hover:bg-emerald-700 [&>button]:text-white [&>button]:transition-all [&>button]:shadow-sm [&>button]:border-0">
                    <BuyNowForm productId={product.id} />
                  </div>
                </div>

                {/* Trust badges */}
                <div className="pt-2 space-y-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                    Secure transaction
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <RefreshCw className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                    Free returns within 30 days
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Shield className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                    Buyer protection guarantee
                  </div>
                </div>

                {/* Seller */}
                {product.seller?.user?.name && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Ships from and sold by{' '}
                      <span className="text-blue-600 font-medium">
                        {product.seller.user.name}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Add to Wishlist button */}
            <button 
              className="w-full mt-3 flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors py-2"
              aria-label="Add to wishlist"
              title="Add to wishlist"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Add to Wish List
            </button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left 2/3 – Details & Reviews */}
          <div className="lg:col-span-2 space-y-6">

            {/* Product Details Table */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900">Product details</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { label: 'Price', value: fmtEUR(product.price) },
                  { label: 'Stock', value: `${product.stock} units` },
                  { label: 'SKU', value: product.sku },
                  { label: 'Category', value: product.category?.name },
                  product.subCategory ? { label: 'Sub-Category', value: product.subCategory.name } : null,
                  product.brand ? { label: 'Brand', value: product.brand } : null,
                  product.weight ? { label: 'Weight', value: `${product.weight} kg` } : null,
                  product.unitOfMeasurement ? { label: 'Unit', value: product.unitOfMeasurement } : null,
                  product.estimatedDelivery ? { label: 'Est. Delivery', value: product.estimatedDelivery } : null,
                  { label: 'Date Listed', value: formatDate(product.createdAt) },
                ]
                  .filter(Boolean)
                  .map((row, i) => (
                    <div key={i} className="flex px-6 py-3">
                      <span className="w-1/3 text-sm font-medium text-gray-500">{row!.label}</span>
                      <span className="flex-1 text-sm text-gray-900">{row!.value}</span>
                    </div>
                  ))}
                {tags.length > 0 && (
                  <div className="flex px-6 py-3">
                    <span className="w-1/3 text-sm font-medium text-gray-500">Tags</span>
                    <div className="flex-1 flex flex-wrap gap-1.5">
                      {tags.map((tag: string, i: number) => (
                        <span key={i} className="bg-gray-100 px-2.5 py-0.5 rounded-full text-xs text-gray-600">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Customer Reviews */}
            <section id="reviews" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900">Customer reviews</h2>
              </div>
              <div className="p-6">
                {ratingCount > 0 ? (
                  <div className="space-y-6">
                    {/* Rating summary */}
                    <div className="flex items-start gap-8">
                      <div className="text-center flex-shrink-0">
                        <div className="text-5xl font-bold text-gray-900">{avgRating?.toFixed(1)}</div>
                        <div className="flex justify-center mt-1.5 gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                avgRating && i < Math.floor(avgRating)
                                  ? 'text-amber-400 fill-current'
                                  : 'text-gray-200 fill-current'
                              }`}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{ratingCount} ratings</p>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {starCounts.map(({ stars, count }) => (
                          <div key={stars} className="flex items-center gap-2 text-xs">
                            <span className="w-10 text-gray-500 text-right">{stars} star</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full transition-all"
                                style={{ width: `${ratingCount ? (count / ratingCount) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="w-6 text-gray-400">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Review list */}
                    <div className="divide-y divide-gray-100">
                      {product.reviews.slice(0, 5).map((review: ReviewWithUser) => (
                        <div key={review.id} className="py-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xs">
                                {(review.user?.name || 'C')[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">
                                  {review.user?.name || 'Verified Customer'}
                                </p>
                                <div className="flex gap-0.5 mt-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < review.rating
                                          ? 'text-amber-400 fill-current'
                                          : 'text-gray-200 fill-current'
                                      }`}
                                      aria-hidden="true"
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-gray-600 pl-10">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="flex justify-center gap-0.5 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-6 h-6 text-gray-200 fill-current" aria-hidden="true" />
                      ))}
                    </div>
                    <p className="text-gray-600 font-medium">No reviews yet</p>
                    <p className="text-sm text-gray-400 mt-1">Be the first to review this product</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right 1/3 – Related Products */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  Similar items
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {related.length > 0 ? (
                  related.map((item: RelatedItem) => (
                    <Link
                      key={item.id}
                      href={`/shop/${item.slug}`}
                      className="flex gap-3 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden border border-gray-100">
                        {item.images[0] ? (
                          <Picture src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-300" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
                          {item.name}
                        </p>
                        <p className="text-sm font-bold text-gray-900 mt-1">{fmtEUR(item.price)}</p>
                        {item.discountPrice && (
                          <p className="text-xs text-gray-400 line-through">{fmtEUR(item.discountPrice)}</p>
                        )}
                        <div className="flex gap-0.5 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-2.5 h-2.5 text-amber-400 fill-current" aria-hidden="true" />
                          ))}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-6 text-center text-sm text-gray-400">No similar items found</div>
                )}
              </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex gap-3">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Marketplace product</p>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                    Sold by a verified marketplace seller. All transactions are encrypted and protected.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}