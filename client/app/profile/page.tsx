"use client";

import React, {
  useState,
  useRef,
  ChangeEvent,
  useEffect,
  useMemo,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  Package,
  ShoppingCart,
  Heart,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Edit3,
  Check,
  X,
  ChevronRight,
  Shield,
  Clock,
  CreditCard,
  Camera,
  LogOut,
  Star,
  Truck,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/app/providers";
import { useLanguage } from "@/context/LanguageContext";

// ─── Mock data for display ─────────────────────────────────────────────────
const MOCK_STATS = {
  totalOrders: 24,
  wishlistItems: 8,
  cartItems: 3,
  memberSince: "Jan 2024",
};

const MOCK_RECENT_ORDERS = [
  {
    id: "GEN-2024-0847",
    date: "Aug 25, 2026",
    statusKey: "delivered",
    total: 2450,
    items: 3,
  },
  {
    id: "GEN-2024-0831",
    date: "Aug 18, 2026",
    statusKey: "inTransit",
    total: 1875,
    items: 2,
  },
  {
    id: "GEN-2024-0819",
    date: "Aug 10, 2026",
    statusKey: "processing",
    total: 3200,
    items: 5,
  },
];

type StatusKey = "delivered" | "inTransit" | "processing" | "cancelled";

function buildStatusConfig(
  t: (key: string, fallback?: string) => string
): Record<
  StatusKey,
  { color: string; bg: string; icon: React.ReactNode; label: string }
> {
  return {
    delivered: {
      color: "text-emerald-700",
      bg: "bg-emerald-50 border-emerald-200",
      icon: <Check size={12} />,
      label: t("profile.status_delivered", "Delivered"),
    },
    inTransit: {
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-200",
      icon: <Truck size={12} />,
      label: t("profile.status_in_transit", "In Transit"),
    },
    processing: {
      color: "text-blue-700",
      bg: "bg-blue-50 border-blue-200",
      icon: <Clock size={12} />,
      label: t("profile.status_processing", "Processing"),
    },
    cancelled: {
      color: "text-red-700",
      bg: "bg-red-50 border-red-200",
      icon: <X size={12} />,
      label: t("profile.status_cancelled", "Cancelled"),
    },
  };
}

export default function ProfilePage() {
  const { user, status, logout, updateProfile, uploadAvatar } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const derivedFormData = useMemo(
    () => ({
      name: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
      bio: user?.bio || "",
    }),
    [user]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(derivedFormData);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (!isEditing && user) {
      queueMicrotask(() => {
        setFormData({
          name: user.name || "",
          phone: user.phone || "",
          address: user.address || "",
          bio: user.bio || "",
        });
      });
    }
  }, [user?.id, isEditing, user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSaveError(t("profile.error_image_size", "Image must be smaller than 5 MB"));
      setTimeout(() => setSaveError(null), 4000);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSaveError(t("profile.error_image_type", "Please choose an image file"));
      setTimeout(() => setSaveError(null), 4000);
      return;
    }

    const preview = URL.createObjectURL(file);
    setAvatarUrl(preview);

    setAvatarUploading(true);
    setSaveError(null);

    try {
      await uploadAvatar(file);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : t("profile.error_avatar_upload", "Failed to upload avatar");
      setSaveError(msg);
      setTimeout(() => setSaveError(null), 4000);
      setAvatarUrl(null);
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        bio: formData.bio,
      });

      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : t("profile.error_profile_save", "Failed to save profile");
      setSaveError(msg);
      setTimeout(() => setSaveError(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
        bio: user.bio || "",
      });
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-genesis-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-genesis-700 border-t-genesis-lime rounded-full animate-spin" />
          <p className="text-genesis-muted font-sans text-sm">
            {t("profile.loading", "Loading your profile...")}
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const userInitials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  const avatarSrc = user.avatar || avatarUrl || "";

  const STATUS_CONFIG = buildStatusConfig(t);

  return (
    <div className="min-h-screen bg-genesis-cream">
      {/* HERO BANNER */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-genesis-950 via-genesis-900 to-genesis-800" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b9d873' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-genesis-lime/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-genesis-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28 sm:pt-28 sm:pb-32">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6">
            {/* Circular avatar */}
            <div className="relative group">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl transition-transform duration-300 group-hover:scale-[1.02] relative">
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt={user.name || "Profile"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 112px, 128px"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-genesis-500 to-genesis-lime flex items-center justify-center">
                    <span className="text-3xl sm:text-4xl font-bold text-white font-serif">
                      {userInitials}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 w-9 h-9 bg-genesis-lime text-genesis-950 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 border-2 border-white disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label={t(
                  "profile.aria_change_avatar",
                  "Change profile picture"
                )}
                title={t(
                  "profile.aria_change_avatar",
                  "Change profile picture"
                )}
              >
                {avatarUploading ? (
                  <div className="w-4 h-4 border-2 border-genesis-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
              </button>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                title={t(
                  "profile.aria_change_avatar",
                  "Change profile picture"
                )}
              />
            </div>

            <div className="text-center sm:text-left pb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif tracking-tight">
                {user.name || t("profile.default_name", "Genesis User")}
              </h1>
              <p className="text-genesis-lime/80 text-sm mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail size={14} />
                {user.email}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-genesis-lime/15 text-genesis-lime border border-genesis-lime/20">
                  <Star size={12} />
                  {user.role === "ADMIN"
                    ? t("profile.admin_role", "Administrator")
                    : t("profile.member_role", "Member")}
                </span>
                <span className="text-white/40 text-xs flex items-center gap-1">
                  <Calendar size={12} />
                  {t("profile.since_label", "Since")} {MOCK_STATS.memberSince}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK LINKS BAR */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-genesis-cream-dark shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide -mx-1">
            {[
              {
                label: t("profile.nav_orders", "My Orders"),
                icon: <Package size={18} />,
                href: "/orders",
                count: MOCK_STATS.totalOrders,
                color: "text-genesis-700",
              },
              {
                label: t("profile.nav_cart", "Cart"),
                icon: <ShoppingCart size={18} />,
                href: "/cart",
                count: MOCK_STATS.cartItems,
                color: "text-genesis-700",
              },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-genesis-ink hover:bg-genesis-cream transition-all duration-200 whitespace-nowrap group"
              >
                <span
                  className={`${link.color} group-hover:scale-110 transition-transform duration-200`}
                >
                  {link.icon}
                </span>
                <span>{link.label}</span>
                {link.count !== undefined && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-genesis-900 text-genesis-lime min-w-[24px] text-center">
                    {link.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Success toast */}
        {saveSuccess && (
          <div className="animate-fade-in-up fixed top-20 right-4 sm:right-8 z-50 flex items-center gap-3 px-5 py-3 bg-genesis-900 text-genesis-lime rounded-xl shadow-2xl border border-genesis-700">
            <Check size={18} />
            <span className="text-sm font-semibold">
              {t("profile.toast_saved", "Profile updated successfully!")}
            </span>
          </div>
        )}

        {/* Error toast */}
        {saveError && (
          <div className="animate-fade-in-up fixed top-20 right-4 sm:right-8 z-50 flex items-center gap-3 px-5 py-3 bg-red-600 text-white rounded-xl shadow-2xl border border-red-700">
            <X size={18} />
            <span className="text-sm font-semibold">{saveError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl border border-genesis-cream-dark shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-genesis-cream-dark">
                <div>
                  <h2 className="text-lg font-bold text-genesis-ink font-serif">
                    {t(
                      "profile.section_personal_title",
                      "Personal Information"
                    )}
                  </h2>
                  <p className="text-xs text-genesis-muted mt-0.5">
                    {t(
                      "profile.section_personal_sub",
                      "Manage your personal details"
                    )}
                  </p>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-genesis-700 bg-green-50 hover:bg-green-100 border border-green-200 transition-all duration-200"
                  >
                    <Edit3 size={14} />
                    {t("profile.action_edit", "Edit")}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-genesis-muted bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-200 disabled:opacity-50"
                    >
                      <X size={14} />
                      {t("profile.action_cancel", "Cancel")}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-genesis-700 hover:bg-genesis-800 shadow-md shadow-genesis-700/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {t("profile.action_saving", "Saving…")}
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          {t("profile.action_save", "Save")}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="profile-name"
                      className="flex items-center gap-1.5 text-xs font-semibold text-genesis-muted uppercase tracking-wider"
                    >
                      <User size={12} />
                      {t("profile.field_name", "Full Name")}
                    </label>
                    {isEditing ? (
                      <input
                        id="profile-name"
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-genesis-cream-dark bg-genesis-cream/50 text-genesis-ink text-sm font-medium focus:outline-none focus:ring-2 focus:ring-genesis-500/30 focus:border-genesis-500 transition-all"
                      />
                    ) : (
                      <p className="px-4 py-2.5 rounded-xl bg-genesis-cream/40 text-genesis-ink text-sm font-medium">
                        {formData.name || t("profile.empty_value", "—")}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-genesis-muted uppercase tracking-wider">
                      <Mail size={12} />
                      {t("profile.field_email", "Email Address")}
                    </label>
                    <p className="px-4 py-2.5 rounded-xl bg-genesis-cream/40 text-genesis-muted text-sm font-medium flex items-center justify-between">
                      <span>{user.email}</span>
                      <Shield
                        size={14}
                        className="text-genesis-500 flex-shrink-0"
                      />
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="profile-phone"
                      className="flex items-center gap-1.5 text-xs font-semibold text-genesis-muted uppercase tracking-wider"
                    >
                      <Phone size={12} />
                      {t("profile.field_phone", "Phone Number")}
                    </label>
                    {isEditing ? (
                      <input
                        id="profile-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-genesis-cream-dark bg-genesis-cream/50 text-genesis-ink text-sm font-medium focus:outline-none focus:ring-2 focus:ring-genesis-500/30 focus:border-genesis-500 transition-all"
                      />
                    ) : (
                      <p className="px-4 py-2.5 rounded-xl bg-genesis-cream/40 text-genesis-ink text-sm font-medium">
                        {formData.phone || t("profile.empty_value", "—")}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="profile-address"
                      className="flex items-center gap-1.5 text-xs font-semibold text-genesis-muted uppercase tracking-wider"
                    >
                      <MapPin size={12} />
                      {t("profile.field_address", "Location")}
                    </label>
                    {isEditing ? (
                      <input
                        id="profile-address"
                        type="text"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-genesis-cream-dark bg-genesis-cream/50 text-genesis-ink text-sm font-medium focus:outline-none focus:ring-2 focus:ring-genesis-500/30 focus:border-genesis-500 transition-all"
                      />
                    ) : (
                      <p className="px-4 py-2.5 rounded-xl bg-genesis-cream/40 text-genesis-ink text-sm font-medium">
                        {formData.address || t("profile.empty_value", "—")}
                      </p>
                    )}
                  </div>

                  {/* Bio */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label
                      htmlFor="profile-bio"
                      className="flex items-center gap-1.5 text-xs font-semibold text-genesis-muted uppercase tracking-wider"
                    >
                      <Edit3 size={12} />
                      {t("profile.field_bio", "Bio")}
                    </label>
                    {isEditing ? (
                      <textarea
                        id="profile-bio"
                        rows={3}
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-genesis-cream-dark bg-genesis-cream/50 text-genesis-ink text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-genesis-500/30 focus:border-genesis-500 transition-all"
                      />
                    ) : (
                      <p className="px-4 py-2.5 rounded-xl bg-genesis-cream/40 text-genesis-ink text-sm font-medium leading-relaxed">
                        {formData.bio || t("profile.empty_value", "—")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl border border-genesis-cream-dark shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-genesis-cream-dark">
                <div>
                  <h2 className="text-lg font-bold text-genesis-ink font-serif">
                    {t(
                      "profile.section_recent_orders_title",
                      "Recent Orders"
                    )}
                  </h2>
                  <p className="text-xs text-genesis-muted mt-0.5">
                    {t(
                      "profile.section_recent_orders_sub",
                      "Your latest purchases"
                    )}
                  </p>
                </div>
                <Link
                  href="/orders"
                  className="flex items-center gap-1.5 text-sm font-semibold text-genesis-700 hover:text-genesis-800 transition-colors"
                >
                  {t("profile.action_view_all", "View all")}
                  <ChevronRight size={16} />
                </Link>
              </div>

              <div className="divide-y divide-genesis-cream-dark">
                {MOCK_RECENT_ORDERS.map((order) => {
                  const statusConf =
                    STATUS_CONFIG[order.statusKey as StatusKey] ||
                    STATUS_CONFIG.processing;
                  return (
                    <Link
                      key={order.id}
                      href="/orders"
                      className="flex items-center justify-between px-6 py-4 hover:bg-genesis-cream/40 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-genesis-cream flex items-center justify-center text-genesis-700">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-genesis-ink group-hover:text-genesis-700 transition-colors">
                            {order.id}
                          </p>
                          <p className="text-xs text-genesis-muted mt-0.5">
                            {order.date} · {order.items}{" "}
                            {order.items === 1
                              ? t("profile.order_items_singular", "item")
                              : t("profile.order_items_plural", "items")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConf.bg} ${statusConf.color}`}
                        >
                          {statusConf.icon}
                          {statusConf.label}
                        </span>
                        <span className="text-sm font-bold text-genesis-ink hidden sm:block">
                          ETB {order.total.toLocaleString()}
                        </span>
                        <ChevronRight
                          size={16}
                          className="text-genesis-muted/50 group-hover:text-genesis-700 transition-colors"
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: t("profile.stat_orders", "Orders"),
                  value: MOCK_STATS.totalOrders,
                  icon: <Package size={20} />,
                  gradient: "from-genesis-700 to-genesis-800",
                },
                {
                  label: t("profile.stat_wishlist", "Wishlist"),
                  value: MOCK_STATS.wishlistItems,
                  icon: <Heart size={20} />,
                  gradient: "from-genesis-500 to-genesis-700",
                },
                {
                  label: t("profile.stat_in_cart", "In Cart"),
                  value: MOCK_STATS.cartItems,
                  icon: <ShoppingCart size={20} />,
                  gradient: "from-genesis-900 to-genesis-950",
                },
                {
                  label: t("profile.stat_reviews", "Reviews"),
                  value: 12,
                  icon: <Star size={20} />,
                  gradient: "from-genesis-800 to-genesis-900",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-4 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}
                >
                  <div className="absolute -top-3 -right-3 w-14 h-14 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                  <div className="text-white/60 mb-2">{stat.icon}</div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-[11px] text-white/60 font-medium uppercase tracking-wider mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-genesis-cream-dark shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-genesis-cream-dark">
                <h3 className="text-sm font-bold text-genesis-ink">
                  {t(
                    "profile.section_quick_actions_title",
                    "Quick Actions"
                  )}
                </h3>
              </div>
              <div className="p-2">
                {[
                  {
                    label: t("profile.quick_track_title", "Track Orders"),
                    desc: t(
                      "profile.quick_track_desc",
                      "View delivery status"
                    ),
                    icon: <Truck size={18} />,
                    href: "/orders",
                    iconColor: "text-genesis-700 bg-green-50",
                  },
                  {
                    label: t(
                      "profile.quick_payment_title",
                      "Payment & Checkout"
                    ),
                    desc: t(
                      "profile.quick_payment_desc",
                      "Review your cart"
                    ),
                    icon: <CreditCard size={18} />,
                    href: "/cart",
                    iconColor: "text-blue-600 bg-blue-50",
                  },
                  {
                    label: t(
                      "profile.quick_help_title",
                      "Help & Support"
                    ),
                    desc: t("profile.quick_help_desc", "Get assistance"),
                    icon: <HelpCircle size={18} />,
                    href: "/contact",
                    iconColor: "text-genesis-muted bg-gray-50",
                  },
                ].map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-genesis-cream/60 transition-all duration-200 group"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${action.iconColor} group-hover:scale-110 transition-transform duration-200`}
                    >
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-genesis-ink group-hover:text-genesis-700 transition-colors">
                        {action.label}
                      </p>
                      <p className="text-[11px] text-genesis-muted">
                        {action.desc}
                      </p>
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-genesis-muted/40 group-hover:text-genesis-700 group-hover:translate-x-0.5 transition-all duration-200"
                    />
                  </Link>
                ))}
              </div>
            </div>

            {/* Account & Security */}
            <div className="bg-white rounded-2xl border border-genesis-cream-dark shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-genesis-cream-dark">
                <h3 className="text-sm font-bold text-genesis-ink">
                  {t(
                    "profile.section_account_title",
                    "Account & Security"
                  )}
                </h3>
              </div>
              <div className="p-2">
                <Link
                  href="/settings"
                  className="flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-genesis-cream/60 transition-all duration-200 group"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-genesis-700 bg-green-50 group-hover:scale-110 transition-transform duration-200">
                    <Shield size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-genesis-ink">
                      {t(
                        "profile.account_security_title",
                        "Security Settings"
                      )}
                    </p>
                    <p className="text-[11px] text-genesis-muted">
                      {t("profile.account_security_desc", "Password & 2FA")}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-genesis-muted/40 group-hover:text-genesis-700 transition-colors"
                  />
                </Link>

                <button
                  onClick={logout}
                  className="flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 group w-full text-left"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-red-500 bg-red-50 group-hover:scale-110 transition-transform duration-200">
                    <LogOut size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-600">
                      {t("profile.account_signout_title", "Sign Out")}
                    </p>
                    <p className="text-[11px] text-red-400">
                      {t(
                        "profile.account_signout_desc",
                        "Log out of your account"
                      )}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}