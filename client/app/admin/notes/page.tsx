// app/admin/notes/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Eye, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Loader2,
  PenSquare,
  StickyNote,
  Calendar,
  User,
  Search,
  Plus,
  X,
  FileText
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  author: string;
  summary: string;
  content: string;
  note?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminNotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    router.push('/admin/notes/writer');
  };

  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNote(null);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <StickyNote className="w-6 h-6 text-yellow-600" />
            My Notes
          </h1>
          <p className="text-sm text-gray-500">Create and manage your personal notes</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={fetchNotes}
            className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleWriteNote}
            className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <PenSquare className="w-4 h-4" />
            <span>Write Note</span>
          </button>
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

      {/* Empty State */}
      {notes.length === 0 && !error && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <StickyNote className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
          <p className="text-gray-500 mb-4">Start writing your first note today!</p>
          <button
            onClick={handleWriteNote}
            className="inline-flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Note</span>
          </button>
        </div>
      )}

      {/* Notes List */}
      {filteredNotes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-5"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 text-base line-clamp-2 flex-1">
                  {note.title}
                </h3>
                {note.note && (
                  <span className="text-yellow-600 ml-2" title="Has private note">
                    <StickyNote className="w-4 h-4" />
                  </span>
                )}
              </div>
              
              {note.summary && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {note.summary}
                </p>
              )}
              
              <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                {note.content}
              </p>
              
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {note.author}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(note.createdAt)}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(note.status)}`}>
                  {note.status || 'DRAFT'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleViewNote(note)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
                <button
                  onClick={() => router.push(`/admin/notes/writer?id=${note.id}`)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total count */}
      {notes.length > 0 && (
        <div className="mt-6 flex justify-between items-center text-sm text-gray-500 border-t border-gray-200 pt-4">
          <span>
            Showing {filteredNotes.length} of {notes.length} note{notes.length !== 1 ? 's' : ''}
          </span>
          {searchTerm && filteredNotes.length === 0 && (
            <span className="text-yellow-600">No notes match your search</span>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-yellow-600" />
                <h2 className="text-xl font-bold text-gray-900">Note Details</h2>
              </div>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Title
                </label>
                <p className="text-lg font-semibold text-gray-900">{selectedNote.title}</p>
              </div>

              {/* Author & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Author
                  </label>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <User className="w-4 h-4 text-gray-400" />
                    {selectedNote.author}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedNote.status)}`}>
                    {selectedNote.status || 'DRAFT'}
                  </span>
                </div>
              </div>

              {/* Summary */}
              {selectedNote.summary && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Summary
                  </label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedNote.summary}</p>
                </div>
              )}

              {/* Content */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Content
                </label>
                <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedNote.content}</p>
                </div>
              </div>

              {/* Private Note */}
              {selectedNote.note && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    <span className="flex items-center gap-1">
                      <StickyNote className="w-3 h-3 text-yellow-600" />
                      Private Note
                    </span>
                  </label>
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedNote.note}</p>
                  </div>
                </div>
              )}

              {/* Created & Updated */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Created
                  </label>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(selectedNote.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Last Updated
                  </label>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(selectedNote.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => router.push(`/admin/notes/writer?id=${selectedNote.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Note
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}