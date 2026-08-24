// components/layout/Navbar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ShoppingCart, User, ShieldAlert, LogOut, ArrowRight } from 'lucide-react';
import { useAuth } from '@/app/providers';

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span className="leaf leaf-one" />
      <span className="leaf leaf-two" />
      <span className="stem" />
    </span>
  );
}

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAdminRoute = pathname?.startsWith('/admin') || false;
  const isHome = pathname === '/';

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isAdmin = user?.role === 'ADMIN';
  const isAuthenticated = status === 'authenticated';

  if (isAdminRoute) {
    return null;
  }

  const closeMenu = () => setIsOpen(false);

  return (
    <header className={isHome ? "absolute left-0 top-0 z-50 w-full text-white" : "sticky top-0 z-50 w-full text-white bg-[var(--green-950)] shadow-lg"}>
      <nav className="mx-auto flex min-h-[92px] w-[min(1180px,calc(100%-48px))] items-center justify-between border-b border-white/20">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="flex items-center gap-3"
          onClick={closeMenu}
        >
          <BrandMark />

          <span className="grid gap-[5px] leading-none">
            <strong className="text-[18px] tracking-[0.16em]">
              GENESIS
            </strong>

            <small className="text-[8px] tracking-[0.22em] opacity-75">
              AGRO-BUSINESS
            </small>
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-7 text-[13px] font-semibold lg:flex">
          <Link
            href="/"
            className="opacity-100 transition hover:opacity-100"
          >
            Home
          </Link>

          <Link
            href="/#products"
            className="opacity-80 transition hover:opacity-100"
          >
            Our Products
          </Link>

          <Link
            href="/#tana-farm"
            className="opacity-80 transition hover:opacity-100"
          >
            Tana Farm
          </Link>

          <Link
            href="/about"
            className="opacity-80 transition hover:opacity-100"
          >
            About Us
          </Link>

          <Link
            href="/contact"
            className="opacity-80 transition hover:opacity-100"
          >
            Contact
          </Link>

          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 bg-[#19472d] text-[var(--lime)] border border-[var(--lime)]/30 px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#28633e] transition"
            >
              <ShieldAlert className="w-4 h-4" />
              Dashboard
            </Link>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          <Link
            href="/cart"
            className="p-1.5 text-white/80 hover:text-white transition relative"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5" />
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="p-1.5 text-white/80 hover:text-white transition"
                aria-label="Profile"
              >
                <User className="w-5 h-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 text-red-400 hover:text-red-300 transition"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="hidden sm:inline-block text-xs text-white/90 hover:text-white font-medium border border-white/30 px-3 py-1.5 rounded"
            >
              Sign In
            </Link>
          )}

          <Link
            href="/shop"
            className="flex items-center gap-3 rounded-[2px] bg-[var(--lime)] px-4 py-3 text-[13px] font-bold text-[var(--green-950)] transition hover:-translate-y-0.5"
          >
            Shop Fresh
            <ArrowRight size={17} />
          </Link>

          {/* Mobile button */}
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={isOpen}
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-white"
          >
            {isOpen ? <X size={27} /> : <Menu size={27} />}
          </button>
        </div>
      </nav>

      {/* Mobile navigation */}
      {isOpen && (
        <div className="absolute left-4 right-4 top-[78px] flex flex-col gap-2 bg-[var(--green-950)] p-5 shadow-2xl lg:hidden z-50">
          {[
            ["Home", "/"],
            ["Our Products", "/#products"],
            ["Tana Farm", "/#tana-farm"],
            ["About Us", "/about"],
            ["Contact", "/contact"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              onClick={closeMenu}
              className="border-b border-white/10 py-3 text-sm text-white/85"
            >
              {label}
            </Link>
          ))}

          {isAdmin && (
            <Link
              href="/admin/dashboard"
              onClick={closeMenu}
              className="border-b border-white/10 py-3 text-sm text-[var(--lime)] font-semibold flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              Dashboard
            </Link>
          )}

          {isAuthenticated ? (
            <>
              <Link
                href="/profile"
                onClick={closeMenu}
                className="border-b border-white/10 py-3 text-sm text-white/85"
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  closeMenu();
                  handleLogout();
                }}
                className="border-b border-white/10 py-3 text-sm text-red-400 text-left"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              onClick={closeMenu}
              className="border-b border-white/10 py-3 text-sm text-white/85"
            >
              Sign In
            </Link>
          )}

          <Link
            href="/shop"
            onClick={closeMenu}
            className="mt-2 flex items-center justify-between bg-[var(--lime)] px-4 py-3 text-sm font-bold text-[var(--green-950)]"
          >
            Shop Fresh
            <ArrowRight size={17} />
          </Link>
        </div>
      )}
    </header>
  );
};