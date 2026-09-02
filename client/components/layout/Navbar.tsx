// components/layout/Navbar.tsx
"use client";

import React, { useEffect, useState, useRef, useCallback, useSyncExternalStore } from "react";
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
  Globe,
} from "lucide-react";
import { useAuth } from "@/app/providers";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/hooks/useSettings";
import { useLanguage } from "@/context/LanguageContext";

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

// Use the same mounted detection as Footer
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useMounted() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

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
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  // FIX: Get settings with refetch and forceUpdate from useSettings hook
  const { settings, loading: settingsLoading, refetch, forceUpdate } = useSettings();

  const [localUser, setLocalUser] = useState<User | null>(null);
  const hasSynced = useRef(false);

  const mounted = useMounted();

  // FIX: Use a state for render key, but update it safely
  const [renderKey, setRenderKey] = useState(0);

  // Only use settings values after client-side mount
  const logoUrl = mounted ? (settings?.logo || '') : '';
  const siteName = mounted ? (settings?.siteName || 'Genesis') : 'Genesis';

  // FIX: Use useRef to track if we're in a render cycle
  const isRenderingRef = useRef(false);

  // FIX: Safe way to trigger re-render - use a state update that's batched
  const triggerReRender = useCallback(() => {
    // Use requestAnimationFrame to ensure we're not in the middle of rendering
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        setRenderKey(prev => prev + 1);
      });
    }
  }, []);

  // FIX: Listen for settings changes - DON'T call setState directly in event listeners
  useEffect(() => {
    const handleSettingsChange = () => {
      console.log('🔄 Settings changed event detected, refreshing navbar...');
      // Force update from the provider
      forceUpdate();
      // Schedule the re-render safely
      triggerReRender();
      if (refetch) {
        refetch();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'site_settings' && e.newValue) {
        console.log('🔄 Settings changed in another tab, refreshing navbar...');
        try {
          const parsed = JSON.parse(e.newValue);
          console.log('📦 New settings from storage:', parsed);
          forceUpdate();
          triggerReRender();
        } catch (error) {
          console.error('Error parsing storage data:', error);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Tab visible, refreshing settings...');
        forceUpdate();
        triggerReRender();
        if (refetch) {
          refetch();
        }
      }
    };

    const handleFocus = () => {
      console.log('🔄 Window focused, refreshing settings...');
      forceUpdate();
      triggerReRender();
      if (refetch) {
        refetch();
      }
    };

    window.addEventListener('settings-change', handleSettingsChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    console.log('✅ Navbar settings listeners registered');

    return () => {
      window.removeEventListener('settings-change', handleSettingsChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetch, forceUpdate, triggerReRender]);

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
  const isHome = pathname === "/" || pathname === "/blog" || pathname === "/about" || pathname === "/shop";

  const handleScroll = useCallback(() => {
    if (isHome) setScrolled(window.scrollY > 40);
  }, [isHome]);

  useEffect(() => {
    if (!isHome) return;
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll, isHome]);

  // Fetch categories with proper cleanup
  useEffect(() => {
    let isMounted = true;
    
    const fetchCategories = async () => {
      if (!isMounted) return;
      
      try {
        setCategoriesLoading(true);
        setCategoriesError(null);
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/categories`);
        
        if (!isMounted) return;
        
        if (res.ok) {
          const data = await res.json();
          const cats = Array.isArray(data) ? data : data.data || [];
          if (isMounted) {
            setCategories(cats);
            setCategoriesError(null);
          }
        } else {
          if (isMounted) {
            setCategories(FALLBACK_CATEGORIES);
          }
        }
      } catch (error) {
        if (isMounted) {
          setCategories(FALLBACK_CATEGORIES);
          setCategoriesError(error instanceof Error ? error.message : "Failed to fetch categories");
        }
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (productsDropdownRef.current && !productsDropdownRef.current.contains(e.target as Node)) {
        setProductsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProductsMouseEnter = () => {
    if (productsTimeoutRef.current) clearTimeout(productsTimeoutRef.current);
    setProductsDropdownOpen(true);
  };

  const handleProductsMouseLeave = () => {
    productsTimeoutRef.current = setTimeout(() => {
      setProductsDropdownOpen(false);
    }, 150);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setMobileProductsOpen(false);
  };

  const closeAllMenus = () => {
    setMenuOpen(false);
    setMobileProductsOpen(false);
    setDropdownOpen(false);
    setProductsDropdownOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      closeAllMenus();
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (isAdminRoute) return null;

  const topCategories = categories.filter((c) => !c.parentId);
  const displayCategories = topCategories.length > 0 ? topCategories : categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  const dynamicNavLinks = [
    { label: t("nav.about", "About Us"), href: "/about" },
    { label: t("nav.contact", "Contact"), href: "/contact" },
    { label: t("nav.blog", "Blog"), href: "/blog" },
  ];

  return (
    <header key={renderKey} className={isHome ? `fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "py-3" : "py-5"}` : "relative z-50 w-full bg-[#071a11] text-white border-b border-white/10 shadow-md"}>
      <div className={isHome ? `mx-auto flex h-[70px] w-[min(1180px,calc(100%-48px))] items-center justify-between border-b transition-all duration-500 ${scrolled ? "rounded-full border-white/10 bg-[rgba(7,26,17,.88)] px-5 shadow-[0_15px_40px_rgba(0,0,0,.18)] backdrop-blur-xl" : "border-white/20 px-0"}` : "mx-auto flex h-[75px] w-[min(1180px,calc(100%-48px))] items-center justify-between px-0"}>
        
        {/* LOGO - Dynamic from Settings */}
        <Link href="/" className="group flex items-center gap-2" onClick={closeMenu}>
          <div className="relative h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-[#0b2419] border border-white/10 shadow-sm flex-shrink-0">
            {settingsLoading ? (
              <BrandMark />
            ) : logoUrl ? (
              <Image
                key={`logo-${renderKey}`}
                src={logoUrl}
                alt={siteName}
                width={40}
                height={40}
                className="h-full w-full object-cover"
                priority
                onError={(e) => {
                  console.error('Logo failed to load:', logoUrl);
                  // Show fallback brand mark on error
                  const parent = (e.currentTarget as HTMLElement).parentElement;
                  if (parent) {
                    const fallback = document.createElement('span');
                    fallback.className = 'brand-mark shrink-0';
                    fallback.innerHTML = '<span class="leaf leaf-one"></span><span class="leaf leaf-two"></span><span class="stem"></span>';
                    parent.appendChild(fallback);
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }
                }}
                onLoad={() => {
                  console.log('✅ Logo loaded successfully:', logoUrl);
                }}
              />
            ) : (
              <BrandMark />
            )}
          </div>
          <span className="font-serif-heading text-lg font-semibold tracking-[-0.045em] text-white">
            {siteName}
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden items-center gap-5 lg:flex">
          <Link href="/" className="group relative py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70 hover:text-white">
            {t("nav.home", "Home")}
            <span className={`absolute -bottom-[1px] left-0 h-[2px] bg-[var(--lime)] transition-all duration-300 ${pathname === "/" ? "w-3" : "w-0 group-hover:w-3"}`} />
          </Link>

          {/* Products Dropdown */}
          <div className="relative" ref={productsDropdownRef} onMouseEnter={handleProductsMouseEnter} onMouseLeave={handleProductsMouseLeave}>
            <Link href="/shop" className="group relative flex items-center gap-1 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70 hover:text-white">
              <span>{t("nav.products", "Products")}</span>
              <ChevronDown className={`h-3 w-3 text-white/60 transition-transform duration-150 ${productsDropdownOpen ? "rotate-180 text-[var(--lime)]" : "group-hover:text-white"}`} />
              <span className={`absolute -bottom-[1px] left-0 h-[2px] bg-[var(--lime)] transition-all duration-150 ${pathname === "/shop" || productsDropdownOpen ? "w-3" : "w-0 group-hover:w-3"}`} />
            </Link>

            <div className={`absolute -left-6 sm:-left-12 lg:-left-20 xl:left-0 top-full mt-2 w-[580px] sm:w-[640px] max-w-[calc(100vw-2.5rem)] origin-top-left rounded-[24px] border border-[#1e4d35] bg-[#071a11] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.85)] transition-all duration-100 ease-out z-50 ${productsDropdownOpen ? "scale-100 opacity-100 translate-y-0 pointer-events-auto" : "scale-95 opacity-0 -translate-y-3 pointer-events-none"}`}>
              <div className="flex items-center justify-between pb-2.5 border-b border-[#16412c]">
                <h4 className="text-xs font-semibold text-white tracking-wide">{t("nav.categories", "Categories")}</h4>
                <Link href="/shop" onClick={closeAllMenus} className="flex items-center gap-1.5 rounded-full border border-[#1e4d35] bg-[#0b2419] px-2.5 py-1 text-[10px] font-semibold text-[var(--lime)] hover:bg-[#123825] hover:border-[var(--lime)]/40 hover:text-white">
                  <span>{t("nav.shop", "Shop")}</span> <ArrowUpRight size={12} />
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
                        <p className="mt-0.5 truncate text-[9px] text-white/50">{cat.description || (subCount > 0 ? `${subCount} ${t("nav.subcategories", "subcategories")}` : t("nav.fresh_verified", "Fresh & verified"))}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-2.5 flex justify-end rounded-xl px-2 py-1">
                <Link href="/shop" onClick={closeAllMenus} className="text-[10px] font-bold uppercase tracking-wider text-[var(--lime)] hover:text-white transition-colors">
                  {t("nav.view_all", "View All →")}
                </Link>
              </div>
            </div>
          </div>

          {dynamicNavLinks.map((link) => (
            <Link key={link.href} href={link.href} className="group relative py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70 hover:text-white">
              {link.label}
              <span className={`absolute -bottom-[1px] left-0 h-[2px] bg-[var(--lime)] transition-all duration-300 ${pathname === link.href ? "w-2" : "w-0 group-hover:w-2"}`} />
            </Link>
          ))}
        </nav>

        {/* Right Controls - keep the same, just copy from original */}
        <div className="hidden items-center gap-3 lg:flex">
          
          {/* Language Switcher UI (Desktop) */}
          <div className="flex items-center rounded-full bg-white/10 p-0.5 border border-white/20 backdrop-blur-md shadow-sm">
            <Globe size={12} className="ml-1.5 mr-1 text-[var(--lime)] shrink-0" />
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all duration-200 ${language === "en" ? "bg-[var(--lime)] text-[var(--green-950)] shadow-sm" : "text-white/70 hover:text-white"}`}
              aria-label="Switch to English"
              title="English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("am")}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all duration-200 ${language === "am" ? "bg-[var(--lime)] text-[var(--green-950)] shadow-sm" : "text-white/70 hover:text-white"}`}
              aria-label="Switch to Amharic"
              title="አማርኛ"
            >
              አማ
            </button>
          </div>

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
                <span className="max-w-[80px] truncate text-[10px] text-white">{activeUser?.name || t("nav.account", "Account")}</span>
                <ChevronDown className={`h-3 w-3 text-white/70 transition-transform ${dropdownOpen ? "rotate-180 text-[var(--lime)]" : ""}`} />
              </button>

              <div className={`absolute right-0 top-full mt-2 w-56 origin-top-right rounded-xl border border-[#1e4d35] bg-[#071a11] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.85)] transition-all duration-150 ease-out z-50 ${dropdownOpen ? "scale-100 opacity-100 translate-y-0 pointer-events-auto" : "scale-95 opacity-0 -translate-y-2 pointer-events-none"}`}>
                <div className="flex items-center gap-2 rounded-lg bg-[#0b2419] p-2 border border-[#16412c]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)] font-bold text-[10px] shadow-md">
                    {activeUser?.name ? activeUser.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-[10px] font-semibold text-white">{activeUser?.name || t("nav.my_account", "My Account")}</span>
                      <span className="shrink-0 rounded bg-[var(--lime)]/15 border border-[var(--lime)]/30 px-1 py-0.2 text-[7px] font-bold uppercase text-[var(--lime)]">{userRole}</span>
                    </div>
                    <span className="truncate text-[9px] text-white/60">{activeUser?.email || ""}</span>
                  </div>
                </div>

                <div className="my-1 h-px bg-[#16412c]" />

                <Link href="/profile" onClick={closeAllMenus} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[10px] font-medium text-white/80 hover:bg-[#0b2419] hover:text-white group">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0b2419] border border-[#16412c] text-white/70 group-hover:bg-[var(--lime)] group-hover:text-[var(--green-950)] transition-colors"><User className="h-3.5 w-3.5" /></span>
                  <div><span className="font-semibold text-white text-[10px]">{t("nav.profile", "Profile")}</span></div>
                </Link>

                <Link href="/orders" onClick={closeAllMenus} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[10px] font-medium text-white/80 hover:bg-[#0b2419] hover:text-white group">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0b2419] border border-[#16412c] text-white/70 group-hover:bg-[var(--lime)] group-hover:text-[var(--green-950)] transition-colors"><ShoppingBag className="h-3.5 w-3.5" /></span>
                  <div><span className="font-semibold text-white text-[10px]">{t("nav.orders", "Orders")}</span></div>
                </Link>

                {isAdmin && (
                  <Link href="/dashboard" onClick={closeAllMenus} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[10px] font-medium text-white/80 hover:bg-[#0b2419] hover:text-white group">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0b2419] border border-[#16412c] text-white/70 group-hover:bg-[var(--lime)] group-hover:text-[var(--green-950)] transition-colors"><LayoutDashboard className="h-3.5 w-3.5" /></span>
                    <div><span className="font-semibold text-white text-[10px]">{t("nav.dashboard", "Dashboard")}</span></div>
                  </Link>
                )}
                <div className="my-1 h-px bg-[#16412c]" />

                <button onClick={() => { setDropdownOpen(false); handleLogout(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[10px] font-semibold text-red-400 hover:bg-red-950/30 hover:text-red-300 group">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-950/40 text-red-400 group-hover:bg-red-900/40"><LogOut className="h-3.5 w-3.5" /></span>
                  <span>{t("nav.sign_out", "Sign Out")}</span>
                </button>
              </div>
            </div>
          ) : (
            <Link href="/auth/signin" className="rounded border border-white/30 px-2.5 py-1 text-[10px] font-medium text-white/90 hover:text-white hover:border-white/60">
              {t("nav.sign_in", "Sign In")}
            </Link>
          )}

          {!isAuthenticated && (
            <Link href="/shop" className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
              {t("nav.shop", "Shop")}
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)] transition-transform group-hover:rotate-45"><ArrowUpRight size={12} strokeWidth={2.2} /></span>
            </Link>
          )}
        </div>

        {/* Mobile Menu Controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setLanguage(language === "en" ? "am" : "en")}
            className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 border border-white/20 text-[10px] font-bold text-white backdrop-blur-md hover:bg-white/20"
            aria-label="Toggle Language"
          >
            <Globe size={12} className="text-[var(--lime)]" />
            <span>{language === "en" ? "EN" : "አማ"}</span>
          </button>

          <Link href="/cart" className="relative p-1.5 text-white/80 hover:text-white" aria-label="Cart">
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && <span className="absolute -top-1 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--lime)] px-1 text-[8px] font-black text-[var(--green-950)] shadow-md">{cartCount > 99 ? "99+" : cartCount}</span>}
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20" aria-label="Toggle navigation menu">
            {menuOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer - keep the same */}
      <div className={isHome ? `mx-auto mt-1.5 w-[min(1180px,calc(100%-48px))] overflow-hidden rounded-[16px] border border-white/10 bg-[rgba(7,26,17,.96)] shadow-[0_20px_60px_rgba(0,0,0,.3)] backdrop-blur-xl transition-all duration-300 lg:hidden ${menuOpen ? "max-h-[650px] opacity-100" : "pointer-events-none max-h-0 opacity-0"}` : `mx-auto w-[min(1180px,calc(100%-48px))] overflow-hidden rounded-b-[12px] bg-[#071a11] transition-all duration-300 lg:hidden ${menuOpen ? "max-h-[650px] opacity-100 border-t border-white/10 py-2" : "pointer-events-none max-h-0 opacity-0"}`}>
        <nav className="p-2">
          {/* Mobile Language Selector Row */}
          <div className="flex items-center justify-between px-3 py-2 mb-1.5 rounded-lg bg-white/[0.04] border border-white/5">
            <span className="flex items-center gap-2 text-xs font-semibold text-white/80">
              <Globe size={14} className="text-[var(--lime)]" />
              <span>{t("nav.language", "Language")}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${language === "en" ? "bg-[var(--lime)] text-[var(--green-950)]" : "text-white/60 hover:text-white bg-white/5"}`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage("am")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${language === "am" ? "bg-[var(--lime)] text-[var(--green-950)]" : "text-white/60 hover:text-white bg-white/5"}`}
              >
                አማርኛ
              </button>
            </div>
          </div>

          <Link href="/" onClick={closeMenu} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/5 hover:text-white">
            <span className="flex items-center gap-2"><span className="text-[8px] font-bold tracking-widest text-[var(--lime)]">01</span> {t("nav.home", "Home")}</span>
            <ArrowUpRight size={14} className="text-white/40" />
          </Link>

          <div>
            <button onClick={() => setMobileProductsOpen(!mobileProductsOpen)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/5 hover:text-white">
              <span className="flex items-center gap-2"><span className="text-[8px] font-bold tracking-widest text-[var(--lime)]">02</span> {t("nav.products", "Products")}</span>
              <ChevronDown size={14} className={`text-white/40 transition-transform ${mobileProductsOpen ? "rotate-180 text-[var(--lime)]" : ""}`} />
            </button>

            <div className={`overflow-hidden transition-all duration-300 ${mobileProductsOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="mx-2 mb-2 rounded-xl bg-white/[0.03] border border-white/5 p-2 space-y-1">
                <Link href="/shop" onClick={closeMenu} className="flex items-center justify-between rounded-lg bg-[var(--lime)]/10 border border-[var(--lime)]/20 px-2.5 py-1.5 text-[10px] font-bold text-[var(--lime)] hover:bg-[var(--lime)]/20 transition">
                  <span>{t("nav.browse_all", "🌱 Browse All")}</span> <ArrowUpRight size={12} />
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

          {dynamicNavLinks.map((link, index) => (
            <Link key={link.href} href={link.href} onClick={closeMenu} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/5 hover:text-white">
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
                    <span className="truncate text-xs font-semibold text-white">{activeUser?.name || t("nav.my_account", "My Account")}</span>
                    <span className="rounded bg-[var(--lime)]/15 border border-[var(--lime)]/30 px-1 py-0.2 text-[7px] font-bold uppercase text-[var(--lime)]">{userRole}</span>
                  </div>
                  <span className="truncate text-[9px] text-white/50">{activeUser?.email || ""}</span>
                </div>
              </div>

              <Link href="/profile" onClick={closeMenu} className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-white/90 hover:bg-white/5 hover:text-white">
                <span className="flex items-center gap-2"><User size={14} /> {t("nav.profile", "Profile")}</span>
                <ArrowUpRight size={14} className="text-white/40" />
              </Link>

              <Link href="/orders" onClick={closeMenu} className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-white/90 hover:bg-white/5 hover:text-white">
                <span className="flex items-center gap-2"><ShoppingBag size={14} /> {t("nav.orders", "Orders")}</span>
                <ArrowUpRight size={14} className="text-white/40" />
              </Link>

              {isAdmin && (
                <Link href="/dashboard" onClick={closeMenu} className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-white/90 hover:bg-white/5 hover:text-white">
                  <span className="flex items-center gap-2"><LayoutDashboard size={14} /> {t("nav.dashboard", "Dashboard")}</span>
                  <ArrowUpRight size={14} className="text-white/40" />
                </Link>
              )}

              <button onClick={closeMenu} className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300">
                <span className="flex items-center gap-2"><LogOut size={14} /> {t("nav.sign_out", "Sign Out")}</span>
              </button>
            </div>
          ) : (
            <Link href="/auth/signin" onClick={closeMenu} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-white/85 hover:bg-white/5">
              {t("nav.sign_in", "Sign In")} <ArrowUpRight size={14} className="text-white/40" />
            </Link>
          )}

          {!isAuthenticated && (
            <Link href="/shop" onClick={closeMenu} className="mt-2 flex items-center justify-between rounded-lg bg-[var(--lime)] px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--green-950)] hover:brightness-105">
              {t("nav.shop", "Shop")} <ArrowUpRight size={14} />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;