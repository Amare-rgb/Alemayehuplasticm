// app/admin/layout.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  User,
  CreditCard,
  FileText,
  Newspaper,
  StickyNote,
} from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';  // ✅ FIXED: Use the new hook

// Define types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { settings } = useSettings();  // ✅ This now works with the new hook
  const pathname = usePathname();
  const router = useRouter();
  
  // Use refs to prevent re-renders and re-checks
  const isMountedRef = useRef<boolean>(false);
  const isAuthCheckedRef = useRef<boolean>(false);
  const redirectingRef = useRef<boolean>(false);

  // Set mounted state - only once
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      setIsMounted(true);
    }
  }, []);

  // Check authentication - ONLY ONCE on mount
  useEffect(() => {
    // Skip if already checked or not mounted or already redirecting
    if (isAuthCheckedRef.current || !isMounted || redirectingRef.current) {
      return;
    }

    const checkAuth = (): void => {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user');

      console.log('🔍 Admin Layout - Initial auth check...');
      console.log('Token exists:', !!token);

      if (!token) {
        console.log('❌ No token found, redirecting to login...');
        redirectingRef.current = true;
        router.replace('/auth/signin');
        setLoading(false);
        return;
      }

      if (userData) {
        try {
          const parsedUser: User = JSON.parse(userData);
          console.log('👤 User role:', parsedUser.role);
          
          if (parsedUser.role?.toUpperCase() !== 'ADMIN') {
            console.log('❌ Not an admin, redirecting to home...');
            redirectingRef.current = true;
            router.replace('/');
            setLoading(false);
            return;
          }
          
          setUser(parsedUser);
          isAuthCheckedRef.current = true;
          setLoading(false);
        } catch (error) {
          console.error('Error parsing user data:', error);
          redirectingRef.current = true;
          router.replace('/auth/signin');
          setLoading(false);
        }
      } else {
        console.log('❌ No user data found');
        redirectingRef.current = true;
        router.replace('/auth/signin');
        setLoading(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  // Navigation items
  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, section: 'Main' },
    { name: 'Products', href: '/admin/products', icon: Package, section: 'Main' },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag, section: 'Main' },
    { name: 'Users', href: '/admin/users', icon: Users, section: 'Main' },
    { name: 'Transactions', href: '/admin/transactions', icon: CreditCard, section: 'Financial' },
    { name: 'Blog', href: '/admin/blog', icon: FileText, section: 'Content' },
    { name: 'Notes', href: '/admin/notes', icon: StickyNote, section: 'Content' },
    { name: 'Articles', href: '/admin/articles', icon: Newspaper, section: 'Content' },
    { name: 'Settings', href: '/admin/settings', icon: Settings, section: 'Settings' },
  ];

  // Mock notifications
  const notifications: Notification[] = [
    { id: 1, title: 'New Order #1234', message: 'John Doe placed a new order', time: '5 min ago', read: false },
    { id: 2, title: 'Product Low Stock', message: 'Organic Tomatoes is running low', time: '1 hour ago', read: false },
    { id: 3, title: 'New Farmer Registered', message: 'Sarah Smith joined as a farmer', time: '3 hours ago', read: true },
    { id: 4, title: 'Payment Received', message: 'Payment of $450.00 received', time: '5 hours ago', read: true },
  ];

  const unreadCount: number = notifications.filter((n: Notification) => !n.read).length;

  // Safe user data
  const adminUser: User = {
    id: user?.id ?? '',
    name: user?.name ?? 'Admin User',
    email: user?.email ?? 'admin@genesisagri.com',
    role: user?.role ?? 'Administrator'
  };

  const handleLogout = (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('userRole');
    isAuthCheckedRef.current = false;
    router.push('/auth/signin');
  };

  // Group nav items by section
  const groupedNavItems = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    const section = item.section || 'Main';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {});

  const sectionLabels: Record<string, string> = {
    Main: 'Main Menu',
    Financial: 'Financial',
    Content: 'Content',
    Settings: 'Settings',
  };

  const getPageTitle = (): string => {
    if (!pathname) return 'Dashboard';
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];
    if (!lastSegment || lastSegment === 'admin') return 'Dashboard';
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  // Show loading state
  if (loading || !isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin
  if (!user || user.role?.toUpperCase() !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <Link href="/admin/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 relative">
              <Image
                src={settings?.logo || "/banners/images.jpeg"}
                alt={settings?.siteName || "Genesis Agri Business"}
                width={32}
                height={32}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            {sidebarOpen && (
              <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                {settings?.siteName || "Genesis Agri Business"}
              </span>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5 text-gray-500" /> : <Menu className="w-5 h-5 text-gray-500" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-4rem)]">
          {Object.keys(groupedNavItems).map((section) => (
            <div key={section}>
              {sidebarOpen && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {sectionLabels[section] ?? section}
                </p>
              )}
              <div className="space-y-1">
                {groupedNavItems[section]?.map((item: NavItem) => {
                  const IconComponent = item.icon;
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/') || false;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } ${!sidebarOpen ? 'justify-center' : ''}`}
                    >
                      <IconComponent className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                      {!sidebarOpen && (
                        <span className="text-xs font-medium sr-only">{item.name}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Divider */}
          <div className="border-t border-gray-200 my-4"></div>

          {/* Return to Store */}
          <Link
            href="/"
            className={`flex items-center px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 ${
              sidebarOpen ? 'justify-start' : 'justify-center'
            }`}
          >
            <span className={`text-sm font-medium ${!sidebarOpen ? 'sr-only' : ''}`}>Return to Store</span>
            {!sidebarOpen && <span className="text-xs font-medium">🏪</span>}
          </Link>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className={`flex items-center px-3 py-2.5 w-full rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 mt-2 ${
              sidebarOpen ? 'justify-start' : 'justify-center'
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium ml-3">Logout</span>}
            {!sidebarOpen && <span className="text-xs font-medium sr-only">Logout</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-800 hidden md:block">
                {getPageTitle()}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search in admin..."
                  className="w-64 pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-xs font-medium text-white bg-red-500 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-800">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif: Notification) => (
                        <div
                          key={notif.id}
                          className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notif.read ? 'bg-green-50' : ''
                          }`}
                        >
                          <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 border-t border-gray-200">
                      <button className="w-full text-center text-sm text-green-600 hover:text-green-700 font-medium py-1">
                        View All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Profile"
                >
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {adminUser.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-800">{adminUser.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{adminUser.role?.toLowerCase()}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-800">{adminUser.name}</p>
                      <p className="text-xs text-gray-500">{adminUser.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 capitalize">
                        {adminUser.role?.toLowerCase()}
                      </span>
                    </div>
                    <Link
                      href="/admin/profile"
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">My Profile</span>
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Settings</span>
                    </Link>
                    <div className="border-t border-gray-200"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-4 py-2 w-full hover:bg-gray-50 transition-colors text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}