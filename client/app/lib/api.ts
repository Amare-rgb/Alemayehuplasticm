// lib/api.ts
import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

// ============================================================
// Base URL (normalized)
// ============================================================
// - Removes trailing slashes   → prevents "//api/auth/login" (404)
// - Removes a trailing "/api"  → prevents "/api/api/auth/login" (404)
// - Falls back to the Railway backend in production if the Vercel
//   env variable is missing, and to localhost in development.
const PRODUCTION_FALLBACK = 'https://genesis-production-1d52.up.railway.app';

const rawUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? PRODUCTION_FALLBACK
    : 'http://localhost:5000');

export const API_URL = rawUrl
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '');

// ✅ Instance for your EXTERNAL backend (Express on Railway)
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000, // Neon cold start / Railway first request can be slow
});

// ✅ Instance for NEXT.JS internal API routes (/api/...)
// No baseURL → uses the current origin automatically.
const nextApi: AxiosInstance = axios.create({
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ---------- Request interceptor (shared) ----------
const attachAuth = (
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
  // Make sure the path always starts with exactly one "/"
  // so baseURL + url never produces a double slash.
  if (config.baseURL && config.url && !/^https?:\/\//i.test(config.url)) {
    config.url = '/' + config.url.replace(/^\/+/, '');
  }

  if (typeof window !== 'undefined') {
    const token =
      localStorage.getItem('authToken') ||
      sessionStorage.getItem('authToken') ||
      localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
};

api.interceptors.request.use(attachAuth, (error) => Promise.reject(error));
nextApi.interceptors.request.use(attachAuth, (error) => Promise.reject(error));

// ---------- Response interceptor (shared) ----------
const isAuthRoute = (url?: string) =>
  !!url && /\/auth\/(login|register|signin|signup|forgot|reset)/i.test(url);

const handleAuthError = (error: AxiosError) => {
  // Only force logout on 401 for NON-auth routes.
  // A wrong password on /auth/login must show its error message,
  // not reload the page.
  if (
    error.response?.status === 401 &&
    typeof window !== 'undefined' &&
    !isAuthRoute(error.config?.url)
  ) {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    window.location.href = '/auth/signin';
  }

  // Log the FULL url on 404 so path problems are obvious.
  if (error.response?.status === 404) {
    console.error('❌ 404 Not Found:', {
      fullUrl: `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`,
      method: error.config?.method,
      serverResponse: error.response?.data,
    });
  }

  // Log the ACTUAL server error body for 400s so you can debug.
  // Skip binary FormData payloads (uploads) — they'd flood the console.
  if (error.response?.status === 400) {
    const isFormData =
      typeof FormData !== 'undefined' && error.config?.data instanceof FormData;

    if (!isFormData) {
      console.error('❌ 400 Bad Request:', {
        url: error.config?.url,
        method: error.config?.method,
        payload: error.config?.data,
        serverResponse: error.response?.data,
      });
    } else {
      console.error('❌ 400 Bad Request (upload):', {
        url: error.config?.url,
        method: error.config?.method,
        serverResponse: error.response?.data,
      });
    }
  }

  // Timeout / network problems (slow Railway or Neon cold start)
  if (error.code === 'ECONNABORTED') {
    console.error('⏱️ Request timed out:', {
      fullUrl: `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`,
    });
  }

  return Promise.reject(error);
};

api.interceptors.response.use((r) => r, handleAuthError);
nextApi.interceptors.response.use((r) => r, handleAuthError);

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

export type OrderStatus =
  | 'PENDING'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Order {
  id: string;              // internal cuid — do not display
  orderNumber: number;     // ✅ sequential display number (1, 2, 3, …)
  userId: string;
  addressId: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentRef?: string;
  paymentProof?: string;   // base64 data URL of uploaded receipt
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
  paymentStatus?: PaymentStatus;
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
  paymentRef?: string;
  paymentProof?: {
    fileName: string;
    mimeType: string;
    base64: string;
  } | null;
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
  getOrders: async (params?: {
    status?: OrderStatus | string;
    paymentStatus?: PaymentStatus | string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedOrdersResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.status && params.status !== 'ALL')
      queryParams.append('status', params.status);
    if (params?.paymentStatus && params.paymentStatus !== 'ALL')
      queryParams.append('paymentStatus', params.paymentStatus);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/api/orders${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await api.get<PaginatedOrdersResponse>(url);
    return response.data;
  },

  getOrder: async (orderId: string): Promise<Order> => {
    const response = await api.get<Order>(`/api/orders/${orderId}`);
    return response.data;
  },

  createOrder: async (
    data: CreateOrderPayload
  ): Promise<{ success: boolean; order: Order; message: string }> => {
    const response = await api.post<{
      success: boolean;
      order: Order;
      message: string;
    }>('/api/orders', data);
    return response.data;
  },

  updateOrder: async (data: {
    orderId: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    notes?: string;
  }): Promise<{ success: boolean; order: Order; message: string }> => {
    const response = await api.patch<{
      success: boolean;
      order: Order;
      message: string;
    }>('/api/orders', data);
    return response.data;
  },

  cancelOrder: async (
    orderId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(
      `/api/orders/${orderId}`
    );
    return response.data;
  },

  // ✅ Hard-delete an order (admin only) — same endpoint as cancelOrder
  // but the backend distinguishes them by role. Used by the admin orders page.
  deleteOrder: async (
    orderId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(
      `/api/orders/${orderId}`
    );
    return response.data;
  },
};

// ✅ checkoutApi uses `api` → hits the Express backend (Railway in production)
export const checkoutApi = {
  createCheckout: async (
    data: CheckoutPayload
  ): Promise<CreateCheckoutResponse> => {
    const response = await api.post<CreateCheckoutResponse>(
      '/api/checkout',
      data
    );
    return response.data;
  },

  getSummary: async (): Promise<CheckoutSummaryResponse> => {
    const response = await api.get<CheckoutSummaryResponse>(
      '/api/checkout/summary'
    );
    return response.data;
  },

  getOrder: async (orderId: string): Promise<GetOrderResponse> => {
    const response = await api.get<GetOrderResponse>(
      `/api/checkout/order/${orderId}`
    );
    return response.data;
  },
};

// ============================================================
// UPLOAD API
// ============================================================
// The shared `api` instance sets Content-Type: application/json.
// For multipart uploads we must NOT send that header — the browser
// needs to set "multipart/form-data; boundary=..." itself, otherwise
// Multer receives a JSON body, req.file is undefined, and the route
// returns 400.
//
// We strip the header by deleting it inside `transformRequest` so
// the browser can set the multipart Content-Type with its own boundary.

export interface UploadResponse {
  success: boolean;
  url: string;         // e.g. "/uploads/products/1712345678-abcd.png"
  fileName: string;
  fileSize: number;
  fileType: string;
  message: string;
}

export const uploadApi = {
  /**
   * Upload a single file.
   * The backend accepts either field name:
   *   - "image"  → saved to uploads/products/
   *   - "avatar" → saved to uploads/avatars/
   */
  uploadFile: async (
    file: File,
    fieldName: 'image' | 'avatar' = 'image'
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append(fieldName, file);

    const response = await api.post<UploadResponse>('/api/upload', formData, {
      timeout: 120000, // uploads can take longer than normal requests
      // ✅ Delete the shared JSON Content-Type so the browser sets
      //    multipart/form-data with the correct boundary.
      transformRequest: [
        (data: FormData, headers: Record<string, unknown>) => {
          if (headers && typeof headers === 'object') {
            delete headers['Content-Type'];
            delete headers['content-type'];
          }
          return data;
        },
      ],
    });
    return response.data;
  },

  /** Convenience wrapper for product images. */
  uploadProductImage: (file: File) => uploadApi.uploadFile(file, 'image'),

  /** Convenience wrapper for category images. */
  uploadCategoryImage: (file: File) => uploadApi.uploadFile(file, 'image'),

  /** Convenience wrapper for user avatars. */
  uploadAvatar: (file: File) => uploadApi.uploadFile(file, 'avatar'),
};

export default api;