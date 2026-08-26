// app/admin/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import {
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  Download,
  RefreshCw,
  Activity,
  BarChart3,
  Eye,
} from 'lucide-react';

// Define types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface OrderItem {
  product: {
    name: string;
  };
  quantity: number;
}

interface Order {
  id: string;
  user: {
    name: string;
    email: string;
  };
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
  paymentMethod: string;
}

interface WeeklySale {
  date: string;
  orders: number;
  revenue: number;
}

interface StatsData {
  stats: {
    revenue: number;
    products: number;
    orders: number;
    customers: number;
    pendingOrders: number;
    deliveredOrders: number;
  };
  recentOrders: Order[];
  weeklySales: WeeklySale[];
}

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
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

// Stats Card Component
const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-200">
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // FIXED: Use a ref to track initialization instead of state
  const hasInitializedRef = useRef(false);

  // Check authentication and get user data
  const getAuthenticatedUser = useCallback((): User | null => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    console.log('🔍 Checking auth - Token exists:', !!token);
    
    if (!token) {
      console.log('❌ No token found');
      return null;
    }

    if (!userData) {
      console.log('❌ No user data found');
      return null;
    }

    try {
      const parsedUser = JSON.parse(userData) as User;
      console.log('👤 User role:', parsedUser.role);
      
      if (parsedUser.role?.toUpperCase() !== 'ADMIN') {
        console.log('❌ Not an admin');
        return null;
      }
      
      return parsedUser;
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching dashboard data from API...');
      
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await api.get('/api/admin/dashboard');
      console.log('📊 API Response:', response.data);
      
      if (!isMountedRef.current) return;
      
      if (response.data && response.data.stats) {
        setData(response.data);
        setError(null);
      } else {
        setError('Invalid data format from API');
      }
    } catch (err: unknown) {
      console.error('❌ Fetch error:', err);
      if (!isMountedRef.current) return;
      
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ error: string }>;
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          console.log('❌ Unauthorized, redirecting to login...');
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
          window.location.replace('/auth/signin');
          return;
        }
        setError(axiosError.response?.data?.error || 'Failed to fetch dashboard data');
      } else {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // FIXED: Use a setTimeout to defer state updates outside the effect
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // Check authentication
    const authenticatedUser = getAuthenticatedUser();
    
    if (!authenticatedUser) {
      console.log('❌ Authentication failed, redirecting...');
      window.location.replace('/auth/signin');
      return;
    }

    // FIXED: Use setTimeout to move state updates out of the effect
    // This breaks the synchronous setState call in the effect
    setTimeout(() => {
      setUser(authenticatedUser);
      fetchDashboardData();
    }, 0);
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only runs once on mount

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DELIVERED: 'bg-green-100 text-green-700',
      COMPLETED: 'bg-green-100 text-green-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      PROCESSING: 'bg-blue-100 text-blue-700',
      SHIPPED: 'bg-blue-100 text-blue-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      DELIVERED: <CheckCircle className="w-4 h-4" />,
      COMPLETED: <CheckCircle className="w-4 h-4" />,
      PENDING: <Clock className="w-4 h-4" />,
      PROCESSING: <Activity className="w-4 h-4" />,
      SHIPPED: <Activity className="w-4 h-4" />,
      CANCELLED: <XCircle className="w-4 h-4" />,
    };
    return icons[status] || null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No data available</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const { stats, recentOrders, weeklySales } = data;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-500">Welcome back, {user?.name || 'Admin'}!</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            onClick={fetchDashboardData}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.revenue)}
        />
        <StatsCard
          title="Total Products"
          value={stats.products || 0}
        />
        <StatsCard
          title="Total Orders"
          value={stats.orders || 0}
        />
        <StatsCard
          title="Total Customers"
          value={stats.customers || 0}
        />
      </div>

      {/* Order Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Order Status</h3>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Delivered</span>
              </div>
              <span className="text-sm font-medium">{stats.deliveredOrders || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <span className="text-sm font-medium">{stats.pendingOrders || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Processing</span>
              </div>
              <span className="text-sm font-medium">
                {(stats.orders || 0) - (stats.deliveredOrders || 0) - (stats.pendingOrders || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Sales Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Weekly Sales</h3>
            <span className="text-xs text-gray-500">Last 7 days</span>
          </div>
          <div className="h-28 flex items-end space-x-2">
            {weeklySales && weeklySales.length > 0 ? (
              weeklySales.map((day, index) => {
                const maxRevenue = Math.max(...weeklySales.map((d) => d.revenue || 0));
                const heightPercentage =
                  maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                const dayLabel = new Date(day.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                });

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center space-y-1"
                  >
                    <div
                      className="w-full bg-green-600 rounded-t transition-all hover:bg-green-700"
                      style={{
                        height: `${Math.max(heightPercentage, 5)}%`,
                        minHeight: '8px',
                      }}
                    ></div>
                    <span className="text-xs text-gray-500">{dayLabel}</span>
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center text-gray-400 text-sm">
                No sales data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Recent Orders</h3>
            <p className="text-xs text-gray-500">Latest transactions from your store</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {recentOrders && recentOrders.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {order.user?.name || order.user?.email || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {order.items?.map((item) => item.product?.name).join(', ') || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status?.toLowerCase() || 'unknown'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No recent orders found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}