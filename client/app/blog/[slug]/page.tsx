// app/blog/[slug]/page.tsx
// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import Link from 'next/link';
// import Image from 'next/image';
// import axios, { AxiosError } from 'axios';
// import {
//   ArrowLeft,
//   Calendar,
//   Clock,
//   Tag,
//   User,
//   Eye,
//   Share2,
//   Heart,
//   MessageCircle,
//   Bookmark,
//   ChevronLeft,
//   ChevronRight,
  
  
//   Mail,
//   Copy,
//   CheckCircle,
//   AlertCircle,
//   Info,
//   XCircle,
//   Film,
//   Play,
//   Image as ImageIcon,
//   Loader2
// } from 'lucide-react';

// // Create axios instance
// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// const api = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   withCredentials: true,
// });

// // Types
// interface BlogPost {
//   id: string;
//   title: string;
//   slug: string;
//   content: string;
//   excerpt: string;
//   image: string | null;
//   category: string;
//   readTime: number;
//   published: boolean;
//   views: number;
//   createdAt: string;
//   updatedAt: string;
//   author: {
//     id: string;
//     name: string;
//     email: string;
//     avatar: string | null;
//   };
// }

// // Helper function to detect if URL is a video
// const isVideoUrl = (url: string | null): boolean => {
//   if (!url) return false;
//   const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.mpeg', '.mpg', '.3gp'];
//   const lowerUrl = url.toLowerCase();
//   return videoExtensions.some(ext => lowerUrl.endsWith(ext) || lowerUrl.includes(ext)) ||
//          lowerUrl.includes('/video/') ||
//          lowerUrl.includes('/videos/');
// };

// // Notification Component
// interface NotificationProps {
//   type: 'success' | 'error' | 'info' | 'warning';
//   message: string;
//   onClose: () => void;
// }

// const Notification: React.FC<NotificationProps> = ({ type, message, onClose }) => {
//   const [isVisible, setIsVisible] = useState(true);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setIsVisible(false);
//       setTimeout(onClose, 300);
//     }, 5000);

//     return () => clearTimeout(timer);
//   }, [onClose]);

//   const getIcon = () => {
//     switch (type) {
//       case 'success':
//         return <CheckCircle className="w-5 h-5 text-green-500" />;
//       case 'error':
//         return <XCircle className="w-5 h-5 text-red-500" />;
//       case 'warning':
//         return <AlertCircle className="w-5 h-5 text-yellow-500" />;
//       default:
//         return <Info className="w-5 h-5 text-blue-500" />;
//     }
//   };

//   const getColors = () => {
//     switch (type) {
//       case 'success':
//         return 'bg-green-50 border-green-200 text-green-800';
//       case 'error':
//         return 'bg-red-50 border-red-200 text-red-800';
//       case 'warning':
//         return 'bg-yellow-50 border-yellow-200 text-yellow-800';
//       default:
//         return 'bg-blue-50 border-blue-200 text-blue-800';
//     }
//   };

//   return (
//     <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}>
//       <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg max-w-md ${getColors()}`}>
//         {getIcon()}
//         <p className="text-sm font-medium flex-1">{message}</p>
//         <button
//           onClick={() => {
//             setIsVisible(false);
//             setTimeout(onClose, 300);
//           }}
//           className="text-gray-400 hover:text-gray-600 transition-colors"
//         >
//           <XCircle className="w-4 h-4" />
//         </button>
//       </div>
//     </div>
//   );
// };

// // Media Renderer Component
// const MediaRenderer: React.FC<{ src: string | null; alt: string; className?: string }> = ({
//   src,
//   alt,
//   className = ''
// }) => {
//   const [error, setError] = useState(false);

//   if (!src) {
//     return (
//       <div className={`w-full h-full flex items-center justify-center bg-gray-100 ${className}`}>
//         <ImageIcon className="w-12 h-12 text-gray-300" />
//       </div>
//     );
//   }

