"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  PlusCircle,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  ArrowLeft,
  Filter,
  Package,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  discountPrice: number | null
  stock: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  images: string[]
  category?: { name: string; id: string }
  seller?: { shopName: string }
  createdAt: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/products?all=true&limit=100`)
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      setProducts(data.products || [])
    } catch (err) {
      console.error('Error:', err)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleStatusChange = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      setActionLoading(id)
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      toast.success(`Product ${newStatus.toLowerCase()} successfully!`)
      fetchProducts()
    } catch (err) {
      toast.error('Failed to update product status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return
    try {
      setActionLoading(id)
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Product deleted')
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      toast.error('Failed to delete product')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = products.filter(p => {
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

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
              <Package className="text-green-600" /> Products Management
            </h1>
            <p className="text-sm text-gray-500">
              Manage inventory, approve new listings, and update product pricing
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchProducts}
              className="p-2.5 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition-all"
            >
              <PlusCircle size={18} />
              Add Product
            </Link>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by product or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
            {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${statusFilter === tab
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {tab} {tab === 'ALL' ? `(${products.length})` : `(${products.filter(p => p.status === tab).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* ✅ CHANGED: Product Grid - 4 per row, vertical stacking */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {loading ? (
            <div className="py-16 text-center text-gray-500">
              <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p>Loading products...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <Package size={48} className="mx-auto text-gray-300 mb-3" />
              <h3 className="font-semibold text-gray-700">No products found</h3>
              <p className="text-sm mt-1">Try adjusting your search or status filter.</p>
            </div>
          ) : (
            // ✅ GRID LAYOUT: 4 products per row, stacks vertically
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map(p => (
                <div
                  key={p.id}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 bg-white flex flex-col"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-50 flex items-center justify-center p-4">
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-4xl text-gray-300">🌱</div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Category badge */}
                      <span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-semibold rounded-full mb-2">
                        {p.category?.name || 'General'}
                      </span>

                      {/* Name */}
                      <Link href={`/shop/${encodeURIComponent(p.slug)}`}>
                        <h3 className="text-sm font-semibold text-gray-900 hover:text-green-600 line-clamp-2">
                          {p.name}
                        </h3>
                      </Link>

                      {/* Seller */}
                      <p className="text-xs text-gray-400 mt-1">
                        By {p.seller?.shopName || 'Genesis Agri'}
                      </p>
                    </div>

                    {/* Price & Stock Row */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-green-700">
                            ${p.discountPrice ? p.discountPrice.toFixed(2) : p.price.toFixed(2)}
                          </div>
                          {p.discountPrice && (
                            <div className="text-xs text-gray-400 line-through">
                              ${p.price.toFixed(2)}
                            </div>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.stock > 10 ? 'bg-green-100 text-green-800' :
                            p.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {p.stock > 0 ? `${p.stock} left` : 'Out'}
                        </span>
                      </div>
                    </div>

                    {/* Status & Actions Row */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      {/* Status Badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          p.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                        {p.status}
                      </span>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        {p.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleStatusChange(p.id, 'APPROVED')}
                            disabled={actionLoading === p.id}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {p.status !== 'REJECTED' && (
                          <button
                            onClick={() => handleStatusChange(p.id, 'REJECTED')}
                            disabled={actionLoading === p.id}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            title="Reject"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          disabled={actionLoading === p.id}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}