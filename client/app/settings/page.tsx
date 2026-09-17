// app/settings/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Bell,
  Globe,
  Shield,
  LogOut,
  Store,
  Palette,
} from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/app/providers";
import { useLanguage } from "@/context/LanguageContext";

export default function UserSettingsPage() {
  const router = useRouter();
  const { settings, loading: settingsLoading } = useSettings();
  const { user, status, logout } = useAuth();
  const { t } = useLanguage();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-genesis-cream flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-genesis-700 border-t-genesis-lime rounded-full animate-spin" />
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

  return (
    <div className="min-h-screen bg-genesis-cream py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back link */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-genesis-muted hover:text-genesis-ink transition-colors"
        >
          <ArrowLeft size={14} /> {t("settings.back_to_profile", "Back to profile")}
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-genesis-cream-dark shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-genesis-500 to-genesis-lime flex items-center justify-center text-white text-lg font-bold shadow-md">
              {userInitials}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-genesis-ink font-serif">
                {t("settings.page_title", "Settings")}
              </h1>
              <p className="text-xs text-genesis-muted truncate">
                {user.name} · {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Account section */}
        <div className="bg-white rounded-2xl border border-genesis-cream-dark shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-genesis-cream-dark">
            <h2 className="text-sm font-bold text-genesis-ink flex items-center gap-2">
              <User size={16} className="text-genesis-700" />{" "}
              {t("settings.section_account", "Account")}
            </h2>
          </div>
          <div className="p-2">
            <Link
              href="/profile"
              className="flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-genesis-cream/60 transition-all duration-200 group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-genesis-700 bg-green-50 group-hover:scale-110 transition-transform">
                <User size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-genesis-ink">
                  {t(
                    "settings.account_personal_title",
                    "Personal Information"
                  )}
                </p>
                <p className="text-[11px] text-genesis-muted">
                  {t(
                    "settings.account_personal_desc",
                    "Name, phone, address, bio"
                  )}
                </p>
              </div>
            </Link>

            <Link
              href="/orders"
              className="flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-genesis-cream/60 transition-all duration-200 group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-genesis-700 bg-blue-50 group-hover:scale-110 transition-transform">
                <Store size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-genesis-ink">
                  {t("settings.account_orders_title", "Order History")}
                </p>
                <p className="text-[11px] text-genesis-muted">
                  {t(
                    "settings.account_orders_desc",
                    "View past purchases"
                  )}
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Security section */}
        <div className="bg-white rounded-2xl border border-genesis-cream-dark shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-genesis-cream-dark">
            <h2 className="text-sm font-bold text-genesis-ink flex items-center gap-2">
              <Shield size={16} className="text-genesis-700" />{" "}
              {t("settings.section_security", "Security")}
            </h2>
          </div>
          <div className="p-2">
            <div className="flex items-start gap-3.5 px-3 py-3 rounded-xl">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-genesis-700 bg-amber-50 flex-shrink-0">
                <Shield size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-genesis-ink">
                  {t(
                    "settings.security_password_title",
                    "Password & 2FA"
                  )}
                </p>
                <p className="text-[11px] text-genesis-muted">
                  {t(
                    "settings.security_password_desc",
                    "Password change and two-factor authentication can be added here."
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences section */}
        <div className="bg-white rounded-2xl border border-genesis-cream-dark shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-genesis-cream-dark">
            <h2 className="text-sm font-bold text-genesis-ink flex items-center gap-2">
              <Bell size={16} className="text-genesis-700" />{" "}
              {t("settings.section_preferences", "Preferences")}
            </h2>
          </div>
          <div className="p-2">
            <div className="flex items-start gap-3.5 px-3 py-3 rounded-xl">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-genesis-700 bg-purple-50 flex-shrink-0">
                <Bell size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-genesis-ink">
                  {t(
                    "settings.preferences_notifications_title",
                    "Notifications"
                  )}
                </p>
                <p className="text-[11px] text-genesis-muted">
                  {t(
                    "settings.preferences_notifications_desc",
                    "Choose which alerts you receive."
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 px-3 py-3 rounded-xl">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-genesis-700 bg-teal-50 flex-shrink-0">
                <Globe size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-genesis-ink">
                  {t(
                    "settings.preferences_language_title",
                    "Language & Region"
                  )}
                </p>
                <p className="text-[11px] text-genesis-muted">
                  {t(
                    "settings.preferences_language_desc",
                    "Switch between English and አማርኛ from the navbar."
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Site info */}
        <div className="bg-white rounded-2xl border border-genesis-cream-dark shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-genesis-cream-dark">
            <h2 className="text-sm font-bold text-genesis-ink flex items-center gap-2">
              <Store size={16} className="text-genesis-700" />{" "}
              {t("settings.section_site_info", "Site Information")}
            </h2>
          </div>
          <div className="p-5 space-y-3">
            {settingsLoading ? (
              <div className="flex items-center gap-3 text-sm text-genesis-muted">
                <div className="w-5 h-5 border-2 border-genesis-700 border-t-transparent rounded-full animate-spin" />
                {t("settings.site_loading", "Loading settings…")}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Store
                    size={16}
                    className="text-genesis-muted flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] text-genesis-muted">
                      {t("settings.site_name_label", "Site name")}
                    </p>
                    <p className="text-sm font-semibold text-genesis-ink truncate">
                      {settings.siteName || t("settings.empty_value", "—")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail
                    size={16}
                    className="text-genesis-muted flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] text-genesis-muted">
                      {t("settings.site_email_label", "Contact email")}
                    </p>
                    <p className="text-sm font-semibold text-genesis-ink truncate">
                      {settings.contactEmail ||
                        t("settings.empty_value", "—")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone
                    size={16}
                    className="text-genesis-muted flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] text-genesis-muted">
                      {t("settings.site_phone_label", "Phone")}
                    </p>
                    <p className="text-sm font-semibold text-genesis-ink truncate">
                      {settings.contactPhone ||
                        t("settings.empty_value", "—")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin
                    size={16}
                    className="text-genesis-muted flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] text-genesis-muted">
                      {t("settings.site_address_label", "Address")}
                    </p>
                    <p className="text-sm font-semibold text-genesis-ink truncate">
                      {settings.contactAddress ||
                        t("settings.empty_value", "—")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Palette
                    size={16}
                    className="text-genesis-muted flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] text-genesis-muted">
                      {t("settings.site_theme_label", "Theme color")}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-genesis-cream-dark"
                        style={{
                          backgroundColor: settings.themeColor || "#22c55e",
                        }}
                      />
                      <span className="text-sm font-medium text-genesis-ink">
                        {settings.themeColor ||
                          t("settings.empty_value", "—")}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sign out */}
        <div className="bg-white rounded-2xl border border-genesis-cream-dark shadow-sm overflow-hidden">
          <button
            onClick={() => logout()}
            className="flex items-center gap-3.5 px-5 py-4 hover:bg-red-50 transition-colors w-full text-left group"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-red-500 bg-red-50 group-hover:scale-110 transition-transform">
              <LogOut size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-600">
                {t("settings.signout_title", "Sign Out")}
              </p>
              <p className="text-[11px] text-red-400">
                {t("settings.signout_desc", "Log out of your account")}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}