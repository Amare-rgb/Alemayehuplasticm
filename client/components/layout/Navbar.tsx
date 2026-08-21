'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Leaf, Menu, X, ShoppingCart, User, Search } from 'lucide-react';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

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
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <Link href="/cart" className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <ShoppingCart className="w-5 h-5" />
            </Link>
            <Link href="/login" className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <User className="w-5 h-5" />
            </Link>
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
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};