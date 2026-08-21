// src/components/home/ProductScroller.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ShoppingCart, Star, Heart, Check, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  images?: string[];
  slug: string;
  category?: string | { id?: string; name?: string; slug?: string; description?: string; image?: string; parentId?: string };
  rating?: number;
  reviews?: number;
  badge?: string;
  badgeColor?: string;
  inStock?: boolean;
  isNew?: boolean;
  isSale?: boolean;
}

interface ProductScrollerProps {
  items?: Product[];
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
  limit?: number;
}

// ✅ Fallback only if API fails completely
const fallbackProducts: Product[] = [
  {
    id: '1',
    name: 'Organic Wheat Seeds (25kg)',
    slug: 'organic-wheat-seeds',
    price: 24.99,
    originalPrice: 34.99,
    image: '/banners/images.jpeg',
    images: ['/banners/images.jpeg'],
    category: 'Seeds',
    rating: 4.8,
    reviews: 124,
    badge: 'Bestseller',
    badgeColor: 'bg-yellow-500',
    inStock: true,
    isSale: true,
  },
  {
    id: '2',
    name: 'Premium Fertilizer Blend NPK',
    slug: 'premium-fertilizer-blend',
    price: 45.99,
    image: '/banners/hero-farmer.jpg',
    images: ['/banners/hero-farmer.jpg'],
    category: 'Fertilizers',
    rating: 4.6,
    reviews: 89,
    badge: 'Sale',
    badgeColor: 'bg-red-500',
    inStock: true,
    isSale: true,
  },
  {
    id: '3',
    name: 'Heavy Duty Farm Tractor Tools',
    slug: 'farm-tractor-tools',
    price: 89.00,
    image: '/banners/OfLUzm2ezjHCJUvuxeMpyqItc.avif',
    images: ['/banners/OfLUzm2ezjHCJUvuxeMpyqItc.avif'],
    category: 'Equipment',
    rating: 4.9,
    reviews: 42,
    badge: 'Quality',
    badgeColor: 'bg-green-600',
    inStock: true,
  },
  {
    id: '4',
    name: 'Organic Plant Nutrition Spray',
    slug: 'organic-plant-nutrition',
    price: 19.50,
    image: '/banners/TSe9c8pWQAoVr1cHJorIxnFDhg.avif',
    images: ['/banners/TSe9c8pWQAoVr1cHJorIxnFDhg.avif'],
    category: 'Organic Care',
    rating: 4.7,
    reviews: 65,
    badge: 'Eco',
    badgeColor: 'bg-emerald-600',
    inStock: true,
  },
];

export default function ProductScroller({
  items: propItems,
  title = 'Featured Products',
  subtitle = 'Discover our best agricultural products',
  viewAllLink = '/shop',
  limit = 6
}: ProductScrollerProps) {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const cart = useCart();

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.inStock === false) {
      toast.error('Product is out of stock');
      return;
    }

    try {
      setAddingId(product.id);
      await cart.add(product.id, 1);
      toast.success(`${product.name} added to cart! 🛒`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add to cart');
    } finally {
      setAddingId(null);
    }
  };

  useEffect(() => {
    // If items are passed as props, use them directly
    if (propItems && propItems.length > 0) {
      setItems(propItems.slice(0, limit));
      setLoading(false);
      return;
    }

    // ✅ Fetch products from Admin API
    const fetchProducts = async () => {
      try {
        // This endpoint should return products from your admin panel
        const response = await fetch(`/api/products?limit=${limit}&featured=true`);

        if (response.ok) {
          const data = await response.json();

          // Check if API returned products
          if (data.products && data.products.length > 0) {
            setItems(data.products.slice(0, limit));
          } else if (data.data && data.data.length > 0) {
            // Some APIs return data under "data" key
            setItems(data.data.slice(0, limit));
          } else {
            // No products found, use fallback
            setItems(fallbackProducts.slice(0, limit));
          }
        } else {
          // API failed, use fallback
          console.warn('Failed to fetch products from API, using fallback');
          setItems(fallbackProducts.slice(0, limit));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setItems(fallbackProducts.slice(0, limit));
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [propItems, limit]);

  const scroll = (direction: number) => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction * scrollAmount,
      behavior: 'smooth'
    });
  };

  const toggleFavorite = (productId: string) => {
    setFavorites(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const renderStars = (rating: number = 0) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
        <span className="text-xs text-gray-500 ml-1">{rating}</span>
      </div>
    );
  };

  // Loading skeleton
  if (loading) {
    return (
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse shadow-sm">
              <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // No products available
  if (!items || items.length === 0) {
    return (
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">{title}</h2>
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          <p className="text-gray-500">No products available at the moment</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <ShoppingCart className="w-7 h-7 text-green-600" />
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
          )}
        </div>
        <Link
          href={viewAllLink}
          className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
        >
          View All
          <ChevronRight size={16} />
        </Link>
      </div>

      <div className="relative">
        {/* Scroll Buttons */}
        {items.length > 4 && (
          <>
            <button
              onClick={() => scroll(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          className="overflow-x-auto no-scrollbar grid grid-flow-col auto-cols-[calc(50%_-_0.5rem)] sm:auto-cols-[calc(33.333%_-_0.75rem)] md:auto-cols-[calc(25%_-_0.75rem)] gap-4 py-4 px-6 -mx-6"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {items.map((product) => (
            <div
              key={product.id}
              className="scroll-snap-align-start"
            >
              <Link
                href={`/shop/${encodeURIComponent(product.slug)}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 hover:border-green-200 block h-full"
              >
                <div className="relative aspect-square bg-gray-50 overflow-hidden flex items-center justify-center">
                  <img
                    src={
                      (product.images && product.images.length > 0 && product.images[0])
                        ? product.images[0]
                        : (product.image || '/banners/images.jpeg')
                    }
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.badge && (
                      <span className={`${product.badgeColor || 'bg-green-500'} text-white text-xs font-bold px-2 py-0.5 rounded`}>
                        {product.badge}
                      </span>
                    )}
                    {product.isNew && (
                      <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                        New
                      </span>
                    )}
                    {product.isSale && product.originalPrice && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                        Sale
                      </span>
                    )}
                    {product.inStock === false && (
                      <span className="bg-gray-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  {/* Favorite button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFavorite(product.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-full hover:bg-white transition-colors shadow-sm"
                    aria-label="Add to favorites"
                  >
                    <Heart
                      size={16}
                      className={favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                    />
                  </button>
                </div>

                <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                  <div>
                    {product.category && (
                      <p className="text-xs text-green-700 font-semibold mb-1">
                        {typeof product.category === 'object' ? product.category.name : product.category}
                      </p>
                    )}
                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 hover:text-green-600 transition-colors">
                      {product.name}
                    </h3>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-green-700">
                          {formatPrice(product.price)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>
                      {product.rating && (
                        <div className="hidden sm:block">
                          {renderStars(product.rating)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart Form Button */}
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(e, product)}
                    disabled={addingId === product.id || product.inStock === false}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                      product.inStock === false
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white active:scale-95'
                    }`}
                  >
                    {addingId === product.id ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Adding...
                      </>
                    ) : product.inStock === false ? (
                      'Out of Stock'
                    ) : (
                      <>
                        <ShoppingCart size={12} />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scroll-snap-align-start {
          scroll-snap-align: start;
        }
      `}</style>
    </section>
  );
}