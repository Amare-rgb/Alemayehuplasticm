// app/providers.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
}

// Payload type for updateProfile
export interface ProfileUpdatePayload {
  name?: string;
  phone?: string;
  address?: string;
  bio?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  updateProfile: (payload: ProfileUpdatePayload) => Promise<User>;
  uploadAvatar: (file: File) => Promise<User>;   // ✅ ADDED
}

interface LoginResponse {
  token: string;
  user: User;
}

interface RegisterResponse {
  token: string;
  user: User;
}

interface UserPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
}

const extractUserData = (payload: unknown): User | null => {
  if (!payload || typeof payload !== 'object') return null;

  const data = payload as Record<string, unknown>;

  if (
    data.data &&
    typeof data.data === 'object' &&
    (data.data as Record<string, unknown>).id
  ) {
    const u = data.data as UserPayload;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar || null,
      phone: u.phone || null,
      address: u.address || null,
      bio: u.bio || null,
    };
  }

  if (
    data.user &&
    typeof data.user === 'object' &&
    (data.user as Record<string, unknown>).id
  ) {
    const u = data.user as UserPayload;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar || null,
      phone: u.phone || null,
      address: u.address || null,
      bio: u.bio || null,
    };
  }

  if (data.id && typeof data.id === 'string') {
    return {
      id: data.id as string,
      name: (data.name as string) || '',
      email: (data.email as string) || '',
      role: (data.role as string) || 'USER',
      avatar: (data.avatar as string | null) || null,
      phone: (data.phone as string | null) || null,
      address: (data.address as string | null) || null,
      bio: (data.bio as string | null) || null,
    };
  }

  return null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<
    'loading' | 'authenticated' | 'unauthenticated'
  >('loading');
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token =
          localStorage.getItem('token') || localStorage.getItem('authToken');

        if (!token || token === 'undefined' || token === 'null') {
          setStatus('unauthenticated');
          setUser(null);
          return;
        }

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = extractUserData(JSON.parse(storedUser));
            if (parsedUser) {
              setUser(parsedUser);
              setStatus('authenticated');
            }
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }

        try {
          const response = await api.get('/api/auth/me');
          const fetchedUser = extractUserData(response.data);
          if (fetchedUser) {
            setUser(fetchedUser);
            setStatus('authenticated');
            localStorage.setItem('user', JSON.stringify(fetchedUser));
            if (fetchedUser.role) {
              localStorage.setItem('userRole', fetchedUser.role);
            }
          }
        } catch (err) {
          if (axios.isAxiosError(err) && err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            setUser(null);
            setStatus('unauthenticated');
          } else {
            const localUser = localStorage.getItem('user');
            if (localUser) {
              try {
                const parsed = extractUserData(JSON.parse(localUser));
                if (parsed) {
                  setUser(parsed);
                  setStatus('authenticated');
                } else {
                  setStatus('unauthenticated');
                }
              } catch {
                setStatus('unauthenticated');
              }
            } else {
              setStatus('unauthenticated');
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setStatus('unauthenticated');
      }
    };

    initAuth();

    const handleAuthChange = () => {
      initAuth();
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await api.post<LoginResponse>('/api/auth/login', {
        email,
        password,
      });

      const token = response.data.token;
      const userData = extractUserData(response.data);

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token);
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('authToken', token);
      }

      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('user', JSON.stringify(userData));
        if (userData.role) {
          localStorage.setItem('userRole', userData.role);
        }
        setUser(userData);
      }

      setStatus('authenticated');

      const userRole = userData?.role?.toUpperCase();
      if (userRole === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/shop');
      }
    } catch (error: unknown) {
      const err = error as AxiosError<{ error: string }>;
      throw new Error(err.response?.data?.error || 'Login failed');
    }
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');

    sessionStorage.removeItem('token');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('userRole');

    setUser(null);
    setStatus('unauthenticated');

    router.push('/');
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: string = 'USER'
  ): Promise<void> => {
    try {
      const response = await api.post<RegisterResponse>('/api/auth/register', {
        name,
        email,
        password,
        role,
      });

      const token = response.data.token;
      const userData = extractUserData(response.data);

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token);
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('authToken', token);
      }

      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('user', JSON.stringify(userData));
        if (userData.role) {
          localStorage.setItem('userRole', userData.role);
        }
        setUser(userData);
      }

      setStatus('authenticated');

      const userRole = userData?.role?.toUpperCase();
      if (userRole === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (error: unknown) {
      const err = error as AxiosError<{ error: string }>;
      throw new Error(err.response?.data?.error || 'Registration failed');
    }
  };

  // ✅ Real profile update
  const updateProfile = async (
    payload: ProfileUpdatePayload
  ): Promise<User> => {
    try {
      const response = await api.patch('/api/auth/profile', payload);

      const updated =
        extractUserData(response.data) ||
        (user ? { ...user, ...payload } : null);
      if (!updated) throw new Error('Failed to parse updated user');

      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      sessionStorage.setItem('user', JSON.stringify(updated));
      if (updated.role) {
        localStorage.setItem('userRole', updated.role);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-change'));
      }

      return updated;
    } catch (error: unknown) {
      const err = error as AxiosError<{ error?: string; message?: string }>;
      throw new Error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to update profile'
      );
    }
  };

  // ✅ ADDED: upload avatar file, then save URL on user profile
  const uploadAvatar = async (file: File): Promise<User> => {
    try {
      const formData = new FormData();
      // Field name MUST match the middleware: "avatar"
      formData.append('avatar', file);

      const token =
        localStorage.getItem('token') || localStorage.getItem('authToken');

      // 1. Upload the file
      const uploadRes = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const url: string | undefined =
        uploadRes.data?.url ||
        uploadRes.data?.data?.url ||
        uploadRes.data?.fileUrl;

      if (!url) {
        throw new Error('Upload succeeded but no URL returned');
      }

      // 2. Save the URL on the user's profile
      const baseURL =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;

      const updated = await updateProfile({ avatar: fullUrl });
      return updated;
    } catch (error: unknown) {
      const err = error as AxiosError<{ error?: string; message?: string }>;
      throw new Error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to upload avatar'
      );
    }
  };

  const value = {
    user,
    status,
    login,
    logout,
    register,
    updateProfile,
    uploadAvatar,   // ✅ ADDED
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import { CartProvider, useCart } from '@/context/CartContext';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
export { useCart, CartProvider, useSettings, SettingsProvider, useLanguage, LanguageProvider };

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <SettingsProvider>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </SettingsProvider>
    </LanguageProvider>
  );
}