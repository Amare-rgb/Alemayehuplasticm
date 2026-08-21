'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star } from 'lucide-react';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  images: string[];
  category?: { name: string; id: string };
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  slug,
  price,
  discountPrice,
  stock,
  images,
  category,
}) => {
  const hasDiscount = discountPrice && discountPrice < price;
  const imageUrl = images && images.length > 0 ? images[0] : '/images/placeholder.jpg';

  return (
    <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <Link href={`/product/${slug}`} className="block relative aspect-square overflow-hidden bg-gray-100">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
            Sale
          </span>
        )}
        {stock === 0 && (
          <span className="absolute top-2 right-2 bg-gray-800 text-white text-xs font-medium px-2 py-1 rounded">
            Out of Stock
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        {category && (
          <p className="text-xs text-gray-500 uppercase tracking-wider">{category.name}</p>
        )}
        <Link href={`/product/${slug}`}>
          <h3 className="font-semibold text-gray-900 mt-1 hover:text-green-600 transition-colors line-clamp-2 text-sm">
            {name}
          </h3>
        </Link>

        {/* Rating placeholder */}
        <div className="flex items-center space-x-2 mt-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-3 h-3 text-gray-300 fill-gray-300"
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">(0)</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mt-3">
          <div>
            {hasDiscount ? (
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-red-500">${discountPrice.toFixed(2)}</span>
                <span className="text-sm text-gray-400 line-through">${price.toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-gray-900">${price.toFixed(2)}</span>
            )}
          </div>
          <button 
            disabled={stock === 0}
            className={`p-2 rounded-lg transition-colors group-hover:scale-110 duration-200 ${
              stock === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;