// context/SettingsContext.tsx
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
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  error: null,
  refetch: async () => {},
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async (forceRefresh = false) => {
    try {
      const url = forceRefresh
        ? `${API_URL}/api/admin/settings/public?_=${Date.now()}`
        : `${API_URL}/api/admin/settings/public`;

      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

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
        }
      } else {
        setError('Failed to fetch settings');
      }
    } catch (err) {
      console.warn('Could not fetch public settings, using fallback/cache:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch on mount / page refresh
    fetchSettings();

    // 1. Listen for custom settings changes (e.g. from admin panel in same window)
    const handleSettingsChange = () => {
      fetchSettings(true);
    };

    // 2. Revalidate when user focuses or returns to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSettings();
      }
    };

    // 3. Periodic background refresh (every 5 minutes)
    const interval = setInterval(() => {
      fetchSettings();
    }, 5 * 60 * 1000);

    window.addEventListener('settings-change', handleSettingsChange);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleSettingsChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'site_settings' && e.newValue) {
        try {
          setSettings(JSON.parse(e.newValue));
        } catch {}
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('settings-change', handleSettingsChange);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleSettingsChange);
    };
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, error, refetch: () => fetchSettings(true) }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(usePublicEndpoint: boolean = false) {
  const context = useContext(SettingsContext);
  return context;
}
