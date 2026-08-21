'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Leaf,
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
  EyeOff,
  MoreVertical,
  Download,
  RefreshCw,
  PenTool,
  Image,
  User
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  status: 'published' | 'draft' | 'archived';
  date: string;
  readTime: number;
  views: number;
  image?: string;
}

const BlogPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const posts: BlogPost[] = [
    {
      id: '1',
      title: 'Sustainable Farming Practices for Small Scale Farmers',
      excerpt: 'Learn about sustainable farming techniques that can increase yield while protecting the environment...',
      category: 'Sustainable Farming',
      author: 'Dr. James Mwangi',
      status: 'published',
      date: '2026-08-20',
      readTime: 5,
      views: 1247,
    },
    {
      id: '2',
      title: 'The Future of Organic Agriculture in Africa',
      excerpt: 'Exploring the growing trend of organic farming and its potential to transform African agriculture...',
      category: 'Organic Farming',
      author: 'Sarah Kariuki',
      status: 'published',
      date: '2026-08-18',
      readTime: 7,
      views: 856,
    },
    {
      id: '3',
      title: 'How to Maximize Crop Yield with Minimal Inputs',
      excerpt: 'Discover cost-effective strategies to boost your crop production without breaking the bank...',
      category: 'Crop Management',
      author: 'Peter Odhiambo',
      status: 'draft',
      date: '2026-08-15',
      readTime: 4,
      views: 0,
    },
    {
      id: '4',
      title: 'Understanding Soil Health and Fertility',
      excerpt: 'A comprehensive guide to soil management and maintaining optimal soil health for farming...',
      category: 'Soil Science',
      author: 'Dr. Grace Wanjiru',
      status: 'published',
      date: '2026-08-12',
      readTime: 6,
      views: 623,
    },
    {
      id: '5',
      title: 'Smart Irrigation Systems for Modern Farming',
      excerpt: 'How technology is revolutionizing irrigation and water management in agriculture...',
      category: 'Technology',
      author: 'Michael Kiprop',
      status: 'archived',
      date: '2026-08-10',
      readTime: 5,
      views: 345,
    },
  ];

  const categories = ['All', 'Sustainable Farming', 'Organic Farming', 'Crop Management', 'Soil Science', 'Technology'];
  const statuses = ['All', 'Published', 'Draft', 'Archived'];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || post.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      published: 'bg-green-100 text-green-700',
      draft: 'bg-yellow-100 text-yellow-700',
      archived: 'bg-gray-100 text-gray-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      published: <CheckCircle className="w-4 h-4" />,
      draft: <PenTool className="w-4 h-4" />,
      archived: <EyeOff className="w-4 h-4" />,
    };
    return icons[status as keyof typeof icons] || null;
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this blog post?')) {
      console.log('Delete post:', id);
    }
  };

  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === 'published').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your blog posts and content</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Post</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Posts</p>
          <p className="text-2xl font-bold text-gray-900">{totalPosts}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Published</p>
          <p className="text-2xl font-bold text-green-600">{publishedPosts}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Views</p>
          <p className="text-2xl font-bold text-blue-600">{posts.reduce((sum, p) => sum + p.views, 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search blog posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Dropdown */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Categories</option>
              {categories.slice(1).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Statuses</option>
              {statuses.slice(1).map(status => (
                <option key={status} value={status.toLowerCase()}>{status}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Blog Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPosts.map((post) => (
          <div key={post.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Leaf className="w-4 h-4 text-green-600" />
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(post.status)}`}>
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </span>
                </div>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 hover:text-green-600 transition-colors">
                  <Link href={`/admin/blog/${post.id}`}>{post.title}</Link>
                </h3>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{post.excerpt}</p>
              </div>

              {/* Meta */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <User className="w-3.5 h-3.5" />
                      <span>{post.author}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{post.category}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{post.date}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{post.readTime} min read</span>
                  </span>
                  <span>{post.views} views</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <Link
                  href={`/blog/${post.id}`}
                  target="_blank"
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </Link>
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/admin/blog/${post.id}/edit`}
                    className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogPage;