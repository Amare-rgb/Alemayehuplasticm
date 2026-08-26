// app/admin/orders/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import {
  ShoppingCart,
  Search,
  Filter,
  ChevronDown,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Package,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  MoreVertical,
  ArrowUpDown,
  AlertCircle,
  Info,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Banknote,
  Wallet,
  Building,
  Home
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

// Add token to requests - FIXED: Use 'authToken' instead of 'token'
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

// Types
interface Address {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

interface Product {
  id: string;
  name: string;
  images: string[];
  slug: string;
  price: number;
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Order {
  id: string;
  userId: string;
  addressId: string;
  total: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  address: Address;
  items: OrderItem[];
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

// Order Detail Modal
interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, isOpen, onClose, onStatusUpdate }) => {
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ type, message });
  };

  const clearNotification = () => {
    setNotification(null);
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      PROCESSING: 'bg-blue-100 text-blue-700 border-blue-200',
      SHIPPED: 'bg-purple-100 text-purple-700 border-purple-200',
      COMPLETED: 'bg-green-100 text-green-700 border-green-200',
      CANCELLED: 'bg-red-100 text-red-700 border-red-200',
      REJECTED: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      PAID: 'bg-green-100 text-green-700',
      FAILED: 'bg-red-100 text-red-700',
      REFUNDED: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPaymentMethodIcon = (method?: string) => {
    if (!method) return <CreditCard className="w-4 h-4" />;
    const lower = method.toLowerCase();
    if (lower.includes('card') || lower.includes('credit')) return <CreditCard className="w-4 h-4" />;
    if (lower.includes('paypal')) return <Wallet className="w-4 h-4" />;
    if (lower.includes('bank') || lower.includes('transfer')) return <Building className="w-4 h-4" />;
    if (lower.includes('cash')) return <Banknote className="w-4 h-4" />;
    return <CreditCard className="w-4 h-4" />;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pending',
      PROCESSING: 'Processing',
      SHIPPED: 'Shipped',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      REJECTED: 'Rejected',
    };
    return labels[status] || status;
  };

  const getStatusOptions = () => {
    if (!order) return [];
    const allStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REJECTED'];
    return allStatuses;
  };

  const handleStatusUpdate = async () => {
    if (!order || !selectedStatus) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        showNotification('error', 'Authentication required');
        setUpdating(false);
        return;
      }

      const response = await api.patch(
        '/api/orders',
        {
          orderId: order.id,
          status: selectedStatus,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        showNotification('success', `Order status updated to ${getStatusLabel(selectedStatus)}`);
        onStatusUpdate();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        showNotification('error', response.data.error || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order:', err);
      if (axios.isAxiosError(err)) {
        showNotification('error', err.response?.data?.error || 'Failed to update order status');
      } else {
        showNotification('error', 'An unexpected error occurred');
      }
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg max-w-md ${
            notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {notification.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
            {notification.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
            {notification.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
            <p className="text-sm font-medium flex-1">{notification.message}</p>
            <button onClick={clearNotification} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
            <p className="text-xs text-gray-500">Order #{order.id.slice(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Update Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="ml-2 px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="">Select Status</option>
                  {getStatusOptions().map(status => (
                    <option key={status} value={status}>{getStatusLabel(status)}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleStatusUpdate}
                disabled={!selectedStatus || updating}
                className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
              <div className="ml-auto flex items-center space-x-2">
                <span className="text-sm text-gray-500">Current Status:</span>
                <span className={`inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                  <span>{getStatusLabel(order.status)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span>Customer Information</span>
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{order.user.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{order.user.email}</span>
                </div>
                {order.user.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{order.user.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>Shipping Address</span>
              </h3>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{order.address.fullName}</p>
                <p className="text-gray-600">{order.address.street}</p>
                <p className="text-gray-600">
                  {order.address.city}, {order.address.state} {order.address.zip}
                </p>
                <p className="text-gray-600">{order.address.country}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{order.address.phone}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <Package className="w-4 h-4 text-gray-500" />
                <span>Order Summary</span>
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Total:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(order.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Items:</span>
                  <span className="text-gray-700">{order.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Date:</span>
                  <span className="text-gray-700">{formatDate(order.createdAt)}</span>
                </div>
                {order.notes && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Notes:</span>
                    <span className="text-gray-700">{order.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span>Payment Information</span>
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Payment Method:</span>
                  <span className="flex items-center space-x-1 text-gray-700">
                    {getPaymentMethodIcon(order.paymentMethod)}
                    <span>{order.paymentMethod || 'Not specified'}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Payment Status:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Order Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.product.images && item.product.images.length > 0 ? (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                }}
                              />
                            ) : (
                              <Package className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                            <p className="text-xs text-gray-500">SKU: {item.productId.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      Total:
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrdersPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const isMounted = useRef(true);
  const isInitialMount = useRef(true);

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ type, message });
  };

  const clearNotification = () => {
    setNotification(null);
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      PROCESSING: 'bg-blue-100 text-blue-700 border-blue-200',
      SHIPPED: 'bg-purple-100 text-purple-700 border-purple-200',
      COMPLETED: 'bg-green-100 text-green-700 border-green-200',
      CANCELLED: 'bg-red-100 text-red-700 border-red-200',
      REJECTED: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      COMPLETED: <CheckCircle className="w-3.5 h-3.5" />,
      PENDING: <Clock className="w-3.5 h-3.5" />,
      PROCESSING: <Package className="w-3.5 h-3.5" />,
      SHIPPED: <Truck className="w-3.5 h-3.5" />,
      CANCELLED: <XCircle className="w-3.5 h-3.5" />,
      REJECTED: <XCircle className="w-3.5 h-3.5" />,
    };
    return icons[status] || null;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pending',
      PROCESSING: 'Processing',
      SHIPPED: 'Shipped',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      REJECTED: 'Rejected',
    };
    return labels[status] || status;
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      PAID: 'bg-green-100 text-green-700',
      FAILED: 'bg-red-100 text-red-700',
      REFUNDED: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const statuses = ['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REJECTED'];

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        showNotification('error', 'Authentication required. Please login again.');
        router.push('/auth/signin');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      
      const url = `/api/orders?${params.toString()}`;
      
      const response = await api.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!isMounted.current) return;

      console.log('📊 Orders loaded:', response.data);
      
      let ordersData = response.data;
      if (response.data && response.data.orders) {
        ordersData = response.data.orders;
      }
      
      if (Array.isArray(ordersData)) {
        setOrders(ordersData);
        setTotal(ordersData.length);
        setTotalPages(Math.ceil(ordersData.length / pageSize));
      } else {
        setOrders([]);
        setTotal(0);
        setTotalPages(0);
      }
      
    } catch (err: unknown) {
      console.error('❌ Fetch error:', err);
      if (!isMounted.current) return;
      
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ error: string }>;
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          showNotification('error', 'Authentication failed. Please login again.');
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
          router.push('/auth/signin');
        } else {
          showNotification('error', axiosError.response?.data?.error || 'Failed to fetch orders');
        }
      } else {
        showNotification('error', err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [selectedStatus, pageSize, router]);

  // ✅ FIXED: Initial load - only runs once
  useEffect(() => {
    isMounted.current = true;
    
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchOrders();
    }
    
    return () => {
      isMounted.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only runs once

  // ✅ FIXED: Status changes - uses a ref to track initialization
  useEffect(() => {
    // Skip on initial mount to avoid double fetch
    if (isInitialMount.current) return;
    
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  // Handle search change - NO setState in effect
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Handle status filter change - NO setState in effect
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  // Handle clear filters - NO setState in effect
  const handleClearFilters = () => {
    setSelectedStatus('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Handle refresh
  const handleRefresh = () => {
    showNotification('info', 'Refreshing orders...');
    fetchOrders();
  };

  // Filter orders based on search
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.user.phone && order.user.phone.includes(searchQuery));
    
    return matchesSearch;
  });

  // Paginated orders
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalFiltered = filteredOrders.length;

  // Stats
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const processingOrders = orders.filter(o => o.status === 'PROCESSING').length;
  const shippedOrders = orders.filter(o => o.status === 'SHIPPED').length;
  const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
  const cancelledOrders = orders.filter(o => o.status === 'CANCELLED' || o.status === 'REJECTED').length;

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
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

      <OrderDetailModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStatusUpdate={fetchOrders}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Orders</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage and track all customer orders</p>
          <p className="text-xs text-gray-400 mt-1">Total: {totalOrders} orders</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-lg font-bold text-gray-900">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Revenue</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-lg font-bold text-yellow-600">{pendingOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Processing</p>
          <p className="text-lg font-bold text-blue-600">{processingOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Shipped</p>
          <p className="text-lg font-bold text-purple-600">{shippedOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="text-lg font-bold text-green-600">{completedOrders}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders by ID, customer, email, or phone..."
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
        </div>
      </div>

      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All Statuses' : getStatusLabel(status)}
                </option>
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
          {paginatedOrders.length > 0 ? (
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleViewOrder(order)}>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">#{order.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.user.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{order.user.email}</span>
                        </div>
                        {order.user.phone && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span>{order.user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span>{getStatusLabel(order.status)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                        {order.paymentMethod && (
                          <div className="text-xs text-gray-500">{order.paymentMethod}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOrder(order);
                        }}
                        className="inline-flex items-center space-x-1 text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">No orders found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
        
        {totalFiltered > pageSize && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalFiltered)} of {totalFiltered}
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
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalFiltered / pageSize)))}
                disabled={currentPage >= Math.ceil(totalFiltered / pageSize)}
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

export default OrdersPage;