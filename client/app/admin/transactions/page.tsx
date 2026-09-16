// app/admin/transactions/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import {
  CreditCard,
  Search,
  Filter,
  ChevronDown,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  Info,
  X,
  User,
  Mail,
  Phone,
  DollarSign,
  Wallet,
  Banknote,
  Building,
  Printer,
  Package,
  Smartphone,
  Truck,
} from 'lucide-react';

// ============================================================
// Axios instance
// ============================================================
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('authToken') ||
    localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

// ============================================================
// Types
// ============================================================
type OrderStatus = 'PENDING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

interface TransactionUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface TransactionItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    images: string[];
    slug: string;
    price: number;
  };
}

interface Transaction {
  id: string;
  orderNumber: number;
  userId: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentRef?: string;
  stripeSessionId?: string;
  createdAt: string;
  updatedAt: string;
  user: TransactionUser;
  items: TransactionItem[];
  address: {
    id: string;
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

// ============================================================
// Notification
// ============================================================
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
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
    >
      <div
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg max-w-md ${getColors()}`}
      >
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

// ============================================================
// Shared helpers
// ============================================================
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);

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

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    SHIPPED: 'Shipped',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    REJECTED: 'Rejected',
  };
  return labels[status] || status;
};

const getPaymentStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    PAID: 'Paid',
    FAILED: 'Failed',
    REFUNDED: 'Refunded',
  };
  return labels[status] || status;
};

const getPaymentMethodLabel = (method?: string) => {
  if (!method) return 'Not specified';
  const lower = method.toLowerCase();
  if (lower.includes('telebirr')) return 'Telebirr Mobile Money';
  if (lower.includes('bank')) return 'Commercial Bank Transfer';
  if (lower.includes('cash')) return 'Cash on Delivery';
  return method;
};

const getPaymentMethodIcon = (method?: string) => {
  if (!method) return <CreditCard className="w-4 h-4" />;
  const lower = method.toLowerCase();
  if (lower.includes('telebirr')) return <Smartphone className="w-4 h-4" />;
  if (lower.includes('bank')) return <Building className="w-4 h-4" />;
  if (lower.includes('cash')) return <Banknote className="w-4 h-4" />;
  if (lower.includes('card')) return <CreditCard className="w-4 h-4" />;
  if (lower.includes('paypal') || lower.includes('wallet'))
    return <Wallet className="w-4 h-4" />;
  return <CreditCard className="w-4 h-4" />;
};

const getStatusIcon = (status: string) => {
  const icons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="w-3.5 h-3.5" />,
    SHIPPED: <Truck className="w-3.5 h-3.5" />,
    COMPLETED: <CheckCircle className="w-3.5 h-3.5" />,
    CANCELLED: <XCircle className="w-3.5 h-3.5" />,
    REJECTED: <XCircle className="w-3.5 h-3.5" />,
  };
  return icons[status] || null;
};

// ============================================================
// Transaction Detail Modal
// ============================================================
interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Transaction Details
            </h2>
            <p className="text-xs text-gray-500">
              Order #{transaction.orderNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span>Customer Information</span>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{transaction.user.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{transaction.user.email}</span>
                </div>
                {transaction.user.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{transaction.user.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span>Payment Information</span>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(transaction.total)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Payment Status:</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${getPaymentStatusColor(
                      transaction.paymentStatus
                    )}`}
                  >
                    {getPaymentStatusLabel(transaction.paymentStatus)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Payment Method:</span>
                  <span className="flex items-center space-x-1.5 text-gray-700">
                    {getPaymentMethodIcon(transaction.paymentMethod)}
                    <span>{getPaymentMethodLabel(transaction.paymentMethod)}</span>
                  </span>
                </div>
                {transaction.paymentRef && (
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-gray-500 shrink-0">Reference:</span>
                    <span className="text-xs text-gray-600 font-mono break-all text-right">
                      {transaction.paymentRef}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order status */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <Package className="w-4 h-4 text-gray-500" />
              <span>Order Status</span>
            </h4>
            <div className="flex items-center space-x-4">
              <span
                className={`inline-flex items-center space-x-1.5 px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(
                  transaction.status
                )}`}
              >
                {getStatusIcon(transaction.status)}
                <span>{getStatusLabel(transaction.status)}</span>
              </span>
              <span className="text-sm text-gray-500">
                Updated: {formatDate(transaction.updatedAt)}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700">Order Items</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transaction.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.product.images && item.product.images.length > 0 ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={
                                  item.product.images[0].startsWith('http')
                                    ? item.product.images[0]
                                    : `${API_URL}${
                                        item.product.images[0].startsWith('/')
                                          ? item.product.images[0]
                                          : `/${item.product.images[0]}`
                                      }`
                                }
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    '/placeholder-image.png';
                                }}
                              />
                            ) : (
                              <Package className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              SKU: {item.productId.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-right text-sm font-medium text-gray-700"
                    >
                      Total:
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(transaction.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>Transaction Timeline</span>
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Created:</span>
                <span className="text-gray-700">
                  {formatDate(transaction.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Last Updated:</span>
                <span className="text-gray-700">
                  {formatDate(transaction.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Main page
// ============================================================
const TransactionsPage: React.FC = () => {
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Refs
  const isMounted = useRef(true);
  const hasFetchedInitial = useRef(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const firstFilterRun = useRef(true);
  const firstPageRun = useRef(true);
  const firstSearchRun = useRef(true);

  const showNotification = (
    type: 'success' | 'error' | 'info' | 'warning',
    message: string
  ) => setNotification({ type, message });

  const clearNotification = () => setNotification(null);

  const getToken = () =>
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('authToken') ||
    localStorage.getItem('token');

  // Fetch
  const fetchTransactions = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      try {
        if (!silent) setRefreshing(true);

        const token = getToken();
        if (!token) {
          showNotification('error', 'Authentication required. Please login again.');
          router.push('/auth/signin');
          return;
        }

        const params = new URLSearchParams();
        if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
        if (selectedPaymentStatus !== 'ALL')
          params.append('paymentStatus', selectedPaymentStatus);
        if (searchQuery) params.append('search', searchQuery);
        params.append('page', String(currentPage));
        params.append('limit', String(pageSize));

        const url = `/api/orders?${params.toString()}`;
        const response = await api.get(url);

        if (!isMounted.current) return;

        let list: Transaction[] = [];
        let count = 0;
        if (response.data?.orders) {
          list = response.data.orders;
          count = response.data.total ?? list.length;
        } else if (Array.isArray(response.data)) {
          list = response.data;
          count = list.length;
        }

        // Sort ascending by orderNumber for consistent display
        list = [...list].sort((a, b) => a.orderNumber - b.orderNumber);

        setTransactions(list);
        setTotal(count);
        setTotalPages(Math.ceil(count / pageSize));
      } catch (err: unknown) {
        if (!isMounted.current) return;
        if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError<{ error: string }>;
          if (
            axiosError.response?.status === 401 ||
            axiosError.response?.status === 403
          ) {
            showNotification('error', 'Authentication failed. Please login again.');
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            router.push('/auth/signin');
          } else {
            showNotification(
              'error',
              axiosError.response?.data?.error || 'Failed to fetch transactions'
            );
          }
        } else {
          showNotification(
            'error',
            err instanceof Error ? err.message : 'An unexpected error occurred'
          );
        }
      } finally {
        if (isMounted.current) {
          setRefreshing(false);
          setInitialLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      selectedStatus,
      selectedPaymentStatus,
      searchQuery,
      currentPage,
      pageSize,
      router,
    ]
  );

  // Initial fetch (once)
  useEffect(() => {
    isMounted.current = true;
    if (!hasFetchedInitial.current) {
      hasFetchedInitial.current = true;
      fetchTransactions();
    }
    return () => {
      isMounted.current = false;
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    if (firstSearchRun.current) {
      firstSearchRun.current = false;
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchTransactions({ silent: true });
    }, 500);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Filter changes
  useEffect(() => {
    if (firstFilterRun.current) {
      firstFilterRun.current = false;
      return;
    }
    setCurrentPage(1);
    fetchTransactions({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedPaymentStatus]);

  // Page changes
  useEffect(() => {
    if (firstPageRun.current) {
      firstPageRun.current = false;
      return;
    }
    fetchTransactions({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
  };

  const handlePaymentStatusChange = (value: string) => {
    setSelectedPaymentStatus(value);
  };

  const handleClearFilters = () => {
    setSelectedStatus('ALL');
    setSelectedPaymentStatus('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    showNotification('info', 'Refreshing transactions...');
    fetchTransactions();
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  // Filter option lists
  const orderStatuses = [
    'ALL',
    'PENDING',
    'SHIPPED',
    'COMPLETED',
    'CANCELLED',
    'REJECTED',
  ];
  const paymentStatuses = ['ALL', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'];

  // Derived stats
  const totalTransactions = transactions.length;
  const totalRevenue = transactions.reduce((s, t) => s + (t.total || 0), 0);
  const paidCount = transactions.filter((t) => t.paymentStatus === 'PAID').length;
  const pendingCount = transactions.filter(
    (t) => t.paymentStatus === 'PENDING'
  ).length;

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
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

      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Transactions</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage and track all payment transactions
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Total: {totalTransactions} transactions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Transactions</p>
          <p className="text-lg font-bold text-gray-900">{totalTransactions}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Revenue</p>
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Paid</p>
          <p className="text-lg font-bold text-green-600">{paidCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-lg font-bold text-yellow-600">{pendingCount}</p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number, customer name, or email..."
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
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                showFilters ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Order Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            >
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All Statuses' : getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Payment Status
            </label>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => handlePaymentStatusChange(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            >
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL'
                    ? 'All Payment Statuses'
                    : getPaymentStatusLabel(status)}
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden relative">
        {refreshing && (
          <div className="absolute inset-0 bg-white/40 flex items-start justify-center pt-6 pointer-events-none z-10">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-600 border-t-transparent" />
          </div>
        )}

        <div className="overflow-x-auto">
          {transactions.length > 0 ? (
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Order #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Payment Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Order Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Payment Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleViewTransaction(transaction)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        #{transaction.orderNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[120px]">
                          {transaction.user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(transaction.total)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(
                          transaction.paymentStatus
                        )}`}
                      >
                        {getPaymentStatusLabel(transaction.paymentStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {getStatusIcon(transaction.status)}
                        <span>{getStatusLabel(transaction.status)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1.5 text-sm text-gray-700">
                        {transaction.paymentMethod ? (
                          <>
                            {getPaymentMethodIcon(transaction.paymentMethod)}
                            <span>
                              {getPaymentMethodLabel(transaction.paymentMethod)}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Not specified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(transaction.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewTransaction(transaction);
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
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">No transactions found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>

        {total > pageSize && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, total)} of {total}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
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

export default TransactionsPage;