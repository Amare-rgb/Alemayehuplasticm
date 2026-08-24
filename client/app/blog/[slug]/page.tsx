// app/blog/[slug]/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import axios, { AxiosError } from 'axios';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Tag,
  User,
  Eye,
  Share2,
  Heart,
  MessageCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  
  
  Mail,
  Copy,
  CheckCircle,
  AlertCircle,
  Info,
  XCircle,
  Film,
  Play,
  Image as ImageIcon,
  Loader2
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

// Types
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image: string | null;
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

// Helper function to detect if URL is a video
const isVideoUrl = (url: string | null): boolean => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.mpeg', '.mpg', '.3gp'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.endsWith(ext) || lowerUrl.includes(ext)) ||
         lowerUrl.includes('/video/') ||
         lowerUrl.includes('/videos/');
};

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

// Media Renderer Component
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

  const fullUrl = src.startsWith('http') ? src : `${API_URL}${src}`;
  const isVideo = isVideoUrl(fullUrl);

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
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
};

const BlogDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ type, message });
  };

  const clearNotification = () => {
    setNotification(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Fetch blog post
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/blog/${slug}`);

        if (response.data.post) {
          setPost(response.data.post);
        } else {
          showNotification('error', 'Blog post not found');
        }
      } catch (err) {
        console.error('Error fetching blog post:', err);
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          showNotification('error', 'Blog post not found');
        } else {
          showNotification('error', 'Failed to load blog post');
        }
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title || 'Blog Post',
          text: post?.excerpt || 'Check out this blog post',
          url: url,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        showNotification('success', 'Link copied to clipboard!');
        setTimeout(() => setCopied(false), 3000);
      } catch (err) {
        showNotification('error', 'Failed to copy link');
      }
    }
  };

  // Handle like
  const handleLike = () => {
    setLiked(!liked);
  };

  // Handle save
  const handleSave = () => {
    setSaved(!saved);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-gray-900">Blog Post Not Found</h2>
          <p className="text-gray-500 mt-2">The blog post youre looking for doesnt exist.</p>
          <Link
            href="/blog"
            className="inline-block mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = post.image ? (post.image.startsWith('http') ? post.image : `${API_URL}${post.image}`) : null;
  const isVideo = imageUrl ? isVideoUrl(imageUrl) : false;

  return (
    <div className="min-h-screen bg-gray-50">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={clearNotification}
        />
      )}

      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Link
          href="/blog"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Blog</span>
        </Link>
      </div>

      {/* Blog Post Content */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
              {post.category || 'General'}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="flex items-center space-x-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(post.createdAt)}</span>
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{post.readTime || 3} min read</span>
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                {post.author?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{post.author?.name || 'Unknown Author'}</p>
                <p className="text-xs text-gray-500">{post.author?.email || ''}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleLike}
                className={`p-2 rounded-full transition-colors ${
                  liked ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleSave}
                className={`p-2 rounded-full transition-colors ${
                  saved ? 'bg-blue-50 text-blue-500' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Featured Media */}
        {imageUrl && (
          <div className="mb-8 rounded-xl overflow-hidden bg-gray-100">
            {isVideo ? (
              <div className="aspect-video bg-black">
                <video
                  src={imageUrl}
                  className="w-full h-full object-contain"
                  controls
                  controlsList="nodownload"
                  playsInline
                  preload="metadata"
                  poster="/video-placeholder.png"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <div className="relative aspect-video">
                <Image
                  src={imageUrl}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div
            className="text-gray-800 leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{
              __html: post.content.replace(/\n/g, '<br />')
            }}
          />
        </div>

        {/* Tags */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Category:</span>
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-green-50 text-green-700">
              {post.category || 'General'}
            </span>
          </div>
        </div>

        {/* Author Section */}
        <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl font-bold flex-shrink-0">
              {post.author?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{post.author?.name || 'Unknown Author'}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {post.author?.email || ''}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Passionate about agriculture and sustainable farming practices.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 pt-8 border-t border-gray-200 flex justify-between">
          <Link
            href="/blog"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>All Posts</span>
          </Link>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            <span>Back to Top</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </article>
    </div>
  );
};

export default BlogDetailPage;