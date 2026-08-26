// app/admin/products/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  ChevronDown,
  Package,
  Download,
  RefreshCw,
  XCircle,
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
  Image as ImageIcon
} from 'lucide-react';

// Create axios instance with base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken') || 
                sessionStorage.getItem('authToken') ||
                localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
    }
    return Promise.reject(error);
  }
);

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: Category | null;
  subCategory?: Category | null;
  price: number;
  discountPrice?: number;
  salePrice?: number;
  stock: number;
  sku: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT';
  images: string[];
  tags: string[];
  condition: 'NEW' | 'USED' | 'REFURBISHED';
  brand?: string;
  weight?: number;
  unitOfMeasurement?: string;
  pricePerUnit?: number;
  durationTime?: string;
  seller: {
    shopName: string;
    isVerified: boolean;
  } | null;
  reviews: Array<{ rating: number }>;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  products: Product[];
  total: number;
  pages: number;
  page: number;
}

type ProductsApiResponse = ApiResponse | Product[] | { message?: string; error?: string };

const durationOptions = [
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '2h', label: '2 Hours' },
  { value: '4h', label: '4 Hours' },
  { value: '8h', label: '8 Hours' },
  { value: '12h', label: '12 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '2d', label: '2 Days' },
  { value: '3d', label: '3 Days' },
  { value: '7d', label: '7 Days' },
  { value: '14d', label: '14 Days' },
  { value: '30d', label: '30 Days' },
];

interface NotificationProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ type, message, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}>
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg max-w-md ${getColors()}`}>
        {getIcon()}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Image Component with fallback
const ProductImage: React.FC<{ src: string | null; alt: string; className?: string }> = ({ src, alt, className = '' }) => {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <ImageIcon className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={48}
      height={48}
      className={`object-cover ${className}`}
      onError={() => setError(true)}
      unoptimized={src.startsWith('http')}
    />
  );
};

const ProductsPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Refs for tracking
  const isMounted = useRef(true);
  const isInitialMount = useRef(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldResetPageRef = useRef(false);

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ type, message });
  };

  const clearNotification = () => {
    setNotification(null);
  };

  const extractProductsFromResponse = (data: unknown): { products: Product[]; total: number; pages: number } => {
    if (data && typeof data === 'object') {
      if ('products' in data && Array.isArray((data as ApiResponse).products)) {
        const response = data as ApiResponse;
        return {
          products: response.products,
          total: response.total || response.products.length,
          pages: response.pages || 1
        };
      }
      if (Array.isArray(data)) {
        return {
          products: data as Product[],
          total: data.length,
          pages: 1
        };
      }
      if ('data' in data && Array.isArray((data as { data: Product[] }).data)) {
        const response = data as { data: Product[]; total?: number; pages?: number };
        return {
          products: response.data,
          total: response.total || response.data.length,
          pages: response.pages || 1
        };
      }
    }
    
    return {
      products: [],
      total: 0,
      pages: 0
    };
  };

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/api/categories');
      let categoriesData = [];
      
      if (response.data && Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data && response.data.categories) {
        categoriesData = response.data.categories;
      } else if (response.data && response.data.data) {
        categoriesData = response.data.data;
      }
      
      const parentCategories = categoriesData.filter((cat: Category) => !cat.parentId);
      const categoryNames = parentCategories.map((cat: Category) => cat.name);
      setCategories(categoryNames);
      
      return categoryNames;
    } catch (err) {
      console.log('Categories fetch error:', err);
      return [];
    }
  }, []);

  // Main fetch function - uses all current state values
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        showNotification('error', 'Authentication required. Please login again.');
        router.push('/auth/signin');
        return;
      }
      
      // Use the current page or reset to 1 if needed
      const pageToUse = shouldResetPageRef.current ? 1 : currentPage;
      
      // Reset the flag after using it
      if (shouldResetPageRef.current && pageToUse === 1) {
        shouldResetPageRef.current = false;
        if (currentPage !== 1) {
          setCurrentPage(1);
        }
      }
      
      const params = new URLSearchParams();
      params.append('page', pageToUse.toString());
      params.append('limit', pageSize.toString());
      
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);
      
      const url = `/api/products?${params.toString()}`;
      
      const response = await api.get<ProductsApiResponse>(url);
      
      if (!isMounted.current) return;
      
      const { products: productsData, total: totalCount, pages: pagesCount } = 
        extractProductsFromResponse(response.data);
      
      setProducts(productsData);
      setTotal(totalCount);
      setPages(pagesCount || 1);
      
    } catch (err: unknown) {
      console.error('❌ Fetch error:', err);
      if (!isMounted.current) return;
      
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ error: string }>;
        if (axiosError.response?.status === 404) {
          showNotification('error', 'Products API endpoint not found. Please check your backend configuration.');
        } else if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          showNotification('error', 'Authentication failed. Please login again.');
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
          router.push('/auth/signin');
        } else {
          showNotification('error', axiosError.response?.data?.error || `Failed to fetch products (Status: ${axiosError.response?.status})`);
        }
      } else {
        showNotification('error', err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [currentPage, pageSize, searchQuery, selectedCategory, selectedStatus, router]);

  // Initial load - only runs once
  useEffect(() => {
    isMounted.current = true;
    
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Fetch categories first, then products
      fetchCategories().then(() => {
        fetchProducts();
      });
    }
    
    return () => {
      isMounted.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle search with debounce - NO setState here
  useEffect(() => {
    if (isInitialMount.current || !isMounted.current) return;

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      // Mark that page should reset
      shouldResetPageRef.current = true;
      // Fetch with page reset logic
      fetchProducts();
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Handle filter changes - NO setState here
  useEffect(() => {
    if (isInitialMount.current || !isMounted.current) return;
    
    // Mark that page should reset
    shouldResetPageRef.current = true;
    // Fetch with page reset logic
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedStatus]);

  // Handle page changes - NO setState here, just fetch
  useEffect(() => {
    if (isInitialMount.current || !isMounted.current) return;
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        showNotification('error', 'Authentication required. Please login again.');
        router.push('/auth/signin');
        return;
      }
      
      const response = await api.delete(`/api/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        showNotification('success', 'Product deleted successfully!');
        await fetchProducts();
      } else {
        showNotification('error', response.data.error || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          showNotification('error', 'Authentication failed. Please login again.');
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
          router.push('/auth/signin');
        } else if (err.response?.status === 403) {
          showNotification('error', 'You don\'t have permission to delete this product.');
        } else {
          showNotification('error', err.response?.data?.error || 'Failed to delete product');
        }
      } else {
        showNotification('error', 'An unexpected error occurred');
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDateWithTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDurationLabel = (durationValue: string) => {
    if (!durationValue || durationValue === '' || durationValue === 'undefined' || durationValue === 'null') {
      return 'Not set';
    }
    const option = durationOptions.find(d => d.value === durationValue);
    return option ? option.label : durationValue;
  };

  const statuses = ['All', 'APPROVED', 'PENDING', 'REJECTED', 'DRAFT'];

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    let cleanPath = imagePath;
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    return `${API_URL}/${cleanPath}`;
  };

  const getFirstImage = (images: string[]) => {
    if (!images || images.length === 0) return null;
    
    for (const img of images) {
      if (img && img.trim() !== '') {
        const url = getImageUrl(img);
        if (url) return url;
      }
    }
    return null;
  };

  // Handle page change - NO setState in effect
  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      setCurrentPage(page);
    }
  };

  // Handle search change - NO setState in effect
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle filter change - NO setState in effect
  const handleFilterChange = (type: 'category' | 'status', value: string) => {
    if (type === 'category') {
      setSelectedCategory(value);
    } else {
      setSelectedStatus(value);
    }
  };

  // Handle clear filters - NO setState in effect
  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedStatus('');
    setSearchQuery('');
    setCurrentPage(1);
    // Reset the flag and fetch
    shouldResetPageRef.current = false;
    setTimeout(() => fetchProducts(), 100);
  };

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
    <div className="space-y-6">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={clearNotification}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Products</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage your product inventory and listings</p>
          <p className="text-xs text-gray-400 mt-1">Total: {total} products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Product</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
          />
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => {
              showNotification('info', 'Refreshing products...');
              shouldResetPageRef.current = false;
              fetchProducts();
            }}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            >
              <option value="">All Categories</option>
              {categories.length > 0 ? (
                categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))
              ) : (
                <option value="" disabled>No categories available</option>
              )}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            >
              <option value="">All Statuses</option>
              {statuses.slice(1).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {products.length > 0 ? (
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => {
                  const imageUrl = getFirstImage(product.images);
                  const isDurationSet = product.durationTime && product.durationTime !== '' && product.durationTime !== 'undefined' && product.durationTime !== 'null';
                  const durationLabel = getDurationLabel(product.durationTime || '');
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3 whitespace-nowrap">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                            <ProductImage
                              src={imageUrl}
                              alt={product.name}
                              className="w-full h-full"
                            />
                          </div>
                          <div className="flex flex-col">
                            <p className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">{product.name}</p>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <span>SKU: {product.sku || 'N/A'}</span>
                              {product.subCategory && (
                                <span>• {product.subCategory.name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {product.category?.name || 'Uncategorized'}
                          </span>
                          {product.subCategory && (
                            <span className="text-xs text-gray-500 ml-1">
                              → {product.subCategory.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center whitespace-nowrap space-x-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(product.price)}
                          </span>
                          {product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price && (
                            <span className="text-xs text-green-600 font-medium">
                              (Disc: {formatCurrency(product.discountPrice)})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center whitespace-nowrap space-x-1">
                          <span className={`text-sm font-medium ${product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-yellow-600' : 'text-gray-900'}`}>
                            {product.stock || 0}
                          </span>
                          {product.stock < 10 && product.stock > 0 && (
                            <span className="text-xs text-yellow-600">(Low)</span>
                          )}
                          {product.stock === 0 && (
                            <span className="text-xs text-red-600">(Out of Stock)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center whitespace-nowrap">
                          {isDurationSet ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span>{durationLabel}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Not set</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-500 whitespace-nowrap">
                          {formatDateWithTime(product.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end space-x-1">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Product Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">No products found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
        
        {total > pageSize && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, total)} of {total}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(Math.min(currentPage + 1, pages))}
                disabled={currentPage >= pages}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;