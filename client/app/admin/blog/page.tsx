// app/admin/blog/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  ChevronDown,
  Calendar,
  Clock,
  Tag,
  CheckCircle,
  XCircle,
  RefreshCw,
  Image as ImageIcon,
  User,
  AlertCircle,
  Info,
  FileText,
  Film,
  Link2,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Axios instance                                                             */
/* -------------------------------------------------------------------------- */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('authToken') ||
    localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
      if (typeof window !== 'undefined') window.location.href = '/auth/signin';
    }
    return Promise.reject(error);
  }
);

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image: string | null;
  video: string | null;
  category: string;
  readTime: number;
  published: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

/* -------------------------------------------------------------------------- */
/*  Notification                                                               */
/* -------------------------------------------------------------------------- */
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
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
    >
      <div
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg max-w-md ${getColors()}`}
      >
        {getIcon()}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close notification"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Video / image helpers                                                      */
/* -------------------------------------------------------------------------- */
const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
const VIMEO_ID_REGEX = /vimeo\.com\/(?:video\/)?(\d+)/i;
const DAILYMOTION_ID_REGEX =
  /dailymotion\.com\/(?:video|embed\/video)\/([a-zA-Z0-9]+)/i;
const DIRECT_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'];

const getKnownPlatformEmbedUrl = (
  url: string | null | undefined
): string | null => {
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
  const lowerUrl = url.toLowerCase().split('?')[0].split('#')[0];
  return DIRECT_VIDEO_EXTENSIONS.some((ext) => lowerUrl.endsWith(ext));
};

const getEmbedUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (
    url.includes('youtube.com/embed/') ||
    url.includes('player.vimeo.com/') ||
    url.includes('dailymotion.com/embed/')
  ) {
    return url;
  }
  return getKnownPlatformEmbedUrl(url) ?? url;
};

/** Heuristic: does the URL look like an image we can safely send to next/image? */
const looksLikeImage = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase().split('?')[0].split('#')[0];

  // Explicit image extension
  if (IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return true;

  // Backend uploads are images unless the extension says otherwise
  if (lower.includes('/uploads/blog/') || lower.includes('/uploads/products/')) {
    return !DIRECT_VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
  }

  return false;
};

/** Build a fully-qualified URL for an image/video path. */
const buildFullUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return `${API_URL}${path}`;
  return `${API_URL}/${path}`;
};

/* -------------------------------------------------------------------------- */
/*  MediaRenderer — safe for any URL, never crashes on weird input             */
/* -------------------------------------------------------------------------- */
const MediaRenderer: React.FC<{
  image: string | null;
  video: string | null;
  alt: string;
  className?: string;
  eager?: boolean;
}> = ({ image, video, alt, className = '', eager = false }) => {
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const currentMedia = video || image;
  const isVideo = currentMedia ? isVideoUrl(currentMedia) : false;
  const isImage = currentMedia ? looksLikeImage(currentMedia) : false;
  const isKnownPlatformLink = currentMedia
    ? getKnownPlatformEmbedUrl(currentMedia) !== null
    : false;
  const embedUrl = getEmbedUrl(currentMedia);

  // Render-time state adjustment — no cascading useEffect.
  const [prevMedia, setPrevMedia] = useState(currentMedia);
  if (currentMedia !== prevMedia) {
    setPrevMedia(currentMedia);
    setError(false);
    setIsLoading(true);
  }

  /* ---- No media ---- */
  if (!currentMedia) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-gray-100 ${className}`}
      >
        <ImageIcon className="w-12 h-12 text-gray-300" />
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <div
        className={`relative w-full h-full flex flex-col items-center justify-center bg-gray-100 ${className}`}
      >
        <ImageIcon className="w-12 h-12 text-gray-300" />
        <span className="text-xs text-gray-400 mt-2">Failed to load media</span>
      </div>
    );
  }

  /* ---- Known platform video (YouTube / Vimeo / Dailymotion) ---- */
  if (isVideo && isKnownPlatformLink && embedUrl) {
    return (
      <div className={`relative w-full h-full bg-black ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          </div>
        )}
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={alt}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError(true);
            setIsLoading(false);
          }}
        />
        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1 pointer-events-none">
          <Film className="w-3 h-3" />
          <span>Video</span>
        </div>
      </div>
    );
  }

  /* ---- Direct video file (.mp4 / .webm / uploads) ---- */
  if (isVideo) {
    const fullUrl = buildFullUrl(currentMedia);
    return (
      <div className={`relative bg-black w-full h-full ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          </div>
        )}
        <video
          key={currentMedia}
          src={fullUrl}
          className="w-full h-full object-cover"
          controls
          controlsList="nodownload"
          playsInline
          preload="metadata"
          onLoadedData={() => setIsLoading(false)}
          onError={() => {
            setError(true);
            setIsLoading(false);
          }}
        >
          Your browser does not support the video tag.
        </video>
        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1 pointer-events-none">
          <Film className="w-3 h-3" />
          <span>Video</span>
        </div>
      </div>
    );
  }

  /* ---- Unknown media type (e.g. YouTube channel URL stored in `image`) ---- */
  if (!isImage) {
    return (
      <div
        className={`relative w-full h-full flex flex-col items-center justify-center bg-gray-100 ${className}`}
      >
        <Link2 className="w-10 h-10 text-gray-300" />
        <span className="text-xs text-gray-400 mt-2 px-4 text-center line-clamp-2 break-all">
          Unsupported media
        </span>
      </div>
    );
  }

  /* ---- Image (safe path) ---- */
  const fullUrl = buildFullUrl(currentMedia);
  const isLocalBackendImage =
    fullUrl.startsWith(API_URL) && fullUrl.includes('/uploads/');

  return (
    <div className={`relative w-full h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      )}

      {isLocalBackendImage ? (
        <Image
          key={currentMedia}
          src={fullUrl}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError(true);
            setIsLoading(false);
          }}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
        />
      ) : (
        // External image — plain <img> avoids unconfigured-host errors.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={currentMedia}
          src={fullUrl}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError(true);
            setIsLoading(false);
          }}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
        />
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Main page                                                                  */
/* -------------------------------------------------------------------------- */
const BlogPage: React.FC = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(9);
  const [totalPages, setTotalPages] = useState(1);

  const isMounted = useRef(true);

  const showNotification = useCallback(
    (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
      setNotification({ type, message });
    },
    []
  );

  const clearNotification = useCallback(() => setNotification(null), []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: boolean) =>
    status ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';

  const getStatusLabel = (status: boolean) => (status ? 'Published' : 'Draft');

  /**
   * Fetch blog posts.
   * @param opts.silent — if true, skip setLoading(true). Used for refreshes
   *                      and background updates.
   */
  const fetchPosts = useCallback(
    async (opts?: { silent?: boolean }) => {
      try {
        if (!opts?.silent) setLoading(true);

        const token =
          localStorage.getItem('authToken') ||
          sessionStorage.getItem('authToken');
        if (!token) {
          showNotification('error', 'Authentication required. Please login again.');
          router.push('/auth/signin');
          return;
        }

        const params = new URLSearchParams();
        if (selectedStatus !== 'all') {
          params.append(
            'published',
            selectedStatus === 'published' ? 'true' : 'false'
          );
        }
        if (selectedCategory !== 'all') {
          params.append('category', selectedCategory);
        }
        if (searchQuery) params.append('search', searchQuery);
        params.append('page', currentPage.toString());
        params.append('limit', pageSize.toString());

        const response = await api.get(`/api/blog?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!isMounted.current) return;

        let postsData: BlogPost[] = [];
        let totalCount = 0;

        if (response.data && Array.isArray(response.data.posts)) {
          postsData = response.data.posts;
          totalCount = response.data.total ?? postsData.length;
        } else if (Array.isArray(response.data)) {
          postsData = response.data;
          totalCount = postsData.length;
        }

        setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));
        setPosts(postsData);
        setTotal(totalCount);

        if (postsData.length > 0) {
          setCategories((prev) => {
            const merged = new Set(prev);
            postsData.forEach((p) => {
              if (p.category) merged.add(p.category);
            });
            return Array.from(merged);
          });
        }
      } catch (err: unknown) {
        if (!isMounted.current) return;

        if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError<{ error: string }>;
          const status = axiosError.response?.status;
          if (status === 401 || status === 403) {
            showNotification('error', 'Authentication failed. Please login again.');
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            router.push('/auth/signin');
          } else {
            showNotification(
              'error',
              axiosError.response?.data?.error || 'Failed to fetch blog posts'
            );
          }
        } else {
          showNotification(
            'error',
            err instanceof Error ? err.message : 'An unexpected error occurred'
          );
        }
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    [
      selectedStatus,
      selectedCategory,
      searchQuery,
      currentPage,
      pageSize,
      router,
      showNotification,
    ]
  );

  /**
   * ✅ Deferred fetch — avoids "setState synchronously in effect" lint error.
   * Cleanup clears the timer so no orphan fetches fire.
   */
  useEffect(() => {
    isMounted.current = true;

    const isFirstRun = posts.length === 0;
    const id = window.setTimeout(() => {
      fetchPosts({ silent: isFirstRun });
    }, 0);

    return () => {
      isMounted.current = false;
      window.clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedCategory, searchQuery, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    showNotification('info', 'Refreshing blog posts...');
    fetchPosts({ silent: false });
  };

  const handleDelete = async (id: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${title}"? This action cannot be undone.`
      )
    )
      return;

    try {
      const token =
        localStorage.getItem('authToken') ||
        sessionStorage.getItem('authToken');
      if (!token) {
        showNotification('error', 'Authentication required');
        return;
      }

      const response = await api.delete(`/api/blog/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        showNotification('success', `Blog post "${title}" deleted successfully`);
        await fetchPosts({ silent: true });
      } else {
        showNotification(
          'error',
          response.data.error || 'Failed to delete blog post'
        );
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          showNotification(
            'error',
            'Blog post not found. It may have already been deleted.'
          );
        } else {
          showNotification(
            'error',
            err.response?.data?.error || 'Failed to delete blog post'
          );
        }
      } else {
        showNotification('error', 'An unexpected error occurred');
      }
    }
  };

  const totalPosts = posts.length;
  const publishedPosts = posts.filter((p) => p.published === true).length;
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading blog posts...</p>
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Blog</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your blog posts and content
          </p>
          <p className="text-xs text-gray-400 mt-1">Total: {totalPosts} posts</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Post</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Posts</p>
          <p className="text-lg font-bold text-gray-900">{totalPosts}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Published</p>
          <p className="text-lg font-bold text-green-600">{publishedPosts}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Views</p>
          <p className="text-lg font-bold text-blue-600">
            {totalViews.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search + actions */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search blog posts..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
          />
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                showFilters ? 'rotate-180' : ''
              }`}
            />
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.length > 0 ? (
          posts.map((post, index) => {
            const hasVideo = !!post.video;
            const imageIsVideo = post.image ? isVideoUrl(post.image) : false;
            const isVideoPost = hasVideo || imageIsVideo;

            return (
              <div
                key={post.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                <div className="relative h-48 bg-gray-100">
                  <MediaRenderer
                    image={post.image}
                    video={post.video}
                    alt={post.title}
                    eager={index < 2}
                  />
                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(
                        post.published
                      )}`}
                    >
                      {getStatusLabel(post.published)}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-2 hover:text-green-600 transition-colors">
                      <Link href={`/admin/blog/${post.id}/edit`}>
                        {post.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {post.excerpt || post.content?.substring(0, 120)}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{post.author?.name || 'Unknown'}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Tag className="w-3 h-3" />
                        <span>{post.category || 'General'}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(post.createdAt)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{post.readTime || 3} min read</span>
                      </span>
                      <span>{post.views || 0} views</span>
                    </div>
                  </div>

                  {isVideoPost && (
                    <div className="mt-2">
                      <span className="inline-flex items-center space-x-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        <Film className="w-3 h-3" />
                        <span>Video Post</span>
                      </span>
                    </div>
                  )}
                  {!isVideoPost && (post.image || post.video) && (
                    <div className="mt-2">
                      <span className="inline-flex items-center space-x-1 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                        <ImageIcon className="w-3 h-3" />
                        <span>Image Post</span>
                      </span>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </Link>
                    <div className="flex items-center space-x-1">
                      <Link
                        href={`/admin/blog/${post.id}/edit`}
                        className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                        aria-label="Edit post"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Delete post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-3 p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm">No blog posts found</p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, total)} of {total}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage >= totalPages}
              className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPage;