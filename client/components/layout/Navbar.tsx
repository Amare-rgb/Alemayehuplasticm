// components/layout/Navbar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Leaf, Menu, X, ShoppingCart, User, Search, ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '@/app/providers';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Directly check if current route starts with /admin (No useEffect or setState needed!)
  const isAdminRoute = pathname?.startsWith('/admin') || false;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isAdmin = user?.role === 'ADMIN';
  const isAuthenticated = status === 'authenticated';

  // Don't show navbar on admin routes
  if (isAdminRoute) {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Leaf className="w-8 h-8 text-green-600" />
            <span className="text-xl font-bold text-gray-900">Genesis Agri</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/shop" className="text-gray-700 hover:text-green-600 transition-colors">
              Shop
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-green-600 transition-colors">
              About
            </Link>
            <Link href="/blog" className="text-gray-700 hover:text-green-600 transition-colors">
              Blog
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-green-600 transition-colors">
              Contact
            </Link>
            
            {/* Admin Dashboard Link - only show if user is admin */}
            {isAdmin && (
              <Link 
                href="/admin/dashboard" 
                className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-100 transition-colors"
              >
                <ShieldAlert className="w-4 h-4" />
                Dashboard
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <Link href="/cart" className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <ShoppingCart className="w-5 h-5" />
            </Link>
            
            {/* Auth buttons */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/profile" 
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <User className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-red-500 hover:text-red-700 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link 
                href="/auth/signin" 
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Sign In
              </Link>
            )}
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              <Link href="/shop" className="text-gray-700 hover:text-green-600 transition-colors px-3 py-2">
                Shop
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-green-600 transition-colors px-3 py-2">
                About
              </Link>
              <Link href="/blog" className="text-gray-700 hover:text-green-600 transition-colors px-3 py-2">
                Blog
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-green-600 transition-colors px-3 py-2">
                Contact
              </Link>
              
              {/* Admin Dashboard Link for Mobile - only show if user is admin */}
              {isAdmin && (
                <Link 
                  href="/admin/dashboard" 
                  className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg font-semibold transition-colors"
                >
                  <ShieldAlert className="w-5 h-5" />
                  Dashboard
                </Link>
              )}
              
              {isAuthenticated ? (
                <>
                  <Link 
                    href="/profile" 
                    className="text-gray-700 hover:text-green-600 transition-colors px-3 py-2"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 transition-colors px-3 py-2 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  href="/auth/signin" 
                  className="bg-green-600 text-white px-3 py-2 rounded-lg text-center hover:bg-green-700 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};