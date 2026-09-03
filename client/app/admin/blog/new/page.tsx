// app/admin/blog/new/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  FileText,
  Plus,
  Minus,
  Loader2,
  Settings,
  Film,
  Link2,
  Video,
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
  const token = localStorage.getItem('authToken') || 
                sessionStorage.getItem('authToken') ||
                localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

// Video platform regex patterns
const YOUTUBE_ID_REGEX = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
const VIMEO_ID_REGEX = /vimeo\.com\/(?:video\/)?(\d+)/i;
const DAILYMOTION_ID_REGEX = /dailymotion\.com\/(?:video|embed\/video)\/([a-zA-Z0-9]+)/i;
const DIRECT_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];

const getKnownPlatformEmbedUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  const yt = url.match(YOUTUBE_ID_REGEX);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;

  const vm = url.match(VIMEO_ID_REGEX);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;

  const dm = url.match(DAILYMOTION_ID_REGEX);
  if (dm) return `https://www.dailymotion.com/embed/video/${dm[1]}`;

  return null;
};

const isVideoUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  if (getKnownPlatformEmbedUrl(url)) return true;
  const lowerUrl = url.toLowerCase();
  return DIRECT_VIDEO_EXTENSIONS.some(ext => lowerUrl.includes(ext));
};

const getEmbedUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  const platformEmbed = getKnownPlatformEmbedUrl(url);
  return platformEmbed ?? url;
};

