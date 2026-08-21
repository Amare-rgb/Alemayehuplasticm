"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Trash2, Package, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
}

export default function AdminEditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [discountPrice, setDiscountPrice] = useState('')
  const [stock, setStock] = useState('0')
  const [categoryId, setCategoryId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [unitOfMeasurement, setUnitOfMeasurement] = useState('kg')
  const [condition, setCondition] = useState<'NEW' | 'USED' | 'REFURBISHED'>('NEW')
  const [status, setStatus] = useState<'APPROVED' | 'PENDING' | 'REJECTED'>('APPROVED')
  const [brand, setBrand] = useState('')
  const [tags, setTags] = useState('')

  useEffect(() => {
    // Load categories
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => Array.isArray(data) && setCategories(data))
      .catch(() => {})

    // Load product
    if (id) {
      fetch(`/api/products/${id}`)
        .then(r => {
          if (!r.ok) throw new Error('Product not found')
          return r.json()
        })
        .then(data => {
          setName(data.name || '')
          setDescription(data.description || '')
          setPrice(data.price?.toString() || '')
          setDiscountPrice(data.discountPrice?.toString() || '')
          setStock(data.stock?.toString() || '0')
          setCategoryId(data.categoryId || '')
          setImageUrl(data.images?.[0] || '')
          setUnitOfMeasurement(data.unitOfMeasurement || 'kg')
          setCondition(data.condition || 'NEW')
          setStatus(data.status || 'APPROVED')
          setBrand(data.brand || '')
          setTags(Array.isArray(data.tags) ? data.tags.join(', ') : '')
        })
        .catch(err => {
          toast.error(err.message || 'Failed to fetch product')
        })
        .finally(() => setLoading(false))
    }
  }, [id])

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      setUploading(true)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to upload image')

      setImageUrl(data.url)
      toast.success('Image uploaded successfully! 📸')
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price) {
      toast.error('Product name and price are required')
      return
    }

    try {
      setSaving(true)

      const payload = {
        name,
        description,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        stock: parseInt(stock || '0', 10),
        categoryId,
        images: [imageUrl || '/banners/images.jpeg'],
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        condition,
        status,
        brand,
        unitOfMeasurement,
      }

      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update product')

      toast.success('Product updated successfully!')
      router.push('/admin/products')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading product details...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/products" className="text-sm text-gray-500 hover:text-green-600 flex items-center gap-1 mb-1">
              <ArrowLeft size={16} /> Back to Products
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Edit Product: {name}</h1>
            <p className="text-sm text-gray-500">Modify stock, pricing, photo, status, and description</p>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
          
          {/* Status Bar */}
          <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Listing Status:</span>
            <div className="flex gap-2">
              {(['APPROVED', 'PENDING', 'REJECTED'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    status === s
                      ? s === 'APPROVED' ? 'bg-green-600 text-white' : s === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-red-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload Card Section */}
          <div className="space-y-4 pt-2">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
              <ImageIcon className="text-green-600" size={20} />
              Product Image Upload
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Upload Drop Area */}
              <div className="md:col-span-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-green-300 hover:border-green-500 bg-green-50/50 hover:bg-green-50 p-6 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center shadow-sm">
                    {uploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {uploading ? 'Uploading image...' : 'Click to Upload / Change Image'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Select a new photo to replace the current image
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={uploading}
                    className="px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    Select File from Device
                  </button>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Image URL:
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Live Preview Thumbnail */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col items-center text-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Photo</span>
                <div className="relative w-36 h-36 bg-white rounded-xl overflow-hidden shadow-inner border border-gray-200 flex items-center justify-center">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-3xl text-gray-300">🌱</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Basic Details */}
          <div className="space-y-4 pt-2">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Basic Details</h2>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="space-y-4 pt-2">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Pricing & Stock</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Regular Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Discount Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountPrice}
                  onChange={e => setDiscountPrice(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Stock Units *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Unit of Measurement
                </label>
                <input
                  type="text"
                  value={unitOfMeasurement}
                  onChange={e => setUnitOfMeasurement(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={e => setCondition(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
                >
                  <option value="NEW">New</option>
                  <option value="USED">Used / Tested</option>
                  <option value="REFURBISHED">Refurbished</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Link
              href="/admin/products"
              className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-semibold transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
