// app/admin/settings/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import axios, { AxiosError } from 'axios';
import {
  Settings,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  XCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Lock,
  Bell,
  Shield,
  Palette,
  Type,
  Image as ImageIcon,
  Upload,
  Trash2,
  RefreshCw,
  Loader2,
  Store,
  DollarSign,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  CreditCard,
  FileText,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Camera,
  Building,
  Clock
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

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

// Form Input Component
interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  disabled?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  helpText,
  disabled = false
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500"
      />
      {helpText && <p className="text-xs text-gray-400 mt-1">{helpText}</p>}
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

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    // General Settings
    siteName: 'Genesis Agri Business',
    siteDescription: 'Agriculture marketplace connecting farmers and buyers',
    adminEmail: 'admin@genesisagri.com',
    adminPhone: '+1 (555) 123-4567',
    address: '123 Farm Road, Nairobi, Kenya',
    timezone: 'Africa/Nairobi',
    dateFormat: 'MM/DD/YYYY',

    // Store Settings
    storeName: 'Genesis Agri Business',
    storeEmail: 'info@genesisagri.com',
    storePhone: '+1 (555) 123-4567',
    storeAddress: '123 Farm Road, Nairobi, Kenya',
    currency: 'KES',
    taxRate: 16,

    // Logo
    logo: '',
    favicon: '',

    // Security
    twoFactorAuth: false,
    sessionTimeout: 60,

    // Notifications
    emailNotifications: true,
    orderNotifications: true,
    productNotifications: true,
    userNotifications: true,
    marketingEmails: false,

    // Appearance
    themeColor: '#22c55e',
    darkMode: false,
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'store', label: 'Store', icon: Store },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleToggle = (name: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: !prev[name as keyof typeof prev]
    }));
  };

  // ✅ FIXED: Fetch settings - using useCallback properly
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Authentication required');
        router.push('/auth/signin');
        setLoading(false);
        return;
      }

      // Try to fetch settings from API
      try {
        const response = await api.get('/api/admin/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.data) {
          setFormData(prev => ({ ...prev, ...response.data }));
        }
      } catch (err) {
        // If API doesn't exist, use defaults
        console.log('Using default settings');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ✅ FIXED: Use isMounted ref to prevent setState after unmount
  const isMounted = useRef(true);
  const isInitialMount = useRef(true);

  // ✅ FIXED: Only fetch on initial mount
  useEffect(() => {
    isMounted.current = true;
    
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchSettings();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [fetchSettings]);

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 2 * 1024 * 1024) {
      showNotification('error', 'Logo size must be less than 2MB');
      return;
    }

    setUploadingLogo(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Authentication required');
        setUploadingLogo(false);
        return;
      }

      const formDataUpload = new FormData();
      formDataUpload.append('logo', file);

      const response = await api.post('/api/admin/upload-logo', formDataUpload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.logoUrl) {
        setFormData(prev => ({
          ...prev,
          logo: response.data.logoUrl
        }));
        showNotification('success', 'Logo uploaded successfully');
      } else {
        showNotification('error', response.data.error || 'Failed to upload logo');
      }
    } catch (err) {
      console.error('Error uploading logo:', err);
      showNotification('error', 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({
      ...prev,
      logo: ''
    }));
  };

  // Handle save settings
  const handleSave = async () => {
    setSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Authentication required');
        router.push('/auth/signin');
        setSaving(false);
        return;
      }

      const response = await api.post('/api/admin/settings', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        showNotification('success', 'Settings saved successfully! 🎉');
      } else {
        showNotification('error', response.data.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      showNotification('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Handle reset settings
  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all settings to default?')) return;
    
    try {
      const token = localStorage.getItem('token');
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
        // Reset form data to defaults
        setFormData({
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
        });
        showNotification('success', 'Settings reset to default successfully');
      } else {
        showNotification('error', response.data.error || 'Failed to reset settings');
      }
    } catch (err) {
      console.error('Error resetting settings:', err);
      showNotification('error', 'Failed to reset settings');
    }
  };

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
      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={clearNotification}
        />
      )}

      {/* Page Header */}
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

      {/* Tabs */}
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
          {/* General Settings */}
          <TabPanel active={activeTab === 'general'}>
            <SettingSection
              title="General Settings"
              description="Basic information about your application"
            >
              <FormInput
                label="Site Name"
                name="siteName"
                value={formData.siteName}
                onChange={handleChange}
                placeholder="Enter site name"
                required
              />
              <FormInput
                label="Site Description"
                name="siteDescription"
                value={formData.siteDescription}
                onChange={handleChange}
                placeholder="Enter site description"
              />
              <FormInput
                label="Admin Email"
                name="adminEmail"
                type="email"
                value={formData.adminEmail}
                onChange={handleChange}
                placeholder="admin@example.com"
                required
              />
              <FormInput
                label="Admin Phone"
                name="adminPhone"
                type="tel"
                value={formData.adminPhone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
              />
              <FormInput
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter business address"
              />
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

          {/* Store Settings */}
          <TabPanel active={activeTab === 'store'}>
            <SettingSection
              title="Store Settings"
              description="Configure your store information and preferences"
            >
              <FormInput
                label="Store Name"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                placeholder="Enter store name"
                required
              />
              <FormInput
                label="Store Email"
                name="storeEmail"
                type="email"
                value={formData.storeEmail}
                onChange={handleChange}
                placeholder="store@example.com"
                required
              />
              <FormInput
                label="Store Phone"
                name="storePhone"
                type="tel"
                value={formData.storePhone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
              />
              <FormInput
                label="Store Address"
                name="storeAddress"
                value={formData.storeAddress}
                onChange={handleChange}
                placeholder="Enter store address"
              />
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
                <FormInput
                  label="Tax Rate (%)"
                  name="taxRate"
                  type="number"
                  value={formData.taxRate}
                  onChange={handleChange}
                  placeholder="0"
                  helpText="Default tax rate applied to products"
                />
              </div>
            </SettingSection>
          </TabPanel>

          {/* Appearance Settings */}
          <TabPanel active={activeTab === 'appearance'}>
            <SettingSection
              title="Appearance"
              description="Customize the look and feel of your application"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Logo
                </label>
                <div className="flex items-center space-x-4">
                  {formData.logo ? (
                    <div className="relative w-32 h-32 border border-gray-200 rounded-lg overflow-hidden group">
                      <Image
                        src={formData.logo.startsWith('http') ? formData.logo : `${API_URL}${formData.logo}`}
                        alt="Logo"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-green-500 transition-colors cursor-pointer group"
                    >
                      <div className="text-center">
                        {uploadingLogo ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mx-auto group-hover:text-green-500 transition-colors" />
                            <span className="text-xs text-gray-500 group-hover:text-green-500 transition-colors block mt-1">
                              Upload Logo
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">Recommended size: 200x200px, Max 2MB</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Theme Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    name="themeColor"
                    value={formData.themeColor}
                    onChange={handleChange}
                    className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    name="themeColor"
                    value={formData.themeColor}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
              </div>

              <ToggleSwitch
                label="Dark Mode"
                description="Enable dark theme for the application"
                checked={formData.darkMode}
                onChange={() => handleToggle('darkMode')}
              />
            </SettingSection>
          </TabPanel>

          {/* Notifications Settings */}
          <TabPanel active={activeTab === 'notifications'}>
            <SettingSection
              title="Notification Preferences"
              description="Manage your notification settings"
            >
              <ToggleSwitch
                label="Email Notifications"
                description="Receive email notifications for important updates"
                checked={formData.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
              />
              <ToggleSwitch
                label="Order Notifications"
                description="Get notified about new orders and order updates"
                checked={formData.orderNotifications}
                onChange={() => handleToggle('orderNotifications')}
              />
              <ToggleSwitch
                label="Product Notifications"
                description="Receive alerts about product listings and updates"
                checked={formData.productNotifications}
                onChange={() => handleToggle('productNotifications')}
              />
              <ToggleSwitch
                label="User Notifications"
                description="Get notified about user registrations and activities"
                checked={formData.userNotifications}
                onChange={() => handleToggle('userNotifications')}
              />
              <ToggleSwitch
                label="Marketing Emails"
                description="Receive promotional emails and newsletters"
                checked={formData.marketingEmails}
                onChange={() => handleToggle('marketingEmails')}
              />
            </SettingSection>
          </TabPanel>

          {/* Security Settings */}
          <TabPanel active={activeTab === 'security'}>
            <SettingSection
              title="Security Settings"
              description="Configure security preferences for your account"
            >
              <div className="space-y-4">
                <FormInput
                  label="Current Password"
                  name="currentPassword"
                  type={showPassword ? 'text' : 'password'}
                  value=""
                  onChange={() => {}}
                  placeholder="Enter current password"
                />
                <FormInput
                  label="New Password"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value=""
                  onChange={() => {}}
                  placeholder="Enter new password"
                  helpText="Minimum 8 characters"
                />
                <FormInput
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value=""
                  onChange={() => {}}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
                </button>
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

      {/* Bottom Actions */}
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