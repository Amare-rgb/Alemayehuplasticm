// hooks/useSettings.ts
import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface SettingsData {
  id?: string;
  siteName: string;
  siteDescription: string;
  adminEmail: string;
  adminPhone: string;
  address: string;
  timezone: string;
  dateFormat: string;
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  currency: string;
  taxRate: number;
  logo: string;
  favicon: string;
  twoFactorAuth: boolean;
  sessionTimeout: number;
  emailNotifications: boolean;
  orderNotifications: boolean;
  productNotifications: boolean;
  userNotifications: boolean;
  marketingEmails: boolean;
  themeColor: string;
  darkMode: boolean;
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

const defaultSettings: SettingsData = {
  siteName: 'Genesis',
  siteDescription: 'Agriculture marketplace connecting farmers and buyers',
  adminEmail: 'admin@genesisagri.com',
  adminPhone: '+1 (555) 123-4567',
  address: '123 Farm Road, Nairobi, Kenya',
  timezone: 'Africa/Nairobi',
  dateFormat: 'MM/DD/YYYY',
  storeName: 'Genesis',
  storeEmail: 'info@genesisagri.com',
  storePhone: '+1 (555) 123-4567',
  storeAddress: '123 Farm Road, Nairobi, Kenya',
  currency: 'KES',
  taxRate: 16,
  logo: '',
  favicon: '',
  twoFactorAuth: false,
  sessionTimeout: 60,
  emailNotifications: true,
  orderNotifications: true,
  productNotifications: true,
  userNotifications: true,
  marketingEmails: false,
  themeColor: '#22c55e',
  darkMode: false,
  contactEmail: 'support@genesisagri.com',
  contactPhone: '+1 (555) 123-4567',
  contactAddress: '123 Agriculture Way, Farming District, FC 12345',
  contactHours: 'Mon-Fri: 8:00 AM - 6:00 PM',
  contactMapEmbed: '',
  enableContactForm: true,
  enableWhatsApp: true,
  whatsAppNumber: '+254700000000',
  enableLiveChat: false,
  emergencyPhone: '+1 (555) 999-9999',
  supportEmail: 'support@genesisagri.com',
  infoEmail: 'info@genesisagri.com',
};

const getStoredToken = (): string | null => {
  return (
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('token')
  );
};

const getFullLogoUrl = (logoPath: string): string => {
  if (!logoPath) return '';
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) return logoPath;
  const cleanPath = logoPath.startsWith('/') ? logoPath.slice(1) : logoPath;
  return `${API_URL}/${cleanPath}`;
};

export function useSettings(usePublicEndpoint: boolean = false) {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      const endpoint = usePublicEndpoint ? '/api/admin/settings/public' : '/api/admin/settings';
      const token = getStoredToken();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (!usePublicEndpoint && token) headers['Authorization'] = `Bearer ${token}`;
      const url = forceRefresh ? `${API_URL}${endpoint}?_=${Date.now()}` : `${API_URL}${endpoint}`;
      const response = await fetch(url, { headers, credentials: 'include', cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        const settingsData = data.data || data;
        let logoUrl = '';
        if (settingsData.logo && settingsData.logo !== '') {
          logoUrl = getFullLogoUrl(settingsData.logo);
        }
        const newSettings = {
          ...defaultSettings,
          ...settingsData,
          logo: logoUrl,
          emergencyPhone: settingsData.emergencyPhone || defaultSettings.emergencyPhone,
          supportEmail: settingsData.supportEmail || defaultSettings.supportEmail,
          infoEmail: settingsData.infoEmail || defaultSettings.infoEmail,
        };
        setSettings(newSettings);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch settings');
        setSettings(defaultSettings);
      }
    } catch (err) {
      setError('Failed to load settings');
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, [usePublicEndpoint]);

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => { if (!isMounted) return; await fetchSettings(); };
    loadSettings();
    return () => { isMounted = false; };
  }, [fetchSettings]);

  return { settings, loading, error, refetch: () => fetchSettings(true) };
}