//   const fullUrl = src.startsWith('http') ? src : `${API_URL}${src}`;
//   const isVideo = isVideoUrl(fullUrl);

//   if (isVideo) {
//     return (
//       <div className={`relative bg-black w-full h-full ${className}`}>
//         <video
//           key={fullUrl}
//           src={fullUrl}
//           className="w-full h-full object-contain"
//           controls
//           controlsList="nodownload"
//           playsInline
//           preload="metadata"
//           poster="/video-placeholder.png"
//           onError={() => setError(true)}
//         >
//           Your browser does not support the video tag.
//         </video>
//         <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
//           <Film className="w-3 h-3" />
//           <span>Video</span>
//         </div>
//         {error && (
//           <div className="absolute inset-0 flex items-center justify-center bg-black/80">
//             <div className="text-center text-white">
//               <Play className="w-12 h-12 mx-auto mb-2 text-gray-400" />
//               <p className="text-sm">Video unavailable</p>
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className={`w-full h-full flex items-center justify-center bg-gray-100 ${className}`}>
//         <div className="text-center">
//           <ImageIcon className="w-12 h-12 text-gray-300 mx-auto" />
//           <span className="text-xs text-gray-400 block mt-2">Image unavailable</span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className={`relative w-full h-full ${className}`}>
//       <Image
//         src={fullUrl}
//         alt={alt}
//         fill
//         className="object-cover"
//         onError={() => setError(true)}
//         sizes="(max-width: 768px) 100vw, 50vw"
//       />
//     </div>
//   );
// };

// const BlogDetailPage: React.FC = () => {
//   const params = useParams();
//   const router = useRouter();
//   const slug = params?.slug as string;
//   const [loading, setLoading] = useState(true);
//   const [post, setPost] = useState<BlogPost | null>(null);
//   const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
//   const [liked, setLiked] = useState(false);
//   const [saved, setSaved] = useState(false);
//   const [copied, setCopied] = useState(false);

//   const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
//     setNotification({ type, message });
//   };

//   const clearNotification = () => {
//     setNotification(null);
//   };

//   const formatDate = (dateString: string) => {
//     if (!dateString) return 'N/A';
//     return new Date(dateString).toLocaleString('en-US', {
//       month: 'long',
//       day: 'numeric',
//       year: 'numeric'
//     });
//   };

//   // Fetch blog post
//   useEffect(() => {
//     const fetchPost = async () => {
//       try {
//         setLoading(true);
//         const response = await api.get(`/api/blog/${slug}`);

