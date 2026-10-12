'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

// ============================================================
// Types
// ============================================================
export interface SettingsData {
  id?: string;
  siteName: string;
  siteDescription: string;
  storeName?: string;
  currency?: string;
  logo: string;
  favicon?: string;
  themeColor: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  contactHours: string;
  contactMapEmbed: string;
  enableContactForm: boolean;
  enableWhatsApp: boolean;
  whatsAppNumber: string;
  enableLiveChat: boolean;
  emergencyPhone: string;
  supportEmail: string;
  infoEmail: string;
}

// ============================================================
// ✅ Rebranded defaults — Alemayehu Plastic Manufacturing
// ============================================================
export const defaultSettings: SettingsData = {
  siteName: 'Alemayehu Plastic Manufacturing',
  siteDescription: 'Quality plastic products manufactured in Ethiopia',
  storeName: 'Alemayehu Plastic Manufacturing',
  currency: 'ETB',
  logo: '',
  themeColor: '#e0a83c',
  contactEmail: 'info@alemayehplastic.com',
  contactPhone: '+251 900 000 000',
  contactAddress: 'Bahir Dar, Ethiopia',
  contactHours: 'Mon-Sat: 8:00 AM - 6:00 PM',
  contactMapEmbed: '',
  enableContactForm: true,
  enableWhatsApp: true,
  whatsAppNumber: '+251900000000',
  enableLiveChat: false,
  emergencyPhone: '+251 900 000 000',
  supportEmail: 'support@alemayehplastic.com',
  infoEmail: 'info@alemayehplastic.com',
};

// ============================================================
// Context
// ============================================================
interface SettingsContextType {
  settings: SettingsData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  forceUpdate: () => void;
  updateSettings: (partial: Partial<SettingsData>) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  error: null,
  refetch: async () => {},
  forceUpdate: () => {},
  updateSettings: () => {},
});

// ============================================================
// Logo URL helper
// ============================================================
export const getFullLogoUrl = (logoPath: string): string => {
  if (!logoPath) return '';
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
    return logoPath;
  }
  const cleanPath = logoPath.startsWith('/') ? logoPath.slice(1) : logoPath;
  return `${API_URL}/${cleanPath}`;
};

// ============================================================
// Provider
// ============================================================
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // ✅ Initialize from cache without a setState-in-effect
  const [settings, setSettings] = useState<SettingsData>(() => {
    if (typeof window === 'undefined') return defaultSettings;

    try {
      const cached = localStorage.getItem('site_settings');
      if (!cached) return defaultSettings;

      const parsed = JSON.parse(cached);
      return {
        ...defaultSettings,
        ...parsed,
        logo: parsed.logo ? getFullLogoUrl(parsed.logo) : '',
      };
    } catch (e) {
      console.error('Error reading cached settings:', e);
      return defaultSettings;
    }
  });

  // ✅ Loading is only true if there's NO cache
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return !localStorage.getItem('site_settings');
  });

  const [error, setError] = useState<string | null>(null);

  // ✅ Use refs so `fetchSettings` never depends on state
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // ============================================================
  // fetchSettings — stable across renders (no state deps)
  // ============================================================
  const fetchSettings = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current) return;

    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const url = forceRefresh
        ? `${API_URL}/api/admin/settings/public?_=${Date.now()}`
        : `${API_URL}/api/admin/settings/public`;

      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!isMountedRef.current) return;

      if (!response.ok) {
        setError('Failed to fetch settings');
        return;
      }

      const data = await response.json();
      const settingsData = data.data || data;

      const updatedSettings: SettingsData = {
        ...defaultSettings,
        ...settingsData,
        logo: settingsData.logo ? getFullLogoUrl(settingsData.logo) : '',
        emergencyPhone:
          settingsData.emergencyPhone || defaultSettings.emergencyPhone,
        supportEmail:
          settingsData.supportEmail || defaultSettings.supportEmail,
        infoEmail: settingsData.infoEmail || defaultSettings.infoEmail,
      };

      setSettings(updatedSettings);
      setError(null);

      if (typeof window !== 'undefined') {
        localStorage.setItem('site_settings', JSON.stringify(updatedSettings));
        window.dispatchEvent(new Event('settings-change'));
      }
    } catch (err) {
      // Silently ignore abort errors (they're expected)
      if (err instanceof Error && err.name === 'AbortError') return;

      console.warn(
        'Could not fetch public settings, using fallback/cache:',
        err
      );
      if (isMountedRef.current) {
        setError('Failed to load settings');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // ============================================================
  // forceUpdate — re-read from localStorage
  // ============================================================
  const forceUpdate = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const cached = localStorage.getItem('site_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        setSettings({
          ...defaultSettings,
          ...parsed,
          logo: parsed.logo ? getFullLogoUrl(parsed.logo) : '',
        });
      } else {
        setSettings({ ...defaultSettings });
      }
    } catch (e) {
      console.error('Error reading cached settings:', e);
    }

    setLoading(false);
  }, []);

  // ============================================================
  // updateSettings — merge + persist + broadcast
  // ============================================================
  const updateSettings = useCallback((partial: Partial<SettingsData>) => {
    setSettings((prev) => {
      const merged: SettingsData = {
        ...prev,
        ...partial,
        logo:
          partial.logo !== undefined
            ? partial.logo
              ? getFullLogoUrl(partial.logo)
              : ''
            : prev.logo,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('site_settings', JSON.stringify(merged));
        window.dispatchEvent(new Event('settings-change'));
      }

      return merged;
    });
  }, []);

  // ============================================================
  // Mount: initial fetch + listeners
  // ✅ No state (`loading`) in deps — avoids infinite loop
  // ============================================================
  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch (once)
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      void fetchSettings();
    }

    // Safety timeout — force loading=false after 4s even if the
    // network is stuck, so the spinner never spins forever
    const safetyTimer = setTimeout(() => {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }, 4000);

    const handleSettingsChange = () => {
      if (isMountedRef.current) void fetchSettings(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMountedRef.current) {
        void fetchSettings();
      }
    };

    const handleFocus = () => {
      if (isMountedRef.current) void fetchSettings();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'site_settings' && e.newValue && isMountedRef.current) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings({
            ...defaultSettings,
            ...parsed,
            logo: parsed.logo ? getFullLogoUrl(parsed.logo) : '',
          });
          setLoading(false);
        } catch {
          // ignore parse errors
        }
      }
    };

    window.addEventListener('settings-change', handleSettingsChange);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);

    // Poll every 5 minutes (unref'd, safe)
    const interval = setInterval(() => {
      if (isMountedRef.current) void fetchSettings();
    }, 5 * 60 * 1000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(safetyTimer);
      clearInterval(interval);
      if (abortRef.current) abortRef.current.abort();

      window.removeEventListener('settings-change', handleSettingsChange);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        refetch: () => fetchSettings(true),
        forceUpdate,
        updateSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================
export function useSettings() {
  return useContext(SettingsContext);
}