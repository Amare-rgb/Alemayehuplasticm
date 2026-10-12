// app/admin/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { Download, RefreshCw } from "lucide-react";

// ============================================================
// Types
// ============================================================
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
  orderNumber: number;
  user: {
    name: string;
    email: string;
  };
  items: OrderItem[];
  total: number;
  createdAt: string;
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
    completedOrders: number;
  };
  recentOrders: Order[];
  weeklySales: WeeklySale[];
}

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

// ============================================================
// Axios instance
// ============================================================
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("authToken") ||
    localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      if (typeof window !== "undefined") {
        // Full-page redirect to fully reset React state on auth failure.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/auth/signin";
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================
// Stats Card
// ============================================================
const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-200">
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

// ============================================================
// Main component
// ============================================================
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

  const hasInitializedRef = useRef(false);

  const getAuthenticatedUser = useCallback((): User | null => {
    const token =
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("authToken");
    const userData =
      localStorage.getItem("user") || sessionStorage.getItem("user");

    if (!token) return null;
    if (!userData) return null;

    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role?.toUpperCase() !== "ADMIN") return null;
      return parsedUser;
    } catch (e) {
      console.error("Error parsing user data:", e);
      return null;
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await api.get("/api/admin/dashboard");

      if (!isMountedRef.current) return;

      if (response.data && response.data.stats) {
        setData(response.data);
        setError(null);
      } else {
        setError("Invalid data format from API");
      }
    } catch (err: unknown) {
      if (!isMountedRef.current) return;

      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ error: string }>;
        if (
          axiosError.response?.status === 401 ||
          axiosError.response?.status === 403
        ) {
          localStorage.removeItem("authToken");
          sessionStorage.removeItem("authToken");
          router.replace("/auth/signin");
          return;
        }
        setError(
          axiosError.response?.data?.error || "Failed to fetch dashboard data"
        );
      } else {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const authenticatedUser = getAuthenticatedUser();
    if (!authenticatedUser) {
      router.replace("/auth/signin");
      return;
    }

    setTimeout(() => {
      setUser(authenticatedUser);
      fetchDashboardData();
    }, 0);
  }, [getAuthenticatedUser, fetchDashboardData, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
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
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
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
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
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
          <p className="text-xs text-gray-500">
            Welcome back, {user?.name || "Admin"}!
          </p>
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
            className="flex items-center space-x-2 px-3 py-1.5 text-xs text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Total Revenue" value={formatCurrency(stats.revenue)} />
        <StatsCard title="Total Products" value={stats.products || 0} />
        <StatsCard title="Total Orders" value={stats.orders || 0} />
        <StatsCard title="Total Customers" value={stats.customers || 0} />
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
              const maxRevenue = Math.max(
                ...weeklySales.map((d) => d.revenue || 0)
              );
              const heightPercentage =
                maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
              const dayLabel = new Date(day.date).toLocaleDateString("en-US", {
                weekday: "short",
              });

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center space-y-1"
                >
                  <div
                    className="w-full bg-yellow-500 rounded-t transition-all hover:bg-yellow-600"
                    style={{
                      height: `${Math.max(heightPercentage, 5)}%`,
                      minHeight: "8px",
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

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-sm">
            Recent Orders
          </h3>
          <p className="text-xs text-gray-500">
            Latest transactions from your store
          </p>
        </div>
        <div className="overflow-x-auto">
          {recentOrders && recentOrders.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
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
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      #{order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {order.user?.name || order.user?.email || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {order.items
                        ?.map((item) => item.product?.name)
                        .join(", ") || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
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