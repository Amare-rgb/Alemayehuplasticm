// // // app/shop/page.tsx
// // 'use client';

// // import React, { useState, useEffect } from 'react';
// // import Link from 'next/link';
// // import { ShoppingBag, Sprout, Search, Filter } from 'lucide-react';
// // import axios from 'axios';

// // // Define types
// // interface Product {
// //   id: string;
// //   name: string;
// //   slug: string;
// //   description: string;
// //   price: number;
// //   discountPrice?: number | null;
// //   stock: number;
// //   images: string[];
// //   status: 'PENDING' | 'APPROVED' | 'REJECTED';
// //   category?: {
// //     id: string;
// //     name: string;
// //     slug: string;
// //   };
// //   seller?: {
// //     id: string;
// //     shopName: string;
// //   };
// //   createdAt: string;
// // }

// // interface Category {
// //   id: string;
// //   name: string;
// //   slug: string;
// //   description?: string;
// // }

// // // Fallback Mock Data when no backend API is running
// // const MOCK_CATEGORIES: Category[] = [
// //   { id: 'cat-veg', name: 'Vegetables', slug: 'vegetables', description: 'Farm fresh organic vegetables' },
// //   { id: 'cat-fruit', name: 'Fruits', slug: 'fruits', description: 'Seasonal and naturally sweet fruits' },
// //   { id: 'cat-cereal', name: 'Cereals & Grains', slug: 'cereals', description: 'Whole grains and kitchen staples' },
// //   { id: 'cat-tana', name: 'Tana Farm (Livestock & Dairy)', slug: 'tana-farm', description: 'Fresh cow milk and livestock' },
// // ];

