// components/layout/Navbar.tsx
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  ShoppingCart,
  User,
  LogOut,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/app/providers";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/hooks/useSettings";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  parentId?: string | null;
  children?: Category[];
  _count?: { products?: number };
}

interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  avatar?: string | null;
}

const FALLBACK_CATEGORIES: Category[] = [
  { id: "fb-veg", name: "Fresh Vegetables", slug: "vegetables", description: "Organic roots, fresh greens & farm produce", icon: "🥦" },
  { id: "fb-fruits", name: "Organic Fruits", slug: "fruits", description: "Seasonal sweet fruits, berries & citrus", icon: "🍎" },
  { id: "fb-grains", name: "Grains & Cereals", slug: "grains", description: "Wheat, corn, rice & premium pulses", icon: "🌾" },
  { id: "fb-dairy", name: "Dairy & Poultry", slug: "dairy", description: "Pure milk, artisanal cheese & fresh eggs", icon: "🥛" },
  { id: "fb-spices", name: "Herbs & Spices", slug: "spices", description: "Aromatic herbs & freshly dried spices", icon: "🌿" },
  { id: "fb-seeds", name: "Seeds & Nuts", slug: "seeds", description: "High-yield planting seeds & edible nuts", icon: "🥜" },
];

function BrandMark() {
  return (
    <span className="brand-mark shrink-0" aria-hidden="true">
      <span className="leaf leaf-one" /><span className="leaf leaf-two" /><span className="stem" />
    </span>
  );
}

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Blog", href: "/blog" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const productsDropdownRef = useRef<HTMLDivElement>(null);
  const productsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { user, status, logout } = useAuth();
  const { cartCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  const { settings, loading: settingsLoading } = useSettings(true);

  const [localUser, setLocalUser] = useState<User | null>(null);
  const hasSynced = useRef(false);

  const syncUserFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setLocalUser(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    if (!hasSynced.current) { syncUserFromStorage(); hasSynced.current = true; }
  }, [syncUserFromStorage]);

  const activeUser = React.useMemo(() => {
    if (status === "authenticated" && user) return user;
    if (localUser) return localUser;
    return null;
  }, [status, user, localUser]);

  const userRole = (activeUser?.role || "USER").toUpperCase();
  const isAdmin = userRole === "ADMIN";
  const isAuthenticated = status === "authenticated" || (status !== "unauthenticated" && !!activeUser);

  const isAdminRoute = pathname?.startsWith("/admin") || false;
  const isHome = pathname === "/";

  const handleScroll = useCallback(() => {
    if (isHome) setScrolled(window.scrollY > 40);
  }, [isHome]);

  useEffect(() => {
    if (!isHome) return;
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome, handleScroll]);

  const closeAllMenus = useCallback(() => {
    setDropdownOpen(false);
    setProductsDropdownOpen(false);
    setMenuOpen(false);
    setMobileProductsOpen(false);
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => closeAllMenus());
  }, [pathname, closeAllMenus]);

  const handleProductsMouseEnter = useCallback(() => {
    if (productsTimeoutRef.current) clearTimeout(productsTimeoutRef.current);
    setProductsDropdownOpen(true);
  }, []);

  const handleProductsMouseLeave = useCallback(() => {
    if (productsTimeoutRef.current) clearTimeout(productsTimeoutRef.current);
    productsTimeoutRef.current = setTimeout(() => setProductsDropdownOpen(false), 60);
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setDropdownOpen(false);
    if (productsDropdownRef.current && !productsDropdownRef.current.contains(event.target as Node)) setProductsDropdownOpen(false);
  }, []);

  useEffect(() => {
    if (dropdownOpen || productsDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen, productsDropdownOpen, handleClickOutside]);

  const handleLogout = useCallback(() => {
    logout();
    setLocalUser(null);
    router.push("/");
  }, [logout, router]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const response = await fetch(`${apiBaseUrl}/api/categories/public`, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`Failed to load categories (Status: ${response.status})`);
        const data = await response.json();
        if (isMounted) {
          if (Array.isArray(data)) setCategories(data);
          else if (data && Array.isArray(data.categories)) setCategories(data.categories);
          else if (data && Array.isArray(data.data)) setCategories(data.data);
        }
      } catch (err) {
        const error = err as Error;
        console.warn("Categories fetch note:", error.message);
        if (isMounted) setCategoriesError(error.message || "Failed to load categories");
      } finally {
        if (isMounted) setCategoriesLoading(false);
      }
    };
    fetchCategories();
    return () => { isMounted = false; };
  }, []);

  const dashboardHref = isAdmin ? "/admin/dashboard" : "/dashboard";

  if (isAdminRoute) return null;

  const topCategories = categories.filter((c) => !c.parentId);
  const displayCategories = topCategories.length > 0 ? topCategories : categories.length > 0 ? categories : FALLBACK_CATEGORIES;
  const logoUrl = settings?.logo || '';

  return (
    <header className={isHome ? `fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "py-3" : "py-5"}` : "relative z-50 w-full bg-[#071a11] text-white border-b border-white/10 shadow-md"}>
      <div className={isHome ? `mx-auto flex h-[70px] w-[min(1180px,calc(100%-48px))] items-center justify-between border-b transition-all duration-500 ${scrolled ? "rounded-full border-white/10 bg-[rgba(7,26,17,.88)] px-5 shadow-[0_15px_40px_rgba(0,0,0,.18)] backdrop-blur-xl" : "border-white/20 px-0"}` : "mx-auto flex h-[75px] w-[min(1180px,calc(100%-48px))] items-center justify-between px-0"}>
        
        {/* LOGO - Minimized */}
        <Link href="/" className="group flex items-center gap-2" onClick={closeMenu}>
          <div className="relative h-8 w-8 flex items-center justify-center">
            {settingsLoading ? <BrandMark /> : logoUrl ? (
              <Image src={logoUrl} alt={settings?.siteName || "Genesis"} width={28} height={28} className="object-contain" priority onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
            ) : <BrandMark />}
          </div>
          <span className="font-serif-heading text-lg font-semibold tracking-[-0.045em] text-white">
            {settings?.siteName || "Genesis"}
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden items-center gap-5 lg:flex">
          <Link href="/" className="group relative py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70 hover:text-white">
            Home
            <span className={`absolute -bottom-[1px] left-0 h-[2px] bg-[var(--lime)] transition-all duration-300 ${pathname === "/" ? "w-3" : "w-0 group-hover:w-3"}`} />
          </Link>

          <div className="relative" ref={productsDropdownRef} onMouseEnter={handleProductsMouseEnter} onMouseLeave={handleProductsMouseLeave}>
            <Link href="/shop" className="group relative flex items-center gap-1 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70 hover:text-white">
              <span>Products</span>
              <ChevronDown className={`h-3 w-3 text-white/60 transition-transform duration-150 ${productsDropdownOpen ? "rotate-180 text-[var(--lime)]" : "group-hover:text-white"}`} />
              <span className={`absolute -bottom-[1px] left-0 h-[2px] bg-[var(--lime)] transition-all duration-150 ${pathname === "/shop" || productsDropdownOpen ? "w-3" : "w-0 group-hover:w-3"}`} />
            </Link>

            <div className={`absolute -left-6 sm:-left-12 lg:-left-20 xl:left-0 top-full mt-2 w-[580px] sm:w-[640px] max-w-[calc(100vw-2.5rem)] origin-top-left rounded-[24px] border border-[#1e4d35] bg-[#071a11] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.85)] transition-all duration-100 ease-out z-50 ${productsDropdownOpen ? "scale-100 opacity-100 translate-y-0 pointer-events-auto" : "scale-95 opacity-0 -translate-y-3 pointer-events-none"}`}>
              <div className="flex items-center justify-between pb-2.5 border-b border-[#16412c]">
                <h4 className="text-xs font-semibold text-white tracking-wide">Categories</h4>
                <Link href="/shop" onClick={closeAllMenus} className="flex items-center gap-1.5 rounded-full border border-[#1e4d35] bg-[#0b2419] px-2.5 py-1 text-[10px] font-semibold text-[var(--lime)] hover:bg-[#123825] hover:border-[var(--lime)]/40 hover:text-white">
                  <span>Shop</span> <ArrowUpRight size={12} />
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2.5 max-h-[320px] overflow-y-auto pr-1">
                {displayCategories.slice(0, 9).map((cat) => {
                  const productCount = cat._count?.products;
                  const subCount = cat.children?.length || 0;
                  const imageSrc = cat.image ? (cat.image.startsWith("http") ? cat.image : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${cat.image}`) : null;
                  return (
                    <Link key={cat.id} href={`/shop?category=${encodeURIComponent(cat.slug || cat.id)}`} onClick={closeAllMenus} className="group/cat flex items-start gap-2 p-2 rounded-xl border border-[#16412c] bg-[#0b2419] hover:bg-[#123825] hover:border-[var(--lime)]/40 transition-all duration-200">
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#071a11] border border-[#1c4d35] overflow-hidden text-base group-hover/cat:scale-105 transition-transform">
                        {imageSrc ? <Image src={imageSrc} alt={cat.name} width={36} height={36} className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} /> : <span>{cat.icon || "🌾"}</span>}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-[10px] font-bold text-white group-hover/cat:text-[var(--lime)] transition-colors">{cat.name}</span>
                          {productCount !== undefined && productCount > 0 && <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.2 text-[8px] font-medium text-white/60">{productCount}</span>}
                        </div>
                        <p className="mt-0.5 truncate text-[9px] text-white/50">{cat.description || (subCount > 0 ? `${subCount} subcategories` : "Fresh & verified")}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-2.5 flex justify-end rounded-xl px-2 py-1">
                <Link href="/shop" onClick={closeAllMenus} className="text-[10px] font-bold uppercase tracking-wider text-[var(--lime)] hover:text-white transition-colors">View All →</Link>
              </div>
            </div>
          </div>

          {navLinks.slice(1).map((link) => (
            <Link key={link.label} href={link.href} className="group relative py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70 hover:text-white">
              {link.label}
              <span className={`absolute -bottom-[1px] left-0 h-[2px] bg-[var(--lime)] transition-all duration-300 ${pathname === link.href ? "w-2" : "w-0 group-hover:w-2"}`} />
            </Link>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/cart" className="relative p-1 text-white/80 hover:text-white" aria-label="Cart">
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && <span className="absolute -top-1 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--lime)] px-1 text-[8px] font-black text-[var(--green-950)] shadow-md">{cartCount > 99 ? "99+" : cartCount}</span>}
          </Link>

          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen((prev) => !prev)} className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md hover:bg-white/15 hover:border-white/30">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)] font-bold text-[9px]">
                  {activeUser?.name ? activeUser.name.charAt(0).toUpperCase() : <User className="h-3 w-3" />}
                </div>
                <span className="max-w-[80px] truncate text-[10px] text-white">{activeUser?.name || "Account"}</span>
                <ChevronDown className={`h-3 w-3 text-white/70 transition-transform ${dropdownOpen ? "rotate-180 text-[var(--lime)]" : ""}`} />
              </button>

              <div className={`absolute right-0 top-full mt-2 w-56 origin-top-right rounded-xl border border-[#1e4d35] bg-[#071a11] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.85)] transition-all duration-150 ease-out z-50 ${dropdownOpen ? "scale-100 opacity-100 translate-y-0 pointer-events-auto" : "scale-95 opacity-0 -translate-y-2 pointer-events-none"}`}>
                <div className="flex items-center gap-2 rounded-lg bg-[#0b2419] p-2 border border-[#16412c]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)] font-bold text-[10px] shadow-md">
                    {activeUser?.name ? activeUser.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-[10px] font-semibold text-white">{activeUser?.name || "My Account"}</span>
                      <span className="shrink-0 rounded bg-[var(--lime)]/15 border border-[var(--lime)]/30 px-1 py-0.2 text-[7px] font-bold uppercase text-[var(--lime)]">{userRole}</span>
                    </div>
                    <span className="truncate text-[9px] text-white/60">{activeUser?.email || ""}</span>
                  </div>
                </div>

                <div className="my-1 h-px bg-[#16412c]" />

                <Link href="/profile" onClick={closeAllMenus} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[10px] font-medium text-white/80 hover:bg-[#0b2419] hover:text-white group">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0b2419] border border-[#16412c] text-white/70 group-hover:bg-[var(--lime)] group-hover:text-[var(--green-950)] transition-colors"><User className="h-3.5 w-3.5" /></span>
                  <div><span className="font-semibold text-white text-[10px]">Profile</span></div>
                </Link>

                <Link href="/orders" onClick={closeAllMenus} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[10px] font-medium text-white/80 hover:bg-[#0b2419] hover:text-white group">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0b2419] border border-[#16412c] text-white/70 group-hover:bg-[var(--lime)] group-hover:text-[var(--green-950)] transition-colors"><ShoppingBag className="h-3.5 w-3.5" /></span>
                  <div><span className="font-semibold text-white text-[10px]">Orders</span></div>
                </Link>

               
                <div className="my-1 h-px bg-[#16412c]" />

                <button onClick={() => { setDropdownOpen(false); handleLogout(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[10px] font-semibold text-red-400 hover:bg-red-950/30 hover:text-red-300 group">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-950/40 text-red-400 group-hover:bg-red-900/40"><LogOut className="h-3.5 w-3.5" /></span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <Link href="/auth/signin" className="rounded border border-white/30 px-2.5 py-1 text-[10px] font-medium text-white/90 hover:text-white hover:border-white/60">Sign In</Link>
          )}

          {!isAuthenticated && (
            <Link href="/shop" className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
              Shop
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)] transition-transform group-hover:rotate-45"><ArrowUpRight size={12} strokeWidth={2.2} /></span>
            </Link>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link href="/cart" className="relative p-1.5 text-white/80 hover:text-white" aria-label="Cart">
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && <span className="absolute -top-1 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--lime)] px-1 text-[8px] font-black text-[var(--green-950)] shadow-md">{cartCount > 99 ? "99+" : cartCount}</span>}
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20">
            {menuOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={isHome ? `mx-auto mt-1.5 w-[min(1180px,calc(100%-48px))] overflow-hidden rounded-[16px] border border-white/10 bg-[rgba(7,26,17,.96)] shadow-[0_20px_60px_rgba(0,0,0,.3)] backdrop-blur-xl transition-all duration-300 lg:hidden ${menuOpen ? "max-h-[600px] opacity-100" : "pointer-events-none max-h-0 opacity-0"}` : `mx-auto w-[min(1180px,calc(100%-48px))] overflow-hidden rounded-b-[12px] bg-[#071a11] transition-all duration-300 lg:hidden ${menuOpen ? "max-h-[600px] opacity-100 border-t border-white/10 py-2" : "pointer-events-none max-h-0 opacity-0"}`}>
        <nav className="p-2">
          <Link href="/" onClick={closeMenu} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/5 hover:text-white">
            <span className="flex items-center gap-2"><span className="text-[8px] font-bold tracking-widest text-[var(--lime)]">01</span> Home</span>
            <ArrowUpRight size={14} className="text-white/40" />
          </Link>

          <div>
            <button onClick={() => setMobileProductsOpen(!mobileProductsOpen)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/5 hover:text-white">
              <span className="flex items-center gap-2"><span className="text-[8px] font-bold tracking-widest text-[var(--lime)]">02</span> Products</span>
              <ChevronDown size={14} className={`text-white/40 transition-transform ${mobileProductsOpen ? "rotate-180 text-[var(--lime)]" : ""}`} />
            </button>

            <div className={`overflow-hidden transition-all duration-300 ${mobileProductsOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="mx-2 mb-2 rounded-xl bg-white/[0.03] border border-white/5 p-2 space-y-1">
                <Link href="/shop" onClick={closeMenu} className="flex items-center justify-between rounded-lg bg-[var(--lime)]/10 border border-[var(--lime)]/20 px-2.5 py-1.5 text-[10px] font-bold text-[var(--lime)] hover:bg-[var(--lime)]/20 transition">
                  <span>🌱 Browse All</span> <ArrowUpRight size={12} />
                </Link>
                <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                  {displayCategories.map((cat) => (
                    <Link key={cat.id} href={`/shop?category=${encodeURIComponent(cat.slug || cat.id)}`} onClick={closeMenu} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[10px] text-white/70 hover:bg-white/5 hover:text-white transition">
                      <span className="flex items-center gap-1.5 truncate"><span>{cat.icon || "🌾"}</span><span className="truncate">{cat.name}</span></span>
                      <ChevronRight size={12} className="text-white/30" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {navLinks.slice(1).map((link, index) => (
            <Link key={link.label} href={link.href} onClick={closeMenu} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/5 hover:text-white">
              <span className="flex items-center gap-2"><span className="text-[8px] font-bold tracking-widest text-[var(--lime)]">0{index + 3}</span> {link.label}</span>
              <ArrowUpRight size={14} className="text-white/40" />
            </Link>
          ))}

          {isAuthenticated ? (
            <div className="mt-2 border-t border-white/10 pt-2 space-y-1">
              <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] p-2 border border-white/5 mb-1.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)] font-bold text-[10px]">
                  {activeUser?.name ? activeUser.name.charAt(0).toUpperCase() : <User size={14} />}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-semibold text-white">{activeUser?.name || "My Account"}</span>
                    <span className="rounded bg-[var(--lime)]/15 border border-[var(--lime)]/30 px-1 py-0.2 text-[7px] font-bold uppercase text-[var(--lime)]">{userRole}</span>
                  </div>
                  <span className="truncate text-[9px] text-white/50">{activeUser?.email || ""}</span>
                </div>
              </div>

              <Link href="/profile" onClick={closeMenu} className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-white/90 hover:bg-white/5 hover:text-white">
                <span className="flex items-center gap-2"><User size={14} /> Profile</span>
                <ArrowUpRight size={14} className="text-white/40" />
              </Link>

              <Link href="/orders" onClick={closeMenu} className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-white/90 hover:bg-white/5 hover:text-white">
                <span className="flex items-center gap-2"><ShoppingBag size={14} /> Orders</span>
                <ArrowUpRight size={14} className="text-white/40" />
              </Link>

              <button onClick={closeMenu} className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300">
                <span className="flex items-center gap-2"><LogOut size={14} /> Sign Out</span>
              </button>
            </div>
          ) : (
            <Link href="/auth/signin" onClick={closeMenu} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-white/85 hover:bg-white/5">
              Sign In <ArrowUpRight size={14} className="text-white/40" />
            </Link>
          )}

          {!isAuthenticated && (
            <Link href="/shop" onClick={closeMenu} className="mt-2 flex items-center justify-between rounded-lg bg-[var(--lime)] px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--green-950)] hover:brightness-105">
              Shop <ArrowUpRight size={14} />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;