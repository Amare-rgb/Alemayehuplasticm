// app/providers.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests with proper typing
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Check both possible token storage keys
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  phone?: string | null;
}

interface AuthContextType {
  user: User | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface RegisterResponse {
  token: string;
  user: User;
}

// Helper to extract clean User object from any response structure
const extractUserData = (payload: any): User | null => {
  if (!payload) return null;
  if (payload.data && typeof payload.data === 'object' && payload.data.id) {
    return payload.data as User;
  }
  if (payload.user && typeof payload.user === 'object' && payload.user.id) {
    return payload.user as User;
  }
  if (payload.id) {
    return payload as User;
  }
  return null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const router = useRouter();
  const pathname = usePathname();

  // Initialize auth - runs immediately on mount and syncs with storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        if (!token || token === 'undefined' || token === 'null') {
          setStatus('unauthenticated');
          setUser(null);
          return;
        }

        // 1. Immediately read cached user from localStorage for zero flash
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const raw = JSON.parse(storedUser);
            const parsedUser = extractUserData(raw);
            if (parsedUser) {
              setUser(parsedUser);
              setStatus('authenticated');
            }
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }

        // 2. Verify with backend in background
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
          // If server returns 401 Unauthorized, wipe storage
          if (axios.isAxiosError(err) && err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            setUser(null);
            setStatus('unauthenticated');
          } else {
            // Network issue or other non-auth error: keep cached user if valid
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

    // Listen to storage events and custom auth-change events
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
        password 
      });
      
      const token = response.data.token;
      const userData = extractUserData(response.data);
      
      // Store token with consistent keys
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token);
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('authToken', token);
      }
      
      // Store user data
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('user', JSON.stringify(userData));
        if (userData.role) {
          localStorage.setItem('userRole', userData.role);
        }
        setUser(userData);
      }
      
      setStatus('authenticated');
      
      // Redirect based on role
      const userRole = userData?.role?.toUpperCase();
      if (userRole === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (userRole === 'SELLER' || userRole === 'FARMER') {
        router.push('/seller/dashboard');
      } else {
        router.push('/shop');
      }
    } catch (error: unknown) {
      const err = error as AxiosError<{ error: string }>;
      throw new Error(err.response?.data?.error || 'Login failed');
    }
  };

  const logout = (): void => {
    // Clear ALL authentication data
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
        role 
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
      
      // Redirect based on role
      const userRole = userData?.role?.toUpperCase();
      if (userRole === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (userRole === 'SELLER' || userRole === 'FARMER') {
        router.push('/seller/dashboard');
      } else {
        router.push('/');
      }
    } catch (error: unknown) {
      const err = error as AxiosError<{ error: string }>;
      throw new Error(err.response?.data?.error || 'Registration failed');
    }
  };

  const value = {
    user,
    status,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import { CartProvider, useCart } from '@/context/CartContext';
export { useCart, CartProvider };

// Export Providers as a wrapper component for easier importing
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}