"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Check, Star, Eye, Loader2 } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import toast from 'react-hot-toast'

export interface ProductCardProps {
  id: string
  name: string
  slug: string
  price: number
  discountPrice?: number | null
  stock: number
  images?: string[]
  category?: { name: string; slug?: string }
  unitOfMeasurement?: string
}

export default function ProductCard({
  id,
  name,
  slug,
  price,
  discountPrice,
  stock,
  images,
  category,
  unitOfMeasurement = 'pcs'
}: ProductCardProps) {
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const cart = useCart()

  const finalPrice = discountPrice ? discountPrice : price
  const isOutOfStock = stock <= 0
  const rawImage = (images && images.length > 0 && images[0]) ? images[0] : ''
  const imageSrc = rawImage && rawImage.trim() !== '' ? rawImage : '/banners/images.jpeg'

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isOutOfStock) {
      toast.error('This product is currently out of stock')
      return
    }

    try {
      setAdding(true)
      await cart.add(id, 1)
      setAdded(true)
      toast.success(`${name} added to cart! 🛒`)
      setTimeout(() => setAdded(false), 2000)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add to cart')
    } finally {
      setAdding(false)
    }
  }

  return (
    // ✅ REMOVED bg-white and border, added bg-transparent
    <div className="bg-transparent rounded-2xl border-0 overflow-hidden hover:shadow-xl hover:border-green-400 transition-all duration-300 flex flex-col justify-between group h-full">

      {/* Product Image Container */}
      <Link href={`/shop/${encodeURIComponent(slug)}`} className="relative aspect-square bg-gray-50/50 flex items-center justify-center p-4 overflow-hidden block rounded-2xl">
        <img
          src={imageSrc}
          alt={name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />

        {/* Discount Badge */}
        {discountPrice && discountPrice < price && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
            Save ${(price - discountPrice).toFixed(2)}
          </span>
        )}

        {/* Stock Badge */}
        {isOutOfStock ? (
          <span className="absolute bottom-3 left-3 bg-gray-800 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            Out of Stock
          </span>
        ) : stock <= 5 ? (
          <span className="absolute bottom-3 left-3 bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            Only {stock} left
          </span>
        ) : null}

        {/* Quick View Overlay Icon */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1.5 rounded-full shadow-sm text-gray-700 hover:text-green-700">
          <Eye size={16} />
        </div>
      </Link>

      {/* Product Info & Action Form */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {category?.name && (
            <span className="text-[11px] font-semibold text-green-700 uppercase tracking-wider block mb-1">
              {category.name}
            </span>
          )}
          <Link href={`/shop/${encodeURIComponent(slug)}`}>
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors line-clamp-2 leading-snug">
              {name}
            </h3>
          </Link>
        </div>

        {/* Price Section */}
        <div className="pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-green-800">
              ${finalPrice.toFixed(2)}
            </span>
            {discountPrice && discountPrice < price && (
              <span className="text-xs text-gray-400 line-through">
                ${price.toFixed(2)}
              </span>
            )}
            <span className="text-xs text-gray-500 font-normal">
              / {unitOfMeasurement}
            </span>
          </div>
        </div>

        {/* Direct Add to Cart Card Form */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding || isOutOfStock}
            className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : added
                  ? 'bg-emerald-600 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white active:scale-[0.98]'
              }`}
          >
            {adding ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Adding...</span>
              </>
            ) : added ? (
              <>
                <Check size={14} />
                <span>Added to Cart!</span>
              </>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <ShoppingCart size={14} />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}