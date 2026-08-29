// src/components/home/CategoryGrid.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sprout,
  TrendingUp
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  icon?: string;
  productCount?: number;
  description?: string;
}

interface CategoryGridProps {
  categories?: Category[];
  title?: string;
  limit?: number;
}

// Default fallback categories
const defaultCategories: Category[] = [
  { id: '1', name: 'Fresh Produce', slug: 'fresh-produce', icon: '🌿' },
  { id: '2', name: 'Seeds & Fertilizers', slug: 'seeds-fertilizers', icon: '🌱' },
  { id: '3', name: 'Farm Equipment', slug: 'farm-equipment', icon: '🚜' },
  { id: '4', name: 'Irrigation Systems', slug: 'irrigation', icon: '💧' },
  { id: '5', name: 'Organic Products', slug: 'organic', icon: '🌾' },
  { id: '6', name: 'Livestock', slug: 'livestock', icon: '🐄' },
  { id: '7', name: 'Dairy Products', slug: 'dairy', icon: '🥛' },
  { id: '8', name: 'Tools & Machinery', slug: 'tools', icon: '🔧' },
];

const getCategoryIcon = (name: string): string => {
  const icons: Record<string, string> = {
    'Vegetables': '🥬',
    'Fruits': '🍎',
    'Grains': '🌾',
    'Seeds': '🌱',
    'Fertilizers': '🧪',
    'Equipment': '🚜',
    'Irrigation': '💧',
    'Livestock': '🐄',
    'Organic': '🌿',
    'Dairy': '🥛',
    'Tools': '🔧',
    'Fresh Produce': '🥬',
  };
  return icons[name] || '🌾';
};

export default function CategoryGrid({
  categories: propCategories,
  title = 'Shop by Category',
  limit = 8
}: CategoryGridProps) {
  const [fetchedCategories, setFetchedCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!propCategories || propCategories.length === 0);

  // ── FIX: Determine if we are using props or fetched data ───────────────────
  const displayCategories = useMemo(() => {
    if (propCategories && propCategories.length > 0) {
      return propCategories.slice(0, limit);
    }
    if (fetchedCategories.length > 0) {
      return fetchedCategories.slice(0, limit);
    }
    return defaultCategories.slice(0, limit);
  }, [propCategories, fetchedCategories, limit]);

  // ── FIX: Only fetch if props are NOT provided ─────────────────────────────
  useEffect(() => {
    if (propCategories && propCategories.length > 0) {
      return; // Skip fetching if categories are passed via props
    }

    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?limit=' + limit);
        if (response.ok) {
          const data = await response.json();
          if (isMounted && data.categories && data.categories.length > 0) {
            setFetchedCategories(data.categories);
          } else if (isMounted) {
            setFetchedCategories(defaultCategories);
          }
        } else if (isMounted) {
          setFetchedCategories(defaultCategories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        if (isMounted) {
          setFetchedCategories(defaultCategories);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, [propCategories, limit]);

  // If props are provided, we are never loading from API
  const isLoading = propCategories && propCategories.length > 0 ? false : loading;

  if (isLoading) {
    return (
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <Sprout className="w-7 h-7 text-green-600" />
          {title}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse shadow-sm">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!displayCategories || displayCategories.length === 0) {
    return (
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <Sprout className="w-7 h-7 text-green-600" />
          {title}
        </h2>
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          <p className="text-gray-500">No categories available</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Sprout className="w-7 h-7 text-green-600" />
          {title}
        </h2>
        <Link
          href="/shop"
          className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
        >
          View All
          <TrendingUp size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {displayCategories.map((category) => (
          <Link
            key={category.id}
            href={`/shop?category=${encodeURIComponent(category.slug)}`}
            className="group bg-white rounded-xl p-4 text-center hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-300 hover:-translate-y-1"
          >
            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full flex items-center justify-center group-hover:from-green-100 group-hover:to-emerald-100 transition-all">
              {category.image ? (
                <div className="relative w-10 h-10">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <span className="text-3xl">{getCategoryIcon(category.name)}</span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">
              {category.name}
            </h3>
            {category.productCount !== undefined && (
              <p className="text-xs text-gray-400 mt-1">
                {category.productCount} products
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}