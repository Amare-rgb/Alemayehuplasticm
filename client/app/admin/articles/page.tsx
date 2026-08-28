// app/admin/articles/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  FileText, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  RefreshCw, 
  Loader2,
  PenSquare,
  StickyNote,
  Calendar,
  User,
  Search
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  author: string;
  summary: string;
  content: string;
  note?: string;
  pdfUrl: string;
  pdfFileName: string;
  status: string;
  views: number;
  downloads: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminArticlesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        setError('Please login to view notes');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/articles', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      const notesData = data.data || data;
      setNotes(Array.isArray(notesData) ? notesData : []);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadNotes = async () => {
      if (isMounted) {
        await fetchNotes();
      }
    };
    loadNotes();
    return () => {
      isMounted = false;
    };
  }, [fetchNotes]);

  const deleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
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
        throw new Error(errorData.error || 'Failed to delete note');
      }
      
      setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
      alert('Note deleted successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };

  const getStatusColor = (status: string) => {
    const upperStatus = status?.toUpperCase() || '';
    if (upperStatus === 'PUBLISHED') return 'bg-green-100 text-green-800';
    if (upperStatus === 'DRAFT') return 'bg-yellow-100 text-yellow-800';
    if (upperStatus === 'ARCHIVED') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleWriteNote = () => {
    router.push('/admin/articles/writer');
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-yellow-600 animate-spin" />
        <p className="mt-4 text-gray-600">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <StickyNote className="w-6 h-6 text-yellow-600" />
            Notes
          </h1>
          <p className="text-sm text-gray-600">Manage your personal notes</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={fetchNotes}
            className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          {/* REMOVED Write Note BUTTON */}
          {/* Write Note button removed - only Add Article remains */}
          <Link
            href="/admin/add-article"
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Article</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading notes</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchNotes}
                className="mt-2 text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {notes.length === 0 && !error ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <StickyNote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No notes yet.</p>
          <Link
            href="/admin/add-article"
            className="mt-4 inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Article</span>
          </Link>
        </div>
      ) : filteredNotes.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Content Preview
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNotes.map((note) => (
                  <tr key={note.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {note.title}
                        </span>
                        {note.note && (
                          <span className="text-yellow-600" title="Has private note">
                            <StickyNote className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      {note.summary && (
                        <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                          {note.summary}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <User className="w-3 h-3 text-gray-400" />
                        {note.author}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {note.content ? note.content.substring(0, 80) + (note.content.length > 80 ? '...' : '') : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(note.status)}`}>
                        {note.status || 'DRAFT'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(note.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {note.pdfUrl && note.pdfUrl !== '' && (
                          <a
                            href={`http://localhost:5000${note.pdfUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <Link
                          href={`/admin/articles/${note.id}`}
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                          title="View Note"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/articles/writer?id=${note.id}`}
                          className="text-green-600 hover:text-green-800 transition-colors"
                          title="Edit Note"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete Note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Footer with total count */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Total: {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}