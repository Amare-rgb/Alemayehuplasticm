// components/Navbar.tsx
"use client"

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Menu, X, ShoppingCart, Package, LayoutDashboard, MapPin, Search, User, ChevronDown, Heart, CreditCard, LogOut, List, BookOpen, TrendingUp, Clock, ArrowRight, Leaf, Settings } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { ProfileDropdown } from '../ProfileDropdown'
// ✅ REMOVED: import { LocationSelector } from '../LocationSelector'
import { useCart } from '@/context/CartContext'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export function Navbar() {
  const { data: session } = useSession()
  const cart = useCart()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // ✅ Navigation links - Changed "History" to "Blog"
  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/shop' },
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },  // ✅ Changed from 'History' to 'Blog'
    { name: 'Export', href: '/export' },
    { name: 'Contact', href: '/contact' },
  ]

  // ✅ Functional Search - handles Enter key and icon click
  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchFocused(false)
      setSearchQuery('')
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Sidebar links
  const sidebarLinks = [
    'Browse all categories',
    'Hello, sign in',
    'Trending',
    'Best Sellers',
    'New Releases',
    'Fresh Produce',
    'Seeds & Fertilizers',
    'Farm Equipment',
    'Livestock & Poultry',
    'Irrigation Systems',
    'Organic Products',
    'Agri Tools & Machinery',
    'Crop Protection',
    'Soil & Plant Care',
    'Shop by Department',
    'Vegetables',
    'Fruits',
    'Grains & Cereals',
    'Dairy Products',
    'Meat & Poultry',
    "Today's Deals",
    'Prime',
    'New Releases',
    'Customer Service'
  ]

  return (
    <header className="sticky top-0 z-50">
      {/* Main Navbar - Clean White Agriculture Style */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left Section - Menu & Logo */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-all duration-200"
                aria-label="Open categories sidebar"
                title="Open categories sidebar"
              >
                <Menu size={20} />
              </button>

              <Link href="/" className="flex items-center gap-2 group" aria-label="Home">
                {/* Logo Image */}
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-green-100 p-1 flex-shrink-0 border border-green-200">
                  <Image
                    src="/banners/images.jpeg"
                    alt="Genesis Agri Logo"
                    fill
                    className="object-cover rounded-full"
                    priority
                  />
                </div>
                <span className="text-xl font-bold text-gray-800 hover:text-green-700 transition-all duration-200">
                  Genesis<span className="text-green-600">Agri</span>
                </span>
              </Link>
            </div>

            {/* Navigation Links - Desktop */}
            <nav className="hidden lg:flex items-center gap-6" aria-label="Main navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors duration-200 hover:underline underline-offset-4"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-1">
              {/* ✅ Functional Search Button with Input */}
              <div className="relative hidden sm:block">
                {searchFocused ? (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-white shadow-lg rounded-lg p-1 flex items-center border border-gray-300">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="w-64 px-3 py-1.5 text-sm outline-none rounded-l-lg"
                      autoFocus
                    />
                    <button
                      onClick={handleSearch}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-r-lg transition-colors"
                    >
                      <Search size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSearchFocused(true)
                      setTimeout(() => searchInputRef.current?.focus(), 100)
                    }}
                    className="p-2 text-gray-600 hover:text-green-700 hover:bg-gray-100 rounded-full transition-all duration-200"
                    aria-label="Search"
                  >
                    <Search size={20} />
                  </button>
                )}
              </div>

              {/* Mobile Search Button */}
              <button
                onClick={() => {
                  const query = prompt('Search for products:')
                  if (query && query.trim()) {
                    router.push(`/shop?search=${encodeURIComponent(query.trim())}`)
                  }
                }}
                className="sm:hidden p-2 text-gray-600 hover:text-green-700 hover:bg-gray-100 rounded-full transition-all duration-200"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* ✅ Admin Dashboard Button */}
              <Link
                href="/admin/Dashbord"
                className="p-2 text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-all duration-200 flex items-center gap-1"
                aria-label="Admin Dashboard"
                title="Admin Dashboard"
              >
                <LayoutDashboard size={20} />
                <span className="hidden sm:inline text-sm font-medium">Admin</span>
              </Link>

              {/* Cart */}
              <Link href="/cart" className="relative p-2 text-gray-600 hover:text-green-700 hover:bg-gray-100 rounded-full transition-all duration-200">
                <ShoppingCart size={20} />
                {cart.count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {cart.count}
                  </span>
                )}
              </Link>

              {/* ✅ Profile Dropdown - Fixed to display correctly after login */}
              <ProfileDropdown />

              {/* Mobile menu button */}
              <button
                type="button"
                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                title={menuOpen ? "Close menu" : "Open menu"}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div id="mobile-menu" className="lg:hidden bg-white py-4 space-y-1 shadow-lg border-b border-gray-200">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="block text-sm text-gray-700 px-6 py-3 hover:bg-green-50 hover:text-green-700 transition-all duration-200"
              onClick={() => setMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          {/* ✅ Mobile Admin Link */}
          <Link
            href="/admin/Dashbord"
            className="block text-sm text-gray-700 px-6 py-3 hover:bg-green-50 hover:text-green-700 transition-all duration-200 flex items-center gap-2"
            onClick={() => setMenuOpen(false)}
          >
            <LayoutDashboard size={16} />
            Admin Dashboard
          </Link>
          <div className="border-t border-gray-100 mt-2 pt-2">
            <Link href="/cart" className="block text-sm text-gray-700 px-6 py-3 hover:bg-green-50 transition-all duration-200" onClick={() => setMenuOpen(false)}>
              Cart {cart.count > 0 && `(${cart.count})`}
            </Link>
            {session ? (
              <button
                onClick={() => {
                  setMenuOpen(false)
                  window.location.href = '/api/auth/signout'
                }}
                className="block text-sm text-red-600 px-6 py-3 hover:bg-red-50 w-full text-left transition-all duration-200"
              >
                Sign Out
              </button>
            ) : (
              <Link href="/login" className="block text-sm text-green-700 px-6 py-3 hover:bg-green-50 transition-all duration-200" onClick={() => setMenuOpen(false)}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" />
          <aside className="relative w-80 max-w-full h-full bg-white shadow-2xl animate-slideInLeft" aria-label="Sidebar navigation">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-600 to-green-700 text-white">
              <div className="flex items-center gap-3">
                <Link href="/" className="font-display font-bold text-lg flex items-center gap-2 text-white" onClick={() => setSidebarOpen(false)}>
                  <div className="relative w-6 h-6 rounded-full overflow-hidden bg-white/10 p-1 flex-shrink-0">
                    <Image
                      src="/banners/images.jpeg"
                      alt="Genesis Agri Logo"
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                  <span>Genesis<span className="text-green-300">Agri</span></span>
                </Link>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-white hover:bg-white/20 transition-all duration-200"
                aria-label="Close sidebar"
                title="Close sidebar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto h-[calc(100vh-64px)]">
              {/* ✅ Location Selector completely removed from here */}

              {/* ✅ Sidebar Admin Link */}
              <Link
                href="/admin/Dashbord"
                className="block py-2 px-2 text-sm text-green-700 hover:bg-green-50 rounded-md transition-colors flex items-center gap-2 font-medium"
                onClick={() => setSidebarOpen(false)}
              >
                <LayoutDashboard size={16} />
                Admin Dashboard
              </Link>

              <div className="mt-2 pt-2 border-t border-gray-100">
                {sidebarLinks.map((t, i) => {
                  if (t === 'Customer Service') {
                    return (
                      <Link key={i} href={'/contact'} className="block py-2 px-2 text-sm text-gray-700 hover:bg-green-50 rounded-md transition-colors" onClick={() => setSidebarOpen(false)}>
                        {t}
                      </Link>
                    )
                  }
                  if (t.toLowerCase().includes('sign in') || t === 'Sign in' || t === 'Hello, sign in') {
                    return (
                      <Link key={i} href={'/login'} className="block py-2 px-2 text-sm text-gray-700 hover:bg-green-50 rounded-md transition-colors" onClick={() => setSidebarOpen(false)}>
                        {t}
                      </Link>
                    )
                  }
                  if (t === 'Your Account') {
                    return (
                      <Link key={i} href={'/account'} className="block py-2 px-2 text-sm text-gray-700 hover:bg-green-50 rounded-md transition-colors" onClick={() => setSidebarOpen(false)}>
                        {t}
                      </Link>
                    )
                  }
                  return (
                    <Link
                      key={i}
                      href={`/shop?search=${encodeURIComponent(t)}`}
                      className="block py-2 px-2 text-sm text-gray-700 hover:bg-green-50 rounded-md transition-colors"
                      onClick={() => setSidebarOpen(false)}
                    >
                      {t}
                    </Link>
                  )
                })}
              </div>
            </div>
          </aside>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.3s ease-out;
        }
      `}</style>
    </header>
  )
}