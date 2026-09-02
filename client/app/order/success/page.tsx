// src/app/order/success/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { CheckCircle, Package, Truck, MapPin, Star, ArrowRight, ShoppingBag, Clock, Shield } from 'lucide-react'

// Define the order types manually
type OrderItem = {
  id: string
  productId: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    slug: string
    images?: string[] | null
  }
}

type OrderWithDetails = {
  id: string
  items: OrderItem[]
  total?: number | null
  address: {
    fullName?: string
    street?: string
    city?: string
    country?: string
  } | null
}

type Props = {
  searchParams?: {
    session_id?: string
  }
}

function fmtEUR(value: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value)
}

/* ── Fallback: no session_id ── */
function NoSession() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Purchase complete!</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          We received your order. Check your email for a confirmation with full details.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/account/orders"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full transition-all shadow-sm"
          >
            View your orders
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-full transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ── Fallback: order not found yet ── */
function OrderPending() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Order received</h1>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-emerald-800">Payment confirmed ✓</p>
          <p className="text-sm text-emerald-700 mt-1">
            Your order is being processed. It may take a moment to appear. Check your inbox for a confirmation email.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/account/orders"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full transition-all shadow-sm"
          >
            View your orders
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-full transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

// Define a type for the Prisma client with order model
type PrismaClientWithModels = {
  order: {
    findFirst: (args: {
      where: { paymentRef: string }
      include: {
        items: {
          include: {
            product: true
          }
        }
        address: true
      }
    }) => Promise<unknown>
  }
}

/* ── Main success page ── */
export default async function OrderSuccessPage({ searchParams }: Props) {
  const sessionId = searchParams?.session_id ?? null

  if (!sessionId) return <NoSession />

  // FIX: Cast prisma to the typed client instead of any
  const prismaClient = prisma as unknown as PrismaClientWithModels
  
  let order: OrderWithDetails | null = null
  
  try {
    const result = await prismaClient.order.findFirst({
      where: { paymentRef: sessionId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        address: true,
      },
    })
    order = result as OrderWithDetails | null
  } catch (error) {
    console.error('Error fetching order:', error)
    return <OrderPending />
  }

  if (!order) return <OrderPending />

  const subtotal = order.items.reduce(
    (sum, it) => sum + Number(it.price) * it.quantity,
    0
  )
  const total = Number(order.total ?? subtotal)
  const shipping = Math.max(0, parseFloat((total - subtotal).toFixed(2)))
  const shortId = order.id.slice(-8).toUpperCase()

  // Estimated delivery window
  const deliveryStart = new Date()
  deliveryStart.setDate(deliveryStart.getDate() + 3)
  const deliveryEnd = new Date()
  deliveryEnd.setDate(deliveryEnd.getDate() + 7)
  const deliveryRange = `${deliveryStart.getDate()} ${deliveryStart.toLocaleString('default', { month: 'long' })} – ${deliveryEnd.getDate()} ${deliveryEnd.toLocaleString('default', { month: 'long' })}`

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Success Hero Banner ── */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 sm:p-8 mb-8 text-white shadow-lg">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                Thank you — your order is confirmed!
              </h1>
              <p className="text-emerald-100 mt-1 text-sm sm:text-base">
                A confirmation email is on its way. Your order is being prepared.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5">
                <Package className="w-4 h-4" />
                <span className="text-sm font-semibold tracking-wider">Order #{shortId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left – Order items + totals */}
          <div className="lg:col-span-2 space-y-4">

            {/* Order items */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  Order summary
                </h2>
                <span className="text-xs text-gray-500">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="divide-y divide-gray-50">
                {order.items.map((it) => {
                  const itemTotal = Number(it.price) * it.quantity
                  return (
                    <div key={it.id} className="flex gap-4 p-5 hover:bg-gray-50/50 transition-colors">
                      {/* Product image */}
                      <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                        {it.product.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={it.product.images[0]}
                            alt={it.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Package className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/shop/${encodeURIComponent(it.product.slug)}`}
                          className="text-sm font-semibold text-gray-900 hover:text-emerald-600 transition-colors line-clamp-2 leading-snug"
                        >
                          {it.product.name}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">
                          Qty {it.quantity} × {fmtEUR(Number(it.price))}
                        </p>

                        {/* Leave a review link */}
                        <Link
                          href={`/shop/${encodeURIComponent(it.product.slug)}#reviews`}
                          className="inline-flex items-center gap-1 mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                        >
                          <Star className="w-3 h-3 fill-current" />
                          Leave a review
                        </Link>
                      </div>

                      {/* Item total */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-bold text-gray-900">{fmtEUR(itemTotal)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order totals */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-gray-900">Payment summary</h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({order.items.length} items)</span>
                  <span>{fmtEUR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? <span className="text-emerald-600 font-medium">Free</span> : fmtEUR(shipping)}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-bold text-gray-900">
                  <span>Order total</span>
                  <span className="text-lg">{fmtEUR(total)}</span>
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Shield, label: 'Buyer protection', sub: 'Money-back guarantee' },
                { icon: Truck, label: 'Fast delivery', sub: deliveryRange },
                { icon: Star, label: 'Quality assured', sub: 'Verified sellers only' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                  <div className="w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xs font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right – Delivery + actions */}
          <div className="space-y-4">

            {/* Delivery card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  Delivery
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Estimated arrival</p>
                    <p className="text-sm text-gray-900 font-medium mt-0.5">{deliveryRange}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Shipping to</p>
                    {order.address ? (
                      <div className="text-sm text-gray-700 mt-0.5 space-y-0.5">
                        <p className="font-medium text-gray-900">{order.address.fullName ?? ''}</p>
                        <p>{order.address.street ?? ''}</p>
                        <p>{[order.address.city, order.address.country].filter(Boolean).join(', ')}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 mt-0.5">No shipping address available.</p>
                    )}
                  </div>
                </div>

                {/* Delivery progress bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>Order placed</span>
                    <span>Delivered</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-1/4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
                  </div>
                  <p className="text-xs text-emerald-600 font-medium mt-1.5">Processing your order</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5">
              <Link
                href="/account/orders"
                className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full transition-all shadow-sm"
              >
                View order details
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/shop"
                className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-full transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                Continue shopping
              </Link>
            </div>

            {/* Help card */}
            <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
              <h4 className="text-sm font-bold text-amber-900 mb-1">Need help?</h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                Contact support with your order number{' '}
                <span className="font-mono font-bold">#{shortId}</span> and well sort it out quickly.
              </p>
              <Link
                href="/support"
                className="inline-flex items-center gap-1 mt-2 text-xs text-amber-700 hover:text-amber-900 font-semibold transition-colors"
              >
                Contact support
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}