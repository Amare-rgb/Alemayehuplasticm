'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';  // Add this import
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  RefreshCw,
  Activity,
  BarChart3
} from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change: number;
  changeLabel: string;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, change, changeLabel, color }) => {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-center space-x-2 mt-4">
        <span className={`text-xs font-medium flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(change)}%
        </span>
        <span className="text-xs text-gray-500">{changeLabel}</span>
      </div>
    </div>
  );
};

interface Order {
  id: string;
  customer: string;
  products: string;
  total: number;
  status: 'completed' | 'pending' | 'processing' | 'cancelled';
  date: string;
  paymentMethod: string;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    revenue: { value: '$45,231.89', change: 12.5, label: 'vs last month' },
    products: { value: '1,234', change: 8.2, label: 'vs last month' },
    orders: { value: '56', change: -2.3, label: 'vs last month' },
    customers: { value: '8,549', change: 15.8, label: 'vs last month' },
  });

  const [recentOrders, setRecentOrders] = useState<Order[]>([
    {
      id: 'ORD-001',
      customer: 'John Doe',
      products: 'Organic Tomatoes x2',
      total: 45.50,
      status: 'completed',
      date: '2026-08-21',
      paymentMethod: 'Credit Card'
    },
    {
      id: 'ORD-002',
      customer: 'Jane Smith',
      products: 'Fresh Corn x5',
      total: 78.00,
      status: 'pending',
      date: '2026-08-21',
      paymentMethod: 'PayPal'
    },
    {
      id: 'ORD-003',
      customer: 'Robert Johnson',
      products: 'Organic Fertilizer x3',
      total: 120.00,
      status: 'processing',
      date: '2026-08-20',
      paymentMethod: 'Bank Transfer'
    },
    {
      id: 'ORD-004',
      customer: 'Maria Garcia',
      products: 'Fresh Produce Bundle',
      total: 230.50,
      status: 'completed',
      date: '2026-08-20',
      paymentMethod: 'Credit Card'
    },
    {
      id: 'ORD-005',
      customer: 'David Wilson',
      products: 'Farm Equipment',
      total: 450.00,
      status: 'cancelled',
      date: '2026-08-19',
      paymentMethod: 'PayPal'
    },
  ]);

  const [salesData, setSalesData] = useState([
    { label: 'Mon', revenue: 1200, orders: 12 },
    { label: 'Tue', revenue: 1800, orders: 18 },
    { label: 'Wed', revenue: 1500, orders: 15 },
    { label: 'Thu', revenue: 2200, orders: 22 },
    { label: 'Fri', revenue: 2800, orders: 28 },
    { label: 'Sat', revenue: 2000, orders: 20 },
    { label: 'Sun', revenue: 1600, orders: 16 },
  ]);

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      completed: <CheckCircle className="w-4 h-4" />,
      pending: <Clock className="w-4 h-4" />,
      processing: <Activity className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
    };
    return icons[status as keyof typeof icons] || null;
  };

  const maxRevenue = Math.max(...salesData.map(d => d.revenue));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back! Heres whats happening with your store today.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue"
          value={stats.revenue.value}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          change={stats.revenue.change}
          changeLabel={stats.revenue.label}
          color="bg-green-600"
        />
        <StatsCard
          title="Active Products"
          value={stats.products.value}
          icon={<Package className="w-6 h-6 text-white" />}
          change={stats.products.change}
          changeLabel={stats.products.label}
          color="bg-blue-600"
        />
        <StatsCard
          title="Pending Orders"
          value={stats.orders.value}
          icon={<ShoppingCart className="w-6 h-6 text-white" />}
          change={stats.orders.change}
          changeLabel={stats.orders.label}
          color="bg-yellow-600"
        />
        <StatsCard
          title="Total Customers"
          value={stats.customers.value}
          icon={<Users className="w-6 h-6 text-white" />}
          change={stats.customers.change}
          changeLabel={stats.customers.label}
          color="bg-purple-600"
        />
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-900">Weekly Sales Overview</h3>
            <p className="text-sm text-gray-500">Revenue and order volume for the past 7 days</p>
          </div>
          <div className="flex items-center space-x-4">
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500">
              <option>Last 7 days</option>
              <option>Last 14 days</option>
              <option>Last 30 days</option>
            </select>
            <button className="text-sm text-green-600 hover:text-green-700 font-medium">
              View Details →
            </button>
          </div>
        </div>
        <div className="h-64 flex items-end space-x-2">
          {salesData.map((day, index) => {
            const heightPercentage = (day.revenue / maxRevenue) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center space-y-2">
                <div className="w-full flex flex-col items-center space-y-1">
                  <div 
                    className="w-full bg-green-600 rounded-t-lg transition-all hover:bg-green-700"
                    style={{ height: `${heightPercentage}%`, minHeight: '20px' }}
                  >
                    <div className="opacity-0 hover:opacity-100 transition-opacity text-center text-white text-xs pt-1">
                      ${day.revenue}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between w-full px-1">
                  <span className="text-xs text-gray-500">{day.label}</span>
                </div>
              </div>
            );
          })}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{order.customer}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{order.products}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">${order.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{order.date}</td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      View
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
};

export default DashboardPage;