// // const MOCK_PRODUCTS: Product[] = [
// //   {
// //     id: 'p-1',
// //     name: 'Organic Tomatoes',
// //     slug: 'organic-tomatoes',
// //     description: 'Freshly harvested ripe organic tomatoes directly from Genesis fields.',
// //     price: 45,
// //     discountPrice: 38,
// //     stock: 120,
// //     images: ['https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80'],
// //     status: 'APPROVED',
// //     category: { id: 'cat-veg', name: 'Vegetables', slug: 'vegetables' },
// //     seller: { id: 's-1', shopName: 'Genesis Direct Farm' },
// //     createdAt: new Date().toISOString(),
// //   },
// //   {
// //     id: 'p-2',
// //     name: 'Fresh Spinach & Garden Greens',
// //     slug: 'fresh-spinach',
// //     description: 'Nutrient-rich green spinach leaves harvested daily.',
// //     price: 30,
// //     discountPrice: null,
// //     stock: 85,
// //     images: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80'],
// //     status: 'APPROVED',
// //     category: { id: 'cat-veg', name: 'Vegetables', slug: 'vegetables' },
// //     seller: { id: 's-1', shopName: 'Genesis Direct Farm' },
// //     createdAt: new Date(Date.now() - 3600000).toISOString(),
// //   },
// //   {
// //     id: 'p-3',
// //     name: 'Seasonal Fresh Apples',
// //     slug: 'fresh-apples',
// //     description: 'Sweet, crisp handpicked apples direct from orchard harvest.',
// //     price: 85,
// //     discountPrice: 75,
// //     stock: 60,
// //     images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80'],
// //     status: 'APPROVED',
// //     category: { id: 'cat-fruit', name: 'Fruits', slug: 'fruits' },
// //     seller: { id: 's-1', shopName: 'Genesis Direct Farm' },
// //     createdAt: new Date(Date.now() - 7200000).toISOString(),
// //   },
// //   {
// //     id: 'p-4',
// //     name: 'Ripe Bananas (Cluster)',
// //     slug: 'ripe-bananas',
// //     description: 'Naturally ripened sweet bananas packed with nutrients.',
// //     price: 65,
// //     discountPrice: null,
// //     stock: 140,
// //     images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80'],
// //     status: 'APPROVED',
// //     category: { id: 'cat-fruit', name: 'Fruits', slug: 'fruits' },
// //     seller: { id: 's-1', shopName: 'Genesis Direct Farm' },
// //     createdAt: new Date(Date.now() - 10800000).toISOString(),
// //   },
// //   {
// //     id: 'p-5',
// //     name: 'Premium Wheat Grains (5kg)',
// //     slug: 'premium-wheat',
// //     description: 'High-quality whole wheat grains for home milling & baking.',
// //     price: 320,
// //     discountPrice: 290,
// //     stock: 40,
// //     images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80'],
// //     status: 'APPROVED',
// //     category: { id: 'cat-cereal', name: 'Cereals & Grains', slug: 'cereals' },
// //     seller: { id: 's-1', shopName: 'Genesis Direct Farm' },
// //     createdAt: new Date(Date.now() - 14400000).toISOString(),
// //   },
// //   {
// //     id: 'p-6',
// //     name: 'Organic Teff Grain (10kg)',
// //     slug: 'organic-teff',
// //     description: 'Pure gluten-free staple teff grain directly from farm harvest.',
// //     price: 680,
// //     discountPrice: 620,
// //     stock: 30,
// //     images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80'],
// //     status: 'APPROVED',
// //     category: { id: 'cat-cereal', name: 'Cereals & Grains', slug: 'cereals' },
// //     seller: { id: 's-1', shopName: 'Genesis Direct Farm' },
// //     createdAt: new Date(Date.now() - 18000000).toISOString(),
// //   },
// //   {
// //     id: 'p-7',
// //     name: 'Tana Farm Fresh Cow Milk (2L)',
// //     slug: 'tana-fresh-milk',
// //     description: '100% pure, farm-fresh pasteurized cow milk from Tana Sister Farm.',
// //     price: 110,
// //     discountPrice: 95,
// //     stock: 50,
// //     images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80'],
// //     status: 'APPROVED',
// //     category: { id: 'cat-tana', name: 'Tana Farm (Livestock & Dairy)', slug: 'tana-farm' },
// //     seller: { id: 's-2', shopName: 'Tana (ጣና) Farm' },
// //     createdAt: new Date(Date.now() - 21600000).toISOString(),
// //   },
// //   {
// //     id: 'p-8',
// //     name: 'Tana Farm Raised Cattle / Cow',
// //     slug: 'tana-cattle',
// //     description: 'Healthy, well-cared farm-raised cow for livestock purchase.',
// //     price: 45000,
// //     discountPrice: 42000,
// //     stock: 5,
// //     images: ['https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80'],
// //     status: 'APPROVED',
// //     category: { id: 'cat-tana', name: 'Tana Farm (Livestock & Dairy)', slug: 'tana-farm' },
// //     seller: { id: 's-2', shopName: 'Tana (ጣና) Farm' },
// //     createdAt: new Date(Date.now() - 25200000).toISOString(),
// //   },
// // ];

// // const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// // const api = axios.create({
// //   baseURL: API_URL,
// //   headers: { 'Content-Type': 'application/json' },
// //   withCredentials: true,
// //   timeout: 4000,
// // });

// // const ShopPage: React.FC = () => {
// //   const [loading, setLoading] = useState<boolean>(true);
// //   const [products, setProducts] = useState<Product[]>([]);
// //   const [categories, setCategories] = useState<Category[]>([]);
// //   const [selectedCategory, setSelectedCategory] = useState<string>('all');
// //   const [searchTerm, setSearchTerm] = useState<string>('');
// //   const [sortBy, setSortBy] = useState<string>('newest');

// //   useEffect(() => {
// //     fetchData();
// //   }, []);

// //   const fetchData = async () => {
// //     try {
// //       setLoading(true);
      
// //       const [productsRes, categoriesRes] = await Promise.all([
// //         api.get('/api/products'),
// //         api.get('/api/categories')
// //       ]);

// //       const approvedProducts = (productsRes.data || []).filter(
// //         (product: Product) => product.status === 'APPROVED'
// //       );
      
