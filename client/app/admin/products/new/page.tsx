// app/admin/products/new/page.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import axios, { AxiosError } from 'axios';
import {
  ArrowLeft,
  Save,
  X,
  Package,
  DollarSign,
  Tag,
  Image as ImageIcon,
  Upload,
  CheckCircle,
  AlertCircle,
  Info,
  XCircle,
  Trash2,
  FolderPlus,
  Layers,
  Weight,
  Eye,
  ShoppingBag,
  Clock,
  Calendar,
  CalendarDays
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

// Add token to requests - FIXED: Use 'authToken'
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken') || 
                sessionStorage.getItem('authToken') ||
                localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
    }
    return Promise.reject(error);
  }
);

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  discountPrice: string;
  categoryId: string;
  subCategoryId: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED';
  tags: string[];
  images: string[];
  brand: string;
  weight: string;
  unitOfMeasurement: string;
  pricePerUnit: string;
  durationTime: string;
  stock: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
}

// Unit of measurement options
const unitOptions = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'lb', label: 'Pound (lb)' },
  { value: 'oz', label: 'Ounce (oz)' },
  { value: 'ton', label: 'Ton' },
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'pack', label: 'Pack' },
  { value: 'box', label: 'Box' },
  { value: 'bag', label: 'Bag' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'liter', label: 'Liter (L)' },
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'gallon', label: 'Gallon (gal)' },
  { value: 'acre', label: 'Acre' },
  { value: 'hectare', label: 'Hectare' },
];

// Duration Time options - FIXED with proper labels
const durationOptions = [
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '2h', label: '2 Hours' },
  { value: '4h', label: '4 Hours' },
  { value: '8h', label: '8 Hours' },
  { value: '12h', label: '12 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '2d', label: '2 Days' },
  { value: '3d', label: '3 Days' },
  { value: '5d', label: '5 Days' },
  { value: '7d', label: '7 Days' },
  { value: '10d', label: '10 Days' },
  { value: '14d', label: '14 Days' },
  { value: '21d', label: '21 Days' },
  { value: '30d', label: '30 Days' },
  { value: '60d', label: '60 Days' },
  { value: '90d', label: '90 Days' },
];

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

