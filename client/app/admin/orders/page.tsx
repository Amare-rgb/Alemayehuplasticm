"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShoppingBag,
  ArrowLeft,
  Search,
  CheckCircle,
  Truck,
  Package,
  Clock,
  XCircle,
  RefreshCw,
  MapPin,
  User,
  Phone,
  Calendar,
  ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    images?: string[]
    slug: string
  }
}

interface Order {
  id: string
  total: number
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED'
  createdAt: string
  notes?: string
  user?: {
    name: string
    email: string
    phone?: string
  }
  address?: {
    fullName: string
    phone: string
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  items: OrderItem[]
}

const statusOptions = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/orders')
      if (!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId)
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update order')
      toast.success(`Order #${orderId.slice(-6)} set to ${newStatus}`)
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: newStatus as any } : o))
      )
    } catch (err) {
      toast.error('Failed to update order status')
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = orders.filter(o => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter
    const customer = (o.user?.name || o.address?.fullName || '').toLowerCase()
    const id = o.id.toLowerCase()
    const matchesSearch = !search || customer.includes(search.toLowerCase()) || id.includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200'
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/admin/Dashbord" className="hover:text-green-600 flex items-center gap-1">
                <ArrowLeft size={14} /> Back to Dashboard
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingBag className="text-green-600" /> Orders Management & Delivery Pipeline
            </h1>
            <p className="text-sm text-gray-500">
              Track customer orders, approve pending requests, and manage deliveries
            </p>
          </div>

          <button
            onClick={fetchOrders}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh Orders
          </button>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by customer name or order ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
            {['ALL', ...statusOptions].map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-white text-green-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab} {tab === 'ALL' ? `(${orders.length})` : `(${orders.filter(o => o.status === tab).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="bg-white py-16 text-center text-gray-500 rounded-xl shadow-sm">
            <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p>Loading orders pipeline...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white py-16 text-center text-gray-500 rounded-xl shadow-sm border border-gray-100">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 className="font-semibold text-gray-700">No orders found</h3>
            <p className="text-sm mt-1">There are no orders matching this filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => {
              const isExpanded = expandedId === order.id
              const customerName = order.address?.fullName || order.user?.name || 'Customer'
              const customerEmail = order.user?.email || ''
              const customerPhone = order.address?.phone || order.user?.phone || 'N/A'

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all"
                >
                  {/* Order Header */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="p-2.5 bg-green-100 text-green-700 rounded-lg">
                        <ShoppingBag size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900">
                            #{order.id.slice(-8).toUpperCase()}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              order.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            💳 {order.paymentStatus || 'PAID'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          <Calendar size={12} />
                          {new Date(order.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Customer & Total */}
                    <div className="flex items-center justify-between lg:justify-end gap-6">
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Customer</div>
                        <div className="font-semibold text-gray-800 text-sm">{customerName}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-gray-400">Total Amount</div>
                        <div className="text-lg font-bold text-green-700">${order.total.toFixed(2)}</div>
                      </div>

                      {/* Status Update Quick Action Dropdown */}
                      <div className="flex items-center gap-2">
                        <select
                          value={order.status}
                          onChange={e => handleUpdateStatus(order.id, e.target.value)}
                          disabled={updatingId === order.id}
                          className="text-xs font-bold py-1.5 px-3 rounded-lg border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"
                        >
                          {statusOptions.map(opt => (
                            <option key={opt} value={opt}>
                              Set: {opt}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}
                          className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                          title="Toggle Details"
                        >
                          <ChevronDown
                            size={18}
                            className={`transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Items & Address */}
                  {isExpanded && (
                    <div className="p-5 bg-white grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                      {/* Items */}
                      <div className="md:col-span-2 space-y-3">
                        <h4 className="font-bold text-sm text-gray-800 border-b pb-2">
                          Ordered Items ({order.items.length})
                        </h4>
                        <div className="divide-y divide-gray-100">
                          {order.items.map(item => (
                            <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                                  {item.product?.images?.[0] ? (
                                    <img
                                      src={item.product.images[0]}
                                      alt={item.product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs">🌱</div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-sm text-gray-800">
                                    {item.product?.name || 'Product'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Qty: {item.quantity} × ${item.price.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              <div className="font-bold text-sm text-gray-800">
                                ${(item.quantity * item.price).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Customer & Shipping Info */}
                      <div className="bg-gray-50 p-4 rounded-xl space-y-3 text-xs text-gray-600">
                        <h4 className="font-bold text-sm text-gray-800 border-b pb-1">
                          Delivery Details
                        </h4>

                        <div className="flex items-start gap-2">
                          <User size={14} className="mt-0.5 text-gray-400" />
                          <div>
                            <span className="font-semibold text-gray-800">{customerName}</span>
                            {customerEmail && <div>{customerEmail}</div>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-gray-400" />
                          <span>{customerPhone}</span>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="mt-0.5 text-gray-400" />
                          <div>
                            {order.address ? (
                              <>
                                <div>{order.address.street}</div>
                                <div>
                                  {order.address.city}, {order.address.state} {order.address.zip}
                                </div>
                                <div>{order.address.country}</div>
                              </>
                            ) : (
                              <span>Standard Address</span>
                            )}
                          </div>
                        </div>

                        {/* Status Progression buttons */}
                        <div className="pt-3 border-t border-gray-200 flex flex-wrap gap-1.5">
                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'PROCESSING')}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                            >
                              Approve & Process
                            </button>
                          )}
                          {order.status === 'PROCESSING' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium flex items-center gap-1"
                            >
                              <Truck size={12} /> Mark as Shipped
                            </button>
                          )}
                          {order.status === 'SHIPPED' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-medium flex items-center gap-1"
                            >
                              <CheckCircle size={12} /> Mark Delivered
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
