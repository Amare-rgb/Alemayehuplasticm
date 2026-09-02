// app/admin/users/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import {
  Users,
  Search,
  Filter,
  ChevronDown,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Info,
  X,
  User,
  Calendar,
  
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

// Types
interface UserCount {
  orders: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'ADMIN' | 'SELLER' | 'CUSTOMER' | 'USER';
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  _count: UserCount;
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
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
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
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
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

// Helper function to get token
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || 
         sessionStorage.getItem('token') ||
         localStorage.getItem('authToken') || 
         sessionStorage.getItem('authToken');
};

// User Detail Modal
interface UserDetailModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, isOpen, onClose }) => {
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

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
      SELLER: 'bg-blue-100 text-blue-700 border-blue-200',
      CUSTOMER: 'bg-gray-100 text-gray-700 border-gray-200',
      USER: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, React.ReactNode> = {
      ADMIN: <ShieldCheck className="w-4 h-4" />,
      SELLER: <Shield className="w-4 h-4" />,
      CUSTOMER: <ShieldAlert className="w-4 h-4" />,
      USER: <ShieldAlert className="w-4 h-4" />,
    };
    return icons[role] || null;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Admin',
      SELLER: 'Seller',
      CUSTOMER: 'Customer',
      USER: 'User',
    };
    return labels[role] || role;
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">User Details</h2>
            <p className="text-xs text-gray-500">View user information</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Mail className="w-4 h-4" />
                <span>{user.email || 'No email'}</span>
              </div>
              {user.phone && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
              )}
              {!user.phone && (
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>No phone number</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span>Account Details</span>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">User ID:</span>
                  <span className="text-gray-700 font-mono">{user.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Role:</span>
                  <span className={`inline-flex items-center space-x-1 px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleColor(user.role)}`}>
                    {getRoleIcon(user.role)}
                    <span>{getRoleLabel(user.role)}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Avatar:</span>
                  <span className="text-gray-700">{user.avatar ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Activity</span>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Joined:</span>
                  <span className="text-gray-700">{formatDate(user.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated:</span>
                  <span className="text-gray-700">{formatDate(user.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Orders:</span>
                  <span className="text-gray-700">{user._count?.orders || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UsersPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const isMounted = useRef(true);
  const isInitialMount = useRef(true);

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ type, message });
  };

  const clearNotification = () => {
    setNotification(null);
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

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
      SELLER: 'bg-blue-100 text-blue-700 border-blue-200',
      CUSTOMER: 'bg-gray-100 text-gray-700 border-gray-200',
      USER: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, React.ReactNode> = {
      ADMIN: <ShieldCheck className="w-4 h-4" />,
      SELLER: <Shield className="w-4 h-4" />,
      CUSTOMER: <ShieldAlert className="w-4 h-4" />,
      USER: <ShieldAlert className="w-4 h-4" />,
    };
    return icons[role] || null;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Admin',
      SELLER: 'Seller',
      CUSTOMER: 'Customer',
      USER: 'User',
    };
    return labels[role] || role;
  };

  const roles = ['ALL', 'ADMIN', 'SELLER', 'CUSTOMER', 'USER'];

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      const token = getToken();
      if (!token) {
        showNotification('error', 'Authentication required. Please login again.');
        router.push('/auth/signin');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (selectedRole !== 'ALL') params.append('role', selectedRole);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());
      
      const url = `/api/users?${params.toString()}`;
      
      console.log('📡 Fetching users from:', url);
      
      const response = await api.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!isMounted.current) return;

      console.log('📊 Users response:', response.data);
      
      let usersData: User[] = [];
      let totalCount = 0;
      
      if (response.data && response.data.users) {
        usersData = response.data.users;
        totalCount = response.data.total || usersData.length;
      } else if (Array.isArray(response.data)) {
        usersData = response.data;
        totalCount = usersData.length;
      }
      
      setUsers(usersData);
      setTotal(totalCount);
      setTotalPages(Math.ceil(totalCount / pageSize));
      
    } catch (err: unknown) {
      console.error('❌ Fetch error:', err);
      if (!isMounted.current) return;
      
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ error: string }>;
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          showNotification('error', 'Authentication failed. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('authToken');
          router.push('/auth/signin');
        } else {
          showNotification('error', axiosError.response?.data?.error || 'Failed to fetch users');
        }
      } else {
        showNotification('error', err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [selectedRole, searchQuery, currentPage, pageSize, router]);

  // Initial load
  useEffect(() => {
    isMounted.current = true;
    
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchUsers();
    }
    
    return () => {
      isMounted.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle role and search changes
  useEffect(() => {
    if (isInitialMount.current) return;
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole, searchQuery, currentPage]);

  // Handler functions
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedRole('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    showNotification('info', 'Refreshing users...');
    fetchUsers();
  };

  // Stats
  const totalUsers = users.length;

  // Handle user click to view details
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // Handle delete user
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) return;
    
    try {
      const token = getToken();
      if (!token) {
        showNotification('error', 'Authentication required');
        return;
      }

      const response = await api.delete(`/api/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        showNotification('success', `User "${name}" deleted successfully`);
        await fetchUsers();
      } else {
        showNotification('error', response.data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      if (axios.isAxiosError(err)) {
        showNotification('error', err.response?.data?.error || 'Failed to delete user');
      } else {
        showNotification('error', 'An unexpected error occurred');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
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

      <UserDetailModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Users</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage users, farmers, and sellers</p>
          <p className="text-xs text-gray-400 mt-1">Total: {totalUsers} users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Users</p>
          <p className="text-lg font-bold text-gray-900">{totalUsers}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchQuery}
            onChange={handleSearchChange}
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
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              {roles.map(role => (
                <option key={role} value={role}>
                  {role === 'ALL' ? 'All Roles' : getRoleLabel(role)}
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
          {users.length > 0 ? (
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Orders</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleViewUser(user)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold text-sm flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">{user.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {user.phone ? (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span>{user.phone}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No phone</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-full border ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span>{getRoleLabel(user.role)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{user._count?.orders || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewUser(user);
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View User Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(user.id, user.name);
                          }}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">No users found</p>
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
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

export default UsersPage;