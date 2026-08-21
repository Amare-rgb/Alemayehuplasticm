// app/admin/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
  Activity,
  BarChart3,
  Eye,
} from 'lucide-react';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Define interfaces
interface StatsData {
  stats: {
    revenue: number;
    products: number;
    orders: number;
    customers: number;
    pendingOrders: number;
    completedOrders: number;
  };
  recentOrders: Array<{
    id: string;
    user: {
      name: string;
      email: string;
    };
    items: Array<{
      product: {
        name: string;
      };
      quantity: number;
    }>;
    total: number;
    status: string;
    createdAt: string;
    paymentMethod: string;
  }>;
  weeklySales: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  changeLabel?: string;
  color: string;
  subtitle?: string;
}

// Stats Card Component
const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  change,
  changeLabel,
  color,
  subtitle,
}) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      </div>
      {change !== undefined && changeLabel && (
        <div className="flex items-center space-x-2 mt-4">
          <span
            className={`text-xs font-medium flex items-center ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {Math.abs(change)}%
          </span>
          <span className="text-xs text-gray-500">{changeLabel}</span>
        </div>
      )}
    </div>
  );
};

export default function DashboardPage() {
  const { user, status } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Tracks whether the component is still mounted so we don't setState
  // after unmount from an in-flight request.
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Define fetchDashboardData with useCallback
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/dashboard');
      if (!isMountedRef.current) return;
      setData(response.data);
      setError(null);
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      
      // Type guard to check if err is an AxiosError
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ error: string }>;
        setError(axiosError.response?.data?.error || 'Failed to fetch dashboard data');
        
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          router.push('/auth/signin');
        }
      } else {
        // Handle non-Axios errors
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [router]);

  // Handle authentication and data fetching
  useEffect(() => {
    let isMounted = true;

    // Authentication check
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (user && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Data fetching with setTimeout to avoid synchronous setState
    const timer = setTimeout(() => {
      if (isMounted && status === 'authenticated') {
        fetchDashboardData();
      }
    }, 0);

    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [user, status, router, fetchDashboardData]);

  const getStatusColor = (status: string) => {
    const colors = {
      COMPLETED: 'bg-green-100 text-green-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      PROCESSING: 'bg-blue-100 text-blue-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      COMPLETED: <CheckCircle className="w-4 h-4" />,
      PENDING: <Clock className="w-4 h-4" />,
      PROCESSING: <Activity className="w-4 h-4" />,
      CANCELLED: <XCircle className="w-4 h-4" />,
    };
    return icons[status as keyof typeof icons] || null;
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
      currency: 'USD',
    }).format(amount);
  };

  // Show loading state
  if (status === 'loading' || loading) {
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

  if (!data) return null;

  const { stats, recentOrders, weeklySales } = data;

  // Calculate changes (in a real app, you'd compare with previous period)
  const changes = {
    revenue: 12.5,
    products: 8.2,
    orders: -2.3,
    customers: 15.8,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back! Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={fetchDashboardData}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.revenue)}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          change={changes.revenue}
          changeLabel="vs last month"
          color="bg-green-600"
        />
        <StatsCard
          title="Total Products"
          value={stats.products}
          icon={<Package className="w-6 h-6 text-white" />}
          change={changes.products}
          changeLabel="vs last month"
          color="bg-blue-600"
        />
        <StatsCard
          title="Total Orders"
          value={stats.orders}
          icon={<ShoppingCart className="w-6 h-6 text-white" />}
          change={changes.orders}
          changeLabel="vs last month"
          color="bg-yellow-600"
        />
        <StatsCard
          title="Total Customers"
          value={stats.customers}
          icon={<Users className="w-6 h-6 text-white" />}
          change={changes.customers}
          changeLabel="vs last month"
          color="bg-purple-600"
        />
      </div>

      {/* Order Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Order Status</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <span className="text-sm font-medium">{stats.completedOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <span className="text-sm font-medium">{stats.pendingOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Processing</span>
              </div>
              <span className="text-sm font-medium">
                {stats.orders - stats.completedOrders - stats.pendingOrders}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Sales Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Weekly Sales</h3>
            <span className="text-xs text-gray-500">Last 7 days</span>
          </div>
          <div className="h-32 flex items-end space-x-2">
            {weeklySales.map((day, index) => {
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
                      minHeight: '10px',
                    }}
                  ></div>
                  <span className="text-xs text-gray-500">{dayLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Recent Orders</h3>
            <p className="text-sm text-gray-500">Latest transactions from your store</p>
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
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {order.user.name || order.user.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {order.items.map((item) => item.product.name).join(', ')}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status.toLowerCase()}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4">
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
        </div>
      </div>
    </div>
  );
}