// //       setProducts(approvedProducts.length > 0 ? approvedProducts : MOCK_PRODUCTS);
// //       setCategories(categoriesRes.data && categoriesRes.data.length > 0 ? categoriesRes.data : MOCK_CATEGORIES);
// //     } catch {
// //       // Fallback seamlessly to mock data when backend is not available
// //       setProducts(MOCK_PRODUCTS);
// //       setCategories(MOCK_CATEGORIES);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // Filter and sort products
// //   const filteredProducts = products
// //     .filter(product => {
// //       // Filter by category (by id or slug)
// //       if (selectedCategory !== 'all') {
// //         const matchesId = product.category?.id === selectedCategory;
// //         const matchesSlug = product.category?.slug === selectedCategory;
// //         if (!matchesId && !matchesSlug) return false;
// //       }
// //       // Filter by search term
// //       if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
// //         return false;
// //       }
// //       return true;
// //     })
// //     .sort((a, b) => {
// //       switch (sortBy) {
// //         case 'newest':
// //           return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
// //         case 'price_low':
// //           return a.price - b.price;
// //         case 'price_high':
// //           return b.price - a.price;
// //         default:
// //           return 0;
// //       }
// //     });

// //   if (loading) {
// //     return (
// //       <div className="flex items-center justify-center min-h-[60vh]">
// //         <div className="text-center">
// //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
// //           <p className="mt-4 text-gray-600">Loading products...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="max-w-7xl mx-auto px-4 py-8">
// //       {/* Header */}
// //       <div className="mb-8">
// //         <h1 className="text-3xl font-bold text-gray-900">Shop Genesis Produce</h1>
// //         <p className="text-gray-600 mt-2">Discover fresh agricultural products and livestock straight from our farms at direct prices</p>
// //       </div>

// //       {/* Filters */}
// //       <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8">
// //         <div className="flex flex-col md:flex-row gap-4">
// //           {/* Search */}
// //           <div className="flex-1 relative">
// //             <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
// //             <input
// //               type="text"
// //               placeholder="Search vegetables, fruits, cereals..."
// //               value={searchTerm}
// //               onChange={(e) => setSearchTerm(e.target.value)}
// //               className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
// //             />
// //           </div>

// //           {/* Category Filter */}
// //           <div className="flex items-center space-x-2">
// //             <Filter className="w-5 h-5 text-gray-400" />
// //             <select
// //               value={selectedCategory}
// //               onChange={(e) => setSelectedCategory(e.target.value)}
// //               className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
// //             >
// //               <option value="all">All Categories</option>
// //               {categories.map((category) => (
// //                 <option key={category.id} value={category.id}>
// //                   {category.name}
// //                 </option>
// //               ))}
// //             </select>
// //           </div>

// //           {/* Sort */}
// //           <div className="flex items-center space-x-2">
// //             <select
// //               value={sortBy}
// //               onChange={(e) => setSortBy(e.target.value)}
// //               className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
// //             >
// //               <option value="newest">Newest</option>
// //               <option value="price_low">Price: Low to High</option>
// //               <option value="price_high">Price: High to Low</option>
// //             </select>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Products Grid */}
// //       {filteredProducts.length === 0 ? (
// //         <div className="text-center py-12">
// //           <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
// //           <h3 className="text-lg font-medium text-gray-900">No products found</h3>
// //           <p className="text-gray-500 mt-1">Try adjusting your filters or search terms</p>
// //         </div>
// //       ) : (
// //         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
// //           {filteredProducts.map((product) => (
// //             <ProductCard key={product.id} product={product} />
// //           ))}
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // // Product Card Component
// // interface ProductCardProps {
// //   product: Product;
// // }

// // const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
// //   const [imageError, setImageError] = useState(false);

// //   return (
// //     <Link href={`/shop/${product.slug}`} className="group">
// //       <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
// //         {/* Product Image */}
// //         <div className="relative h-48 bg-gray-100">
// //           {product.images && product.images[0] && !imageError ? (
// //             <img
// //               src={product.images[0]}
// //               alt={product.name}
// //               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
// //               onError={() => setImageError(true)}
// //             />
// //           ) : (
// //             <div className="w-full h-full flex items-center justify-center">
// //               <Sprout className="w-12 h-12 text-gray-300" />
// //             </div>
// //           )}
// //           {product.discountPrice && product.discountPrice < product.price && (
// //             <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
// //               {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
// //             </div>
// //           )}
// //           {product.stock < 5 && product.stock > 0 && (
// //             <div className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
// //               Only {product.stock} left
// //             </div>
// //           )}
// //           {product.stock === 0 && (
// //             <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
// //               <span className="text-white font-bold text-lg">Out of Stock</span>
// //             </div>
// //           )}
// //         </div>

