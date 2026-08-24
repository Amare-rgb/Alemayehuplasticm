// app/admin/products/[id]/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios, { AxiosError } from 'axios';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  DollarSign,
  Tag,
  Calendar,
  User,
  ShoppingBag,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  X,
  Eye,
  Clock,
  Truck,
  Star
} from 'lucide-react';

// Create axios instance
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
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface Product {
  id: string;
  name: string;
  description: string;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  subCategory?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  price: number;
  discountPrice?: number;
  stock: number;
  sku: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT';
  images: string[];
  tags: string[];
  condition: 'NEW' | 'USED' | 'REFURBISHED';
  brand?: string;
  weight?: number;
  unitOfMeasurement?: string;
  seller: {
    shopName: string;
    isVerified: boolean;
  } | null;
  reviews: Array<{ rating: number; comment: string; user: { name: string } }>;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface DetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Notification Component
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

const ProductDetailPage: React.FC<DetailPageProps> = ({ params }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  const [productId, setProductId] = useState<string | null>(null);

  // Use refs to track state
  const hasSetProductId = useRef(false);
  const hasFetchedProduct = useRef(false);

  // Unwrap params for Next.js 15
  const unwrappedParams = React.use(params);

  // Set productId from unwrapped params - FIXED
  useEffect(() => {
    if (unwrappedParams && unwrappedParams.id && !hasSetProductId.current) {
      hasSetProductId.current = true;
      setProductId(unwrappedParams.id);
    }
  }, [unwrappedParams]);

  // Show notification helper
  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ type, message });
  };

  // Clear notification
  const clearNotification = () => {
    setNotification(null);
  };

  // Helper function to get image URL
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it starts with /uploads/, prepend the API URL
    if (imagePath.startsWith('/uploads/')) {
      return `${API_URL}${imagePath}`;
    }
    
    // If it starts with uploads/ (no leading slash), add slash and prepend API URL
    if (imagePath.startsWith('uploads/')) {
      return `${API_URL}/${imagePath}`;
    }
    
    // Otherwise, assume it's a relative path from uploads
    return `${API_URL}/uploads/products/${imagePath}`;
  };

  // Fetch product - wrapped in useCallback
  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Authentication required. Please login again.');
        router.push('/auth/signin');
        return;
      }

      const response = await api.get(`/api/products/${productId}`);
      
      let productData = response.data;
      if (response.data && response.data.product) {
        productData = response.data.product;
      } else if (response.data && response.data.data) {
        productData = response.data.data;
      }

      if (productData) {
        console.log('📸 Product images:', productData.images);
        setProduct(productData);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          setError('Product not found');
        } else if (err.response?.status === 401) {
          showNotification('error', 'Authentication failed. Please login again.');
          router.push('/auth/signin');
        } else {
          setError(err.response?.data?.error || 'Failed to load product');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  // Fetch product when productId changes - FIXED: Use a flag to prevent cascading renders
  useEffect(() => {
    if (productId && !hasFetchedProduct.current) {
      hasFetchedProduct.current = true;
      fetchProduct();
    }
  }, [productId, fetchProduct]);

  const handleDelete = async () => {
    if (!productId) return;
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Authentication required. Please login again.');
        router.push('/auth/signin');
        return;
      }
      
      const response = await api.delete(`/api/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        showNotification('success', 'Product deleted successfully!');
        setTimeout(() => {
          router.push('/admin/products');
        }, 1500);
      } else {
        showNotification('error', response.data.error || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          showNotification('error', 'Authentication failed. Please login again.');
          localStorage.removeItem('token');
          router.push('/auth/signin');
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-700 border-green-200',
      PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      REJECTED: 'bg-red-100 text-red-700 border-red-200',
      DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      APPROVED: <CheckCircle className="w-5 h-5 text-green-500" />,
      PENDING: <Clock className="w-5 h-5 text-yellow-500" />,
      REJECTED: <XCircle className="w-5 h-5 text-red-500" />,
      DRAFT: <Package className="w-5 h-5 text-gray-500" />,
    };
    return icons[status] || <Package className="w-5 h-5 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 font-medium">{error || 'Product not found'}</p>
          </div>
          <Link
            href="/admin/products"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={clearNotification}
        />
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/products"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{product.name}</h1>
            <p className="text-xs text-gray-500 mt-0.5">Product ID: #{product.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Product Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Badge */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${getStatusColor(product.status)}`}>
                {getStatusIcon(product.status)}
                <span className="text-sm font-medium">{product.status}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Created: {formatDate(product.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Product Images</h3>
            {product.images && product.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {product.images.map((img, index) => {
                  const imageUrl = getImageUrl(img);
                  
                  return (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group">
                      {imageUrl ? (
                        <img 
                          src={imageUrl}
                          alt={`${product.name} - ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('❌ Image failed to load:', imageUrl);
                            const target = e.target as HTMLImageElement;
                            if (img.startsWith('/uploads/')) {
                              const altUrl = `${API_URL}${img.substring(1)}`;
                              target.src = altUrl;
                            } else {
                              target.src = '/placeholder-image.png';
                            }
                          }}
                          onLoad={() => {
                            console.log('✅ Image loaded successfully:', imageUrl);
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded-full">
                        {index + 1}/{product.images.length}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">No images available</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">Description</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{product.description}</p>
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Product Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">SKU:</span>
                <span className="text-sm font-medium text-gray-900">{product.sku || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Condition:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{product.condition?.toLowerCase()}</span>
              </div>
              {product.brand && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Brand:</span>
                  <span className="text-sm font-medium text-gray-900">{product.brand}</span>
                </div>
              )}
              {product.weight && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Weight:</span>
                  <span className="text-sm font-medium text-gray-900">{product.weight} {product.unitOfMeasurement || 'kg'}</span>
                </div>
              )}
              {product.tags && product.tags.length > 0 && (
                <div className="col-span-2 flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {product.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Pricing</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Original Price</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(product.price)}</span>
              </div>
              {product.discountPrice && product.discountPrice < product.price && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Discounted Price</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(product.discountPrice)}</span>
                </div>
              )}
              {product.discountPrice && product.discountPrice < product.price && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-600">You Save</span>
                  <span className="text-green-600 font-medium">{formatCurrency(product.price - product.discountPrice)}</span>
                </div>
              )}
              {product.discountPrice && product.discountPrice >= product.price && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-500">Invalid discount price</span>
                  <span className="text-sm text-red-500 line-through">{formatCurrency(product.discountPrice)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stock Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Inventory</h3>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Stock Available</span>
              <span className={`text-lg font-bold ${product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-yellow-600' : 'text-gray-900'}`}>
                {product.stock || 0}
              </span>
            </div>
            {product.stock === 0 && (
              <p className="text-xs text-red-500 mt-2">Out of Stock</p>
            )}
            {product.stock < 10 && product.stock > 0 && (
              <p className="text-xs text-yellow-500 mt-2">Low Stock</p>
            )}
          </div>

          {/* Seller Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Seller Information</h3>
            {product.seller ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{product.seller.shopName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">
                    {product.seller.isVerified ? 'Verified Seller' : 'Unverified Seller'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No seller information available</p>
            )}
          </div>

          {/* Reviews Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Reviews</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-gray-900">{product.averageRating?.toFixed(1) || '0'}</span>
                <span className="text-sm text-gray-500 ml-1">/ 5</span>
              </div>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.round(product.averageRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">({product.reviewCount || 0} reviews)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;