// components/layout/Navbar.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
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
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  LayoutDashboard,
  Layers,
} from "lucide-react";
import { useAuth } from "@/app/providers";
import { useCart } from "@/context/CartContext";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  parentId?: string | null;
  children?: Category[];
  _count?: {
    products?: number;
  };
}

const FALLBACK_CATEGORIES: Category[] = [
  {
    id: "fb-veg",
    name: "Fresh Vegetables",
    slug: "vegetables",
    description: "Organic roots, fresh greens & farm produce",
    icon: "🥦",
  },
  {
    id: "fb-fruits",
    name: "Organic Fruits",
    slug: "fruits",
    description: "Seasonal sweet fruits, berries & citrus",
    icon: "🍎",
  },
  {
    id: "fb-grains",
    name: "Grains & Cereals",
    slug: "grains",
    description: "Wheat, corn, rice & premium pulses",
    icon: "🌾",
  },
  {
    id: "fb-dairy",
    name: "Dairy & Poultry",
    slug: "dairy",
    description: "Pure milk, artisanal cheese & fresh eggs",
    icon: "🥛",
  },
  {
    id: "fb-spices",
    name: "Herbs & Spices",
    slug: "spices",
    description: "Aromatic herbs & freshly dried spices",
    icon: "🌿",
  },
  {
    id: "fb-seeds",
    name: "Seeds & Nuts",
    slug: "seeds",
    description: "High-yield planting seeds & edible nuts",
    icon: "🥜",
  },
];

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
  const [localUser, setLocalUser] = useState<any>(null);

  // Fetch categories from backend
  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const response = await fetch(`${apiBaseUrl}/api/categories/public`, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load categories (Status: ${response.status})`);
        }

        const data = await response.json();
        if (isMounted) {
          if (Array.isArray(data)) {
            setCategories(data);
          } else if (data && Array.isArray(data.categories)) {
            setCategories(data.categories);
          } else if (data && Array.isArray(data.data)) {
            setCategories(data.data);
          }
        }
      } catch (err: any) {
        console.warn("Categories fetch note:", err.message);
        if (isMounted) {
          setCategoriesError(err.message || "Failed to load categories");
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

  // Filter top-level categories
  const topCategories = categories.filter((c) => !c.parentId);
  const displayCategories =
    topCategories.length > 0
      ? topCategories
      : categories.length > 0
      ? categories
      : FALLBACK_CATEGORIES;

  // Sync local storage on mount and when status changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setLocalUser(JSON.parse(stored));
      }
    } catch {}
  }, [status]);

  const activeUser = user || localUser;
  const userRole = (activeUser?.role || "USER").toUpperCase();
  const isAdmin = userRole === "ADMIN";
  const isAuthenticated =
    status === "authenticated" || (status !== "unauthenticated" && !!activeUser);

  const isAdminRoute = pathname?.startsWith("/admin") || false;
  const isHome =
    pathname === "/" ||
    pathname === "/shop" ||
    pathname === "/blog" ||
    pathname === "/about" ||
    pathname === "/orders";

  useEffect(() => {
    if (!isHome) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  // Handle products dropdown hover with smooth debounce
  const handleProductsMouseEnter = () => {
    if (productsTimeoutRef.current) {
      clearTimeout(productsTimeoutRef.current);
      productsTimeoutRef.current = null;
    }
    setProductsDropdownOpen(true);
  };

  const handleProductsMouseLeave = () => {
    if (productsTimeoutRef.current) {
      clearTimeout(productsTimeoutRef.current);
    }
    productsTimeoutRef.current = setTimeout(() => {
      setProductsDropdownOpen(false);
    }, 60);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        productsDropdownRef.current &&
        !productsDropdownRef.current.contains(event.target as Node)
      ) {
        setProductsDropdownOpen(false);
      }
    };

    if (dropdownOpen || productsDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen, productsDropdownOpen]);

  // Close menus on route change
  useEffect(() => {
    setDropdownOpen(false);
    setProductsDropdownOpen(false);
    setMenuOpen(false);
    setMobileProductsOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    setLocalUser(null);
    router.push("/");
  };

  // Dashboard link based on role
  const dashboardHref =
    userRole === "ADMIN"
      ? "/admin/dashboard"
      : userRole === "SELLER" || userRole === "FARMER"
      ? "/seller/dashboard"
      : "/dashboard";

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
          {/* Home Link */}
          <Link
            href="/"
            className="group relative py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70 transition-colors duration-300 hover:text-white"
          >
            Home
            <span
              className={`absolute -bottom-[1px] left-0 h-[2px] bg-[var(--lime)] transition-all duration-300 ${
                pathname === "/" ? "w-4" : "w-0 group-hover:w-4"
              }`}
            />
          </Link>

          {/* =====================================================
              PRODUCTS MEGA DROPDOWN (Hover Activated)
          ====================================================== */}
          <div
            className="relative"
            ref={productsDropdownRef}
            onMouseEnter={handleProductsMouseEnter}
            onMouseLeave={handleProductsMouseLeave}
          >
            <Link
              href="/shop"
              className="group relative flex items-center gap-1 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70 transition-colors duration-300 hover:text-white"
            >
              <span>Our Products</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-white/60 transition-transform duration-150 ${
                  productsDropdownOpen
                    ? "rotate-180 text-[var(--lime)]"
                    : "group-hover:text-white"
                }`}
              />
              {/* Animated indicator line */}
              <span
                className={`absolute -bottom-[1px] left-0 h-[2px] bg-[var(--lime)] transition-all duration-150 ${
                  pathname === "/shop" || productsDropdownOpen
                    ? "w-4"
                    : "w-0 group-hover:w-4"
                }`}
              />
            </Link>

            {/* Floating Dropdown Card with Smooth Slide Down & Solid Background */}
            <div
              className={`absolute -left-6 sm:-left-12 lg:-left-20 xl:left-0 top-full mt-3 w-[660px] sm:w-[720px] max-w-[calc(100vw-2.5rem)] origin-top-left rounded-[28px] border border-[#1e4d35] bg-[#071a11] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.85)] transition-all duration-100 ease-out z-50 ${
                productsDropdownOpen
                  ? "scale-100 opacity-100 translate-y-0 pointer-events-auto"
                  : "scale-95 opacity-0 -translate-y-3 pointer-events-none"
              }`}
            >
              {/* Dropdown Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#16412c]">
                <div className="flex items-center gap-2.5">
                  {/* <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--lime)]/15 text-[var(--lime)] text-sm border border-[var(--lime)]/30">
                    🌱
                  </span> */}
                  <div>
                    <h4 className="text-sm font-semibold text-white tracking-wide">
                      Fresh Produce Categories
                    </h4>
                    
                  </div>
                </div>

                <Link
                  href="/shop"
                  onClick={() => setProductsDropdownOpen(false)}
                  className="flex items-center gap-1.5 rounded-full border border-[#1e4d35] bg-[#0b2419] px-3 py-1.5 text-xs font-semibold text-[var(--lime)] transition-all hover:bg-[#123825] hover:border-[var(--lime)]/40 hover:text-white"
                >
                  <span>Explore Shop</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>

              {/* Categories Content Grid */}
              {categoriesLoading ? (
                /* Loading Skeleton */
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3.5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-[#0b2419] border border-[#16412c] animate-pulse"
                    >
                      <div className="h-11 w-11 rounded-xl bg-white/10 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-20 bg-white/15 rounded" />
                        <div className="h-2.5 w-28 bg-white/10 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Category Cards Grid */
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3.5 max-h-[360px] overflow-y-auto pr-1">
                  {displayCategories.slice(0, 9).map((cat) => {
                    const productCount = cat._count?.products;
                    const subCount = cat.children?.length || 0;
                    const imageSrc = cat.image
                      ? cat.image.startsWith("http")
                        ? cat.image
                        : `${
                            process.env.NEXT_PUBLIC_API_URL ||
                            "http://localhost:5000"
                          }${cat.image}`
                      : null;

                    return (
                      <Link
                        key={cat.id}
                        href={`/shop?category=${encodeURIComponent(
                          cat.slug || cat.id
                        )}`}
                        onClick={() => setProductsDropdownOpen(false)}
                        className="group/cat flex items-start gap-3 p-3 rounded-2xl border border-[#16412c] bg-[#0b2419] hover:bg-[#123825] hover:border-[var(--lime)]/40 hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all duration-200"
                      >
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071a11] border border-[#1c4d35] overflow-hidden text-lg group-hover/cat:scale-105 transition-transform">
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={cat.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <span>{cat.icon || "🌾"}</span>
                          )}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate text-xs font-bold text-white group-hover/cat:text-[var(--lime)] transition-colors">
                              {cat.name}
                            </span>
                            {productCount !== undefined && productCount > 0 && (
                              <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.2 text-[9px] font-medium text-white/60">
                                {productCount}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-[10px] text-white/50">
                            {cat.description ||
                              (subCount > 0
                                ? `${subCount} subcategories`
                                : "Fresh & verified")}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Bottom Feature Bar */}
              <div className="mt-3.5 flex items-right justify-end rounded-2xl px-4 py-2.5">
                <Link
                  href="/shop"
                  onClick={() => setProductsDropdownOpen(false)}
                  className="text-[11px] font-bold uppercase tracking-wider text-[var(--lime)] hover:text-white transition-colors"
                >
                  View All Products →
                </Link>
              </div>
            </div>
          </div>

          {/* Remaining Nav Links */}
          {navLinks.slice(1).map((link) => {
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
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--lime)] px-1 text-[10px] font-black text-[var(--green-950)] shadow-md">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {/* User Auth controls */}
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-all duration-200 hover:bg-white/15 hover:border-white/30 focus:outline-none"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)] font-bold text-[11px]">
                  {activeUser?.name ? (
                    activeUser.name.charAt(0).toUpperCase()
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                </div>
                <span className="max-w-[110px] truncate font-medium text-[13px] text-white">
                  {activeUser?.name || "Account"}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-white/70 transition-transform duration-150 ${
                    dropdownOpen ? "rotate-180 text-[var(--lime)]" : ""
                  }`}
                />
              </button>

              {/* User Dropdown Menu with Smooth Animation & Solid Background */}
              <div
                className={`absolute right-0 top-full mt-2.5 w-72 origin-top-right rounded-2xl border border-[#1e4d35] bg-[#071a11] p-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.85)] transition-all duration-150 ease-out z-50 ${
                  dropdownOpen
                    ? "scale-100 opacity-100 translate-y-0 pointer-events-auto"
                    : "scale-95 opacity-0 -translate-y-2 pointer-events-none"
                }`}
              >
                {/* User Info Header */}
                <div className="flex items-center gap-3 rounded-xl bg-[#0b2419] p-3 border border-[#16412c]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)] font-bold text-sm shadow-md">
                    {activeUser?.name ? (
                      activeUser.name.charAt(0).toUpperCase()
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate font-semibold text-sm text-white">
                        {activeUser?.name || "My Account"}
                      </span>
                      <span className="shrink-0 rounded-md bg-[var(--lime)]/15 border border-[var(--lime)]/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--lime)]">
                        {userRole}
                      </span>
                    </div>
                    <span className="truncate text-xs text-white/60">
                      {activeUser?.email || "No email available"}
                    </span>
                  </div>
                </div>

                <div className="my-1.5 h-px bg-[#16412c]" />

                {/* Direct Links */}
                <div className="space-y-0.5">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-white/80 transition-all hover:bg-[#0b2419] hover:text-white group"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0b2419] border border-[#16412c] text-white/70 group-hover:bg-[var(--lime)] group-hover:text-[var(--green-950)] transition-colors">
                      <User className="h-4 w-4" />
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">My Profile</span>
                      <span className="text-[10px] text-white/50">
                        Account settings & details
                      </span>
                    </div>
                  </Link>

                  <Link
                    href="/orders"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-white/80 transition-all hover:bg-[#0b2419] hover:text-white group"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0b2419] border border-[#16412c] text-white/70 group-hover:bg-[var(--lime)] group-hover:text-[var(--green-950)] transition-colors">
                      <ShoppingBag className="h-4 w-4" />
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">My Orders</span>
                      <span className="text-[10px] text-white/50">
                        Track & view purchases
                      </span>
                    </div>
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-white/80 transition-all hover:bg-[#0b2419] hover:text-white group"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0b2419] border border-[#16412c] text-white/70 group-hover:bg-[var(--lime)] group-hover:text-[var(--green-950)] transition-colors">
                        <LayoutDashboard className="h-4 w-4" />
                      </span>
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">Admin Dashboard</span>
                        <span className="text-[10px] text-white/50">
                          Admin control panel & settings
                        </span>
                      </div>
                    </Link>
                  )}
                </div>

                <div className="my-1.5 h-px bg-[#16412c]" />

                {/* Sign Out Button */}
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-950/30 hover:text-red-300 group"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-950/40 text-red-400 group-hover:bg-red-900/40 transition-colors">
                    <LogOut className="h-4 w-4" />
                  </span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="rounded border border-white/30 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:text-white hover:border-white/60"
            >
              Sign In
            </Link>
          )}

          {/* Shop Fresh CTA Button (Only for logged-out guests) */}
          {!isAuthenticated && (
            <>
              <span className="h-5 w-px bg-white/20" />
              <Link
                href="/shop"
                className="group flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white"
              >
                Shop Fresh
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)] transition-transform duration-150 group-hover:rotate-45">
                  <ArrowUpRight size={14} strokeWidth={2.2} />
                </span>
              </Link>
            </>
          )}
        </div>

        {/* =====================================================
            MOBILE MENU BUTTON
        ====================================================== */}
        <div className="flex items-center gap-3 lg:hidden">
          <Link
            href="/cart"
            className="relative p-1.5 text-white/80 transition hover:text-white"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--lime)] px-1 text-[10px] font-black text-[var(--green-950)] shadow-md">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
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
                  ? "max-h-[700px] opacity-100"
                  : "pointer-events-none max-h-0 opacity-0"
              }`
            : `mx-auto w-[min(1180px,calc(100%-48px))] overflow-hidden rounded-b-[20px] bg-[#071a11] transition-all duration-300 lg:hidden ${
                menuOpen
                  ? "max-h-[700px] opacity-100 border-t border-white/10 py-2"
                  : "pointer-events-none max-h-0 opacity-0"
              }`
        }
      >
        <nav className="p-3">
          {/* Mobile Home */}
          <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5 hover:text-white"
          >
            <span className="flex items-center gap-3">
              <span className="text-[9px] font-bold tracking-widest text-[var(--lime)]">
                01
              </span>
              Home
            </span>
            <ArrowUpRight size={16} className="text-white/40" />
          </Link>

          {/* Mobile Products Accordion */}
          <div>
            <button
              type="button"
              onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <span className="text-[9px] font-bold tracking-widest text-[var(--lime)]">
                  02
                </span>
                Our Products
              </span>
              <ChevronDown
                size={16}
                className={`text-white/40 transition-transform duration-300 ${
                  mobileProductsOpen ? "rotate-180 text-[var(--lime)]" : ""
                }`}
              />
            </button>

            {/* Accordion Categories List */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                mobileProductsOpen
                  ? "max-h-[360px] opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="mx-2 mb-2 rounded-2xl bg-white/[0.03] border border-white/5 p-2 space-y-1">
                <Link
                  href="/shop"
                  onClick={closeMenu}
                  className="flex items-center justify-between rounded-xl bg-[var(--lime)]/10 border border-[var(--lime)]/20 px-3 py-2 text-xs font-bold text-[var(--lime)] hover:bg-[var(--lime)]/20 transition"
                >
                  <span>🌱 Browse All Produce in Shop</span>
                  <ArrowUpRight size={13} />
                </Link>

                <div className="max-h-[220px] overflow-y-auto space-y-0.5">
                  {displayCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/shop?category=${encodeURIComponent(
                        cat.slug || cat.id
                      )}`}
                      onClick={closeMenu}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white transition"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span>{cat.icon || "🌾"}</span>
                        <span className="truncate">{cat.name}</span>
                      </span>
                      <ChevronRight size={12} className="text-white/30" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Remaining Mobile Nav Links */}
          {navLinks.slice(1).map((link, index) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={closeMenu}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <span className="text-[9px] font-bold tracking-widest text-[var(--lime)]">
                  0{index + 3}
                </span>
                {link.label}
              </span>

              <ArrowUpRight size={16} className="text-white/40" />
            </Link>
          ))}

          {isAuthenticated ? (
            <div className="mt-2 border-t border-white/10 pt-3 space-y-1">
              {/* User details card in mobile drawer */}
              <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-3 border border-white/5 mb-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)] font-bold text-sm">
                  {activeUser?.name ? (
                    activeUser.name.charAt(0).toUpperCase()
                  ) : (
                    <User size={16} />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">
                      {activeUser?.name || "My Account"}
                    </span>
                    <span className="rounded bg-[var(--lime)]/15 border border-[var(--lime)]/30 px-1.5 py-0.2 text-[8px] font-bold uppercase text-[var(--lime)]">
                      {userRole}
                    </span>
                  </div>
                  <span className="truncate text-xs text-white/50">
                    {activeUser?.email || ""}
                  </span>
                </div>
              </div>

              <Link
                href="/profile"
                onClick={closeMenu}
                className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm text-white/90 hover:bg-white/5 hover:text-white"
              >
                <span className="flex items-center gap-2.5">
                  <User size={16} />
                  My Profile
                </span>
                <ArrowUpRight size={16} className="text-white/40" />
              </Link>

              <Link
                href="/orders"
                onClick={closeMenu}
                className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm text-white/90 hover:bg-white/5 hover:text-white"
              >
                <span className="flex items-center gap-2.5">
                  <ShoppingBag size={16} />
                  My Orders
                </span>
                <ArrowUpRight size={16} className="text-white/40" />
              </Link>

              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  onClick={closeMenu}
                  className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm text-white/90 hover:bg-white/5 hover:text-white"
                >
                  <span className="flex items-center gap-2.5">
                    <LayoutDashboard size={16} />
                    Admin Dashboard
                  </span>
                  <ArrowUpRight size={16} className="text-white/40" />
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  handleLogout();
                }}
                className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <span className="flex items-center gap-2.5">
                  <LogOut size={16} />
                  Sign Out
                </span>
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

          {!isAuthenticated && (
            <Link
              href="/shop"
              onClick={closeMenu}
              className="mt-2 flex items-center justify-between rounded-xl bg-[var(--lime)] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-[var(--green-950)] transition hover:brightness-105"
            >
              Shop Fresh
              <ArrowUpRight size={16} />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