// //         {/* Product Info */}
// //         <div className="p-4">
// //           <div className="flex items-start justify-between">
// //             <div className="flex-1">
// //               <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-green-600 transition-colors">
// //                 {product.name}
// //               </h3>
// //               <p className="text-sm text-gray-500 mt-1 line-clamp-1">
// //                 {product.category?.name || 'Uncategorized'}
// //               </p>
// //             </div>
// //           </div>

// //           <div className="mt-3 flex items-center justify-between">
// //             <div>
// //               {product.discountPrice && product.discountPrice < product.price ? (
// //                 <div className="flex items-center space-x-2">
// //                   <span className="text-lg font-bold text-green-600">
// //                     ETB {Number(product.discountPrice).toFixed(0)}
// //                   </span>
// //                   <span className="text-sm text-gray-400 line-through">
// //                     ETB {Number(product.price).toFixed(0)}
// //                   </span>
// //                 </div>
// //               ) : (
// //                 <span className="text-lg font-bold text-green-600">
// //                   ETB {Number(product.price).toFixed(0)}
// //                 </span>
// //               )}
// //             </div>
// //             {product.seller?.shopName && (
// //               <span className="text-xs text-gray-500 truncate max-w-[100px]">
// //                 {product.seller.shopName}
// //               </span>
// //             )}
// //           </div>

// //           <button
// //             className="w-full mt-3 px-4 py-2 bg-[#123523] text-white rounded-lg hover:bg-[#19472d] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
// //             disabled={product.stock === 0}
// //             onClick={(e) => {
// //               e.preventDefault();
// //             }}
// //           >
// //             {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
// //           </button>
// //         </div>
// //       </div>
// //     </Link>
// //   );
// // };

// // export default ShopPage;

// "use client";

// import Link from "next/link";
// import { useMemo, useState } from "react";

// export type ProductCategory = "Vegetables" | "Fruits" | "Cereals";

// export type Product = {
//   id: string;
//   slug: string;
//   name: string;
//   category: ProductCategory;
//   description: string;
//   price: number;
//   unit: string;
//   stock: number;
//   featured?: boolean;
//   badge?: string;
//   images: string[];
// };