//         if (response.data.post) {
//           setPost(response.data.post);
//         } else {
//           showNotification('error', 'Blog post not found');
//         }
//       } catch (err) {
//         console.error('Error fetching blog post:', err);
//         if (axios.isAxiosError(err) && err.response?.status === 404) {
//           showNotification('error', 'Blog post not found');
//         } else {
//           showNotification('error', 'Failed to load blog post');
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (slug) {
//       fetchPost();
//     }
//   }, [slug]);

//   // Handle share
//   const handleShare = async () => {
//     const url = window.location.href;
//     if (navigator.share) {
//       try {
//         await navigator.share({
//           title: post?.title || 'Blog Post',
//           text: post?.excerpt || 'Check out this blog post',
//           url: url,
//         });
//       } catch (err) {
//         console.log('Share cancelled');
//       }
//     } else {
//       // Fallback: copy to clipboard
//       try {
//         await navigator.clipboard.writeText(url);
//         setCopied(true);
//         showNotification('success', 'Link copied to clipboard!');
//         setTimeout(() => setCopied(false), 3000);
//       } catch (err) {
//         showNotification('error', 'Failed to copy link');
//       }
//     }
//   };

//   // Handle like
//   const handleLike = () => {
//     setLiked(!liked);
//   };

//   // Handle save
//   const handleSave = () => {
//     setSaved(!saved);
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto" />
//           <p className="mt-4 text-gray-600">Loading blog post...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!post) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <div className="text-6xl mb-4">📄</div>
//           <h2 className="text-2xl font-bold text-gray-900">Blog Post Not Found</h2>
//           <p className="text-gray-500 mt-2">The blog post youre looking for doesnt exist.</p>
//           <Link
//             href="/blog"
//             className="inline-block mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//           >
//             Back to Blog
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   const imageUrl = post.image ? (post.image.startsWith('http') ? post.image : `${API_URL}${post.image}`) : null;
//   const isVideo = imageUrl ? isVideoUrl(imageUrl) : false;

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {notification && (
//         <Notification
//           type={notification.type}
//           message={notification.message}
//           onClose={clearNotification}
//         />
//       )}

//       {/* Back Button */}
//       <div className="max-w-4xl mx-auto px-4 pt-6">
//         <Link
//           href="/blog"
//           className="inline-flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
//         >
//           <ChevronLeft className="w-5 h-5" />
//           <span>Back to Blog</span>
//         </Link>
//       </div>

//       {/* Blog Post Content */}
//       <article className="max-w-4xl mx-auto px-4 py-8">
//         {/* Header */}
//         <header className="mb-8">
//           <div className="flex items-center space-x-2 mb-4">
//             <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
//               {post.category || 'General'}
//             </span>
//             <span className="text-xs text-gray-400">•</span>
//             <span className="flex items-center space-x-1 text-xs text-gray-500">
//               <Calendar className="w-3 h-3" />
//               <span>{formatDate(post.createdAt)}</span>
//             </span>
//             <span className="text-xs text-gray-400">•</span>
//             <span className="flex items-center space-x-1 text-xs text-gray-500">
//               <Clock className="w-3 h-3" />
//               <span>{post.readTime || 3} min read</span>
//             </span>
//           </div>

//           <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
//             {post.title}
//           </h1>

//           <div className="flex items-center justify-between flex-wrap gap-4">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
//                 {post.author?.name?.charAt(0).toUpperCase() || 'A'}
//               </div>
//               <div>
//                 <p className="text-sm font-medium text-gray-900">{post.author?.name || 'Unknown Author'}</p>
//                 <p className="text-xs text-gray-500">{post.author?.email || ''}</p>
//               </div>
//             </div>

//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={handleLike}
//                 className={`p-2 rounded-full transition-colors ${
//                   liked ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
//                 }`}
//               >
//                 <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
//               </button>
//               <button
//                 onClick={handleSave}
//                 className={`p-2 rounded-full transition-colors ${
//                   saved ? 'bg-blue-50 text-blue-500' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
//                 }`}
//               >
//                 <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
//               </button>
//               <button
//                 onClick={handleShare}
//                 className="p-2 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors"
//               >
//                 <Share2 className="w-5 h-5" />
//               </button>
//             </div>
//           </div>
//         </header>

//         {/* Featured Media */}
//         {imageUrl && (
//           <div className="mb-8 rounded-xl overflow-hidden bg-gray-100">
//             {isVideo ? (
//               <div className="aspect-video bg-black">
//                 <video
//                   src={imageUrl}
//                   className="w-full h-full object-contain"
//                   controls
//                   controlsList="nodownload"
//                   playsInline
//                   preload="metadata"
//                   poster="/video-placeholder.png"
//                 >
//                   Your browser does not support the video tag.
//                 </video>
//               </div>
//             ) : (
//               <div className="relative aspect-video">
//                 <Image
//                   src={imageUrl}
//                   alt={post.title}
//                   fill
//                   className="object-cover"
//                   sizes="(max-width: 768px) 100vw, 50vw"
//                 />
//               </div>
//             )}
//           </div>
//         )}

//         {/* Content */}
//         <div className="prose prose-lg max-w-none">
//           <div
//             className="text-gray-800 leading-relaxed space-y-4"
//             dangerouslySetInnerHTML={{
//               __html: post.content.replace(/\n/g, '<br />')
//             }}
//           />
//         </div>

//         {/* Tags */}
//         <div className="mt-8 pt-8 border-t border-gray-200">
//           <div className="flex items-center space-x-2">
//             <Tag className="w-4 h-4 text-gray-400" />
//             <span className="text-sm text-gray-500">Category:</span>
//             <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-green-50 text-green-700">
//               {post.category || 'General'}
//             </span>
//           </div>
//         </div>

//         {/* Author Section */}
//         <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
//           <div className="flex items-start space-x-4">
//             <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl font-bold flex-shrink-0">
//               {post.author?.name?.charAt(0).toUpperCase() || 'A'}
//             </div>
//             <div>
//               <h3 className="font-semibold text-gray-900">{post.author?.name || 'Unknown Author'}</h3>
//               <p className="text-sm text-gray-500 mt-1">
//                 {post.author?.email || ''}
//               </p>
//               <p className="text-sm text-gray-600 mt-2">
//                 Passionate about agriculture and sustainable farming practices.
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Navigation */}
//         <div className="mt-8 pt-8 border-t border-gray-200 flex justify-between">
//           <Link
//             href="/blog"
//             className="inline-flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
//           >
//             <ChevronLeft className="w-5 h-5" />
//             <span>All Posts</span>
//           </Link>
//           <button
//             onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
//             className="inline-flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
//           >
//             <span>Back to Top</span>
//             <ChevronRight className="w-5 h-5" />
//           </button>
//         </div>
//       </article>
//     </div>
//   );
// };

// export default BlogDetailPage;

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Leaf,
  Sprout,
} from "lucide-react";

interface BlogPost {
  slug: string;
  category: string;
  date: string;
  readTime: string;
  title: string;
  excerpt: string;
  image: string;
  author: string;
}

const posts: BlogPost[] = [
  {
    slug: "what-makes-truly-farm-fresh-produce-different",
    category: "Farming",
    date: "August 18, 2026",
    readTime: "5 min read",
    title: "What makes truly farm-fresh produce different?",
    excerpt:
      "Freshness starts long before produce reaches your kitchen. Here's how thoughtful farming, careful harvesting, and a shorter journey make a difference.",
    image:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=2200&q=90",
    author: "Genesis Farm Team",
  },
  {
    slug: "growing-with-the-land-not-against-it",
    category: "Sustainability",
    date: "August 12, 2026",
    readTime: "6 min read",
    title: "Growing with the land, not against it",
    excerpt:
      "Healthy soil is at the heart of every healthy harvest.",
    image:
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=2200&q=90",
    author: "Genesis Farm Team",
  },
  {
    slug: "from-sunrise-harvest-to-your-table",
    category: "Fresh Produce",
    date: "August 05, 2026",
    readTime: "4 min read",
    title: "From sunrise harvest to your table",
    excerpt:
      "A look behind the scenes at what happens between the moment a crop is picked and the moment it reaches you.",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2200&q=90",
    author: "Genesis Farm Team",
  },
  {
    slug: "a-morning-in-the-fields-at-genesis",
    category: "Our Farm",
    date: "July 28, 2026",
    readTime: "7 min read",
    title: "A morning in the fields at Genesis",
    excerpt:
      "Walk with us through an ordinary morning on the farm.",
    image:
      "https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=2200&q=90",
    author: "Genesis Farm Team",
  },
  {
    slug: "the-people-behind-every-harvest",
    category: "Stories",
    date: "July 19, 2026",
    readTime: "5 min read",
    title: "The people behind every harvest",
    excerpt:
      "Farming is more than soil and sunshine. Meet some of the people whose knowledge and dedication keep Genesis growing.",
    image:
      "https://images.unsplash.com/photo-1592982537447-6f8f2b2d6e0f?auto=format&fit=crop&w=2200&q=90",
    author: "Genesis Farm Team",
  },
  {
    slug: "why-healthy-soil-means-a-healthier-future",
    category: "Sustainability",
    date: "July 10, 2026",
    readTime: "6 min read",
    title: "Why healthy soil means a healthier future",
    excerpt:
      "Good agriculture begins underground.",
    image:
      "https://images.unsplash.com/photo-1523742813107-8f0b6f6e5b6a?auto=format&fit=crop&w=2200&q=90",
    author: "Genesis Farm Team",
  },
];

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogDetailsPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const post = posts.find((item) => item.slug === slug);

  /*
   * In a real application, this would come from your database/API.
   */

  if (!post) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--cream)] px-6">
        <div className="text-center">
          <Leaf
            size={32}
            className="mx-auto mb-5 text-[var(--green-700)]"
          />

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--green-700)]">
            Genesis Journal
          </p>

          <h1 className="mt-4 font-serif-heading text-4xl">
            Story not found
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm text-[var(--muted)]">
            The article you're looking for may have been moved or
            is no longer available.
          </p>

          <Link
            href="/blog"
            className="
              mt-8
              inline-flex
              items-center
              gap-2
              rounded-full
              bg-[var(--green-950)]
              px-6
              py-3
              text-[10px]
              font-bold
              uppercase
              tracking-[0.12em]
              text-white
            "
          >
            <ArrowLeft size={14} />
            Back to Journal
          </Link>
        </div>
      </main>
    );
  }

  /*
   * Related posts
   */
  const relatedPosts = posts
    .filter((item) => item.slug !== post.slug)
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-[var(--cream)] text-[var(--ink)]">

      {/* =========================================================
          ARTICLE HEADER
      ========================================================= */}
      <section className="bg-[var(--green-950)] pt-8 text-white">

        <div className="mx-auto w-[min(1000px,calc(100%-48px))] pb-32">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">

            <Link
              href="/"
              className="transition hover:text-[var(--lime)]"
            >
              Genesis
            </Link>

            <span>/</span>

            <Link
              href="/blog"
              className="transition hover:text-[var(--lime)]"
            >
              Journal
            </Link>

            <span>/</span>

            <span className="max-w-[180px] truncate text-white/70">
              {post.category}
            </span>

          </div>


          {/* Category */}
          <div className="mt-14 flex items-center gap-3">

            <span className="h-2 w-2 rounded-full bg-[var(--lime)]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--lime)]">
              {post.category}
            </span>

          </div>


          {/* Title */}
          <h1
            className="
              mt-6
              max-w-[950px]
              font-serif-heading
              text-[clamp(48px,7vw,88px)]
              font-medium
              leading-[0.98]
              tracking-[-0.055em]
            "
          >
            {post.title}
          </h1>


          {/* Excerpt */}
          <p
            className="
              mt-7
              max-w-[700px]
              text-[15px]
              leading-[1.8]
              text-white/60
            "
          >
            {post.excerpt}
          </p>


          {/* Metadata */}
          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-white/10 py-2">

            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/55">
              <CalendarDays size={13} />
              {post.date}
            </div>

            <span className="h-4 w-px bg-white/15 max-sm:hidden" />

            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/55">
              <Clock3 size={13} />
              {post.readTime}
            </div>

            <span className="h-4 w-px bg-white/15 max-sm:hidden" />

            <div className="text-[10px] uppercase tracking-[0.12em] text-white/55">
              By{" "}
              <span className="text-white">
                {post.author}
              </span>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================
          HERO IMAGE
      ========================================================= */}
      <section className="mx-auto w-[min(1180px,calc(100%-48px))]">

        <div className="relative -mt-16 aspect-[16/8] overflow-hidden lg:aspect-[16/7.2]">

          <img
            src={post.image}
            alt={post.title}
            className="
              h-full
              w-full
              object-cover
            "
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />

          {/* Image label */}
          <div className="absolute bottom-5 left-5 flex items-center gap-2 bg-[rgba(11,36,25,.8)] px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md">
            <Leaf size={12} className="text-[var(--lime)]" />
            From the Genesis fields
          </div>

        </div>

      </section>


      {/* =========================================================
          ARTICLE CONTENT
      ========================================================= */}
      <article className="mx-auto w-[min(760px,calc(100%-48px))] py-20">

        {/* Intro */}
        <p
          className="
            font-serif-heading
            text-[25px]
            leading-[1.55]
            tracking-[-0.015em]
            text-[var(--green-900)]
          "
        >
          At Genesis, we believe that good food begins long before
          it reaches the kitchen. It begins with healthy soil,
          thoughtful farming, and a commitment to doing things
          properly.
        </p>


        {/* Paragraph */}
        <p className="mt-8 text-[15px] leading-[2] text-[var(--muted)]">
          When we talk about farm-fresh produce, we're talking about
          more than a label. Freshness is a journey — one that starts
          in the field and continues through every decision made
          during cultivation, harvesting, selection, and delivery.
        </p>


        {/* Heading */}
        <h2 className="mt-14 font-serif-heading text-[36px] font-medium leading-tight tracking-[-0.035em] text-[var(--green-950)]">
          Freshness starts in the field
        </h2>

        <p className="mt-5 text-[15px] leading-[2] text-[var(--muted)]">
          The quality of produce is closely connected to how it is
          grown. Healthy crops require healthy soil, appropriate
          growing conditions, careful monitoring, and farmers who
          understand the land they work with.
        </p>

        <p className="mt-5 text-[15px] leading-[2] text-[var(--muted)]">
          At Genesis, we pay attention to the details. From
          preparing the soil to monitoring crops throughout the
          growing season, our approach is centered around producing
          food that we would be proud to put on our own table.
        </p>


        {/* =====================================================
            QUOTE
        ====================================================== */}
        <blockquote
          className="
            my-14
            border-l-2
            border-[var(--lime)]
            bg-[var(--cream-dark)]
            px-7
            py-8
            sm:px-10
          "
        >
          <p
            className="
              font-serif-heading
              text-[25px]
              leading-[1.4]
              tracking-[-0.02em]
              text-[var(--green-900)]
            "
          >
            "When we take care of the land, the land takes care
            of the harvest."
          </p>

          <footer className="mt-5 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--green-700)]">
            — Genesis Farm Team
          </footer>
        </blockquote>


        {/* Heading */}
        <h2 className="mt-14 font-serif-heading text-[36px] font-medium leading-tight tracking-[-0.035em] text-[var(--green-950)]">
          A shorter journey from farm to table
        </h2>

        <p className="mt-5 text-[15px] leading-[2] text-[var(--muted)]">
          One of the simplest advantages of buying directly from a
          farm is the shorter distance between where food is grown
          and where it is enjoyed.
        </p>

        <p className="mt-5 text-[15px] leading-[2] text-[var(--muted)]">
          Fewer unnecessary steps can mean better freshness, better
          visibility into where food comes from, and a stronger
          relationship between farmers and the people they feed.
        </p>


        {/* =====================================================
            INLINE IMAGE
        ====================================================== */}
        <figure className="my-14">

          <div className="aspect-[16/9] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=85"
              alt="Agricultural field"
              className="h-full w-full object-cover"
            />
          </div>

          <figcaption className="mt-3 flex items-center justify-between text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]">
            <span>Genesis agricultural fields</span>
            <span>Growing with purpose</span>
          </figcaption>

        </figure>


        {/* Heading */}
        <h2 className="mt-14 font-serif-heading text-[36px] font-medium leading-tight tracking-[-0.035em] text-[var(--green-950)]">
          More than produce
        </h2>

        <p className="mt-5 text-[15px] leading-[2] text-[var(--muted)]">
          Farming connects people to the land, to the seasons, and
          to one another. Every harvest represents countless hours
          of work and a relationship with nature that cannot be
          rushed.
        </p>

        <p className="mt-5 text-[15px] leading-[2] text-[var(--muted)]">
          That's why our work at Genesis is about more than simply
          growing crops. It is about building a food system that
          values quality, responsibility, and the people behind
          every harvest.
        </p>


        {/* =====================================================
            ARTICLE FOOTER
        ====================================================== */}
        <div className="mt-16 border-t border-[var(--line)] pt-7">

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

            <div className="flex items-center gap-3">

              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--green-950)] text-[var(--lime)]">
                <Sprout size={15} />
              </span>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--green-950)]">
                  Written by Genesis
                </p>

                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  Farming with purpose.
                </p>
              </div>

            </div>

            <Link
              href="/blog"
              className="
                inline-flex
                items-center
                gap-2
                text-[10px]
                font-bold
                uppercase
                tracking-[0.13em]
                text-[var(--green-800)]
              "
            >
              <ArrowLeft size={14} />
              Back to journal
            </Link>

          </div>

        </div>

      </article>


      {/* =========================================================
          RELATED STORIES
      ========================================================= */}
      <section className="bg-[var(--cream-dark)] py-20">

        <div className="mx-auto w-[min(1180px,calc(100%-48px))]">

          <div className="mb-10 flex items-end justify-between">

            <div>
              <div className="flex items-center gap-3">

                <span className="h-2 w-2 rounded-full bg-[var(--lime)]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--green-700)]">
                  Keep exploring
                </span>

              </div>

              <h2 className="mt-3 font-serif-heading text-[42px] font-medium leading-none tracking-[-0.04em]">
                More from the journal
              </h2>
            </div>

            <Link
              href="/blog"
              className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--green-800)] sm:flex"
            >
              View all
              <ArrowRight size={14} />
            </Link>

          </div>


          <div className="grid gap-7 md:grid-cols-3">

            {relatedPosts.map((related) => (
              <Link
                key={related.slug}
                href={`/blog/${related.slug}`}
                className="group"
              >

                <div className="aspect-[1.25] overflow-hidden">

                  <img
                    src={related.image}
                    alt={related.title}
                    className="
                      h-full
                      w-full
                      object-cover
                      transition-transform
                      duration-700
                      group-hover:scale-105
                    "
                  />

                </div>

                <div className="pt-5">

                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--green-700)]">
                    {related.category}
                  </span>

                  <h3
                    className="
                      mt-3
                      font-serif-heading
                      text-[24px]
                      font-medium
                      leading-[1.1]
                      tracking-[-0.025em]
                      transition-colors
                      group-hover:text-[var(--green-700)]
                    "
                  >
                    {related.title}
                  </h3>

                  <div className="mt-4 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--green-800)]">
                    Read story
                    <ArrowRight
                      size={13}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>

                </div>

              </Link>
            ))}

          </div>

        </div>

      </section>


      {/* =========================================================
          NEWSLETTER CTA
      ========================================================= */}
      <section className="bg-[var(--green-950)] px-6 py-24 text-center text-white">

        <div className="mx-auto max-w-[700px]">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)]">
            <Leaf size={20} />
          </div>

          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--lime)]">
            The Genesis Journal
          </p>

          <h2 className="mt-5 font-serif-heading text-[clamp(40px,6vw,64px)] font-medium leading-none tracking-[-0.045em]">
            Stay connected
            <br />
            to the <em className="text-[var(--lime)]">farm.</em>
          </h2>

          <p className="mx-auto mt-6 max-w-[450px] text-sm leading-[1.8] text-white/50">
            Discover seasonal stories, farming insights, and news
            from Genesis.
          </p>

          <Link
            href="/blog"
            className="
              mt-8
              inline-flex
              items-center
              gap-3
              rounded-full
              bg-[var(--lime)]
              px-6
              py-3.5
              text-[10px]
              font-bold
              uppercase
              tracking-[0.12em]
              text-[var(--green-950)]
              transition
              hover:-translate-y-0.5
            "
          >
            Explore the journal
            <ArrowUpRight size={15} />
          </Link>

        </div>

      </section>

    </main>
  );
}
