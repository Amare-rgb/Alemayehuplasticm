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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const router = useRouter();
  const pathname = usePathname();
  const initialized = useRef(false);
  const authCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  // Initialize auth - runs only once
  useEffect(() => {
    // Skip if already initialized
    if (initialized.current) return;
    initialized.current = true;

    const initAuth = async () => {
      try {
        // Check both possible token storage keys
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        if (!token) {
          setStatus('unauthenticated');
          setUser(null);
          return;
        }

        // Check if user data exists in localStorage first (faster)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setStatus('authenticated');
            
            // Still verify with backend in background
            api.get<User>('/api/auth/me')
              .then(response => {
                setUser(response.data);
                localStorage.setItem('user', JSON.stringify(response.data));
                if (response.data.role) {
                  localStorage.setItem('userRole', response.data.role);
                }
              })
              .catch(() => {
                // If backend verification fails, don't logout immediately
                // Just keep using stored user data
                console.warn('Backend verification failed, using cached user data');
              });
            
            return;
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }

        // If no stored user, verify with backend
        const response = await api.get<User>('/api/auth/me');
        setUser(response.data);
        setStatus('authenticated');
        
        // Store user data for persistence
        localStorage.setItem('user', JSON.stringify(response.data));
        if (response.data.role) {
          localStorage.setItem('userRole', response.data.role);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Don't clear token immediately - might be a network issue
        // Only clear if it's a 401 unauthorized
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('userRole');
          setUser(null);
          setStatus('unauthenticated');
        } else {
          // Keep user data if available
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
              setStatus('authenticated');
            } catch {
              setStatus('unauthenticated');
            }
          } else {
            setStatus('unauthenticated');
          }
        }
      }
    };

    // Add a small delay to prevent race conditions
    const timeoutId = setTimeout(() => {
      initAuth();
    }, 100);
    
    authCheckTimeout.current = timeoutId;

    return () => {
      if (authCheckTimeout.current) {
        clearTimeout(authCheckTimeout.current);
      }
    };
  }, []); // Empty dependency array - runs once on mount

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await api.post<LoginResponse>('/api/auth/login', { 
        email, 
        password 
      });
      
      const { token, user: userData } = response.data;
      
      // Store token with consistent key "token"
      localStorage.setItem('token', token);
      sessionStorage.setItem('token', token);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.setItem('user', JSON.stringify(userData));
      
      if (userData.role) {
        localStorage.setItem('userRole', userData.role);
      }
      
      setUser(userData);
      setStatus('authenticated');
      
      // ✅ FIXED: Use router.push() instead of window.location.href
      // Redirect based on role
      const userRole = userData.role?.toUpperCase();
      if (userRole === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (userRole === 'SELLER' || userRole === 'FARMER') {
        router.push('/seller/dashboard');
      } else {
        router.push('/dashboard');
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
    
    // ✅ FIXED: Use router.push() instead of window.location.href
    router.push('/auth/signin');
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
      
      const { token, user: userData } = response.data;
      
      // Store token with consistent key "token"
      localStorage.setItem('token', token);
      sessionStorage.setItem('token', token);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.setItem('user', JSON.stringify(userData));
      
      if (userData.role) {
        localStorage.setItem('userRole', userData.role);
      }
      
      setUser(userData);
      setStatus('authenticated');
      
      // ✅ FIXED: Use router.push() instead of window.location.href
      // Redirect based on role
      const userRole = userData.role?.toUpperCase();
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

// Export Providers as a wrapper component for easier importing
export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}