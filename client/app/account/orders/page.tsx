"use client"
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, Package, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: { name: string; images?: string[] }
}

interface Order {
  id: string
  createdAt: string
  status: string
  total: number
  items: OrderItem[]
}

export default function AccountOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!session) return
    fetch('/api/orders')
      .then((r: Response) => r.ok ? r.json() : [])
      .then((data: any) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [session])

  const statusIcon = (s: string) => s === 'DELIVERED' ? <CheckCircle size={14} className="text-green-500" /> : s === 'CANCELLED' ? <XCircle size={14} className="text-red-500" /> : <Clock size={14} className="text-yellow-500" />

  if (status === 'loading') return <div className="p-8 text-center text-gray-500">Loading…</div>
  if (!session) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingBag /> My Orders</h1>
        <Link href="/shop" className="text-sm text-blue-600">Continue shopping</Link>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400 animate-pulse">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="card py-12 text-center">
          <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No orders yet</p>
          <p className="text-gray-400 text-sm mt-1">Start shopping to see your orders here</p>
          <Link href="/shop" className="btn-primary mt-4 inline-block text-sm px-6">Browse Products</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-400">Order ID</p>
                  <p className="font-mono text-sm">#{order.id.slice(-8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                  <div className="text-sm mt-1 inline-flex items-center gap-2">{statusIcon(order.status)}{order.status}</div>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {order.items.map(it => (
                  <div key={it.id} className="flex items-center gap-3 py-3">
                    {it.product.images?.[0] ? (
                      <img src={it.product.images[0]} alt={it.product.name || 'Product image'} title={it.product.name || 'Product image'} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded" aria-hidden />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{it.product.name}</p>
                      <p className="text-xs text-gray-500">Qty {it.quantity} × €{it.price.toFixed(2)}</p>
                    </div>
                    <div className="text-sm font-semibold">€{(it.quantity * it.price).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-500">{order.items.length} item{order.items.length > 1 ? 's' : ''}</div>
                <div className="font-bold">Total €{order.total.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