// Add Category Modal
interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded: (category: Category) => void;
  title: string;
  isSubCategory?: boolean;
  parentCategoryId?: string;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ 
  isOpen, 
  onClose, 
  onCategoryAdded, 
  title,
  isSubCategory = false,
  parentCategoryId = ''
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (value) {
      setSlug(generateSlug(value));
    } else {
      setSlug('');
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/api/categories');
      let categoriesData = [];
      if (response.data && Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data && response.data.categories) {
        categoriesData = response.data.categories;
      } else if (response.data && response.data.data) {
        categoriesData = response.data.data;
      }
      setCategories(categoriesData.filter((cat: Category) => !cat.parentId));
    } catch (err) {
      console.log('Categories fetch error:', err);
    }
  }, []);

  const hasFetched = React.useRef(false);

  useEffect(() => {
    if (isSubCategory && !hasFetched.current) {
      hasFetched.current = true;
      fetchCategories();
    }
  }, [isSubCategory, fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      if (!name.trim()) {
        setError('Name is required');
        setLoading(false);
        return;
      }

      if (!slug.trim()) {
        setError('Slug is required');
        setLoading(false);
        return;
      }

      const payload: {
        name: string;
        slug: string;
        description?: string;
        status: string;
        parentId?: string;
      } = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        status: 'APPROVED'
      };

      if (isSubCategory && parentCategoryId) {
        payload.parentId = parentCategoryId;
      }

      const response = await api.post('/api/categories', payload, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data) {
        const newCategory = response.data.category || response.data;
        onCategoryAdded(newCategory);
        setName('');
        setDescription('');
        setSlug('');
        onClose();
      }
    } catch (err) {
      console.error(`❌ Error creating category:`, err);
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ error: string; message?: string }>;
        const errorMsg = axiosError.response?.data?.error || 
                         axiosError.response?.data?.message || 
                         `Failed to create ${isSubCategory ? 'subcategory' : 'category'}`;
        setError(errorMsg);
      } else {
        setError(`Failed to create ${isSubCategory ? 'subcategory' : 'category'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isSubCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={parentCategoryId}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm cursor-not-allowed"
                >
                  <option value="">Select Parent Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Selected from the dropdown above</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                required
                placeholder={`Enter ${isSubCategory ? 'subcategory' : 'category'} name`}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))}
                required
                placeholder="auto-generated"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50"
              />
              <p className="text-xs text-gray-400 mt-1">URL-friendly version</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !slug.trim()}
              className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : `Create ${isSubCategory ? 'Subcategory' : 'Category'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// SKU Generator function
const generateSKU = () => {
  const prefix = 'PRD';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

// ============================================
// FIXED: Main Component with Authentication Check
// ============================================
const NewProductPage: React.FC = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [sku, setSku] = useState<string>('');
  
  // ✅ FIXED: Authentication check
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    categoryId: '',
    subCategoryId: '',
    status: 'DRAFT',
    tags: [],
    images: [],
    brand: '',
    weight: '',
    unitOfMeasurement: 'kg',
    pricePerUnit: '',
    durationTime: '1h',
    stock: '10'
  });

  const [newTag, setNewTag] = useState('');

  // ✅ FIXED: Authentication check on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
      
      console.log('🔍 New Product Page - Checking auth...');
      console.log('Token exists:', !!token);
      
      if (!token) {
        console.log('❌ No token found, redirecting to login...');
        router.replace('/auth/signin');
        setAuthLoading(false);
        return;
      }
      
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log('👤 User role:', parsedUser.role);
          if (parsedUser.role?.toUpperCase() !== 'ADMIN') {
            console.log('❌ Not an admin, redirecting to home...');
            router.replace('/');
            setAuthLoading(false);
            return;
          }
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
          router.replace('/auth/signin');
        }
      } else {
        console.log('❌ No user data found');
        router.replace('/auth/signin');
      }
      setAuthLoading(false);
    };
    
    checkAuth();
  }, [router]);

  // Generate SKU using useMemo
  const initialSKU = useMemo(() => generateSKU(), []);
  const skuSet = useRef(false);
  
  useEffect(() => {
    if (!skuSet.current) {
      setSku(initialSKU);
      skuSet.current = true;
    }
  }, [initialSKU]);

  // Show notification helper
  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ type, message });
  };

  // Clear notification
  const clearNotification = () => {
    setNotification(null);
  };

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/api/categories');
      let categoriesData = [];
      if (response.data && Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data && response.data.categories) {
        categoriesData = response.data.categories;
      } else if (response.data && response.data.data) {
        categoriesData = response.data.data;
      }
      setCategories(categoriesData.filter((cat: Category) => !cat.parentId));
    } catch (err) {
      console.log('Categories fetch error:', err);
    }
  }, []);

  const fetchSubCategories = useCallback(async (parentId: string) => {
    try {
      const response = await api.get(`/api/categories?parentId=${parentId}`);
      let subCategoriesData = [];
      if (response.data && Array.isArray(response.data)) {
        subCategoriesData = response.data;
      } else if (response.data && response.data.categories) {
        subCategoriesData = response.data.categories;
      } else if (response.data && response.data.data) {
        subCategoriesData = response.data.data;
      }
      setSubCategories(subCategoriesData);
    } catch (err) {
      try {
        const response = await api.get('/api/categories');
        let allData = [];
        if (response.data && Array.isArray(response.data)) {
          allData = response.data;
        } else if (response.data && response.data.categories) {
          allData = response.data.categories;
        } else if (response.data && response.data.data) {
          allData = response.data.data;
        }
        setSubCategories(allData.filter((cat: Category) => cat.parentId === parentId));
      } catch (err2) {
        console.log('Subcategories fetch error:', err2);
      }
    }
  }, []);

  const hasFetchedCategories = useRef(false);
  const hasFetchedSubCategories = useRef(false);

  useEffect(() => {
    if (!hasFetchedCategories.current && isAuthenticated) {
      hasFetchedCategories.current = true;
      const loadCategories = async () => {
        await fetchCategories();
      };
      loadCategories();
    }
  }, [fetchCategories, isAuthenticated]);

  useEffect(() => {
    const loadSubCategories = async () => {
      if (formData.categoryId) {
        hasFetchedSubCategories.current = true;
        await fetchSubCategories(formData.categoryId);
      } else {
        setSubCategories([]);
      }
    };
    loadSubCategories();
  }, [formData.categoryId, fetchSubCategories]);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        showNotification('error', 'Authentication required');
        return;
      }

      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const response = await api.post('/api/upload', formDataUpload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      let imageUrl = null;
      if (response.data && response.data.url) {
        imageUrl = response.data.url;
      } else if (response.data && response.data.imageUrl) {
        imageUrl = response.data.imageUrl;
      } else if (response.data && response.data.image) {
        imageUrl = response.data.image;
      }

      if (imageUrl) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, imageUrl]
        }));
        showNotification('success', 'Image uploaded successfully');
      } else {
        showNotification('error', 'Failed to get image URL from server');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ error: string; message?: string }>;
        const errorMsg = axiosError.response?.data?.error || 
                         axiosError.response?.data?.message || 
                         'Failed to upload image';
        showNotification('error', errorMsg);
      } else {
        showNotification('error', 'Failed to upload image');
      }
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'categoryId') {
      setFormData(prev => ({ ...prev, subCategoryId: '' }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      showNotification('success', `Tag "${newTag.trim()}" added`);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleCategoryAdded = (newCategory: Category) => {
    if (newCategory.parentId) {
      setSubCategories(prev => [...prev, newCategory]);
      setFormData(prev => ({ ...prev, subCategoryId: newCategory.id }));
      showNotification('success', `Subcategory "${newCategory.name}" created and selected`);
    } else {
      setCategories(prev => [...prev, newCategory]);
      setFormData(prev => ({ ...prev, categoryId: newCategory.id }));
      showNotification('success', `Category "${newCategory.name}" created and selected`);
    }
  };

  const handleGenerateSKU = () => {
    const newSKU = generateSKU();
    setSku(newSKU);
    showNotification('info', `New SKU generated: ${newSKU}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        showNotification('error', 'Authentication required. Please login again.');
        router.push('/auth/signin');
        setLoading(false);
        return;
      }

      if (!formData.name.trim()) {
        showNotification('error', 'Product name is required');
        setLoading(false);
        return;
      }

      if (!formData.pricePerUnit) {
        showNotification('error', 'Price Per Unit is required');
        setLoading(false);
        return;
      }

      if (!formData.categoryId) {
        showNotification('error', 'Category is required');
        setLoading(false);
        return;
      }

      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.pricePerUnit) || 0,
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
        stock: parseInt(formData.stock) || 0,
        sku: sku,
        categoryId: formData.categoryId,
        subCategoryId: formData.subCategoryId || undefined,
        status: formData.status,
        tags: formData.tags,
        images: formData.images.length > 0 ? formData.images : ['/banners/images.jpeg'],
        brand: null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        unitOfMeasurement: formData.unitOfMeasurement || 'pcs',
        pricePerUnit: formData.pricePerUnit ? parseFloat(formData.pricePerUnit) : null,
        warranty: null,
        durationTime: formData.durationTime || '1h',
      };

      const response = await api.post('/api/products', submitData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        showNotification('success', 'Product published successfully! 🎉');
        setTimeout(() => {
          router.push('/admin/products');
        }, 1500);
      } else {
        showNotification('error', response.data.error || 'Failed to publish product');
      }
    } catch (err: unknown) {
      console.error('Error creating product:', err);
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ error: string; message?: string }>;
        if (axiosError.response?.status === 401) {
          showNotification('error', 'Authentication failed. Please login again.');
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
          router.push('/auth/signin');
        } else {
          const errorMsg = axiosError.response?.data?.error || 
                          axiosError.response?.data?.message ||
                          `Failed to publish product (Status: ${axiosError.response?.status})`;
          showNotification('error', errorMsg);
        }
      } else {
        showNotification('error', err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Image component with fallback
  const ProductImage: React.FC<{ src: string; alt: string; index: number }> = ({ src, alt, index }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
      if (!hasError) {
        setHasError(true);
        if (!src.startsWith('http') && !src.startsWith('/')) {
          setImgSrc(`${API_URL}/${src}`);
        } else if (src.startsWith('/uploads/')) {
          setImgSrc(`${API_URL}${src}`);
        } else {
          setImgSrc('/placeholder-image.png');
        }
      }
    };

    return (
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
        <Image
          src={imgSrc}
          alt={alt}
          fill
          className="object-cover"
          onError={handleError}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={index === 0}
        />
        <button
          type="button"
          onClick={() => handleRemoveImage(index)}
          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 z-10"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
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

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCategoryAdded={handleCategoryAdded}
        title="Add New Category"
        isSubCategory={false}
      />

      {/* Add Subcategory Modal */}
      <AddCategoryModal
        isOpen={showSubCategoryModal}
        onClose={() => setShowSubCategoryModal(false)}
        onCategoryAdded={handleCategoryAdded}
        title="Add New Subcategory"
        isSubCategory={true}
        parentCategoryId={formData.categoryId}
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/products"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Publish Product</h1>
            <p className="text-xs text-gray-500 mt-0.5">Create and publish a new product listing</p>
          </div>
        </div>
        <Link
          href="/admin/products"
          className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info - One Card with all fields */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-6">
                <Package className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Product Information</h3>
              </div>
              
              <div className="space-y-5">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Fresh Organic Bananas"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    required
                    placeholder="Describe your product in detail..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>

                {/* Category & Sub Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-2">
                      <select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleChange}
                        required
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowCategoryModal(true)}
                        className="px-3 py-2.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors text-sm whitespace-nowrap flex items-center space-x-1"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span>New</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Sub Category</label>
                    <div className="flex space-x-2">
                      <select
                        name="subCategoryId"
                        value={formData.subCategoryId}
                        onChange={handleChange}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        disabled={!formData.categoryId}
                      >
                        <option value="">Select Sub Category</option>
                        {subCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          if (!formData.categoryId) {
                            showNotification('warning', 'Please select a category first');
                            return;
                          }
                          setShowSubCategoryModal(true);
                        }}
                        className="px-3 py-2.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors text-sm whitespace-nowrap flex items-center space-x-1"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span>New</span>
                      </button>
                    </div>
                    {!formData.categoryId && (
                      <p className="text-xs text-yellow-500 mt-1">Select a category first to add subcategory</p>
                    )}
                  </div>
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">SKU</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={sku}
                      disabled
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateSKU}
                      className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm whitespace-nowrap"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Auto-generated</p>
                </div>

                {/* ✅ FIXED: Duration Time - Now with proper labels */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>Duration Time</span>
                    </div>
                  </label>
                  <select
                    name="durationTime"
                    value={formData.durationTime}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  >
                    {durationOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Select how long this product listing will be active</p>
                </div>

                {/* Weight & Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Weight & Unit <span className="text-xs text-gray-400">(Example: 1 kg of bananas)</span>
                  </label>
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                        <Weight className="w-4 h-4" />
                      </span>
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                    <select
                      name="unitOfMeasurement"
                      value={formData.unitOfMeasurement}
                      onChange={handleChange}
                      className="w-48 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    >
                      {unitOptions.map(unit => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Stock - NEW FIELD */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Initial Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="Enter initial stock quantity"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Set the initial stock quantity for this product</p>
                </div>

                {/* Price Per Unit & Discount Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Price Per Unit (ETB) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">ETB</span>
                      <input
                        type="number"
                        name="pricePerUnit"
                        value={formData.pricePerUnit}
                        onChange={handleChange}
                        step="0.01"
                        required
                        placeholder="0.00"
                        className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Price per {formData.unitOfMeasurement || 'unit'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Discount Price (ETB)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">ETB</span>
                      <input
                        type="number"
                        name="discountPrice"
                        value={formData.discountPrice}
                        onChange={handleChange}
                        step="0.01"
                        placeholder="Optional"
                        className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Leave empty for no discount</p>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-700 text-sm rounded-full border border-green-200"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {formData.tags.length === 0 && (
                      <span className="text-sm text-gray-400">No tags added</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-sm whitespace-nowrap"
                    >
                      Add Tag
                    </button>
                  </div>
                </div>
              </div>

              {/* Publish Button */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Publishing...' : 'Publish Product'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Images Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <ImageIcon className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Images</h3>
                <span className="text-xs text-gray-400 ml-auto">{formData.images.length} uploaded</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {formData.images.map((img, index) => {
                  const imageUrl = img.startsWith('http') ? img : `${API_URL}${img}`;
                  return (
                    <ProductImage
                      key={index}
                      src={imageUrl}
                      alt={`Product ${index + 1}`}
                      index={index}
                    />
                  );
                })}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-green-500 transition-colors cursor-pointer group"
                >
                  <div className="text-center">
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto group-hover:text-green-500 transition-colors" />
                        <span className="text-xs text-gray-500 group-hover:text-green-500 transition-colors">Upload</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                multiple={false}
              />
              {formData.images.length === 0 && (
                <p className="text-xs text-gray-400 mt-2 text-center">Click to upload images (max 5MB)</p>
              )}
              <p className="text-xs text-gray-400 mt-1 text-center">Default image will be used if none uploaded</p>
            </div>

            {/* Stock Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Stock Management</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-blue-700">
                      Initial stock will be set to the value you enter above.
                      Stock will be updated automatically when orders are placed.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Initial Stock:</span>
                  <span className="font-medium text-gray-900">{parseInt(formData.stock) || 0} units</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${parseInt(formData.stock) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {parseInt(formData.stock) > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            </div>

            {/* Duration Info Card - NEW */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-4 h-4 text-purple-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Duration Info</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-purple-600" />
                    <p className="text-xs text-purple-700">
                      The duration determines how long this product will be active.
                      After the duration ends, the product will be automatically archived.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium text-gray-900">
                    {durationOptions.find(d => d.value === formData.durationTime)?.label || 'Not set'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Quick Actions</h3>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, status: 'DRAFT' }));
                    showNotification('info', 'Product will be saved as Draft');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (formData.name && formData.pricePerUnit && formData.categoryId) {
                      showNotification('info', 'Ready to publish! Click "Publish Product" button.');
                    } else {
                      showNotification('warning', 'Please fill in all required fields before publishing');
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  Preview Product
                </button>
              </div>
            </div>

            {/* Product Summary Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <Info className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Product Summary</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium text-gray-700 truncate max-w-[140px]">{formData.name || 'Not set'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Price/Unit:</span>
                  <span className="font-medium text-gray-700">{formData.pricePerUnit ? formatCurrency(parseFloat(formData.pricePerUnit)) : 'Not set'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Discount:</span>
                  <span className="font-medium text-gray-700">{formData.discountPrice ? formatCurrency(parseFloat(formData.discountPrice)) : 'Not set'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Stock:</span>
                  <span className="font-medium text-blue-600">{parseInt(formData.stock) || 0} units</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-medium text-gray-700">
                    {durationOptions.find(d => d.value === formData.durationTime)?.label || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Category:</span>
                  <span className="font-medium text-gray-700 truncate max-w-[140px]">
                    {categories.find(c => c.id === formData.categoryId)?.name || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Subcategory:</span>
                  <span className="font-medium text-gray-700 truncate max-w-[140px]">
                    {subCategories.find(c => c.id === formData.subCategoryId)?.name || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Weight:</span>
                  <span className="font-medium text-gray-700">
                    {formData.weight ? `${formData.weight} ${formData.unitOfMeasurement}` : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Images:</span>
                  <span className="font-medium text-gray-700">{formData.images.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewProductPage;