// components/layout/Navbar.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  ShoppingCart,
  User,
  ShieldAlert,
  LogOut,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/app/providers";

function BrandMark() {
  return (
    <span className="brand-mark shrink-0" aria-hidden="true">
      <span className="leaf leaf-one" />
      <span className="leaf leaf-two" />
      <span className="stem" />
    </span>
  );
}

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Our Products", href: "/#products" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Blog", href: "/blog"},
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { user, status, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAdminRoute = pathname?.startsWith("/admin") || false;
  const isHome = pathname === "/" || pathname === "/shop" || pathname === "/blog" || pathname === "/about" || pathname === "/contact" ;

  useEffect(() => {
    if (!isHome) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const isAdmin = user?.role === "ADMIN";
  const isAuthenticated = status === "authenticated";

  if (isAdminRoute) {
    return null;
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className={
        isHome
          ? `fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
              scrolled ? "py-3" : "py-5"
            }`
          : "relative z-50 w-full bg-[#071a11] text-white border-b border-white/10 shadow-md"
      }
    >
      <div
        className={
          isHome
            ? `mx-auto flex h-[70px] w-[min(1180px,calc(100%-48px))] items-center justify-between border-b transition-all duration-500 ${
                scrolled
                  ? "rounded-full border-white/10 bg-[rgba(7,26,17,.88)] px-5 shadow-[0_15px_40px_rgba(0,0,0,.18)] backdrop-blur-xl"
                  : "border-white/20 px-0"
              }`
            : "mx-auto flex h-[75px] w-[min(1180px,calc(100%-48px))] items-center justify-between px-0"
        }
      >
        {/* =====================================================
            LOGO / BRAND
        ====================================================== */}
        <Link
          href="/"
          className="group flex items-center gap-3"
          onClick={closeMenu}
        >
          <BrandMark />

          <div className="flex flex-col leading-none">
            <span className="font-serif-heading text-[23px] font-semibold tracking-[-0.045em] text-white">
              Genesis
            </span>

            <span className="mt-1 text-[8px] font-semibold uppercase tracking-[0.28em] text-white/55">
              Agro-Business
            </span>
          </div>
        </Link>

        {/* =====================================================
            DESKTOP NAVIGATION
        ====================================================== */}
        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className="group relative py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70 transition-colors duration-300 hover:text-white"
              >
                {link.label}

                {/* Animated indicator line */}
                <span
                  className={`absolute -bottom-[1px] left-0 h-[2px] bg-[var(--lime)] transition-all duration-300 ${
                    isActive ? "w-4" : "w-0 group-hover:w-4"
                  }`}
                />
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 rounded border border-[var(--lime)]/30 bg-[#19472d] px-3 py-1.5 text-xs font-semibold text-[var(--lime)] transition hover:bg-[#28633e]"
            >
              <ShieldAlert className="h-4 w-4" />
              Dashboard
            </Link>
          )}
        </nav>

        {/* =====================================================
            RIGHT CONTROLS & CTA
        ====================================================== */}
        <div className="hidden items-center gap-4 lg:flex">
          {/* Shopping Cart */}
          <Link
            href="/cart"
            className="relative p-1.5 text-white/80 transition hover:text-white"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="h-5 w-5" />
          </Link>

          {/* User Auth controls */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="p-1.5 text-white/80 transition hover:text-white"
                aria-label="Profile"
              >
                <User className="h-5 w-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 text-red-400 transition hover:text-red-300"
                aria-label="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="rounded border border-white/30 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:text-white"
            >
              Sign In
            </Link>
          )}

          <span className="h-5 w-px bg-white/20" />

          {/* Shop Fresh CTA Button */}
          <Link
            href="/shop"
            className="group flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white"
          >
            Shop Fresh
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)] transition-transform duration-300 group-hover:rotate-45">
              <ArrowUpRight size={14} strokeWidth={2.2} />
            </span>
          </Link>
        </div>

        {/* =====================================================
            MOBILE MENU BUTTON
        ====================================================== */}
        <div className="flex items-center gap-3 lg:hidden">
          <Link
            href="/cart"
            className="p-1.5 text-white/80 transition hover:text-white"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="h-5 w-5" />
          </Link>

          <button
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {/* =====================================================
          MOBILE MENU DRAWER
      ====================================================== */}
      <div
        className={
          isHome
            ? `mx-auto mt-2 w-[min(1180px,calc(100%-48px))] overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(7,26,17,.96)] shadow-[0_20px_60px_rgba(0,0,0,.3)] backdrop-blur-xl transition-all duration-300 lg:hidden ${
                menuOpen
                  ? "max-h-[550px] opacity-100"
                  : "pointer-events-none max-h-0 opacity-0"
              }`
            : `mx-auto w-[min(1180px,calc(100%-48px))] overflow-hidden rounded-b-[20px] bg-[#071a11] transition-all duration-300 lg:hidden ${
                menuOpen
                  ? "max-h-[550px] opacity-100 border-t border-white/10 py-2"
                  : "pointer-events-none max-h-0 opacity-0"
              }`
        }
      >
        <nav className="p-3">
          {navLinks.map((link, index) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={closeMenu}
              className="flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-medium text-white/80 transition hover:bg-white/5 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <span className="text-[9px] font-bold tracking-widest text-[var(--lime)]">
                  0{index + 1}
                </span>
                {link.label}
              </span>

              <ArrowUpRight size={16} className="text-white/40" />
            </Link>
          ))}

          {isAdmin && (
            <Link
              href="/admin/dashboard"
              onClick={closeMenu}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-[var(--lime)] hover:bg-white/5"
            >
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Admin Dashboard
              </span>
              <ArrowUpRight size={16} />
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
              <Link
                href="/profile"
                onClick={closeMenu}
                className="flex items-center gap-2 text-sm text-white/90 hover:text-white"
              >
                <User size={16} />
                Profile
              </Link>

              <button
                onClick={() => {
                  closeMenu();
                  handleLogout();
                }}
                className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              onClick={closeMenu}
              className="mt-1 flex items-center justify-between rounded-xl px-4 py-3 text-sm text-white/85 hover:bg-white/5"
            >
              Sign In
              <ArrowUpRight size={16} className="text-white/40" />
            </Link>
          )}

          <Link
            href="/shop"
            onClick={closeMenu}
            className="mt-2 flex items-center justify-between rounded-xl bg-[var(--lime)] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-[var(--green-950)] transition hover:brightness-105"
          >
            Shop Fresh
            <ArrowUpRight size={16} />
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
