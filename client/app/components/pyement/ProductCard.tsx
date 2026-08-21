// src/components/shop/ProductCard.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, Heart } from 'lucide-react'
import { useState } from 'react'
import AddToCartButton from '@/components/cart/AddToCartButton'

interface ProductCardProps {
  product: {
    id: string
    slug: string
    name: string
    price: number
    discountPrice?: number | null
    images: string[]
    stock: number
    seller: {
      shopName: string
      id: string
    }
    avgRating: number | null
    reviewCount: number
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const displayPrice = product.discountPrice || product.price
  const originalPrice = product.discountPrice ? product.price : null
  const discountPercentage = originalPrice 
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : null

  const productImage = !imageError && product.images[0] 
    ? product.images[0] 
    : '/images/placeholder-product.jpg'

  return (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full relative">
      {/* Wishlist button */}
      <button
        onClick={() => setIsWishlisted(!isWishlisted)}
        className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart 
          size={18} 
          className={`transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
        />
      </button>

      {/* Discount badge */}
      {discountPercentage && (
        <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
          -{discountPercentage}%
        </div>
      )}

      {/* Product Image */}
      <Link href={`/shop/${encodeURIComponent(product.slug)}`} className="block flex-1">
        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden relative">
          <img
            src={productImage}
            alt={product.name}
            title={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
            loading="lazy"
          />
          {product.stock < 10 && product.stock > 0 && (
            <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
              Only {product.stock} left
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-gray-900 font-medium px-3 py-1 rounded-full text-sm">
                Out of Stock
              </span>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-1 truncate">{product.seller.shopName}</p>
          <h3 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">
            {product.name}
          </h3>
          
          {/* Rating */}
          {product.avgRating && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-medium text-gray-700 ml-1">
                  {product.avgRating.toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                ({product.reviewCount})
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Price and Add to Cart */}
      <div className="p-4 border-t border-gray-100 bg-white mt-auto">
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-brand-600">
              ${displayPrice.toFixed(2)}
            </span>
            {originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          {originalPrice && (
            <p className="text-xs text-green-600 mt-1">
              Save ${(originalPrice - displayPrice).toFixed(2)}
            </p>
          )}
        </div>
        
        <AddToCartButton 
          productId={product.id} 
          disabled={product.stock === 0}
        />
      </div>
    </div>
  )
}