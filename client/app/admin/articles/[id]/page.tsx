// app/admin/articles/[id]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Edit, Trash2, Calendar, User, Eye, FileText, Loader2 } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  author: string;
  summary: string;
  content: string;
  pdfUrl: string;
  pdfFileName: string;
  status: string;
  views: number;
  downloads: number;
  createdAt: string;
  updatedAt: string;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = params.id as string;

  // Wrap fetchArticle in useCallback to memoize it
  const fetchArticle = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        setError('Please login to view this article');
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching article with ID:', id);

      const response = await fetch(`http://localhost:5000/api/articles/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Article not found');
        }
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Article fetched:', data);
      setArticle(data.data);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setLoading(false);
    }
  }, [id]); // Add id as dependency

  // Use useEffect with the memoized function
  useEffect(() => {
    let isMounted = true;
    
    const loadArticle = async () => {
      if (isMounted && id) {
        await fetchArticle();
      }
    };
    
    loadArticle();
    
    return () => {
      isMounted = false;
    };
  }, [id, fetchArticle]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      const response = await fetch(`http://localhost:5000/api/articles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete article');
      }
      
      router.push('/admin/articles');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete article');
    }
  };

  const getStatusColor = (status: string) => {
    const upperStatus = status?.toUpperCase() || '';
    if (upperStatus === 'PUBLISHED') return 'bg-green-100 text-green-800';
    if (upperStatus === 'DRAFT') return 'bg-yellow-100 text-yellow-800';
    if (upperStatus === 'ARCHIVED') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
        <p className="mt-4 text-gray-600">Loading article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <FileText className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Article Not Found</h2>
        <p className="text-red-600">{error || 'The article you are looking for does not exist.'}</p>
        <Link
          href="/admin/articles"
          className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Back to Articles
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <Link
          href="/admin/articles"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Articles</span>
        </Link>
        <div className="flex items-center space-x-2">
          <Link
            href={`/admin/articles/edit/${article.id}`}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Article Content */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{article.title}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <span className="flex items-center space-x-1 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{article.author}</span>
                </span>
                <span className="flex items-center space-x-1 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                </span>
                <span className="flex items-center space-x-1 text-sm text-gray-600">
                  <Eye className="w-4 h-4" />
                  <span>{article.views} views</span>
                </span>
              </div>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(article.status)}`}>
              {article.status}
            </span>
          </div>

          {/* Summary */}
          {article.summary && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border-l-4 border-green-500">
              <p className="text-gray-700">{article.summary}</p>
            </div>
          )}

          {/* Content */}
          <div className="prose max-w-none mb-8">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {article.content}
            </div>
          </div>

          {/* PDF Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">PDF Document</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 p-4 rounded-lg gap-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{article.pdfFileName}</p>
                  <p className="text-xs text-gray-500">
                    Uploaded on {new Date(article.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <a
                href={`http://localhost:5000${article.pdfUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </a>
            </div>

            {/* PDF Preview */}
            <div className="mt-4 border rounded-lg overflow-hidden bg-gray-100" style={{ height: '600px' }}>
              <iframe
                src={`http://localhost:5000${article.pdfUrl}`}
                className="w-full h-full"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}