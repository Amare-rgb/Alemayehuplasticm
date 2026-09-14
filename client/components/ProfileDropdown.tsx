// components/ProfileDropdown.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import {
  User,
  ChevronDown,
  LogOut,
  Gift,
  BookOpen,
  Package,
  Heart,
  Clock,
  Settings,
  Play,
  Film,
  Download,
  CreditCard,
  Music,
  Search,
  LayoutDashboard,
  Home,
} from 'lucide-react';

export function ProfileDropdown() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // While session is loading, render nothing to avoid a flash of "Login"
  if (status === 'loading') {
    return null;
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-sm text-white px-3 py-2 rounded-md hover:opacity-90"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="text-sm bg-yellow-400 text-black px-3 py-2 rounded-md font-medium"
        >
          Get Started
        </Link>
      </div>
    );
  }

  // ✅ Only two roles: ADMIN and USER
  const getDashboardInfo = () => {
    const role = (session.user as { role?: string } | undefined)?.role?.toUpperCase();

    if (role === 'ADMIN') {
      return {
        href: '/admin/dashboard',
        icon: <LayoutDashboard size={16} />,
        label: 'Admin Dashboard',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        hoverBg: 'hover:bg-blue-100',
      };
    }

    // Default: regular user → home page
    return {
      href: '/',
      icon: <Home size={16} />,
      label: 'Home',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      hoverBg: 'hover:bg-emerald-100',
    };
  };

  const dashboardInfo = getDashboardInfo();

  const profileMenuItems = {
    yourLists: [
      { name: 'Create a List', icon: <Gift size={16} />, href: '/account/lists' },
      { name: 'Find a List or Registry', icon: <Search size={16} />, href: '/account/lists/find' },
      { name: 'Your Saved Books', icon: <BookOpen size={16} />, href: '/account/saved-books' },
    ],
    yourAccount: [
      { name: 'Account', icon: <User size={16} />, href: '/account' },
      { name: 'Orders', icon: <Package size={16} />, href: '/account/orders' },
      { name: 'Recommendations', icon: <Heart size={16} />, href: '/account/recommendations' },
      { name: 'Browsing History', icon: <Clock size={16} />, href: '/account/browsing-history' },
      { name: 'Your Shopping preferences', icon: <Settings size={16} />, href: '/account/shopping-preferences' },
      { name: 'Watchlist', icon: <Play size={16} />, href: '/account/watchlist' },
      { name: 'Video Purchases & Rentals', icon: <Film size={16} />, href: '/account/video-purchases' },
      { name: 'Kindle Unlimited', icon: <BookOpen size={16} />, href: '/account/kindle-unlimited' },
      { name: 'Content & Devices', icon: <Download size={16} />, href: '/account/content-devices' },
      { name: 'Subscribe & Save Items', icon: <CreditCard size={16} />, href: '/account/subscribe-save' },
      { name: 'Memberships & Subscriptions', icon: <Gift size={16} />, href: '/account/memberships' },
      { name: 'Music Library', icon: <Music size={16} />, href: '/account/music-library' },
    ],
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm text-white px-3 py-2 rounded-md hover:bg-white/5 transition-colors"
        aria-label={isOpen ? 'Close account menu' : 'Open account menu'}
        title={isOpen ? 'Close account menu' : 'Open account menu'}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <User size={16} />
        <span>{session.user?.name?.split(' ')[0] || 'Account'}</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
          {/* User Info Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                {session.user?.name?.charAt(0) ||
                  session.user?.email?.charAt(0) ||
                  'U'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {session.user?.name}
                </p>
                <p className="text-xs text-gray-600">{session.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Role-based Link (Admin → dashboard, User → home) */}
          <Link
            href={dashboardInfo.href}
            onClick={() => setIsOpen(false)}
            className={`flex items-center justify-between px-4 py-3 text-sm font-medium ${dashboardInfo.textColor} ${dashboardInfo.bgColor} ${dashboardInfo.hoverBg} transition-colors border-b border-gray-100`}
          >
            <div className="flex items-center gap-3">
              {dashboardInfo.icon}
              <span>{dashboardInfo.label}</span>
            </div>
            <ChevronDown size={14} className="-rotate-90" />
          </Link>

          {/* Scrollable Content */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Your Lists Section */}
            <div className="py-2">
              <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Your Lists
              </p>
              {profileMenuItems.yourLists.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>

            {/* Your Account Section */}
            <div className="border-t border-gray-100 py-2">
              <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Your Account
              </p>
              {profileMenuItems.yourAccount.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>

            {/* Sign Out Button */}
            <div className="border-t border-gray-100 py-2 sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut({ callbackUrl: '/' });
                }}
                className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}