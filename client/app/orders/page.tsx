"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Clock,
  Check,
  X,
  Truck,
  ShoppingBag,
  Calendar,
  Filter,
  Search,
} from "lucide-react";
import { useAuth } from "@/app/providers";

// ─── Types ───────────────────────────────────────────────────────────────────
interface OrderItem {
  id: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
  unit: string;
}

interface Order {
  id: string;
  createdAt: string;
  status: "Delivered" | "In Transit" | "Processing" | "Cancelled";
  paymentMethod: string;
  items: OrderItem[];
}

// ─── Status badge config ─────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; icon: React.ReactNode; label: string }
> = {
  Delivered: {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: <Check size={13} strokeWidth={3} />,
    label: "Delivered",
  },
  "In Transit": {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: <Truck size={13} />,
    label: "In Transit",
  },
  Processing: {
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <Clock size={13} />,
    label: "Processing",
  },
  Cancelled: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: <X size={13} strokeWidth={3} />,
    label: "Cancelled",
  },
};

// ─── Mock order data ─────────────────────────────────────────────────────────
const MOCK_ORDERS: Order[] = [
  {
    id: "GEN-2026-0847",
    createdAt: "2026-08-25T14:30:00",
    status: "Delivered",
    paymentMethod: "Telebirr",
    items: [
      {
        id: "i1",
        name: "Organic Cherry Tomatoes",
        image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&h=200&fit=crop",
        quantity: 2,
        price: 450,
        unit: "kg",
      },
      {
        id: "i2",
        name: "Fresh Avocados",
        image: "https://images.unsplash.com/photo-1523049673857-eb18f1d80f67?w=200&h=200&fit=crop",
        quantity: 5,
        price: 120,
        unit: "pcs",
      },
      {
        id: "i3",
        name: "Ethiopian Honey (Raw)",
        image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&h=200&fit=crop",
        quantity: 1,
        price: 850,
        unit: "jar",
      },
    ],
  },
  {
    id: "GEN-2026-0831",
    createdAt: "2026-08-18T09:15:00",
    status: "In Transit",
    paymentMethod: "Bank Transfer",
    items: [
      {
        id: "i4",
        name: "Teff Flour (Organic)",
        image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&h=200&fit=crop",
        quantity: 3,
        price: 380,
        unit: "kg",
      },
      {
        id: "i5",
        name: "Fresh Green Coffee Beans",
        image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=200&h=200&fit=crop",
        quantity: 2,
        price: 520,
        unit: "kg",
      },
    ],
  },
  {
    id: "GEN-2026-0819",
    createdAt: "2026-08-10T16:45:00",
    status: "Processing",
    paymentMethod: "Chapa",
    items: [
      {
        id: "i6",
        name: "Organic Moringa Powder",
        image: "https://images.unsplash.com/photo-1515023115894-bacee40cce4e?w=200&h=200&fit=crop",
        quantity: 1,
        price: 650,
        unit: "pack",
      },
      {
        id: "i7",
        name: "Fresh Mango (Alphonso)",
        image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=200&h=200&fit=crop",
        quantity: 4,
        price: 180,
        unit: "pcs",
      },
      {
        id: "i8",
        name: "Berbere Spice Blend",
        image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&h=200&fit=crop",
        quantity: 2,
        price: 290,
        unit: "pack",
      },
      {
        id: "i9",
        name: "Organic Sesame Seeds",
        image: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=200&h=200&fit=crop",
        quantity: 1,
        price: 340,
        unit: "kg",
      },
      {
        id: "i10",
        name: "Fresh Rosemary Bundle",
        image: "https://images.unsplash.com/photo-1515586838455-8f8f940d6853?w=200&h=200&fit=crop",
        quantity: 3,
        price: 95,
        unit: "bunch",
      },
    ],
  },
  {
    id: "GEN-2026-0790",
    createdAt: "2026-07-28T11:20:00",
    status: "Cancelled",
    paymentMethod: "Telebirr",
    items: [
      {
        id: "i11",
        name: "Red Onions (Premium)",
        image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=200&h=200&fit=crop",
        quantity: 5,
        price: 85,
        unit: "kg",
      },
    ],
  },
  {
    id: "GEN-2026-0752",
    createdAt: "2026-07-15T08:00:00",
    status: "Delivered",
    paymentMethod: "Bank Transfer",
    items: [
      {
        id: "i12",
        name: "Ethiopian Lentils (Misir)",
        image: "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=200&h=200&fit=crop",
        quantity: 3,
        price: 220,
        unit: "kg",
      },
      {
        id: "i13",
        name: "Organic Enset (Kocho)",
        image: "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=200&h=200&fit=crop",
        quantity: 2,
        price: 450,
        unit: "kg",
      },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getOrderTotal(items: OrderItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

type FilterType = "All" | "Delivered" | "In Transit" | "Processing" | "Cancelled";

// ─── Component ───────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(
    MOCK_ORDERS[0]?.id || null
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-genesis-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-genesis-700 border-t-genesis-lime rounded-full animate-spin" />
          <p className="text-genesis-muted font-sans text-sm">
            Loading your orders...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const filteredOrders =
    activeFilter === "All"
      ? MOCK_ORDERS
      : MOCK_ORDERS.filter((o) => o.status === activeFilter);

  const filterCounts: Record<FilterType, number> = {
    All: MOCK_ORDERS.length,
    Delivered: MOCK_ORDERS.filter((o) => o.status === "Delivered").length,
    "In Transit": MOCK_ORDERS.filter((o) => o.status === "In Transit").length,
    Processing: MOCK_ORDERS.filter((o) => o.status === "Processing").length,
    Cancelled: MOCK_ORDERS.filter((o) => o.status === "Cancelled").length,
  };

  return (
    <div className="min-h-screen bg-genesis-cream">
      {/* ═══════════════════════════════════════════════════════════════════════
          PAGE HEADER
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-genesis-950 via-genesis-900 to-genesis-800 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-genesis-lime/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-genesis-500/8 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23b9d873' fill-opacity='1'%3E%3Cpath d='M20 20h-4v-4h4v4zm0-10h-4V6h4v4z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10 sm:pt-28 sm:pb-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-white/50 mb-6">
            <Link
              href="/profile"
              className="hover:text-genesis-lime transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              My Profile
            </Link>
            <ChevronRight size={14} />
            <span className="text-genesis-lime/80">Orders</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white font-serif tracking-tight">
                My Orders
              </h1>
              <p className="text-genesis-lime/60 text-sm mt-2">
                {MOCK_ORDERS.length} order{MOCK_ORDERS.length !== 1 ? "s" : ""}{" "}
                placed
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-genesis-lime/15 text-genesis-lime border border-genesis-lime/20 hover:bg-genesis-lime/25 transition-all duration-200 self-start sm:self-auto"
            >
              <ShoppingBag size={16} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          FILTER TABS
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-genesis-cream-dark shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide -mx-1">
            {(
              ["All", "Processing", "In Transit", "Delivered", "Cancelled"] as FilterType[]
            ).map((filter) => {
              const isActive = activeFilter === filter;
              const statusConf =
                filter !== "All" ? STATUS_CONFIG[filter] : null;

              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-genesis-900 text-genesis-lime shadow-md"
                      : "text-genesis-muted hover:bg-genesis-cream hover:text-genesis-ink"
                  }`}
                >
                  {statusConf && (
                    <span className={isActive ? "text-genesis-lime" : statusConf.color}>
                      {statusConf.icon}
                    </span>
                  )}
                  {filter === "All" && (
                    <span className={isActive ? "text-genesis-lime" : "text-genesis-muted"}>
                      <Package size={14} />
                    </span>
                  )}
                  {filter}
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[20px] text-center ${
                      isActive
                        ? "bg-genesis-lime/20 text-genesis-lime"
                        : "bg-genesis-cream text-genesis-muted"
                    }`}
                  >
                    {filterCounts[filter]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ORDER LIST
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {filteredOrders.length === 0 ? (
          /* ─── Empty state ───────────────────────────────────────────── */
          <div className="bg-white rounded-2xl border border-genesis-cream-dark shadow-sm p-10 sm:p-16 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-genesis-cream flex items-center justify-center mb-5">
              <Package size={36} className="text-genesis-muted/50" />
            </div>
            <h3 className="text-xl font-bold text-genesis-ink font-serif mb-2">
              No {activeFilter !== "All" ? activeFilter.toLowerCase() : ""}{" "}
              orders found
            </h3>
            <p className="text-sm text-genesis-muted max-w-sm mx-auto mb-6">
              {activeFilter === "All"
                ? "You haven't placed any orders yet. Start browsing our fresh produce!"
                : `You don't have any orders with "${activeFilter}" status.`}
            </p>
            {activeFilter !== "All" ? (
              <button
                onClick={() => setActiveFilter("All")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-genesis-700 bg-green-50 hover:bg-green-100 border border-green-200 transition-all"
              >
                View all orders
              </button>
            ) : (
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-genesis-700 hover:bg-genesis-800 shadow-md shadow-genesis-700/20 transition-all"
              >
                <ShoppingBag size={16} />
                Start Shopping
              </Link>
            )}
          </div>
        ) : (
          /* ─── Order cards ───────────────────────────────────────────── */
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const statusConf = STATUS_CONFIG[order.status];
              const orderTotal = getOrderTotal(order.items);
              const totalItems = order.items.reduce(
                (s, i) => s + i.quantity,
                0
              );

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-genesis-cream-dark shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
                >
                  {/* ── Order header (always visible) ──────────────── */}
                  <button
                    onClick={() =>
                      setExpandedOrder(isExpanded ? null : order.id)
                    }
                    className="w-full text-left px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4 group"
                    aria-expanded={isExpanded}
                    aria-label={`Order ${order.id}, ${order.status}`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      {/* Order icon */}
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${statusConf.bg} ${statusConf.border} border`}
                      >
                        <span className={statusConf.color}>
                          {statusConf.icon}
                        </span>
                      </div>

                      {/* Order info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-genesis-ink">
                            {order.id}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusConf.bg} ${statusConf.border} ${statusConf.color}`}
                          >
                            {statusConf.icon}
                            {statusConf.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-genesis-muted">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(order.createdAt)}
                          </span>
                          <span className="hidden sm:flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(order.createdAt)}
                          </span>
                          <span className="text-genesis-muted/50">·</span>
                          <span>
                            {totalItems} item{totalItems > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side — total + chevron */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-genesis-ink">
                          ETB {orderTotal.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-genesis-muted">
                          {order.paymentMethod}
                        </p>
                      </div>
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center bg-genesis-cream/60 group-hover:bg-genesis-cream transition-all duration-300 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      >
                        <ChevronDown
                          size={16}
                          className="text-genesis-muted"
                        />
                      </div>
                    </div>
                  </button>

                  {/* ── Expanded content: item list ────────────────── */}
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isExpanded
                        ? "max-h-[2000px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="border-t border-genesis-cream-dark">
                      {/* Items */}
                      <div className="divide-y divide-genesis-cream-dark/60">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 sm:gap-4 px-5 py-3.5 sm:px-6 sm:py-4 hover:bg-genesis-cream/30 transition-colors"
                          >
                            {/* Product image */}
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-genesis-cream flex-shrink-0 border border-genesis-cream-dark">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>

                            {/* Product info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-genesis-ink truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-genesis-muted mt-0.5">
                                Qty: {item.quantity} {item.unit}
                                {item.quantity > 1 ? "s" : ""} × ETB{" "}
                                {item.price.toLocaleString()}
                              </p>
                            </div>

                            {/* Item total */}
                            <p className="text-sm font-bold text-genesis-ink flex-shrink-0">
                              ETB{" "}
                              {(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Order summary footer */}
                      <div className="bg-genesis-cream/40 px-5 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4 text-xs text-genesis-muted">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} />
                            Ordered {formatDate(order.createdAt)} at{" "}
                            {formatTime(order.createdAt)}
                          </span>
                          <span className="hidden sm:inline text-genesis-muted/40">
                            |
                          </span>
                          <span className="hidden sm:flex items-center gap-1.5">
                            Paid via {order.paymentMethod}
                          </span>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <span className="text-xs text-genesis-muted sm:hidden">
                            Paid via {order.paymentMethod}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-genesis-muted">
                              Total:
                            </span>
                            <span className="text-lg font-bold text-genesis-ink">
                              ETB {orderTotal.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Bottom CTA ─────────────────────────────────────────────── */}
        {filteredOrders.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-genesis-muted mb-4">
              Showing {filteredOrders.length} of {MOCK_ORDERS.length} orders
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-genesis-muted bg-white border border-genesis-cream-dark hover:bg-genesis-cream transition-all duration-200"
              >
                <ArrowLeft size={15} />
                Back to Profile
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-genesis-700 hover:bg-genesis-800 shadow-md shadow-genesis-700/20 transition-all duration-200"
              >
                <ShoppingBag size={15} />
                Shop More
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
