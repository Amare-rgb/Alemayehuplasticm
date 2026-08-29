"use client"
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Package, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: { 
    name: string
    images?: string[] 
  }
}

interface Order {
  id: string
  createdAt: string
  status: string
  total: number
  items: OrderItem[]
}

// ── FIX: Define proper API response type ──────────────────────────────────────
interface ApiResponse {
  orders?: Order[]
  data?: Order[]
}

export const dynamic = 'force-dynamic'

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

    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders')
        if (!response.ok) {
          setOrders([])
          return
        }
        const data = await response.json() as ApiResponse
        // Handle both array and object responses
        if (Array.isArray(data)) {
          setOrders(data)
        } else if (data?.orders) {
          setOrders(data.orders)
        } else if (data?.data) {
          setOrders(data.data)
        } else {
          setOrders([])
        }
      } catch {
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [session])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle size={14} className="text-green-500" />
      case 'CANCELLED':
        return <XCircle size={14} className="text-red-500" />
      default:
        return <Clock size={14} className="text-yellow-500" />
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'PROCESSING':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'SHIPPED':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    }
  }

  if (status === 'loading') {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="animate-pulse">Loading…</div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag size={24} />
          My Orders
        </h1>
        <Link href="/shop" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
          Continue shopping
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400 animate-pulse">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-12 text-center">
          <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No orders yet</p>
          <p className="text-gray-400 text-sm mt-1">Start shopping to see your orders here</p>
          <Link href="/shop" className="inline-block mt-4 px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-400">Order ID</p>
                  <p className="font-mono text-sm font-semibold text-gray-800">
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border mt-1 ${getStatusBadgeClass(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    {item.product.images?.[0] ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name || 'Product image'}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <Package size={20} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {item.product.name || 'Unnamed Product'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Qty {item.quantity} × ETB {item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-gray-800">
                      ETB {(item.quantity * item.price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {order.items.length} item{order.items.length > 1 ? 's' : ''}
                </div>
                <div className="font-bold text-gray-900">
                  Total ETB {order.total.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}