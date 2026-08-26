// app/admin/blog/new/page.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import axios, { AxiosError } from 'axios';
import {
  ArrowLeft,
 
  Image as ImageIcon,
  Upload,
  CheckCircle,
  AlertCircle,
  Info,
  XCircle,
  Trash2,
  Eye,
  
  FileText,
  Plus,
  Minus,
  Loader2,
  Settings,
  
  Film,
  Link2,
 
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

// Helper function to detect if URL is a video
const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext)) || 
         lowerUrl.includes('video') ||
         lowerUrl.includes('youtube.com') ||
         lowerUrl.includes('youtu.be') ||
         lowerUrl.includes('vimeo.com') ||
         lowerUrl.includes('dailymotion.com') ||
         lowerUrl.includes('stream');
};

const NewBlogPostPage: React.FC = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'url' | null>(null);
  const [showVideoUrlInput, setShowVideoUrlInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  // ✅ FIXED: Authentication state
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    image: '',
    video: '',
    category: 'Agriculture',
    readTime: 3,
    published: true,
  });

  const categories = [
    'Agriculture',
    'Sustainable Farming',
    'Organic Farming',
    'Crop Management',
    'Soil Science',
    'Technology',
    'Livestock',
    'Agribusiness',
    'Climate Change',
    'Food Security',
    'Farm Equipment',
    'Irrigation'
  ];

  // ✅ FIXED: Authentication check on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
      
      console.log('🔍 New Blog Post - Checking auth...');
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
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle media upload (image or video)
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB for video, 5MB for image
    
    if (file.size > maxSize) {
      showNotification('error', `File size must be less than ${isVideo ? '50MB' : '5MB'}`);
      return;
    }

    setUploadingMedia(true);
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        showNotification('error', 'Authentication required');
        setUploadingMedia(false);
        return;
      }

      const formDataUpload = new FormData();
      formDataUpload.append('image', file); // Use 'image' field for both images and videos

      console.log('📤 Uploading media...', file.name, file.size);
      
      // Try using the /api/upload endpoint instead of /api/blog/upload
      const response = await api.post('/api/upload', formDataUpload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('📊 Upload response:', response.data);

      let mediaUrl = null;
      if (response.data && response.data.url) {
        mediaUrl = response.data.url;
      } else if (response.data && response.data.imageUrl) {
        mediaUrl = response.data.imageUrl;
      } else if (response.data && response.data.image) {
        mediaUrl = response.data.image;
      }

      if (mediaUrl) {
        const fieldName = isVideo ? 'video' : 'image';
        setFormData(prev => ({
          ...prev,
          [fieldName]: mediaUrl
        }));
        setMediaType(isVideo ? 'video' : 'image');
        setShowVideoUrlInput(false);
        showNotification('success', `${isVideo ? 'Video' : 'Image'} uploaded successfully`);
      } else {
        showNotification('error', 'Failed to get media URL from server');
      }
    } catch (err) {
      console.error('Error uploading media:', err);
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ error: string; message?: string }>;
        const errorMsg = axiosError.response?.data?.error || 
                         axiosError.response?.data?.message || 
                         'Failed to upload media';
        showNotification('error', errorMsg);
      } else {
        showNotification('error', 'Failed to upload media');
      }
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle video URL insertion
  const handleVideoUrlInsert = () => {
    if (!videoUrl.trim()) {
      showNotification('error', 'Please enter a valid video URL');
      return;
    }

    // Validate URL
    try {
      new URL(videoUrl);
    } catch {
      showNotification('error', 'Please enter a valid URL');
      return;
    }

    setFormData(prev => ({
      ...prev,
      video: videoUrl.trim()
    }));
    setMediaType('url');
    setShowVideoUrlInput(false);
    setVideoUrl('');
    showNotification('success', 'Video URL added successfully');
  };

  const handleRemoveMedia = () => {
    setFormData(prev => ({
      ...prev,
      image: '',
      video: ''
    }));
    setMediaType(null);
    setShowVideoUrlInput(false);
    setVideoUrl('');
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

      if (!formData.title.trim()) {
        showNotification('error', 'Title is required');
        setLoading(false);
        return;
      }

      if (!formData.content.trim()) {
        showNotification('error', 'Content is required');
        setLoading(false);
        return;
      }

      const submitData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim() || formData.content.substring(0, 150),
        image: formData.image || '',
        video: formData.video || '',
        category: formData.category,
        readTime: formData.readTime || 3,
        published: formData.published,
      };

      console.log('📤 Creating blog post:', submitData);
      
      const response = await api.post('/api/blog', submitData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Create response:', response.data);
      
      if (response.data.success) {
        showNotification('success', 'Blog post published successfully! 🎉');
        setTimeout(() => {
          router.push('/admin/blog');
        }, 1500);
      } else {
        showNotification('error', response.data.error || 'Failed to publish blog post');
      }
    } catch (err: unknown) {
      console.error('Error creating blog post:', err);
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
                          `Failed to publish blog post (Status: ${axiosError.response?.status})`;
          showNotification('error', errorMsg);
        }
      } else {
        showNotification('error', err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Render media preview
  const renderMediaPreview = () => {
    const videoSrc = formData.video;
    const imageSrc = formData.image;
    const hasMedia = videoSrc || imageSrc;

    if (!hasMedia) {
      return (
        <div className="space-y-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-green-500 transition-colors cursor-pointer group"
          >
            <div className="text-center">
              {uploadingMedia ? (
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto" />
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-400 mx-auto group-hover:text-green-500 transition-colors" />
                  <span className="text-sm text-gray-500 group-hover:text-green-500 transition-colors block mt-2">
                    Upload Image or Video
                  </span>
                  <span className="text-xs text-gray-400">PNG, JPG, WebP, MP4, WebM (Max 50MB)</span>
                </>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaUpload}
            className="hidden"
            multiple={false}
          />
          
          {/* OR Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="text-xs text-gray-400">OR</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Video URL Input */}
          {!showVideoUrlInput ? (
            <button
              type="button"
              onClick={() => setShowVideoUrlInput(true)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-sm text-gray-600"
            >
              <Link2 className="w-4 h-4" />
              <span>Insert Video URL</span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
                <button
                  type="button"
                  onClick={handleVideoUrlInsert}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Add
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowVideoUrlInput(false)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          <p className="text-xs text-gray-400 text-center">
            Supports YouTube, Vimeo, and direct video URLs
          </p>
        </div>
      );
    }

    // Render preview with media
    const isVideo = videoSrc && isVideoUrl(videoSrc);
    const displaySrc = videoSrc || imageSrc;
    const displayUrl = displaySrc.startsWith('http') ? displaySrc : `${API_URL}${displaySrc}`;

    return (
      <div className="relative bg-gray-100 rounded-lg overflow-hidden group">
        {isVideo ? (
          <div className="aspect-video">
            {videoSrc.includes('youtube.com') || videoSrc.includes('youtu.be') ? (
              <iframe
                src={videoSrc.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                className="w-full h-full"
                allowFullScreen
                title="Video"
              />
            ) : (
              <video
                src={displayUrl}
                controls
                className="w-full h-full object-cover"
                poster="/video-placeholder.png"
              >
                Your browser does not support the video tag.
              </video>
            )}
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
              <Film className="w-3 h-3" />
              <span>Video {mediaType === 'url' ? '(URL)' : ''}</span>
            </div>
          </div>
        ) : (
          <div className="relative aspect-video">
            <Image
              src={displayUrl}
              alt="Featured image"
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'w-full h-full flex items-center justify-center bg-gray-100';
                  fallback.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
                  parent.appendChild(fallback);
                }
              }}
              unoptimized={displayUrl.startsWith('http')}
            />
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
              <ImageIcon className="w-3 h-3" />
              <span>Image</span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleRemoveMedia}
          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // Show auth loading state
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

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/blog"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">New Blog Post</h1>
            <p className="text-xs text-gray-500 mt-0.5">Create a new blog post with images or videos</p>
          </div>
        </div>
        <Link
          href="/admin/blog"
          className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Blog Post Content</h3>
              </div>
              
              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Enter blog post title..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    rows={10}
                    required
                    placeholder="Write your blog post content here..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.content.length} characters
                  </p>
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Excerpt (Summary)
                  </label>
                  <textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Brief summary of your blog post..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    If left empty, the first 150 characters will be used
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Media Upload */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <ImageIcon className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Featured Media</h3>
                <span className="text-xs text-gray-400 ml-auto">Image or Video</span>
              </div>
              
              {renderMediaPreview()}
            </div>

            {/* Post Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Post Settings</h3>
              </div>
              
              <div className="space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Read Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Read Time (minutes)
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, readTime: Math.max(1, prev.readTime - 1) }))}
                      className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      name="readTime"
                      value={formData.readTime}
                      onChange={handleChange}
                      min="1"
                      className="w-20 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, readTime: prev.readTime + 1 }))}
                      className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Publish Status */}
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="published"
                      checked={formData.published}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Publish immediately</span>
                  </label>
                  {!formData.published && (
                    <p className="text-xs text-yellow-500 mt-1">
                      Post will be saved as draft
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <Eye className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Preview</h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Title:</span>
                  <span className="font-medium text-gray-700 truncate max-w-[140px]">
                    {formData.title || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Category:</span>
                  <span className="font-medium text-gray-700">{formData.category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Read Time:</span>
                  <span className="font-medium text-gray-700">{formData.readTime} min</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Status:</span>
                  <span className={`font-medium ${formData.published ? 'text-green-600' : 'text-yellow-600'}`}>
                    {formData.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Media:</span>
                  <span className="font-medium text-gray-700">
                    {formData.image ? 'Image ✓' : formData.video ? 'Video ✓' : 'None'}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Publish Post</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewBlogPostPage;