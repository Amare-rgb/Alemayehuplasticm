"use client";

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ListItem {
  id: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
  itemCount: number
  isPublic: boolean
}

export default function AccountListsPage() {
  const router = useRouter()
  const [lists, setLists] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Load lists from localStorage on mount
  useEffect(() => {
    loadLists()
  }, [])

  const loadLists = () => {
    try {
      const savedLists = localStorage.getItem('userLists')
      if (savedLists) {
        setLists(JSON.parse(savedLists))
      } else {
        // Initialize with demo data if empty
        const demoLists: ListItem[] = [
          {
            id: '1',
            title: 'Favorite Books',
            description: 'Books I want to read this year',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            itemCount: 5,
            isPublic: false
          },
          {
            id: '2',
            title: 'Wishlist',
            description: 'Items I want to buy',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            itemCount: 8,
            isPublic: true
          }
        ]
        setLists(demoLists)
        localStorage.setItem('userLists', JSON.stringify(demoLists))
      }
    } catch (error) {
      console.error('Failed to load lists:', error)
      setLists([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteList = async (listId: string, listTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${listTitle}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(listId)
    
    try {
      const updatedLists = lists.filter(list => list.id !== listId)
      localStorage.setItem('userLists', JSON.stringify(updatedLists))
      setLists(updatedLists)
      
      // Show success message
      showToast(`"${listTitle}" has been deleted`, 'success')
    } catch (error) {
      console.error('Failed to delete list:', error)
      showToast('Failed to delete list. Please try again.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const handleTogglePublic = (listId: string) => {
    try {
      const updatedLists = lists.map(list => 
        list.id === listId ? { ...list, isPublic: !list.isPublic, updatedAt: new Date().toISOString() } : list
      )
      localStorage.setItem('userLists', JSON.stringify(updatedLists))
      setLists(updatedLists)
      
      const list = updatedLists.find(l => l.id === listId)
      showToast(`List is now ${list?.isPublic ? 'public' : 'private'}`, 'success')
    } catch (error) {
      console.error('Failed to update list visibility:', error)
      showToast('Failed to update visibility', 'error')
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div')
    toast.className = `fixed bottom-4 right-4 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-slide-up`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 2000)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Your Lists
            </h1>
            <p className="text-gray-500 mt-1">Manage and organize your saved lists</p>
          </div>
          <Link 
            href="/creatlist/ccreat" 
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md flex items-center gap-2"
          >
            <span>+</span>
            Create a List
          </Link>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-2xl font-bold text-emerald-600">{lists.length}</div>
            <div className="text-sm text-gray-500">Total Lists</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {lists.reduce((sum, list) => sum + list.itemCount, 0)}
            </div>
            <div className="text-sm text-gray-500">Total Items</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {lists.filter(list => list.isPublic).length}
            </div>
            <div className="text-sm text-gray-500">Public Lists</div>
          </div>
        </div>

        {/* Lists Grid/List View */}
        {lists.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No lists yet</h3>
            <p className="text-gray-500 mb-4">Create your first list to start organizing items</p>
            <Link 
              href="/creatlist/ccreat" 
              className="inline-block px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Create Your First List
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {lists.map((list) => (
              <div
                key={list.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h2 className="text-xl font-semibold text-gray-800">
                        {list.title}
                      </h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        list.isPublic 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {list.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                    
                    {list.description && (
                      <p className="text-gray-600 mb-3">{list.description}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      <span>📦 {list.itemCount} {list.itemCount === 1 ? 'item' : 'items'}</span>
                      <span>🕒 Updated {formatDate(list.updatedAt)}</span>
                      <span>📅 Created {formatDate(list.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePublic(list.id)}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      aria-label={`Make list ${list.isPublic ? 'private' : 'public'}`}
                    >
                      {list.isPublic ? 'Make Private' : 'Make Public'}
                    </button>
                    
                    <Link
                      href={`/account/lists/${list.id}`}
                      className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors"
                    >
                      View Items
                    </Link>
                    
                    <button
                      onClick={() => handleDeleteList(list.id, list.title)}
                      disabled={deletingId === list.id}
                      className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                      aria-label={`Delete list ${list.title}`}
                    >
                      {deletingId === list.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/account/lists/find"
            className="block bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">Find a List</h3>
                <p className="text-sm text-blue-600">Search and discover lists</p>
              </div>
              <div className="text-3xl">🔍</div>
            </div>
          </Link>
          
          <Link
            href="/creatlist/ccreat"
            className="block bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-emerald-800 mb-1">Create New List</h3>
                <p className="text-sm text-emerald-600">Start organizing your items</p>
              </div>
              <div className="text-3xl">✨</div>
            </div>
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>Your lists are saved locally in your browser</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}