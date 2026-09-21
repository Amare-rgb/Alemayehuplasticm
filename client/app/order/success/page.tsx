// src/app/order/success/OrderSuccessClient.tsx
'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  Package,
  Truck,
  MapPin,
  Star,
  ArrowRight,
  ShoppingBag,
  Clock,
  Shield,
  Loader2,
} from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */
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
  order: OrderWithDetails | null
  sessionId: string | null
  deliveryRange: string
}

// ✅ Changed from 40 → 60 seconds (1 minute)
const REDIRECT_SECONDS = 60

function fmtEUR(value: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value)
}

/* -------------------------------------------------------------------------- */
/*  Countdown hook — pure, proper cleanup, no cascading renders                */
/* -------------------------------------------------------------------------- */
function useCountdown(seconds: number, enabled: boolean) {
  const [remaining, setRemaining] = useState(seconds)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!enabled || paused || remaining <= 0) return

    const id = window.setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0))
    }, 1000)

    return () => window.clearInterval(id)
  }, [enabled, paused, remaining])

  const cancel = () => setPaused(true)
  const reset = () => {
    setRemaining(seconds)
    setPaused(false)
  }

  return { remaining, paused, cancel, reset }
}

/* -------------------------------------------------------------------------- */
/*  Circular countdown ring — pure SVG, animated                               */
/* -------------------------------------------------------------------------- */
function CountdownRing({
  remaining,
  total,
  size = 56,
}: {
  remaining: number
  total: number
  size?: number
}) {
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  const progress = Math.max(0, Math.min(1, remaining / total))
  const dashoffset = c * (1 - progress)

  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="3"
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#ffffff"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={dashoffset}
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*  Fallback: no session_id                                                    */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/*  Fallback: order not found yet — 60s auto-retry countdown                   */
/* -------------------------------------------------------------------------- */
function OrderPending({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [retrying, setRetrying] = useState(false)
  const { remaining, paused, cancel, reset } = useCountdown(REDIRECT_SECONDS, true)
  const hasRetriedRef = useRef(false)

  useEffect(() => {
    if (remaining > 0 || paused || hasRetriedRef.current) return
    hasRetriedRef.current = true
    setRetrying(true)
    router.refresh()
  }, [remaining, paused, router])

  // Format seconds as MM:SS for clarity when > 60
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const timeLabel = mins > 0
    ? `${mins}:${secs.toString().padStart(2, '0')}`
    : `${remaining}s`

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
            Your order is being processed. It may take a moment to appear.
          </p>
        </div>

        {/* Countdown block — 60s (1 minute) */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="relative">
            <CountdownRing remaining={remaining} total={REDIRECT_SECONDS} size={64} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-emerald-700">{timeLabel}</span>
            </div>
          </div>

          {paused ? (
            <button
              type="button"
              onClick={reset}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Resume auto-check
            </button>
          ) : (
            <button
              type="button"
              onClick={cancel}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Stop auto-check
            </button>
          )}

          {retrying && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              Checking again…
            </span>
          )}
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

        {sessionId && (
          <p className="mt-6 text-[11px] text-gray-400 font-mono break-all">
            Ref: {sessionId}
          </p>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Live status timeline — advances every 3 seconds                            */
/* -------------------------------------------------------------------------- */
const STATUS_STAGES = [
  { key: 'placed', label: 'Order placed', sub: 'We received your order' },
  { key: 'payment', label: 'Payment confirmed', sub: 'Transaction verified' },
  { key: 'preparing', label: 'Preparing your order', sub: 'Packing items' },
  { key: 'dispatched', label: 'Ready for dispatch', sub: 'Handing to courier' },
] as const

function StatusTimeline({ startStage = 0 }: { startStage?: number }) {
  const [stage, setStage] = useState(startStage)

  useEffect(() => {
    if (stage >= STATUS_STAGES.length - 1) return
    const id = window.setInterval(() => {
      setStage((s) => Math.min(s + 1, STATUS_STAGES.length - 1))
    }, 3000)
    return () => window.clearInterval(id)
  }, [stage])

  return (
    <div className="space-y-3">
      {STATUS_STAGES.map((s, i) => {
        const done = i < stage
        const active = i === stage
        return (
          <div key={s.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${
                  done
                    ? 'bg-emerald-500 text-white'
                    : active
                    ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {done ? '✓' : i + 1}
              </div>
              {i < STATUS_STAGES.length - 1 && (
                <div
                  className={`w-0.5 h-6 transition-colors duration-500 ${
                    done ? 'bg-emerald-400' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
            <div className="pt-0.5">
              <p
                className={`text-sm font-semibold transition-colors duration-500 ${
                  done || active ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {s.label}
                {active && (
                  <Loader2 className="inline-block ml-1.5 w-3 h-3 animate-spin text-emerald-600" />
                )}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main success page                                                          */
/* -------------------------------------------------------------------------- */
export default function OrderSuccessClient({ order, sessionId, deliveryRange }: Props) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)

  // 60-second (1 minute) auto-redirect countdown
  const { remaining, paused, cancel } = useCountdown(REDIRECT_SECONDS, !!order && !dismissed)

  useEffect(() => {
    if (remaining > 0 || paused || !order) return
    router.push('/account/orders')
  }, [remaining, paused, order, router])

  if (!sessionId) return <NoSession />
  if (!order) return <OrderPending sessionId={sessionId} />

  const subtotal = order.items.reduce(
    (sum, it) => sum + Number(it.price) * it.quantity,
    0
  )
  const total = Number(order.total ?? subtotal)
  const shipping = Math.max(0, parseFloat((total - subtotal).toFixed(2)))
  const shortId = order.id.slice(-8).toUpperCase()

  // Format countdown as MM:SS when >= 60s, else "Ns"
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const timeLabel = mins > 0
    ? `${mins}:${secs.toString().padStart(2, '0')}`
    : `${remaining}s`

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Success Hero Banner ── */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 sm:p-8 mb-8 text-white shadow-lg">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                Thank you — your order is confirmed!
              </h1>
              <p className="text-emerald-100 mt-1 text-sm sm:text-base">
                A confirmation email is on its way. Your order is being prepared.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5">
                  <Package className="w-4 h-4" />
                  <span className="text-sm font-semibold tracking-wider">Order #{shortId}</span>
                </div>

                {/* 60s countdown chip */}
                {!dismissed && (
                  <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full pl-2 pr-3 py-1">
                    <div className="relative">
                      <CountdownRing remaining={remaining} total={REDIRECT_SECONDS} size={28} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white leading-none">
                          {remaining}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-50">
                      {paused
                        ? 'Auto-redirect paused'
                        : `Redirecting to orders in ${timeLabel}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        cancel()
                        setDismissed(true)
                      }}
                      className="text-[11px] font-semibold text-white/80 hover:text-white underline underline-offset-2"
                    >
                      Stay here
                    </button>
                  </div>
                )}
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

                        <Link
                          href={`/shop/${encodeURIComponent(it.product.slug)}#reviews`}
                          className="inline-flex items-center gap-1 mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                        >
                          <Star className="w-3 h-3 fill-current" />
                          Leave a review
                        </Link>
                      </div>

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
                  <span>
                    {shipping === 0 ? (
                      <span className="text-emerald-600 font-medium">Free</span>
                    ) : (
                      fmtEUR(shipping)
                    )}
                  </span>
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

            {/* Delivery card with LIVE timeline */}
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
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Estimated arrival
                    </p>
                    <p className="text-sm text-gray-900 font-medium mt-0.5">{deliveryRange}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Shipping to
                    </p>
                    {order.address ? (
                      <div className="text-sm text-gray-700 mt-0.5 space-y-0.5">
                        <p className="font-medium text-gray-900">{order.address.fullName ?? ''}</p>
                        <p>{order.address.street ?? ''}</p>
                        <p>
                          {[order.address.city, order.address.country]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 mt-0.5">No shipping address available.</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Live status
                  </p>
                  <StatusTimeline startStage={1} />
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
                <span className="font-mono font-bold">#{shortId}</span> and we&apos;ll sort it out quickly.
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