// export const products: Product[] = [
//   {
//     id: "tomato-001",
//     slug: "fresh-tomatoes",
//     name: "Fresh Tomatoes",
//     category: "Vegetables",
//     description:
//       "Fresh, naturally ripened tomatoes sourced directly from local farms.",
//     price: 85,
//     unit: "kg",
//     stock: 120,
//     featured: true,
//     badge: "Best Seller",
//     images: [
//       "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=1200&q=85",
//       "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=1200&q=85",
//       "https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=1200&q=85",
//     ],
//   },
//   {
//     id: "onion-001",
//     slug: "red-onions",
//     name: "Red Onions",
//     category: "Vegetables",
//     description:
//       "Crisp, flavorful red onions carefully selected for freshness and quality.",
//     price: 70,
//     unit: "kg",
//     stock: 90,
//     images: [
//       "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1200&q=85",
//       "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=1200&q=85",
//     ],
//   },
//   {
//     id: "avocado-001",
//     slug: "fresh-avocados",
//     name: "Fresh Avocados",
//     category: "Fruits",
//     description:
//       "Creamy, nutrient-rich avocados harvested at the right stage of ripeness.",
//     price: 140,
//     unit: "kg",
//     stock: 55,
//     featured: true,
//     badge: "Farm Fresh",
//     images: [
//       "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=1200&q=85",
//       "https://images.unsplash.com/photo-1601039641847-7857b994d704?auto=format&fit=crop&w=1200&q=85",
//     ],
//   },
//   {
//     id: "banana-001",
//     slug: "fresh-bananas",
//     name: "Fresh Bananas",
//     category: "Fruits",
//     description:
//       "Naturally sweet bananas sourced directly from trusted local growers.",
//     price: 75,
//     unit: "kg",
//     stock: 150,
//     images: [
//       "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=1200&q=85",
//       "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=1200&q=85",
//     ],
//   },
//   {
//     id: "maize-001",
//     slug: "yellow-maize",
//     name: "Yellow Maize",
//     category: "Cereals",
//     description:
//       "High-quality maize sourced directly from farmers and carefully handled.",
//     price: 95,
//     unit: "kg",
//     stock: 300,
//     featured: true,
//     badge: "Best Value",
//     images: [
//       "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=1200&q=85",
//       "https://images.unsplash.com/photo-1601593768799-76e28b9f7c7b?auto=format&fit=crop&w=1200&q=85",
//     ],
//   },
//   {
//     id: "wheat-001",
//     slug: "whole-wheat",
//     name: "Whole Wheat",
//     category: "Cereals",
//     description:
//       "Wholesome whole wheat grains selected for quality and nutrition.",
//     price: 110,
//     unit: "kg",
//     stock: 180,
//     images: [
//       "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85",
//       "https://images.unsplash.com/photo-1532629789574-5f4dc4f9d4f7?auto=format&fit=crop&w=1200&q=85",
//     ],
//   },
// ];

// const categories: ("All" | ProductCategory)[] = [
//   "All",
//   "Vegetables",
//   "Fruits",
//   "Cereals",
// ];

// type SortOption = "featured" | "price-low" | "price-high" | "name";

// function LeafIcon() {
//   return (
//     <svg
//       viewBox="0 0 24 24"
//       fill="none"
//       className="h-4 w-4"
//       aria-hidden="true"
//     >
//       <path
//         d="M20.5 3.5C11.8 3.9 6.1 7 4.2 11.5c-1.5 3.5.4 6.7 3.6 7.2 4.4.7 8.1-3.3 9.1-7.4"
//         stroke="currentColor"
//         strokeWidth="1.6"
//         strokeLinecap="round"
//       />
//       <path
//         d="M4.5 20c2.5-5.5 6.2-8.8 11.4-11"
//         stroke="currentColor"
//         strokeWidth="1.6"
//         strokeLinecap="round"
//       />
//     </svg>
//   );
// }

// function SearchIcon() {
//   return (
//     <svg
//       viewBox="0 0 24 24"
//       fill="none"
//       className="h-5 w-5"
//       aria-hidden="true"
//     >
//       <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
//       <path
//         d="m16 16 4.5 4.5"
//         stroke="currentColor"
//         strokeWidth="1.8"
//         strokeLinecap="round"
//       />
//     </svg>
//   );
// }

// function ArrowUpRight() {
//   return (
//     <svg
//       viewBox="0 0 24 24"
//       fill="none"
//       className="h-4 w-4"
//       aria-hidden="true"
//     >
//       <path
//         d="M7 17 17 7M8 7h9v9"
//         stroke="currentColor"
//         strokeWidth="1.8"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//       />
//     </svg>
//   );
// }

// export default function Products() {
//   const [selectedCategory, setSelectedCategory] =
//     useState<(typeof categories)[number]>("All");

//   const [search, setSearch] = useState("");
//   const [sort, setSort] = useState<SortOption>("featured");

//   const filteredProducts = useMemo(() => {
//     const normalizedSearch = search.toLowerCase().trim();

//     const filtered = products.filter((product) => {
//       const matchesCategory =
//         selectedCategory === "All" ||
//         product.category === selectedCategory;

//       const matchesSearch =
//         !normalizedSearch ||
//         product.name.toLowerCase().includes(normalizedSearch) ||
//         product.description.toLowerCase().includes(normalizedSearch) ||
//         product.category.toLowerCase().includes(normalizedSearch);

//       return matchesCategory && matchesSearch;
//     });

