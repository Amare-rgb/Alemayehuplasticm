// app/admin/settings/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import Image from 'next/image';
import { useSettings } from '@/hooks/useSettings';
import {
  Settings,
  Save,
  CheckCircle,
  AlertCircle,
  Info,
  XCircle,
  Shield,
  Loader2,
  Store,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  Globe,
} from 'lucide-react';

// Create axios instance
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Helper: single source of truth for reading the stored token
const getStoredToken = (): string | null => {
  const token = 
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('token');
  
  console.log('🔑 Token found:', !!token);
  return token;
};

// Add token to requests with better error handling
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`📤 ${config.method?.toUpperCase()} request to ${config.url}`);
    } else {
      console.warn('⚠️ No token available for request');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error Details:', {
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
      }
    });
    return Promise.reject(error);
  }
);

// Notification Component
interface NotificationProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ type, message, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}>
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg max-w-md ${getColors()}`}>
        {getIcon()}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Tab Content Components
interface TabPanelProps {
  children: React.ReactNode;
  active: boolean;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, active }) => {
  if (!active) return null;
  return <div className="space-y-6">{children}</div>;
};

// Setting Section Component
interface SettingSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, description, children }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  );
};

// Toggle Switch Component
const ToggleSwitch: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}> = ({ label, description, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
          checked ? 'bg-green-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

// Define types for settings data
interface SettingsData {
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
  twoFactorAuth: boolean;
  sessionTimeout: number;
  logo: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  contactHours: string;
  contactMapEmbed: string;
  enableContactForm: boolean;
  enableWhatsApp: boolean;
  whatsAppNumber: string;
  enableLiveChat: boolean;
  themeColor: string;
  darkMode: boolean;
  emailNotifications: boolean;
  orderNotifications: boolean;
  productNotifications: boolean;
  userNotifications: boolean;
  marketingEmails: boolean;
  emergencyPhone: string;
  supportEmail: string;
  infoEmail: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Type for API error response
interface ApiErrorResponse {
  error: string;
  message?: string;
}

const defaultSettings: SettingsData = {
  siteName: 'Genesis Agri Business',
  siteDescription: 'Agriculture marketplace connecting farmers and buyers',
  adminEmail: 'admin@genesisagri.com',
  adminPhone: '+1 (555) 123-4567',
  address: '123 Farm Road, Nairobi, Kenya',
  timezone: 'Africa/Nairobi',
  dateFormat: 'MM/DD/YYYY',
  storeName: 'Genesis Agri Business',
  storeEmail: 'info@genesisagri.com',
  storePhone: '+1 (555) 123-4567',
  storeAddress: '123 Farm Road, Nairobi, Kenya',
  currency: 'KES',
  taxRate: 16,
  twoFactorAuth: false,
  sessionTimeout: 60,
  logo: '',
  contactEmail: 'support@genesisagri.com',
  contactPhone: '+1 (555) 123-4567',
  contactAddress: '123 Agriculture Way, Farming District, FC 12345',
  contactHours: 'Mon-Fri: 8:00 AM - 6:00 PM',
  contactMapEmbed: '',
  enableContactForm: true,
  enableWhatsApp: true,
  whatsAppNumber: '+254700000000',
  enableLiveChat: false,
  themeColor: '#22c55e',
  darkMode: false,
  emailNotifications: true,
  orderNotifications: true,
  productNotifications: true,
  userNotifications: true,
  marketingEmails: false,
  emergencyPhone: '+1 (555) 999-9999',
  supportEmail: 'support@genesisagri.com',
  infoEmail: 'info@genesisagri.com',
};

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const isMounted = useRef(true);
  const hasInitialized = useRef(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoToDelete, setLogoToDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Form Data - initialized with default settings
  const [formData, setFormData] = useState<SettingsData>(defaultSettings);
  
  // Get settings context functions
  const { forceUpdate, refetch, updateSettings } = useSettings();

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'store', label: 'Store', icon: Store },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const currencies = ['KES', 'USD', 'EUR', 'GBP', 'ETB', 'TZS', 'UGX', 'RWF'];
  const timezones = ['Africa/Nairobi', 'Africa/Addis_Ababa', 'Africa/Dar_es_Salaam', 'Africa/Kampala', 'Africa/Kigali'];

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ type, message });
  };

  const clearNotification = () => {
    setNotification(null);
  };

  // Single handler for all input types
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Separate handler for password inputs
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggle = (name: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: !prev[name as keyof typeof prev]
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        showNotification('error', 'Please select a valid image file (JPEG, PNG, GIF, WEBP, SVG)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'Logo file size must be less than 5MB');
        return;
      }

      setLogoFile(file);
      setLogoToDelete(false);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoToDelete(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // loadSettingsData
  const loadSettingsData = useCallback(async () => {
    setLoading(true);

    try {
      const token = getStoredToken();

      if (!token) {
        console.log('⚠️ No token found, using default settings');
        setFormData(defaultSettings);
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching settings from API...');

      const response = await api.get('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('📦 Settings API Response:', response.data);

      if (response.data && isMounted.current) {
        const settingsData = response.data.data || response.data;
        setFormData(prev => ({
          ...defaultSettings,
          ...prev,
          ...settingsData
        }));
        if (settingsData.logo) {
          const logoUrl = settingsData.logo.startsWith('http') 
            ? settingsData.logo 
            : `${API_URL}${settingsData.logo}`;
          setLogoPreview(logoUrl);
          setLogoToDelete(false);
        } else {
          setLogoPreview(null);
        }
        console.log('✅ Settings loaded successfully');
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      console.error('❌ Error fetching settings:', error);
      setFormData(defaultSettings);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadSettingsData();
    }

    return () => {
      isMounted.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ FIX: Helper function to safely update settings after render
  const safeUpdateSettings = useCallback((data: Partial<SettingsData>) => {
    // Use requestAnimationFrame to defer the update until after render
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        updateSettings(data);
        // Also update localStorage
        const currentSettings = localStorage.getItem('site_settings');
        if (currentSettings) {
          try {
            const parsed = JSON.parse(currentSettings);
            const merged = { ...parsed, ...data };
            localStorage.setItem('site_settings', JSON.stringify(merged));
          } catch {
            localStorage.setItem('site_settings', JSON.stringify(data));
          }
        } else {
          localStorage.setItem('site_settings', JSON.stringify(data));
        }
        // Dispatch event for other components
        window.dispatchEvent(new Event('settings-change'));
      });
    }
  }, [updateSettings]);

  // Handle save settings (all settings except logo)
  const handleSave = async () => {
    setSaving(true);

    try {
      const token = getStoredToken();
      if (!token) {
        showNotification('error', 'Authentication required. Please login again.');
        router.push('/auth/signin');
        setSaving(false);
        return;
      }

      console.log('📝 Saving settings...');

      const formDataToSend = new FormData();
      
      // Append all form data fields EXCEPT logo
      Object.keys(formData).forEach(key => {
        if (key !== 'logo') {
          const value = formData[key as keyof SettingsData];
          if (value !== undefined && value !== null) {
            const stringValue = typeof value === 'boolean' ? String(value) : String(value);
            formDataToSend.append(key, stringValue);
          }
        }
      });

      // Keep existing logo
      if (formData.logo) {
        formDataToSend.append('logo', formData.logo);
      }

      console.log('📤 Sending request to /api/admin/settings');

      const response = await api.post('/api/admin/settings', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      console.log('📥 Save response:', response.data);

      const isSuccess = response.data?.success || response.data?.status === 'success';
      
      if (isSuccess) {
        showNotification('success', response.data.message || 'Settings saved successfully! 🎉');
        
        // ✅ FIX: Use safeUpdateSettings instead of direct update
        if (typeof window !== 'undefined') {
          const updatedData = response.data.settings || response.data;
          safeUpdateSettings({
            siteName: updatedData.siteName || '',
            siteDescription: updatedData.siteDescription || '',
            contactEmail: updatedData.contactEmail || '',
            contactPhone: updatedData.contactPhone || '',
            contactAddress: updatedData.contactAddress || '',
            contactHours: updatedData.contactHours || '',
            supportEmail: updatedData.supportEmail || '',
            infoEmail: updatedData.infoEmail || '',
            emergencyPhone: updatedData.emergencyPhone || '',
            logo: updatedData.logo || '',
          });
        }
        
        await loadSettingsData();
      } else {
        const errorMsg = response.data?.error || response.data?.message || 'Failed to save settings';
        showNotification('error', errorMsg);
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      console.error('❌ Error saving settings:', error);
      
      if (error.response?.status === 401) {
        showNotification('error', 'Authentication failed. Please login again.');
        router.push('/auth/signin');
      } else {
        showNotification('error', error.response?.data?.error || 'Failed to save settings');
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle save logo only - SEPARATE BUTTON
  const handleSaveLogo = async () => {
    setSavingLogo(true);

    try {
      const token = getStoredToken();
      if (!token) {
        showNotification('error', 'Authentication required. Please login again.');
        router.push('/auth/signin');
        setSavingLogo(false);
        return;
      }

      if (!logoFile && !logoToDelete) {
        showNotification('warning', 'Please select a logo to upload or click remove to delete');
        setSavingLogo(false);
        return;
      }

      console.log('🖼️ Saving logo only...');

      const formDataToSend = new FormData();
      
      const currentResponse = await api.get('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const currentSettings = currentResponse.data.data || currentResponse.data;
      
      Object.keys(currentSettings).forEach(key => {
        if (key !== 'logo' && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          const value = currentSettings[key];
          if (value !== undefined && value !== null) {
            const stringValue = typeof value === 'boolean' ? String(value) : String(value);
            formDataToSend.append(key, stringValue);
          }
        }
      });

      if (logoToDelete) {
        formDataToSend.append('logo', '');
        console.log('🗑️ Logo will be deleted');
      } else if (logoFile) {
        console.log('🖼️ Appending logo file:', logoFile.name);
        formDataToSend.append('logo', logoFile);
      }

      const response = await api.post('/api/admin/settings', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      const isSuccess = response.data?.success || response.data?.status === 'success';
      
      if (isSuccess) {
        showNotification('success', response.data.message || 'Logo updated successfully! 🎉');
        
        // ✅ FIX: Use safeUpdateSettings instead of direct update
        if (typeof window !== 'undefined') {
          const updatedData = response.data.settings || response.data;
          safeUpdateSettings({
            logo: updatedData.logo || '',
            siteName: updatedData.siteName || '',
            contactEmail: updatedData.contactEmail || '',
            contactPhone: updatedData.contactPhone || '',
            contactAddress: updatedData.contactAddress || '',
            contactHours: updatedData.contactHours || '',
            supportEmail: updatedData.supportEmail || '',
            infoEmail: updatedData.infoEmail || '',
            emergencyPhone: updatedData.emergencyPhone || '',
          });
        }
        
        setLogoFile(null);
        setLogoToDelete(false);
        await loadSettingsData();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const errorMsg = response.data?.error || response.data?.message || 'Failed to update logo';
        showNotification('error', errorMsg);
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      console.error('❌ Error saving logo:', error);
      
      if (error.response?.status === 401) {
        showNotification('error', 'Authentication failed. Please login again.');
        router.push('/auth/signin');
      } else {
        showNotification('error', error.response?.data?.error || 'Failed to update logo');
      }
    } finally {
      setSavingLogo(false);
    }
  };

  // Handle change password
  const handleChangePassword = async () => {
    if (!passwordData.currentPassword) {
      showNotification('error', 'Please enter your current password');
      return;
    }

    if (!passwordData.newPassword) {
      showNotification('error', 'Please enter a new password');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showNotification('error', 'New password must be at least 8 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('error', 'Passwords do not match');
      return;
    }

    try {
      const token = getStoredToken();
      if (!token) {
        showNotification('error', 'Authentication required');
        router.push('/auth/signin');
        return;
      }

      const response = await api.post('/api/admin/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        showNotification('success', response.data.message || 'Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showNotification('error', response.data.error || 'Failed to change password');
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      console.error('Error changing password:', error);
      if (error.response?.status === 401) {
        router.push('/auth/signin');
      } else {
        showNotification('error', error.response?.data?.error || 'Failed to change password');
      }
    }
  };

  // Handle reset settings
  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all settings to default?')) return;

    try {
      const token = getStoredToken();
      if (!token) {
        showNotification('error', 'Authentication required');
        return;
      }

      const response = await api.post('/api/admin/settings/reset', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setFormData(defaultSettings);
        setLogoPreview(null);
        setLogoFile(null);
        setLogoToDelete(false);
        showNotification('success', 'Settings reset to default successfully');
        await loadSettingsData();
        
        // ✅ FIX: Use safeUpdateSettings instead of direct update
        if (typeof window !== 'undefined') {
          safeUpdateSettings(defaultSettings);
        }
      } else {
        showNotification('error', response.data.error || 'Failed to reset settings');
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      console.error('Error resetting settings:', error);
      showNotification('error', error.response?.data?.error || 'Failed to reset settings');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={clearNotification}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage your application settings and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto px-4 py-2 space-x-1" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${isActive ? 'text-green-600' : ''}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* General Tab */}
          <TabPanel active={activeTab === 'general'}>
            <SettingSection
              title="Logo & Branding"
              description="Upload your website logo and configure branding"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Website Logo
                </label>
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    {logoPreview && !logoToDelete && (
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                        id="logo-upload"
                      />
                      <div className="flex flex-wrap gap-2">
                        <label
                          htmlFor="logo-upload"
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition-colors text-sm"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Choose Image</span>
                        </label>
                        
                        <button
                          type="button"
                          onClick={handleSaveLogo}
                          disabled={savingLogo || (!logoFile && !logoToDelete)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          {savingLogo ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Saving Logo...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Save Logo</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400">
                        Recommended: PNG or SVG, max 5MB
                      </p>
                      {logoPreview && !logoToDelete && (
                        <p className="text-xs text-green-600">
                          ✓ New logo selected - click Save Logo to update
                        </p>
                      )}
                      {logoToDelete && (
                        <p className="text-xs text-red-600">
                          ⚠️ Logo will be removed - click Save Logo to confirm
                        </p>
                      )}
                      {formData.logo && !logoPreview && !logoToDelete && (
                        <p className="text-xs text-blue-600">
                          ✓ Current logo is saved
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SettingSection>

            <SettingSection
              title="General Settings"
              description="Basic information about your application"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Site Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="siteName"
                  value={formData.siteName}
                  onChange={handleChange}
                  placeholder="Enter site name"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Site Description
                </label>
                <textarea
                  name="siteDescription"
                  value={formData.siteDescription}
                  onChange={handleChange}
                  placeholder="Enter site description"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Admin Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Admin Phone
                </label>
                <input
                  type="tel"
                  name="adminPhone"
                  value={formData.adminPhone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter business address"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Timezone
                  </label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz.replace('/', ' / ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date Format
                  </label>
                  <select
                    name="dateFormat"
                    value={formData.dateFormat}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </SettingSection>
          </TabPanel>

          {/* Store Tab */}
          <TabPanel active={activeTab === 'store'}>
            <SettingSection
              title="Store Settings"
              description="Configure your store information and preferences"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  placeholder="Enter store name"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Store Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="storeEmail"
                  value={formData.storeEmail}
                  onChange={handleChange}
                  placeholder="store@example.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Store Phone
                </label>
                <input
                  type="tel"
                  name="storePhone"
                  value={formData.storePhone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Store Address
                </label>
                <input
                  type="text"
                  name="storeAddress"
                  value={formData.storeAddress}
                  onChange={handleChange}
                  placeholder="Enter store address"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  >
                    {currencies.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    name="taxRate"
                    value={formData.taxRate}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Default tax rate applied to products</p>
                </div>
              </div>
            </SettingSection>
          </TabPanel>

          {/* Contact Tab */}
          <TabPanel active={activeTab === 'contact'}>
            <SettingSection
              title="Contact Information"
              description="Configure contact details for your website"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contact Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="support@genesisagri.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Support Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="supportEmail"
                    value={formData.supportEmail || ''}
                    onChange={handleChange}
                    placeholder="support@genesisagri.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Info Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="infoEmail"
                    value={formData.infoEmail || ''}
                    onChange={handleChange}
                    placeholder="info@genesisagri.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Emergency Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone || ''}
                    onChange={handleChange}
                    placeholder="+1 (555) 999-9999"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">24/7 Emergency support line</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contact Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    name="contactAddress"
                    value={formData.contactAddress}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Enter your business address"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Business Hours
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="contactHours"
                    value={formData.contactHours}
                    onChange={handleChange}
                    placeholder="Mon-Fri: 8:00 AM - 6:00 PM"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Google Maps Embed URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="contactMapEmbed"
                    value={formData.contactMapEmbed}
                    onChange={handleChange}
                    placeholder="https://www.google.com/maps/embed?pb=..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Paste the embed URL from Google Maps</p>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Contact Form Settings</h4>
                
                <ToggleSwitch
                  label="Enable Contact Form"
                  description="Show contact form on the contact page"
                  checked={formData.enableContactForm}
                  onChange={() => handleToggle('enableContactForm')}
                />

                <ToggleSwitch
                  label="Enable WhatsApp"
                  description="Show WhatsApp button on the contact page"
                  checked={formData.enableWhatsApp}
                  onChange={() => handleToggle('enableWhatsApp')}
                />

                {formData.enableWhatsApp && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      WhatsApp Number
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="whatsAppNumber"
                        value={formData.whatsAppNumber}
                        onChange={handleChange}
                        placeholder="+254700000000"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                  </div>
                )}

                <ToggleSwitch
                  label="Enable Live Chat"
                  description="Show live chat widget on the website"
                  checked={formData.enableLiveChat}
                  onChange={() => handleToggle('enableLiveChat')}
                />
              </div>
            </SettingSection>
          </TabPanel>

          {/* Security Tab */}
          <TabPanel active={activeTab === 'security'}>
            <SettingSection
              title="Security Settings"
              description="Configure security preferences for your account"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Current Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Change Password
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <ToggleSwitch
                  label="Two-Factor Authentication"
                  description="Add an extra layer of security to your account"
                  checked={formData.twoFactorAuth}
                  onChange={() => handleToggle('twoFactorAuth')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  name="sessionTimeout"
                  value={formData.sessionTimeout}
                  onChange={handleChange}
                  min="5"
                  max="480"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Auto-logout after inactivity (5-480 minutes)</p>
              </div>
            </SettingSection>
          </TabPanel>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handleReset}
          className="text-sm text-red-600 hover:text-red-700 transition-colors"
        >
          Reset to Default
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save All Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;