const NewBlogPostPage: React.FC = () => {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [videoPreview, setVideoPreview] = useState<string>('');
  
  const [showVideoUrlInput, setShowVideoUrlInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

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

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
      
      if (!token) {
        router.replace('/auth/signin');
        setAuthLoading(false);
        return;
      }
      
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          if (parsedUser.role?.toUpperCase() !== 'ADMIN') {
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        showNotification('error', 'Authentication required');
        setUploadingImage(false);
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

      let mediaUrl = null;
      if (response.data && response.data.mediaUrl) {
        mediaUrl = response.data.mediaUrl;
      }

      if (mediaUrl) {
        setFormData(prev => ({
          ...prev,
          image: mediaUrl,
          video: ''
        }));
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setVideoFile(null);
        setVideoPreview('');
        showNotification('success', 'Image uploaded successfully');
      } else {
        showNotification('error', 'Failed to get image URL from server');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      showNotification('error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (!file.type.startsWith('video/')) {
      showNotification('error', 'Please select a video file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showNotification('error', 'Video size must be less than 50MB');
      return;
    }

    setUploadingVideo(true);
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        showNotification('error', 'Authentication required');
        setUploadingVideo(false);
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

      let mediaUrl = null;
      if (response.data && response.data.mediaUrl) {
        mediaUrl = response.data.mediaUrl;
      }

      if (mediaUrl) {
        setFormData(prev => ({
          ...prev,
          video: mediaUrl,
          image: ''
        }));
        setVideoFile(file);
        setVideoPreview(URL.createObjectURL(file));
        setImageFile(null);
        setImagePreview('');
        showNotification('success', 'Video uploaded successfully');
      } else {
        showNotification('error', 'Failed to get video URL from server');
      }
    } catch (err) {
      console.error('Error uploading video:', err);
      showNotification('error', 'Failed to upload video');
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  // ✅ FIXED: Handle video URL from internet
  const handleVideoUrlInsert = () => {
    if (!videoUrl.trim()) {
      showNotification('error', 'Please enter a valid video URL');
      return;
    }

    try {
      new URL(videoUrl);
    } catch {
      showNotification('error', 'Please enter a valid URL');
      return;
    }

    const trimmed = videoUrl.trim();
    const normalized = getKnownPlatformEmbedUrl(trimmed) ?? trimmed;

    console.log('🎬 Adding video URL from internet:', {
      original: trimmed,
      normalized: normalized
    });

    // ✅ CRITICAL: Update formData with the video URL
    setFormData(prev => {
      const newData = {
        ...prev,
        video: normalized,
        image: ''
      };
      console.log('📝 Updated formData:', newData);
      return newData;
    });
    
    setVideoFile(null);
    setVideoPreview('');
    setImageFile(null);
    setImagePreview('');
    setShowVideoUrlInput(false);
    setVideoUrl('');
    
    showNotification('success', 'Video URL added successfully');
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    setImageFile(null);
    setImagePreview('');
  };

  const handleRemoveVideo = () => {
    setFormData(prev => ({ ...prev, video: '' }));
    setVideoFile(null);
    setVideoPreview('');
    setShowVideoUrlInput(false);
    setVideoUrl('');
  };

  // ✅ FIXED: Submit handler with proper video URL sending
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

      // ✅ CRITICAL: Prepare data with video URL
      const submitData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim() || formData.content.substring(0, 150),
        image: formData.image || null,
        video: formData.video || null,
        category: formData.category,
        readTime: formData.readTime || 3,
        published: formData.published,
      };

      console.log('📤 SUBMITTING BLOG POST:');
      console.log('  Title:', submitData.title);
      console.log('  Image:', submitData.image);
      console.log('  Video:', submitData.video);
      console.log('  Full data:', JSON.stringify(submitData, null, 2));

      const response = await api.post('/api/blog', submitData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📥 Server response:', response.data);
      
      if (response.data.success) {
        showNotification('success', 'Blog post published successfully! 🎉');
        setTimeout(() => {
          router.push('/admin/blog');
        }, 1500);
      } else {
        showNotification('error', response.data.error || 'Failed to publish blog post');
      }
    } catch (err: unknown) {
      console.error('❌ Error creating blog post:', err);
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
                          `Failed to publish blog post`;
          showNotification('error', errorMsg);
        }
      } else {
        showNotification('error', err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderImagePreview = () => {
    if (formData.image) {
      const displayUrl = formData.image.startsWith('http') ? formData.image : `${API_URL}${formData.image}`;
      return (
        <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
          <div className="relative aspect-video bg-gray-100">
            <Image
              src={displayUrl}
              alt="Featured image"
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
              unoptimized={displayUrl.startsWith('http')}
            />
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
              <ImageIcon className="w-3 h-3" />
              <span>Image</span>
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={() => imageInputRef.current?.click()}
        className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-green-500 transition-colors cursor-pointer group"
      >
        <div className="text-center">
          {uploadingImage ? (
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto" />
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-400 mx-auto group-hover:text-green-500 transition-colors" />
              <span className="text-sm text-gray-500 group-hover:text-green-500 transition-colors block mt-2">
                Upload Image
              </span>
              <span className="text-xs text-gray-400">PNG, JPG, WebP (Max 5MB)</span>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderVideoPreview = () => {
    const videoSrc = formData.video;

    if (videoSrc) {
      const isKnownPlatformLink = getKnownPlatformEmbedUrl(videoSrc) !== null;
      const displayUrl = videoSrc.startsWith('http') ? videoSrc : `${API_URL}${videoSrc}`;

      console.log('🎬 Rendering video preview:', {
        videoSrc,
        isKnownPlatformLink,
        embedUrl: getEmbedUrl(videoSrc)
      });

      return (
        <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
          <div className="aspect-video bg-black">
            {isKnownPlatformLink ? (
              <iframe
                src={getEmbedUrl(videoSrc)}
                className="w-full h-full"
                allowFullScreen
                title="Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <video
                src={displayUrl}
                controls
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Video load error:', e);
                }}
              >
                Your browser does not support the video tag.
              </video>
            )}
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
              <Film className="w-3 h-3" />
              <span>Video</span>
            </div>
            <button
              type="button"
              onClick={handleRemoveVideo}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div
          onClick={() => videoInputRef.current?.click()}
          className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-green-500 transition-colors cursor-pointer group"
        >
          <div className="text-center">
            {uploadingVideo ? (
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto" />
            ) : (
              <>
                <Video className="w-10 h-10 text-gray-400 mx-auto group-hover:text-green-500 transition-colors" />
                <span className="text-sm text-gray-500 group-hover:text-green-500 transition-colors block mt-2">
                  Upload Video
                </span>
                <span className="text-xs text-gray-400">MP4, WebM, MOV (Max 50MB)</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="text-xs text-gray-400">OR</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        {!showVideoUrlInput ? (
          <button
            type="button"
            onClick={() => setShowVideoUrlInput(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-sm text-gray-600"
          >
            <Link2 className="w-4 h-4" />
            <span>Insert Video URL from Internet</span>
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
              <button
                type="button"
                onClick={handleVideoUrlInsert}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
              >
                Add Video
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowVideoUrlInput(false)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
            <p className="text-xs text-gray-400">
              Supports: YouTube, Vimeo, Dailymotion, and direct video URLs
            </p>
            <p className="text-xs text-blue-500">
              Example: https://youtu.be/t9wbRsXtFN0 or https://www.youtube.com/watch?v=t9wbRsXtFN0
            </p>
          </div>
        )}
      </div>
    );
  };

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

  if (!isAuthenticated) {
    return null;
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
            <p className="text-xs text-gray-500 mt-0.5">Create a new blog post with images or videos from the internet</p>
          </div>
        </div>
        <Link
          href="/admin/blog"
          className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        className="hidden"
      />

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
                  <p className="text-xs text-gray-400 mt-1">
                    If left empty, the first 150 characters will be used
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <ImageIcon className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Featured Image</h3>
                <span className="text-xs text-gray-400 ml-auto">Optional</span>
              </div>
              {renderImagePreview()}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <Film className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Featured Video</h3>
                <span className="text-xs text-gray-400 ml-auto">Optional</span>
              </div>
              {renderVideoPreview()}
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