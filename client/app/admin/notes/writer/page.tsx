// app/admin/notes/writer/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import {
  Save,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  StickyNote,
  Trash2,
  Edit,
  Plus,
  Search,
  Calendar,
  User,
  ArrowLeft,
} from 'lucide-react';
import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const getStoredToken = (): string | null => {
  return (
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('token')
  );
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface Note {
  id: string;
  title: string;
  content: string;
  author: string;
  note: string;
  summary: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function NoteWriterPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    note: '',
    author: user?.name || '',
    summary: '',
  });

  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, []);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/articles');
      const notesData = response.data.data || response.data;
      setNotes(Array.isArray(notesData) ? notesData : []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      showNotification('error', 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    let isMounted = true;
    const loadNotes = async () => {
      if (!isMounted) return;
      await fetchNotes();
    };
    loadNotes();
    return () => {
      isMounted = false;
    };
  }, [fetchNotes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      note: '',
      author: user?.name || '',
      summary: '',
    });
    setSelectedNote(null);
    setIsEditing(false);
  };

  const handleEdit = (note: Note) => {
    setSelectedNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      note: note.note || '',
      author: note.author,
      summary: note.summary || '',
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await api.delete(`/api/articles/${id}`);
      showNotification('success', 'Note deleted successfully');
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      showNotification('error', 'Failed to delete note');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('author', formData.author);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('note', formData.note || '');
      formDataToSend.append('summary', formData.summary || '');
      formDataToSend.append('status', 'PUBLISHED');

      const url = isEditing 
        ? `/api/articles/${selectedNote?.id}`
        : '/api/articles';

      const method = isEditing ? 'put' : 'post';

      const response = await api({
        method,
        url,
        data: formDataToSend,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        showNotification('success', response.data.message || 'Note saved successfully!');
        resetForm();
        fetchNotes();
      } else {
        showNotification('error', response.data?.error || 'Failed to save note');
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ error: string; message?: string }>;
      console.error('Error saving note:', axiosError);
      const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || 'Failed to save note';
      showNotification('error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md ${
            notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            {notification.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            {notification.type === 'info' && <FileText className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-auto flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/admin/notes')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <StickyNote className="w-6 h-6 text-yellow-600" />
                Write Note
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-9">Create and manage your personal notes</p>
          </div>
          <button
            onClick={resetForm}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Note Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                {isEditing ? 'Edit Note' : 'Write New Note'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter note title"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Author <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder="Enter author name"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Summary
                  </label>
                  <input
                    type="text"
                    name="summary"
                    value={formData.summary}
                    onChange={handleInputChange}
                    placeholder="Brief summary of your note"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Write your note content here..."
                    rows={8}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center gap-2">
                      <StickyNote className="w-4 h-4 text-yellow-600" />
                      Private Note (optional)
                    </span>
                  </label>
                  <div className="mt-2">
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      placeholder="Add private notes (only visible to you)..."
                      rows={3}
                      className="w-full px-4 py-2.5 border border-yellow-200 bg-yellow-50 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      <StickyNote className="w-3 h-3 inline mr-1" />
                      This note is private and only visible to you
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {isEditing ? 'Update Note' : 'Save Note'}
                      </>
                    )}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Notes List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Notes</h2>

              <div className="mb-4">
                <div className="relative">
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

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <p className="text-center text-gray-500 py-8 text-sm">
                    {searchTerm ? 'No notes found' : 'No notes yet. Create your first note!'}
                  </p>
                ) : (
                  filteredNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-yellow-300 transition-colors"
                    >
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                        {note.title}
                      </h3>
                      {note.summary && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {note.summary}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {note.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {note.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(note.createdAt)}
                        </span>
                        {note.note && (
                          <span className="text-yellow-600" title="Has private note">
                            <StickyNote className="w-3 h-3" />
                          </span>
                        )}
                        {note.status === 'PUBLISHED' && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                            Published
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleEdit(note)}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notes.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Total: {notes.length} note{notes.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}