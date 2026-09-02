'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

export const defaultSettings: SettingsData = {
  siteName: 'Genesis Agri Business',
  siteDescription: 'Agriculture marketplace connecting farmers and buyers',
  storeName: 'Genesis Agri Business',
  currency: 'KES',
  logo: '',
  themeColor: '#22c55e',
  contactEmail: 'info@genesisagri.com',
  contactPhone: '+251 900 000 000',
  contactAddress: '123 Farm Road, Addis Ababa, Ethiopia',
  contactHours: 'Mon-Fri: 8:00 AM - 6:00 PM',
  contactMapEmbed: '',
  enableContactForm: true,
  enableWhatsApp: true,
  whatsAppNumber: '+251900000000',
  enableLiveChat: false,
  emergencyPhone: '+251 911 234 567',
  supportEmail: 'support@genesisagri.com',
  infoEmail: 'info@genesisagri.com',
};

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

export const getFullLogoUrl = (logoPath: string): string => {
  if (!logoPath) return '';
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) return logoPath;
  const cleanPath = logoPath.startsWith('/') ? logoPath.slice(1) : logoPath;
  return `${API_URL}/${cleanPath}`;
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('site_settings');
        if (cached) {
          const parsed = JSON.parse(cached);
          return {
            ...defaultSettings,
            ...parsed,
            logo: parsed.logo ? getFullLogoUrl(parsed.logo) : '',
          };
        }
      } catch (e) {
        console.error('Error reading cached settings:', e);
      }
    }
    return defaultSettings;
  });

  // 💡 ጅምር ላይ localStorage ካለ loading በራስ-ሰር false እንዲሆን ማድረግ
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('site_settings');
    }
    return true;
  });
  
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = React.useRef(true);
  const hasFetchedRef = React.useRef(false);

  const fetchSettings = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current) return;

    try {
      const url = forceRefresh
        ? `${API_URL}/api/admin/settings/public?_=${Date.now()}`
        : `${API_URL}/api/admin/settings/public`;

      // ለሰርቨር ጥያቄ የጊዜ ገደብ (AbortController - 5 ሰከንድ) መስጠት
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!isMountedRef.current) return;

      if (response.ok) {
        const data = await response.json();
        const settingsData = data.data || data;

        const updatedSettings: SettingsData = {
          ...defaultSettings,
          ...settingsData,
          logo: settingsData.logo ? getFullLogoUrl(settingsData.logo) : '',
          emergencyPhone: settingsData.emergencyPhone || defaultSettings.emergencyPhone,
          supportEmail: settingsData.supportEmail || defaultSettings.supportEmail,
          infoEmail: settingsData.infoEmail || defaultSettings.infoEmail,
        };

        setSettings(updatedSettings);
        setError(null);

        if (typeof window !== 'undefined') {
          localStorage.setItem('site_settings', JSON.stringify(updatedSettings));
          window.dispatchEvent(new Event('settings-change'));
        }
      } else {
        if (isMountedRef.current) {
          setError('Failed to fetch settings');
        }
      }
    } catch (err) {
      console.warn('Could not fetch public settings, using fallback/cache:', err);
      if (isMountedRef.current) {
        // ሰርቨሩ ቢጠፋም ካሽ (cache) ካለ ስህተት እንዳይሆን እናደርጋለን
        if (!settings) {
          setError('Failed to load settings');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false); // 💡 ሁልጊዜ loading ወደ false ይቀየራል
      }
    }
  }, [settings]);

  const forceUpdate = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('site_settings');
        if (cached) {
          const parsed = JSON.parse(cached);
          const updatedSettings = {
            ...defaultSettings,
            ...parsed,
            logo: parsed.logo ? getFullLogoUrl(parsed.logo) : '',
          };
          setSettings({ ...updatedSettings });
        } else {
          setSettings({ ...defaultSettings });
        }
      } catch (e) {
        console.error('Error reading cached settings:', e);
      }
    }
    setLoading(false);
  }, []);

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

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchSettings();
    }

    // 💡 የ 4 ሰከንድ Safety Timeout: ሰርቨሩ ዘግይቶም ቢሆን ሎዲንግ ስፒነሩ ለዘላለም እንዳይሽከረከር ይከላከላል
    const safetyTimer = setTimeout(() => {
      if (isMountedRef.current && loading) {
        setLoading(false);
      }
    }, 4000);

    const handleSettingsChange = () => {
      if (isMountedRef.current) {
        fetchSettings(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMountedRef.current) {
        fetchSettings();
      }
    };

    const interval = setInterval(() => {
      if (isMountedRef.current) {
        fetchSettings();
      }
    }, 5 * 60 * 1000);

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
        } catch {}
      }
    };

    const handleFocus = () => {
      if (isMountedRef.current) {
        fetchSettings();
      }
    };

    window.addEventListener('settings-change', handleSettingsChange);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMountedRef.current = false;
      clearTimeout(safetyTimer);
      clearInterval(interval);
      window.removeEventListener('settings-change', handleSettingsChange);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchSettings, loading]);

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

export function useSettings(usePublicEndpoint: boolean = false) {
  const context = useContext(SettingsContext);
  return context;
}