// app/orders/page.tsx
"use client";

import React, {
  Suspense,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/app/providers";
import { useLanguage } from "@/context/LanguageContext";
import { ordersApi } from "@/lib/api";

// ============================================================
// API base + image resolver (same rule used app-wide)
// ============================================================
const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, "");

const DEFAULT_IMAGE = "/placeholder.svg";

function resolveImage(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_IMAGE;
  const s = raw.trim();
  if (!s) return DEFAULT_IMAGE;

  // 1. Absolute URL (Cloudinary, S3, Unsplash, …)
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("data:")) return s;

  // 2. Cloudinary host without protocol
  if (s.startsWith("res.cloudinary.com/")) return `https://${s}`;

  // 3. Legacy /uploads/... → backend origin
  if (s.startsWith("/uploads/")) return `${API_BASE_URL}${s}`;
  if (s.startsWith("uploads/")) return `${API_BASE_URL}/${s}`;

  // 4. Bare filename
  if (!s.includes("/") && /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(s)) {
    return `${API_BASE_URL}/uploads/products/${s}`;
  }

  return DEFAULT_IMAGE;
}

// ============================================================
// Types
// ============================================================
type OrderStatus =
  | "PENDING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    images: string[];
    slug: string;
    price: number;
  };
}

interface Order {
  id: string;
  orderNumber: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

// ============================================================
// Status config
// ============================================================
type FilterType = "All" | OrderStatus;

function buildStatusConfig(
  t: (key: string, fallback?: string) => string
): Record<
  OrderStatus,
  {
    color: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
    label: string;
  }
> {
  return {
    PENDING: {
      color: "text-yellow-700",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      icon: <Clock size={13} />,
      label: t("orders.status_pending", "Pending"),
    },
    SHIPPED: {
      color: "text-purple-700",
      bg: "bg-purple-50",
      border: "border-purple-200",
      icon: <Truck size={13} />,
      label: t("orders.status_shipped", "Shipped"),
    },
    COMPLETED: {
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: <Check size={13} strokeWidth={3} />,
      label: t("orders.status_completed", "Completed"),
    },
    CANCELLED: {
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      icon: <X size={13} strokeWidth={3} />,
      label: t("orders.status_cancelled", "Cancelled"),
    },
    REJECTED: {
      color: "text-gray-600",
      bg: "bg-gray-50",
      border: "border-gray-200",
      icon: <X size={13} strokeWidth={3} />,
      label: t("orders.status_rejected", "Rejected"),
    },
  };
}

// ============================================================
// Helpers
// ============================================================
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getOrderTotal(items: OrderItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ============================================================
// Loading fallback
// ============================================================
function OrdersPageFallback() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#123523] border-t-[#b9d873] rounded-full animate-spin" />
        <p className="text-[#69736b] font-sans text-sm">
          {t("orders.loading", "Loading your orders...")}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Order item thumbnail with fallback
// ============================================================
const OrderItemImage: React.FC<{ src: string; alt: string }> = ({
  src,
  alt,
}) => {
  const [prevSrc, setPrevSrc] = useState(src);
  const [imgSrc, setImgSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setImgSrc(src);
    setFailed(false);
  }

  if (!imgSrc || failed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--cream)]">
        <Package size={20} className="text-[#69736b]/40" />
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      sizes="64px"
      className="object-cover"
      onError={() => setFailed(true)}
      unoptimized={imgSrc.startsWith("/") || imgSrc.includes("images.unsplash.com")}
    />
  );
};

