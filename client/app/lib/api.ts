// lib/api.ts
import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

// ============================================================
// Base URL (normalized)
// ============================================================
const PRODUCTION_FALLBACK = 'https://api.alemayehplastic.com';

const rawUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? PRODUCTION_FALLBACK
    : 'http://localhost:5000');

export const API_URL = rawUrl
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '');

// ✅ Instance for your EXTERNAL backend (Express)
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000,
});

// ✅ Instance for NEXT.JS internal API routes (/api/...)
const nextApi: AxiosInstance = axios.create({
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ---------- Request interceptor (shared) ----------
const attachAuth = (
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
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
  // Force logout only on 401 for NON-auth routes.
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

    // Full-page redirect is intentional here: we need to fully reset all
    // React state and in-memory caches after an auth failure. A router.push()
    // would keep stale state around, so window.location is the correct tool.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/auth/signin';
  }

  if (error.response?.status === 404) {
    console.error('❌ 404 Not Found:', {
      fullUrl: `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`,
      method: error.config?.method,
      serverResponse: error.response?.data,
    });
  }

  if (error.response?.status === 400) {
    const isFormData =
      typeof FormData !== 'undefined' &&
      error.config?.data instanceof FormData;

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
// Types — kept minimal (no orders / checkout)
// ============================================================

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number | null;
  images: string[];
  stock: number;
  sku?: string;
  description?: string;
  brand?: string | null;
  unitOfMeasurement?: string;
  weight?: number | null;
  durationTime?: string | null;
  tags?: string[];
  categoryId?: string;
  subCategoryId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: string;
}

// ============================================================
// UPLOAD API
// ============================================================
export interface UploadResponse {
  success: boolean;
  url: string; // e.g. "/uploads/products/1712345678-abcd.png"
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
      timeout: 120000,
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

  uploadProductImage: (file: File) => uploadApi.uploadFile(file, 'image'),
  uploadCategoryImage: (file: File) => uploadApi.uploadFile(file, 'image'),
  uploadAvatar: (file: File) => uploadApi.uploadFile(file, 'avatar'),
};

export default api;