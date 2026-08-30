// lib/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = 
      localStorage.getItem('authToken') || 
      sessionStorage.getItem('authToken') ||
      localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('token');
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

export interface Address {
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

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  stock: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: string;
}

export interface Order {
  id: string;
  userId: string;
  addressId: string;
  total: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string;
  paymentRef?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  address: Address;
  items: OrderItem[];
}

export interface PaginatedOrdersResponse {
  orders: Order[];
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export interface CreateOrderPayload {
  addressId?: string;
  paymentMethod?: string;
  paymentRef?: string;
  paymentStatus?: string;
  notes?: string;
}

export interface CheckoutItem {
  productId: string;
  name?: string;
  price: number;
  quantity: number;
  image?: string | null;
}

export interface CheckoutPayload {
  addressId?: string;
  paymentMethod?: string;
  notes?: string;
  guestInfo?: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city?: string;
  };
  items?: CheckoutItem[];
}

export interface CheckoutSummaryItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  stock: number;
}

export interface CheckoutSummaryData {
  addresses: Address[];
  items?: CheckoutSummaryItem[];
  subtotal?: number;
  tax?: number;
  taxRate?: number;
  total?: number;
  paymentMethods?: string[];
  cartEmpty?: boolean;
}

export interface CheckoutSummaryResponse {
  success: boolean;
  data?: CheckoutSummaryData;
}

export interface CreateCheckoutResponse {
  success: boolean;
  message: string;
  data: {
    order: Order;
    items?: CheckoutSummaryItem[];
    isGuest?: boolean;
  };
}

export interface GetOrderResponse {
  success: boolean;
  data: Order;
}

// ============================================================
// API Functions
// ============================================================

export const ordersApi = {
  // Get orders with pagination
  getOrders: async (params?: {
    status?: string;
    paymentStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedOrdersResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') queryParams.append('status', params.status);
    if (params?.paymentStatus && params.paymentStatus !== 'ALL') queryParams.append('paymentStatus', params.paymentStatus);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `/api/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<PaginatedOrdersResponse>(url);
    return response.data;
  },

  getOrder: async (orderId: string): Promise<Order> => {
    const response = await api.get<Order>(`/api/orders/${orderId}`);
    return response.data;
  },

  createOrder: async (data: CreateOrderPayload): Promise<{ success: boolean; order: Order; message: string }> => {
    const response = await api.post<{ success: boolean; order: Order; message: string }>(
      '/api/orders',
      data
    );
    return response.data;
  },

  updateOrder: async (data: { orderId: string; status?: string; paymentStatus?: string; notes?: string }): Promise<{ success: boolean; order: Order; message: string }> => {
    const response = await api.patch<{ success: boolean; order: Order; message: string }>(
      '/api/orders',
      data
    );
    return response.data;
  },

  cancelOrder: async (orderId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(
      `/api/orders/${orderId}`
    );
    return response.data;
  },
};

export const checkoutApi = {
  createCheckout: async (data: CheckoutPayload): Promise<CreateCheckoutResponse> => {
    const response = await api.post<CreateCheckoutResponse>(
      '/api/checkout',
      data
    );
    return response.data;
  },

  getSummary: async (): Promise<CheckoutSummaryResponse> => {
    const response = await api.get<CheckoutSummaryResponse>('/api/checkout/summary');
    return response.data;
  },

  getOrder: async (orderId: string): Promise<GetOrderResponse> => {
    const response = await api.get<GetOrderResponse>(`/api/checkout/order/${orderId}`);
    return response.data;
  },
};

export default api;