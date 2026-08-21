// app/providers.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
    const token = localStorage.getItem('token');
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
  const isMounted = useRef(false);

  // Check auth function
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setStatus('unauthenticated');
        setUser(null);
        return;
      }

      const response = await api.get<User>('/api/auth/me');
      setUser(response.data);
      setStatus('authenticated');
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
      setStatus('unauthenticated');
    }
  };

  // Use a ref to track mounted state instead of state
  useEffect(() => {
    isMounted.current = true;
    checkAuth();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await api.post<LoginResponse>('/api/auth/login', { 
        email, 
        password 
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      setStatus('authenticated');
      router.push('/admin/dashboard');
    } catch (error: unknown) {
      const err = error as AxiosError<{ error: string }>;
      throw new Error(err.response?.data?.error || 'Login failed');
    }
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    setUser(null);
    setStatus('unauthenticated');
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
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      setStatus('authenticated');
      router.push('/');
    } catch (error: unknown) {
      const err = error as AxiosError<{ error: string }>;
      throw new Error(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, status, login, logout, register }}>
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