// ============================================================
// Inner component
// ============================================================
function OrdersPageContent() {
  const { user, status } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams?.get("highlight") ?? null;
  const { t } = useLanguage();

  const STATUS_CONFIG = buildStatusConfig(t);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const isMountedRef = useRef(true);
  const hasFetchedInitialRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signin");
    }
  }, [status, router]);

  const fetchOrders = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      try {
        if (!silent) setRefreshing(true);
        setError(null);

        const response = await ordersApi.getOrders({ limit: 100 });

        if (!isMountedRef.current) return;

        const list = (response?.orders ?? []) as Order[];
        list.sort((a, b) => b.orderNumber - a.orderNumber);
        setOrders(list);

        if (highlightId && list.some((o) => o.id === highlightId)) {
          setExpandedOrder(highlightId);
        } else if (list.length > 0) {
          setExpandedOrder((prev) => prev ?? list[0].id);
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
        if (!isMountedRef.current) return;
        setError(
          t(
            "orders.error_load",
            "Failed to load your orders. Please try again."
          )
        );
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [highlightId]
  );

  useEffect(() => {
    if (status !== "authenticated") return;
    if (hasFetchedInitialRef.current) return;
    hasFetchedInitialRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        if (cancelled) return;
        await fetchOrders();
      } catch {
        /* handled inside fetchOrders */
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (status === "loading" || (loading && status === "authenticated")) {
    return <OrdersPageFallback />;
  }

  if (!user) return null;

  const filteredOrders =
    activeFilter === "All"
      ? orders
      : orders.filter((o) => o.status === activeFilter);

  const filterCounts: Record<FilterType, number> = {
    All: orders.length,
    PENDING: orders.filter((o) => o.status === "PENDING").length,
    SHIPPED: orders.filter((o) => o.status === "SHIPPED").length,
    COMPLETED: orders.filter((o) => o.status === "COMPLETED").length,
    CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
    REJECTED: orders.filter((o) => o.status === "REJECTED").length,
  };

  const filterTabs: FilterType[] = [
    "All",
    "PENDING",
    "SHIPPED",
    "COMPLETED",
    "CANCELLED",
  ];

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {/* PAGE HEADER */}
      <div className="bg-gradient-to-br from-[#0b2419] via-[#123523] to-[#19472d] relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#b9d873]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#28633e]/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10 sm:pt-28 sm:pb-12">
          <div className="flex items-center gap-2 text-sm text-white/50 mb-6">
            <Link
              href="/profile"
              className="hover:text-[#b9d873] transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              {t("orders.breadcrumb_profile", "My Profile")}
            </Link>
            <ChevronRight size={14} />
            <span className="text-[#b9d873]/80">
              {t("orders.breadcrumb_orders", "Orders")}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white font-serif-heading tracking-tight">
                {t("orders.page_title", "My Orders")}
              </h1>
              <p className="text-[#b9d873]/60 text-sm mt-2">
                {orders.length}{" "}
                {orders.length === 1
                  ? t("orders.order_count_singular", "order placed")
                  : t("orders.order_count_plural", "orders placed")}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => fetchOrders()}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/80 bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "animate-spin" : ""}
                />
                {t("orders.refresh", "Refresh")}
              </button>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#b9d873]/15 text-[#b9d873] border border-[#b9d873]/20 hover:bg-[#b9d873]/25 transition-all duration-200"
              >
                <ShoppingBag size={16} />
                {t("orders.continue_shopping", "Continue Shopping")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[rgba(20,33,25,.09)] shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide -mx-1">
            {filterTabs.map((filter) => {
              const isActive = activeFilter === filter;
              const statusConf =
                filter !== "All" ? STATUS_CONFIG[filter as OrderStatus] : null;

              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-[#123523] text-[#b9d873] shadow-md"
                      : "text-[#69736b] hover:bg-[var(--cream)] hover:text-[#123523]"
                  }`}
                >
                  {statusConf && (
                    <span
                      className={isActive ? "text-[#b9d873]" : statusConf.color}
                    >
                      {statusConf.icon}
                    </span>
                  )}
                  {filter === "All" && (
                    <span
                      className={isActive ? "text-[#b9d873]" : "text-[#69736b]"}
                    >
                      <Package size={14} />
                    </span>
                  )}
                  {filter === "All"
                    ? t("orders.filter_all", "All")
                    : statusConf?.label}
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[20px] text-center ${
                      isActive
                        ? "bg-[#b9d873]/20 text-[#b9d873]"
                        : "bg-[var(--cream)] text-[#69736b]"
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

      {/* ORDER LIST */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => fetchOrders()}
              className="text-xs font-bold text-red-700 hover:text-red-900 underline"
            >
              {t("orders.retry", "Retry")}
            </button>
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[rgba(20,33,25,.09)] shadow-sm p-10 sm:p-16 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--cream)] flex items-center justify-center mb-5">
              <Package size={36} className="text-[#69736b]/50" />
            </div>
            <h3 className="text-xl font-bold text-[#123523] font-serif-heading mb-2">
              {activeFilter !== "All"
                ? t("orders.empty_title_filtered", "No {status} orders found").replace(
                    "{status}",
                    STATUS_CONFIG[activeFilter as OrderStatus].label.toLowerCase()
                  )
                : t("orders.empty_title_all", "No orders found")}
            </h3>
            <p className="text-sm text-[#69736b] max-w-sm mx-auto mb-6">
              {activeFilter === "All"
                ? t(
                    "orders.empty_desc_all",
                    "You haven't placed any orders yet. Start browsing our fresh produce!"
                  )
                : t(
                    "orders.empty_desc_filtered",
                    "You don't have any orders with \"{status}\" status."
                  ).replace(
                    "{status}",
                    STATUS_CONFIG[activeFilter as OrderStatus].label
                  )}
            </p>
            {activeFilter !== "All" ? (
              <button
                onClick={() => setActiveFilter("All")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#28633e] bg-green-50 hover:bg-green-100 border border-green-200 transition-all"
              >
                {t("orders.view_all_orders", "View all orders")}
              </button>
            ) : (
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#123523] hover:bg-[#19472d] shadow-md transition-all"
              >
                <ShoppingBag size={16} />
                {t("orders.start_shopping", "Start Shopping")}
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const statusConf = STATUS_CONFIG[order.status];
              const orderTotal = getOrderTotal(order.items);
              const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
              const isHighlighted = order.id === highlightId;

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md ${
                    isHighlighted
                      ? "border-[#b9d873] ring-2 ring-[#b9d873]/30"
                      : "border-[rgba(20,33,25,.09)]"
                  }`}
                >
                  <button
                    onClick={() =>
                      setExpandedOrder(isExpanded ? null : order.id)
                    }
                    className="w-full text-left px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4 group"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${statusConf.bg} ${statusConf.border} border`}
                      >
                        <span className={statusConf.color}>
                          {statusConf.icon}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-[#123523]">
                            {t("orders.order_label", "Order")} #
                            {order.orderNumber}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusConf.bg} ${statusConf.border} ${statusConf.color}`}
                          >
                            {statusConf.icon}
                            {statusConf.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#69736b]">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(order.createdAt)}
                          </span>
                          <span className="hidden sm:flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(order.createdAt)}
                          </span>
                          <span className="text-[#69736b]/50">·</span>
                          <span>
                            {totalItems}{" "}
                            {totalItems === 1
                              ? t("orders.items_singular", "item")
                              : t("orders.items_plural", "items")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-[#123523]">
                          {t("orders.currency", "ETB")}{" "}
                          {orderTotal.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-[#69736b]">
                          {order.paymentMethod ||
                            t("orders.not_specified", "Not specified")}
                        </p>
                      </div>
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--cream)]/60 group-hover:bg-[var(--cream)] transition-all duration-300 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      >
                        <ChevronDown size={16} className="text-[#69736b]" />
                      </div>
                    </div>
                  </button>

                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isExpanded
                        ? "max-h-[2000px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="border-t border-[rgba(20,33,25,.09)]">
                      <div className="divide-y divide-[rgba(20,33,25,.06)]">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 sm:gap-4 px-5 py-3.5 sm:px-6 sm:py-4 hover:bg-[var(--cream)]/30 transition-colors"
                          >
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[var(--cream)] flex-shrink-0 border border-[rgba(20,33,25,.09)] relative">
                              <OrderItemImage
                                src={resolveImage(item.product.images?.[0])}
                                alt={item.product.name}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[#123523] truncate">
                                {item.product.name}
                              </p>
                              <p className="text-xs text-[#69736b] mt-0.5">
                                {t("orders.qty_label", "Qty")}: {item.quantity}{" "}
                                × {t("orders.currency", "ETB")}{" "}
                                {item.price.toLocaleString()}
                              </p>
                            </div>

                            <p className="text-sm font-bold text-[#123523] flex-shrink-0">
                              {t("orders.currency", "ETB")}{" "}
                              {(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="bg-[var(--cream)]/40 px-5 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4 text-xs text-[#69736b]">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} />
                            {t("orders.ordered_on", "Ordered")}{" "}
                            {formatDate(order.createdAt)}{" "}
                            {t("orders.at_time", "at")}{" "}
                            {formatTime(order.createdAt)}
                          </span>
                          <span className="hidden sm:inline text-[#69736b]/40">
                            |
                          </span>
                          <span className="hidden sm:flex items-center gap-1.5">
                            {t("orders.paid_via", "Paid via")}{" "}
                            {order.paymentMethod || t("orders.na", "N/A")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <span className="text-xs text-[#69736b] sm:hidden">
                            {t("orders.paid_via", "Paid via")}{" "}
                            {order.paymentMethod || t("orders.na", "N/A")}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#69736b]">
                              {t("orders.total_label", "Total")}:
                            </span>
                            <span className="text-lg font-bold text-[#123523]">
                              {t("orders.currency", "ETB")}{" "}
                              {orderTotal.toLocaleString()}
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

        {filteredOrders.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-[#69736b] mb-4">
              {t("orders.showing_orders", "Showing {shown} of {total} orders")
                .replace("{shown}", String(filteredOrders.length))
                .replace("{total}", String(orders.length))}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#69736b] bg-white border border-[rgba(20,33,25,.09)] hover:bg-[var(--cream)] transition-all duration-200"
              >
                <ArrowLeft size={15} />
                {t("orders.back_to_profile", "Back to Profile")}
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#123523] hover:bg-[#19472d] shadow-md transition-all duration-200"
              >
                <ShoppingBag size={15} />
                {t("orders.shop_more", "Shop More")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Default export — Suspense boundary
// ============================================================
export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersPageFallback />}>
      <OrdersPageContent />
    </Suspense>
  );
}