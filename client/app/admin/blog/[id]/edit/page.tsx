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
  Play,
  Film,
  Link2,
} from 'lucide-react';

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

// ✅ FIXED: regex-based ID extraction, identical to the backend, the blog
// list page, and the new-post page — all four now always agree on what's a
// video and what its embed URL is.
const YOUTUBE_ID_REGEX = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
const VIMEO_ID_REGEX = /vimeo\.com\/(?:video\/)?(\d+)/i;
const DAILYMOTION_ID_REGEX = /dailymotion\.com\/(?:video|embed\/video)\/([a-zA-Z0-9]+)/i;
const DIRECT_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.mpeg', '.mpg', '.3gp'];

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

// ✅ FIXED: MediaRenderer previously had NO iframe branch at all — every
// video, including YouTube/Vimeo links, was pushed into a plain <video>
// tag trying to play a webpage URL as a file, which always failed and
// showed "Video unavailable". Now it renders an iframe for known platform
// links and a real <video> tag only for direct files/uploads.
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

  const isKnownPlatformLink = getKnownPlatformEmbedUrl(src) !== null;
  const isVideo = isVideoUrl(src);

  // Known platform link (YouTube/Vimeo/DailyMotion) - always an iframe
  if (isVideo && isKnownPlatformLink) {
    const embedUrl = getEmbedUrl(src);
    return (
      <div className={`relative w-full h-full ${className}`}>
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={alt}
        />
        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
          <Film className="w-3 h-3" />
          <span>Video</span>
        </div>
      </div>
    );
  }

  const fullUrl = src.startsWith('http') ? src : `${API_URL}${src}`;

  // Direct video file (upload or .mp4 link) - render <video> tag
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

  // Render image
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
        unoptimized={fullUrl.startsWith('http')}
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
  const [showVideoUrlInput, setShowVideoUrlInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  // Authentication state
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

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ type, message });
  };

  const clearNotification = () => {
    setNotification(null);
  };

  // Authentication check on mount
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

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      if (!isAuthenticated || !id) return;

      try {
        setLoading(true);
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (!token) {
          showNotification('error', 'Authentication required');
          router.push('/auth/signin');
          return;
        }

        const response = await api.get(`/api/blog/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const post = response.data?.post || response.data?.data;

        if (post) {
          // ✅ FIXED: check post.video FIRST — it's the source of truth from
          // the backend. Only fall back to inspecting post.image for legacy
          // rows that were saved before the image/video split existed. The
          // old code only ever looked at post.image and silently dropped
          // any video stored in post.video.
          let videoValue = '';
          let imageValue = '';

          if (post.video) {
            videoValue = post.video;
            imageValue = post.image && !isVideoUrl(post.image) ? post.image : '';
          } else if (post.image && isVideoUrl(post.image)) {
            // Legacy row: video URL was stored in the image column
            videoValue = post.image;
          } else {
            imageValue = post.image || '';
          }

          setFormData({
            title: post.title || '',
            content: post.content || '',
            excerpt: post.excerpt || '',
            image: imageValue,
            video: videoValue,
            category: post.category || 'Agriculture',
            readTime: post.readTime || 3,
            published: post.published !== undefined ? post.published : true,
          });
          setMediaType(videoValue ? 'video' : (imageValue ? 'image' : null));
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

    fetchPost();
  }, [id, router, isAuthenticated]);

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
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;

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
      } else if (response.data && response.data.url) {
        mediaUrl = response.data.url;
      } else if (response.data && response.data.imageUrl) {
        mediaUrl = response.data.imageUrl;
      }

      if (mediaUrl) {
        const fieldName = isVideo ? 'video' : 'image';
        setFormData(prev => ({
          ...prev,
          [fieldName]: mediaUrl,
          ...(isVideo ? { image: '' } : { video: '' })
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

    try {
      new URL(videoUrl);
    } catch {
      showNotification('error', 'Please enter a valid URL');
      return;
    }

    // ✅ FIXED: normalize known platform links immediately, same as the
    // new-post page, so the preview and the payload sent on save always
    // use a real embeddable URL.
    const trimmed = videoUrl.trim();
    const normalized = getKnownPlatformEmbedUrl(trimmed) ?? trimmed;

    setFormData(prev => ({
      ...prev,
      video: normalized,
      image: ''
    }));
    setMediaType('video');
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
    setSaving(true);

    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
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

      // ✅ FIXED: keep image and video as separate fields — the old code
      // wrote the video URL into BOTH `image` and `video`
      // (`image: mediaField`), which polluted the image column with a
      // YouTube URL and broke anything that assumed `image` was always
      // a plain image (e.g. Open Graph tags, thumbnails elsewhere in the
      // app). Send each field for what it actually is.
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
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ error: string }>;
        if (axiosError.response?.status === 401) {
          showNotification('error', 'Authentication failed. Please login again.');
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
          router.push('/auth/signin');
        } else {
          showNotification('error', axiosError.response?.data?.error || 'Failed to update blog post');
        }
      } else {
        showNotification('error', 'Failed to update blog post');
      }
    } finally {
      setSaving(false);
    }
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
            {/* Media Upload */}
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
              )}
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