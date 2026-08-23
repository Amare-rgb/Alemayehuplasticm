// app/admin/blog/[id]/edit/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import axios, { AxiosError } from 'axios';
import {
  ArrowLeft,
  Save,
  X,
  Image as ImageIcon,
  Upload,
  CheckCircle,
  AlertCircle,
  Info,
  XCircle,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Tag,
  User,
  FileText,
  Plus,
  Minus,
  Loader2,
  Settings,
  Video,
  Play,
  Film
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

// ✅ FIXED: Better video detection - PURE FUNCTION
const isVideoUrl = (url: string | null): boolean => {
  if (!url) return false;
  
  // Check file extensions
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.mpeg', '.mpg', '.3gp'];
  const lowerUrl = url.toLowerCase();
  
  // Check if URL ends with video extension
  if (videoExtensions.some(ext => lowerUrl.endsWith(ext) || lowerUrl.includes(ext))) {
    return true;
  }
  
  // Check for video in path
  if (lowerUrl.includes('/video/') || lowerUrl.includes('/videos/')) {
    return true;
  }
  
  // Check if it's a YouTube or Vimeo URL
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerUrl.includes('vimeo.com')) {
    return true;
  }
  
  return false;
};

// ✅ FIXED: Media Renderer - No useEffect, pure derived state
const MediaRenderer: React.FC<{ src: string | null; alt: string; className?: string }> = ({ 
  src, 
  alt, 
  className = '' 
}) => {
  const [error, setError] = useState(false);

  if (!src) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-100 ${className}`}>
        <ImageIcon className="w-12 h-12 text-gray-300" />
      </div>
    );
  }

  // ✅ Derive values directly from props - NO useEffect
  const fullUrl = src.startsWith('http') ? src : `${API_URL}${src}`;
  const isVideo = isVideoUrl(fullUrl);

  // Video rendering
  if (isVideo) {
    return (
      <div className={`relative bg-black w-full h-full ${className}`}>
        <video
          key={fullUrl}
          src={fullUrl}
          className="w-full h-full object-contain"
          controls
          controlsList="nodownload"
          playsInline
          preload="metadata"
          poster="/video-placeholder.png"
          onError={() => setError(true)}
        >
          Your browser does not support the video tag.
        </video>
        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
          <Film className="w-3 h-3" />
          <span>Video</span>
        </div>
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white">
              <Play className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Video unavailable</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Image rendering
  if (error) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto" />
          <span className="text-xs text-gray-400 block mt-2">Image unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Image
        src={fullUrl}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
};

const EditBlogPostPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

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

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ type, message });
  };

  const clearNotification = () => {
    setNotification(null);
  };

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          showNotification('error', 'Authentication required');
          router.push('/auth/signin');
          return;
        }

        const response = await api.get(`/api/blog/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.post) {
          const post = response.data.post;
          const isVideo = post.image ? isVideoUrl(post.image) : false;
          
          setFormData({
            title: post.title || '',
            content: post.content || '',
            excerpt: post.excerpt || '',
            image: isVideo ? '' : (post.image || ''),
            video: isVideo ? (post.image || '') : '',
            category: post.category || 'Agriculture',
            readTime: post.readTime || 3,
            published: post.published !== undefined ? post.published : true,
          });
          setMediaType(isVideo ? 'video' : (post.image ? 'image' : null));
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          showNotification('error', 'Blog post not found');
        } else {
          showNotification('error', 'Failed to load blog post');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id, router]);

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

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    
    if (file.size > maxSize) {
      showNotification('error', `File size must be less than ${isVideo ? '50MB' : '5MB'}`);
      return;
    }

    setUploadingMedia(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Authentication required');
        setUploadingMedia(false);
        return;
      }

      const formDataUpload = new FormData();
      formDataUpload.append('media', file);

      const response = await api.post('/api/blog/upload', formDataUpload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.mediaUrl) {
        const fieldName = isVideo ? 'video' : 'image';
        setFormData(prev => ({
          ...prev,
          [fieldName]: response.data.mediaUrl,
          ...(isVideo ? { image: '' } : { video: '' })
        }));
        setMediaType(isVideo ? 'video' : 'image');
        showNotification('success', `${isVideo ? 'Video' : 'Image'} uploaded successfully`);
      } else {
        showNotification('error', response.data.error || 'Failed to upload media');
      }
    } catch (err) {
      console.error('Error uploading media:', err);
      showNotification('error', 'Failed to upload media');
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveMedia = () => {
    setFormData(prev => ({
      ...prev,
      image: '',
      video: ''
    }));
    setMediaType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Authentication required');
        router.push('/auth/signin');
        setSaving(false);
        return;
      }

      if (!formData.title.trim()) {
        showNotification('error', 'Title is required');
        setSaving(false);
        return;
      }

      if (!formData.content.trim()) {
        showNotification('error', 'Content is required');
        setSaving(false);
        return;
      }

      const submitData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim() || formData.content.substring(0, 150),
        image: formData.image || formData.video || '',
        video: formData.video || '',
        category: formData.category,
        readTime: formData.readTime || 3,
        published: formData.published,
      };

      const response = await api.put(`/api/blog/${id}`, submitData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        showNotification('success', 'Blog post updated successfully! 🎉');
        setTimeout(() => {
          router.push('/admin/blog');
        }, 1500);
      } else {
        showNotification('error', response.data.error || 'Failed to update blog post');
      }
    } catch (err) {
      console.error('Error updating blog post:', err);
      showNotification('error', 'Failed to update blog post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  const hasMedia = formData.image || formData.video;
  const mediaSrc = formData.video || formData.image;
  const isVideo = mediaSrc ? isVideoUrl(mediaSrc) : false;

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={clearNotification}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/blog"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Edit Blog Post</h1>
            <p className="text-xs text-gray-500 mt-0.5">Update your blog post</p>
          </div>
        </div>
        <Link
          href="/admin/blog"
          className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Blog Post Content</h3>
              </div>
              
              <div className="space-y-5">
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
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <ImageIcon className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Featured Media</h3>
                <span className="text-xs text-gray-400 ml-auto">Image or Video</span>
              </div>
              
              {hasMedia && mediaSrc ? (
                <div className="relative bg-gray-100 rounded-lg overflow-hidden group">
                  <div className="aspect-video">
                    <MediaRenderer src={mediaSrc} alt="Featured media" />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveMedia}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                    {isVideo ? <Film className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                    <span>{isVideo ? 'Video' : 'Image'}</span>
                  </div>
                </div>
              ) : (
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
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="hidden"
                multiple={false}
              />
              <p className="text-xs text-gray-400 mt-2 text-center">
                Upload an image or video for your blog post
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Post Settings</h3>
              </div>
              
              <div className="space-y-4">
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

                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="published"
                      checked={formData.published}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Published</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Post</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditBlogPostPage;