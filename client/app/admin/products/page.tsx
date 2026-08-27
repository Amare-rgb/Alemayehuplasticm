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
  EyeOff,
  Search,
  Filter,
  ChevronDown,
  Package,
  RefreshCw,
  XCircle,
  AlertCircle,
  CheckCircle,
  Info,
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
  const token = localStorage.getItem('token') || 
                sessionStorage.getItem('token') ||
                localStorage.getItem('authToken') ||
                sessionStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('token');
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
  status?: string;
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
  visibility: 'VISIBLE' | 'HIDDEN';
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
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
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
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedVisibility, setSelectedVisibility] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Bulk action states
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [allProductsVisible, setAllProductsVisible] = useState(false);
  const [selectedCategoryForBulk, setSelectedCategoryForBulk] = useState('');
  
  // Track if products in selected category are all visible
  const [categoryProductsVisible, setCategoryProductsVisible] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Refs for tracking
  const isMounted = useRef(true);
  const isInitialMount = useRef(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ type, message });
  };

  const clearNotification = () => {
    setNotification(null);
  };

  // Helper function to get token
  const getToken = () => {
    return localStorage.getItem('token') || 
           sessionStorage.getItem('token') ||
           localStorage.getItem('authToken') ||
           sessionStorage.getItem('authToken');
  };

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/api/categories/admin/all');
      let categoriesData = [];
      
      if (response.data && Array.isArray(response.data)) {
        categoriesData = response.data;
      }
      
      setCategories(categoriesData);
    } catch (err) {
      console.log('Categories fetch error:', err);
    }
  }, []);

  // Main fetch function
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      const token = getToken();
      if (!token) {
        showNotification('error', 'Authentication required. Please login again.');
        router.push('/auth/signin');
        return;
      }
      
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());
      
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedVisibility) params.append('visibility', selectedVisibility);
      
      const url = `/api/products/admin/all?${params.toString()}`;
      
      const response = await api.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!isMounted.current) return;
      
      if (response.data && response.data.products) {
        setProducts(response.data.products);
        setTotal(response.data.total || response.data.products.length);
        setPages(response.data.pages || 1);
        
        // Check if ALL products are visible
        const visibleCount = response.data.products.filter((p: Product) => p.visibility === 'VISIBLE').length;
        const allVisible = visibleCount === response.data.products.length;
        setAllProductsVisible(allVisible);
        
        // Update category products visibility after fetch
        if (selectedCategoryForBulk) {
          const categoryProducts = response.data.products.filter((p: Product) => p.category?.id === selectedCategoryForBulk);
          if (categoryProducts.length > 0) {
            const catAllVisible = categoryProducts.every((p: Product) => p.visibility === 'VISIBLE');
            setCategoryProductsVisible(catAllVisible);
          }
        }
      }
      
    } catch (err: unknown) {
      console.error('❌ Fetch error:', err);
      if (!isMounted.current) return;
      
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ error: string }>;
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          showNotification('error', 'Authentication failed. Please login again.');
          router.push('/auth/signin');
        } else {
          showNotification('error', axiosError.response?.data?.error || 'Failed to fetch products');
        }
      } else {
        showNotification('error', 'An unexpected error occurred');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [currentPage, pageSize, searchQuery, selectedCategory, selectedStatus, selectedVisibility, router, selectedCategoryForBulk]);

  // Initial load
  useEffect(() => {
    isMounted.current = true;
    
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchCategories().then(() => {
        fetchProducts();
      });
    }
    
    return () => {
      isMounted.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle search with debounce
  useEffect(() => {
    if (isInitialMount.current || !isMounted.current) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchProducts();
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Handle filter changes
  useEffect(() => {
    if (isInitialMount.current || !isMounted.current) return;
    setCurrentPage(1);
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedStatus, selectedVisibility]);

  // Handle page changes
  useEffect(() => {
    if (isInitialMount.current || !isMounted.current) return;
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Toggle ALL products visibility
  const handleToggleAllProducts = async () => {
    try {
      setIsBulkActionLoading(true);
      const token = getToken();
      if (!token) {
        showNotification('error', 'Authentication required');
        return;
      }

      // If all are visible, HIDE them. If not all are visible, SHOW them.
      const isHiding = allProductsVisible;
      const newVisibility = isHiding ? 'HIDDEN' : 'VISIBLE';
      
      const response = await api.post('/api/products/bulk-visibility', {
        visibility: newVisibility,
        scope: 'all'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Alert matches the ACTION performed
        if (isHiding) {
          showNotification('success', 'All products hidden successfully');
        } else {
          showNotification('success', 'All products shown successfully');
        }
        setAllProductsVisible(!allProductsVisible);
        await fetchProducts();
      }
    } catch (err) {
      console.error('Error toggling all products:', err);
      if (axios.isAxiosError(err)) {
        showNotification('error', err.response?.data?.error || 'Failed to update visibility');
      }
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  // Toggle products by category
  const handleToggleByCategory = async () => {
    if (!selectedCategoryForBulk) {
      showNotification('warning', 'Please select a category first');
      return;
    }

    try {
      setIsBulkActionLoading(true);
      const token = getToken();
      if (!token) {
        showNotification('error', 'Authentication required');
        return;
      }

      // If all in category are visible, HIDE them. If not, SHOW them.
      const isHiding = categoryProductsVisible;
      const newVisibility = isHiding ? 'HIDDEN' : 'VISIBLE';
      
      const response = await api.post('/api/products/bulk-visibility', {
        visibility: newVisibility,
        scope: 'category',
        categoryId: selectedCategoryForBulk
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Alert matches the ACTION performed
        if (isHiding) {
          showNotification('success', 'Products in category hidden successfully');
        } else {
          showNotification('success', 'Products in category shown successfully');
        }
        setCategoryProductsVisible(!categoryProductsVisible);
        await fetchProducts();
      }
    } catch (err) {
      console.error('Error toggling category products:', err);
      if (axios.isAxiosError(err)) {
        showNotification('error', err.response?.data?.error || 'Failed to update category visibility');
      }
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  // Toggle individual product visibility
  const handleToggleProductVisibility = async (product: Product) => {
    try {
      const token = getToken();
      if (!token) {
        showNotification('error', 'Authentication required');
        return;
      }

      // If visible, HIDE it. If hidden, SHOW it.
      const isHiding = product.visibility === 'VISIBLE';
      const newVisibility = isHiding ? 'HIDDEN' : 'VISIBLE';
      
      const response = await api.patch(`/api/products/${product.id}/visibility`, {
        visibility: newVisibility,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Alert matches the ACTION performed
        if (isHiding) {
          showNotification('success', `Product "${product.name}" hidden successfully`);
        } else {
          showNotification('success', `Product "${product.name}" shown successfully`);
        }
        await fetchProducts();
      }
    } catch (err) {
      console.error('Error toggling product visibility:', err);
      if (axios.isAxiosError(err)) {
        showNotification('error', err.response?.data?.error || 'Failed to update visibility');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const token = getToken();
      if (!token) {
        showNotification('error', 'Authentication required');
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
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      if (axios.isAxiosError(err)) {
        showNotification('error', err.response?.data?.error || 'Failed to delete product');
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

  const formatDate = (dateString: string) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
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
          <p className="text-xs text-gray-500 mt-0.5">Manage your product inventory and visibility</p>
          <p className="text-xs text-gray-400 mt-1">Total: {total} products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Visibility Controls Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Visibility Controls</h3>
          <span className="text-xs text-gray-500">Quick actions</span>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* 1. All Products Toggle:
              - When ALL products are HIDDEN → Red + Eye + "Show All" (action: SHOW)
              - When ALL products are VISIBLE → Green + EyeOff + "Hide All" (action: HIDE) */}
          <button
            onClick={handleToggleAllProducts}
            disabled={isBulkActionLoading}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              allProductsVisible
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200'
                : 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isBulkActionLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : allProductsVisible ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide All</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Show All</span>
              </>
            )}
          </button>

          {/* 2. By Category Toggle */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedCategoryForBulk}
              onChange={(e) => {
                setSelectedCategoryForBulk(e.target.value);
                setCategoryProductsVisible(true);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs min-w-[150px]"
            >
              <option value="">Select Category</option>
              {categories.filter(cat => !cat.parentId).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <button
              onClick={handleToggleByCategory}
              disabled={isBulkActionLoading || !selectedCategoryForBulk}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                categoryProductsVisible
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200'
                  : 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isBulkActionLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : categoryProductsVisible ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide Category</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Show Category</span>
                </>
              )}
            </button>
          </div>

          {/* 3. Individual Product Info */}
          <div className="text-xs text-gray-500 italic">
            Use <Eye className="w-3.5 h-3.5 inline text-purple-600" /> / <EyeOff className="w-3.5 h-3.5 inline text-purple-600" /> buttons in table below for individual products
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
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
            onClick={() => fetchProducts()}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              <option value="">All Categories</option>
              {categories.filter(cat => !cat.parentId).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Visibility</label>
            <select
              value={selectedVisibility}
              onChange={(e) => setSelectedVisibility(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              <option value="">All Visibility</option>
              <option value="VISIBLE">Visible</option>
              <option value="HIDDEN">Hidden</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedStatus('');
                setSelectedVisibility('');
                setSearchQuery('');
                setCurrentPage(1);
              }}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Visibility</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => {
                  const imageUrl = getFirstImage(product.images);
                  
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
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {product.category?.name || 'Uncategorized'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center whitespace-nowrap space-x-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(product.price)}
                          </span>
                          {product.discountPrice && product.discountPrice > 0 && (
                            <span className="text-xs text-emerald-600 font-medium">
                              (Disc: {formatCurrency(product.discountPrice)})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-yellow-600' : 'text-gray-900'}`}>
                          {product.stock || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                          product.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                          product.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      {/* Visibility column - icon matches the CURRENT state */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleProductVisibility(product)}
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                            product.visibility === 'VISIBLE' 
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={product.visibility === 'VISIBLE' ? 'Click to Hide' : 'Click to Show'}
                        >
                          {product.visibility === 'VISIBLE' ? (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              Visible
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Hidden
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(product.createdAt)}
                        </div>
                      </td>
                      {/* ✅ FIXED: Actions column - REMOVED Visibility Toggle, keeping only View, Edit, and Delete */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end space-x-1">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Product"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
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
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pages))}
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