//     return [...filtered].sort((a, b) => {
//       switch (sort) {
//         case "price-low":
//           return a.price - b.price;

//         case "price-high":
//           return b.price - a.price;

//         case "name":
//           return a.name.localeCompare(b.name);

//         case "featured":
//         default:
//           return Number(b.featured) - Number(a.featured);
//       }
//     });
//   }, [selectedCategory, search, sort]);

//   return (
//     <main className="min-h-screen bg-[var(--cream)]">
//       {/* Hero */}
//       <section className="relative overflow-hidden bg-[#123523] px-5 pb-16 pt-28 sm:px-8 lg:px-12 lg:pb-20 lg:pt-36">
//         <div
//           className="pointer-events-none absolute -right-24 -top-40 h-[32rem] w-[32rem] rounded-full bg-[#b9d873]/10 blur-3xl"
//           aria-hidden="true"
//         />

//         <div
//           className="pointer-events-none absolute -bottom-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-[#72a84d]/10 blur-3xl"
//           aria-hidden="true"
//         />

//         <div className="relative mx-auto max-w-7xl">
//           <div className="max-w-3xl">
//             <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#b9d873]">
//               <LeafIcon />
//               Farm Direct Marketplace
//             </div>

//             <h1 className="font-serif-heading text-5xl font-medium leading-[0.98] tracking-[-0.045em] text-[#f6f3e9] sm:text-6xl lg:text-7xl">
//               Good food,
//               <br />
//               <span className="text-[#b9d873]">straight from the source.</span>
//             </h1>

//             <p className="mt-7 max-w-2xl text-base leading-7 text-[#f6f3e9]/65 sm:text-lg">
//               Browse fresh vegetables, fruits and cereals sourced directly
//               from farms. No unnecessary middlemen. No inflated reseller
//               markups.
//             </p>
//           </div>
//         </div>
//       </section>

//       {/* Catalogue */}
//       <section className="px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
//         <div className="mx-auto max-w-7xl">
//           {/* Controls */}
//           <div className="mb-10 rounded-[2rem] border border-[rgba(20,33,25,.09)] bg-white p-4 shadow-[0_15px_45px_rgba(18,53,35,.06)] sm:p-5">
//             <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//               {/* Search */}
//               <div className="relative w-full lg:max-w-md">
//                 <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#69736b]">
//                   <SearchIcon />
//                 </div>

//                 <input
//                   type="search"
//                   value={search}
//                   onChange={(event) => setSearch(event.target.value)}
//                   placeholder="Search products..."
//                   className="h-12 w-full rounded-xl border border-[#19472d]/10 bg-[#f6f3e9]/60 pl-11 pr-4 text-sm text-[#142119] outline-none transition placeholder:text-[#69736b]/60 focus:border-[#28633e] focus:bg-white focus:ring-4 focus:ring-[#b9d873]/20"
//                 />
//               </div>

//               <div className="flex flex-col gap-3 sm:flex-row">
//                 {/* Categories */}
//                 <div className="flex flex-wrap gap-2">
//                   {categories.map((category) => {
//                     const active = selectedCategory === category;

//                     return (
//                       <button
//                         key={category}
//                         type="button"
//                         onClick={() => setSelectedCategory(category)}
//                         className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
//                           active
//                             ? "bg-[#123523] text-[#f6f3e9] shadow-md"
//                             : "bg-[#f6f3e9] text-[#69736b] hover:bg-[#eae5d7] hover:text-[#123523]"
//                         }`}
//                       >
//                         {category}
//                       </button>
//                     );
//                   })}
//                 </div>

//                 {/* Sort */}
//                 <select
//                   value={sort}
//                   onChange={(event) =>
//                     setSort(event.target.value as SortOption)
//                   }
//                   className="h-11 rounded-full border border-[#19472d]/10 bg-[#f6f3e9] px-4 text-sm font-semibold text-[#123523] outline-none focus:border-[#28633e]"
//                 >
//                   <option value="featured">Featured</option>
//                   <option value="price-low">Price: Low to High</option>
//                   <option value="price-high">Price: High to Low</option>
//                   <option value="name">Name A–Z</option>
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* Results count */}
//           <div className="mb-7 flex items-center justify-between">
//             <p className="text-sm text-[#69736b]">
//               Showing{" "}
//               <span className="font-bold text-[#123523]">
//                 {filteredProducts.length}
//               </span>{" "}
//               {filteredProducts.length === 1 ? "product" : "products"}
//             </p>
//           </div>

