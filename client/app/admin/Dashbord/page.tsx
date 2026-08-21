"use client"

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  CheckCircle,
  AlertTriangle,
  PlusCircle,
  ArrowUp,
  ArrowDown,
  LayoutDashboard,
  Package,
  Truck,
  Users,
  ShoppingCart,
  TrendingUp,
  Box,
  Clock,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Order = {
  id: string
  total: number
  status: string
  createdAt: string
  items: {
    id: string
    quantity: number
    price: number
    product: {
      name: string
      images: string[]
      slug: string
    }
  }[]
  address?: {
    fullName: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
  }
}

type Product = {
  id: string
  name: string
  price: number
  discountPrice: number | null
  stock: number
  status: string
  images: string[]
  category: { name: string }
}

type Category = {
  id: string
  name: string
  slug: string
  image: string | null
  icon: string | null
  parentId: string | null
  children?: Category[]
}

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  badge?: number
}

export default function AdminDashboard() {
  const pathname = usePathname()
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Navigation items
  const navigation: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard size={20} />
    },
    {
      name: 'Products',
      href: '/admin/products',
      icon: <Package size={20} />,
      badge: products.filter(p => p.status === 'APPROVED').length
    },
    {
      name: 'Orders & Delivery',
      href: '/admin/orders',
      icon: <Truck size={20} />,
      badge: orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: <Users size={20} />
    }
  ]

  // Fetch all real data from your APIs
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Fetch orders
        const ordersRes = await fetch('/api/orders')
        if (!ordersRes.ok) throw new Error('Failed to fetch orders')
        const ordersData = await ordersRes.json()
        setOrders(ordersData)

        // 2. Fetch products (limit to 50)
        const productsRes = await fetch('/api/products?limit=50')
        if (!productsRes.ok) throw new Error('Failed to fetch products')
        const productsData = await productsRes.json()
        setProducts(productsData.products || [])

        // 3. Fetch categories
        const categoriesRes = await fetch('/api/categories?includeChildren=true')
        if (!categoriesRes.ok) throw new Error('Failed to fetch categories')
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData || [])

      } catch (err) {
        console.error('Dashboard data fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Calculate real metrics from API data
  const totalEarnings = orders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = orders.length
  const activeProducts = products.filter(p => p.status === 'APPROVED').length
  const lowStockAlerts = products.filter(p => p.stock < 5).length
  const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length

  // Prepare sales data for chart (last 6 months)
  const getSalesData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonth = new Date().getMonth()
    const data = []

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12
      const monthName = months[monthIndex]

      // Filter orders for this month
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt)
        return orderDate.getMonth() === monthIndex
      })

      const revenue = monthOrders.reduce((sum, order) => sum + order.total, 0)
      data.push({ month: monthName, revenue, orders: monthOrders.length })
    }

    return data
  }

  const salesData = getSalesData()

  const toggleStock = async (id: string, currentStock: number) => {
    try {
      const newStock = currentStock === 0 ? 10 : 0

      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      })

      if (!res.ok) throw new Error('Failed to update stock')

      const productsRes = await fetch('/api/products?limit=50')
      const productsData = await productsRes.json()
      setProducts(productsData.products || [])

    } catch (err) {
      console.error('Stock update error:', err)
      alert('Failed to update stock. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed h-full z-50`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="text-white" size={24} />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-gray-800 text-lg">Genesis Agri</h1>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 hover:bg-gray-50"
        >
          {sidebarOpen ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-sm font-medium">{item.name}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-green-600 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          })}

          {/* Quick Actions */}
          {sidebarOpen && (
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Quick Actions
              </p>
              <Link
                href="/admin/products/new"
                className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <PlusCircle size={16} />
                Add New Product
              </Link>
            </div>
          )}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">A</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Admin</p>
                <p className="text-xs text-gray-500">admin@genesis.com</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300 p-6`}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-sm text-gray-500">Genesis Agri Store Control & Delivery System</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/admin/products" className="px-3.5 py-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2">
                <Package size={16} />
                Products
              </Link>
              <Link href="/admin/orders" className="px-3.5 py-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2">
                <Truck size={16} />
                Orders & Delivery
              </Link>
              <Link href="/admin/users" className="px-3.5 py-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2">
                <Users size={16} />
                Users
              </Link>
              <Link href="/admin/products/new" className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold shadow-sm">
                <PlusCircle size={16} />
                Add Product
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500 font-medium">Total Earnings</div>
                  <div className="text-2xl font-bold text-gray-800 mt-1">
                    ${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <DollarSign className="text-green-600" size={20} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-sm">
                <ArrowUp className="text-green-500" size={14} />
                <span className="text-green-600 font-medium">12.5%</span>
                <span className="text-gray-400">from last month</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500 font-medium">Total Orders</div>
                  <div className="text-2xl font-bold text-gray-800 mt-1">{totalOrders}</div>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <ShoppingCart className="text-blue-600" size={20} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-sm">
                <Clock className="text-yellow-500" size={14} />
                <span className="text-yellow-600 font-medium">{pendingOrders} pending</span>
                <span className="text-gray-400">orders</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500 font-medium">Active Products</div>
                  <div className="text-2xl font-bold text-gray-800 mt-1">{activeProducts}</div>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Box className="text-purple-600" size={20} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-sm">
                <span className="text-gray-400">{products.length} total products</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500 font-medium">Low Stock Alerts</div>
                  <div className="text-2xl font-bold text-gray-800 mt-1">{lowStockAlerts}</div>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="text-red-600" size={20} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-sm">
                <span className={`font-medium ${lowStockAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {lowStockAlerts > 0 ? `${lowStockAlerts} items need restock` : 'All items in stock'}
                </span>
              </div>
            </div>
          </section>

          {/* Charts and Inventory Section */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <TrendingUp size={18} className="text-green-600" />
                  Sales Overview (Last 6 Months)
                </h3>
                <span className="text-xs text-gray-500">Revenue vs Orders</span>
              </div>
              <div style={{ height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={salesData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any, name: any, props: any) => {
                        if (typeof value === 'number') {
                          return [`$${value.toLocaleString()}`, 'Revenue'];
                        }
                        return [value, 'Revenue'];
                      }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <Package size={18} className="text-green-600" />
                Inventory Quick Actions
              </h3>
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Add new product</div>
                <Link href="/admin/products/new" className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                  <PlusCircle size={16} /> Add
                </Link>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {products.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No products found</p>
                ) : (
                  products.slice(0, 8).map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-800 truncate">{p.name}</div>
                        <div className="text-sm text-gray-500">
                          ${p.discountPrice ? p.discountPrice.toFixed(2) : p.price.toFixed(2)}
                          {p.discountPrice && <span className="line-through ml-2 text-gray-400">${p.price.toFixed(2)}</span>}
                        </div>
                        <div className="text-xs text-gray-400">{p.category?.name || 'Uncategorized'}</div>
                      </div>
                      <div className="flex items-center gap-3 ml-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={p.stock > 0}
                            onChange={() => toggleStock(p.id, p.stock)}
                            className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                          />
                          <span className={`text-xs ${p.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {p.stock > 0 ? 'In Stock' : 'Out'}
                          </span>
                        </label>
                        <span className="text-xs text-gray-400">({p.stock})</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Recent Orders */}
          <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Truck size={18} className="text-green-600" />
                Recent Orders
              </h3>
              <Link href="/admin/orders" className="text-sm text-green-600 hover:text-green-700 hover:underline">
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              {orders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No orders yet</p>
              ) : (
                <table className="w-full text-left">
                  <thead className="text-sm text-gray-500 border-b">
                    <tr>
                      <th className="py-2 px-3">Order ID</th>
                      <th className="py-2 px-3">Customer</th>
                      <th className="py-2 px-3">Items</th>
                      <th className="py-2 px-3">Total</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map(o => {
                      const customerName = o.address?.fullName || 'Guest'
                      const statusColors = {
                        'Pending': 'bg-yellow-100 text-yellow-800',
                        'Processing': 'bg-blue-100 text-blue-800',
                        'Shipped': 'bg-purple-100 text-purple-800',
                        'Delivered': 'bg-green-100 text-green-800',
                        'Cancelled': 'bg-red-100 text-red-800'
                      }
                      const color = statusColors[o.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'

                      return (
                        <tr key={o.id} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-3 font-medium text-gray-800 text-sm">{o.id.slice(0, 8)}</td>
                          <td className="py-3 px-3 text-sm">{customerName}</td>
                          <td className="py-3 px-3 text-sm">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</td>
                          <td className="py-3 px-3 font-semibold text-sm">${o.total.toFixed(2)}</td>
                          <td className="py-3 px-3">
                            <span className={`inline-block px-2.5 py-1 text-xs rounded-full ${color}`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-sm text-gray-500">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}