// app/shop/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Sprout, Search, Filter, Loader2 } from 'lucide-react';
import axios from 'axios';

// Define types
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  images: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  seller?: {
    id: string;
    shopName: string;
  };
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const ShopPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch products and categories in parallel
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/categories')
      ]);

      // Filter only approved products
      const approvedProducts = productsRes.data.filter(
        (product: Product) => product.status === 'APPROVED'
      );
      
      setProducts(approvedProducts);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      // Filter by category
      if (selectedCategory !== 'all' && product.category?.id !== selectedCategory) {
        return false;
      }
      // Filter by search term
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shop</h1>
        <p className="text-gray-600 mt-2">Discover quality agricultural products from trusted sellers</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No products found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

// Product Card Component
interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <Link href={`/product/${product.slug}`} className="group">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
        {/* Product Image */}
        <div className="relative h-48 bg-gray-100">
          {product.images && product.images[0] && !imageError ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sprout className="w-12 h-12 text-gray-300" />
            </div>
          )}
          {product.discountPrice && product.discountPrice < product.price && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
            </div>
          )}
          {product.stock < 5 && product.stock > 0 && (
            <div className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              Only {product.stock} left
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-green-600 transition-colors">
                {product.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                {product.category?.name || 'Uncategorized'}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div>
              {product.discountPrice && product.discountPrice < product.price ? (
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-green-600">
                    ${Number(product.discountPrice).toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    ${Number(product.price).toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-lg font-bold text-green-600">
                  ${Number(product.price).toFixed(2)}
                </span>
              )}
            </div>
            {product.seller?.shopName && (
              <span className="text-xs text-gray-500 truncate max-w-[100px]">
                {product.seller.shopName}
              </span>
            )}
          </div>

          <button
            className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={product.stock === 0}
            onClick={(e) => {
              e.preventDefault();
              // Add to cart logic here
            }}
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ShopPage;