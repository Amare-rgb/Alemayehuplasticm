'use client'
// src/app/cart/page.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    salePrice: number | null
    images: string[]
    stock: number
    seller: { shopName: string }
  }
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const router = useRouter()

  const fetchCart = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cart')
      if (!res.ok) throw new Error('Failed to load cart')
      const text = await res.text()
      let data: any = null
      try { data = text ? JSON.parse(text) : null } catch (_) { data = null }
      setItems((data && data.items) ?? data ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
    // check payment provider configuration
    fetch('/api/checkout')
      .then((r: Response) => r.ok ? r.json() : null)
      .then((d: any) => { if (d && typeof d.configured !== 'undefined') setStripeConfigured(Boolean(d.configured)) })
      .catch(() => setStripeConfigured(false))
    const onUpdate = () => fetchCart()
    window.addEventListener('cartUpdated', onUpdate)
    return () => window.removeEventListener('cartUpdated', onUpdate)
  }, [])

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    const res = await fetch('/api/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: newQuantity }),
    })
    if (res.ok) {
      fetchCart()
      toast.success('Cart updated')
    } else {
      toast.error('Update failed')
    }
  }

  const removeItem = async (productId: string) => {
    const res = await fetch('/api/cart', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    })
    if (res.ok) {
      setItems(items.filter(i => i.product.id !== productId))
      toast.success('Removed from cart')
    } else {
      toast.error('Remove failed')
    }
  }

  const total = items.reduce((sum, item) => {
    const price = item.product.salePrice ?? item.product.price
    return sum + Number(price) * item.quantity
  }, 0)

  const checkout = async (e: React.FormEvent) => {
    e.preventDefault()
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, address }),
      })
      const text = await res.text()
      let data: any = null
      try { data = text ? JSON.parse(text) : null } catch (_) { data = null }
      if (!res.ok) throw new Error((data && data.error) || res.statusText || 'Checkout failed')
      if (data?.url) window.location.href = data.url
    } catch (err: any) {
      toast.error(err?.message || 'Checkout failed')
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold mb-8">Your Cart</h1>

      {loading ? (
        <div className="text-center py-16 text-gray-400 animate-pulse">Loading cart...</div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16">
          <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="font-semibold text-xl text-gray-700 mb-2">Your cart is empty</h2>
          <p className="text-gray-400 mb-6">Discover thousands of products from our sellers</p>
          <Link href="/shop" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item: CartItem) => {
              const price = Number(item.product.salePrice ?? item.product.price)
              return (
                <div key={item.id} className="card flex gap-4 p-4">
                  <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0 relative">
                    {item.product.images?.[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{item.product.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{item.product.seller?.shopName}</p>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded disabled:opacity-40"
                          aria-label="Decrease quantity"
                          title="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="p-1 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded disabled:opacity-40"
                          aria-label="Increase quantity"
                          title="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Price + Remove */}
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">
                          €{(price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.product.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Remove item"
                          title="Remove from cart"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Order Summary + Checkout */}
          <div>
            <div className="card sticky top-20 space-y-5">
              <div>
                <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  {items.map((item: CartItem) => (
                    <div key={item.id} className="flex justify-between text-gray-600">
                      <span className="truncate mr-2">{item.product.name} ×{item.quantity}</span>
                      <span>€{(Number(item.product.salePrice ?? item.product.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>€{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={checkout} className="space-y-3">
                {stripeConfigured === false && (
                  <div className="p-3 rounded-md bg-yellow-50 text-yellow-800 text-sm">
                    Payments are not configured on this server. To enable checkout, set <span className="font-mono">STRIPE_SECRET_KEY</span> in your environment and restart.
                  </div>
                )}
                <div>
                  <label htmlFor="checkout-name" className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                  <input
                    id="checkout-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="checkout-email" className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input
                    id="checkout-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="checkout-address" className="block text-xs font-medium text-gray-600 mb-1">Delivery Address</label>
                  <textarea
                    id="checkout-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, City, Country"
                    className="input w-full resize-none h-20"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={checkoutLoading || stripeConfigured === false}
                  className="btn-primary w-full py-3"
                >
                  {checkoutLoading ? 'Processing…' : 'Proceed to Payment'}
                </button>
              </form>

              <Link
                href="/shop"
                className="btn-secondary w-full text-center block"
              >
                Continue Shopping
              </Link>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}