//           {/* Product grid */}
//           {filteredProducts.length > 0 ? (
//             <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
//               {filteredProducts.map((product) => (
//                 <Link
//                   key={product.id}
//                   href={`/products/${product.slug}`}
//                   className="group overflow-hidden rounded-[2rem] border border-[rgba(20,33,25,.09)] bg-white shadow-[0_15px_45px_rgba(18,53,35,.07)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_25px_65px_rgba(18,53,35,.13)]"
//                 >
//                   {/* Image */}
//                   <div className="relative aspect-[1.08/1] overflow-hidden">
//                     <img
//                       src={product.images[0]}
//                       alt={product.name}
//                       loading="lazy"
//                       className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
//                     />

//                     <div className="absolute inset-0 bg-gradient-to-t from-[#0b2419]/50 via-transparent to-transparent" />

//                     {product.badge && (
//                       <span className="absolute left-5 top-5 rounded-full bg-[#f6f3e9]/95 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#28633e] backdrop-blur">
//                         {product.badge}
//                       </span>
//                     )}

//                     <span className="absolute bottom-5 left-5 rounded-full bg-[#123523]/80 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#f6f3e9] backdrop-blur">
//                       {product.category}
//                     </span>

//                     <span className="absolute bottom-5 right-5 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-[#b9d873] text-[#123523] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
//                       <ArrowUpRight />
//                     </span>
//                   </div>

//                   {/* Content */}
//                   <div className="p-6">
//                     <div className="mb-3 flex items-start justify-between gap-3">
//                       <h2 className="font-serif-heading text-2xl leading-tight tracking-[-0.025em] text-[#123523]">
//                         {product.name}
//                       </h2>

//                       <span className="shrink-0 rounded-full bg-[#f6f3e9] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#28633e]">
//                         Direct
//                       </span>
//                     </div>

//                     <p className="line-clamp-2 text-sm leading-6 text-[#69736b]">
//                       {product.description}
//                     </p>

//                     <div className="my-5 h-px bg-[#19472d]/10" />

//                     <div className="flex items-end justify-between gap-4">
//                       <div>
//                         <span className="font-serif-heading text-2xl font-semibold text-[#123523]">
//                           ETB {product.price.toLocaleString()}
//                         </span>

//                         <span className="ml-1 text-xs text-[#69736b]">
//                           / {product.unit}
//                         </span>
//                       </div>

//                       <span className="text-xs font-semibold text-[#28633e]">
//                         {product.stock > 0
//                           ? `${product.stock} ${product.unit}s available`
//                           : "Out of stock"}
//                       </span>
//                     </div>
//                   </div>
//                 </Link>
//               ))}
//             </div>
//           ) : (
//             <div className="rounded-[2rem] border border-dashed border-[#19472d]/15 bg-white px-6 py-20 text-center">
//               <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#f6f3e9] text-[#28633e]">
//                 <SearchIcon />
//               </div>

//               <h3 className="font-serif-heading text-3xl text-[#123523]">
//                 No products found
//               </h3>

//               <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#69736b]">
//                 Try another search term or choose a different category.
//               </p>

//               <button
//                 type="button"
//                 onClick={() => {
//                   setSearch("");
//                   setSelectedCategory("All");
//                 }}
//                 className="mt-6 rounded-full bg-[#123523] px-6 py-3 text-sm font-semibold text-[#f6f3e9] transition hover:bg-[#19472d]"
//               >
//                 Clear filters
//               </button>
//             </div>
//           )}
//         </div>
//       </section>
//     </main>
//   );
// }

import Products from "@/components/shop/Products";

export default function ProductsPage() {
  return <Products />;
}