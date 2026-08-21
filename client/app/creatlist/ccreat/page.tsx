"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type ListItem = {
  id: string
  title: string
  description?: string
  privacy: 'public' | 'private'
  createdAt: string
}

export default function CreateListPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [privacy, setPrivacy] = useState<'public'|'private'>('public')
  const [lists, setLists] = useState<ListItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('userLists')
      if (raw) setLists(JSON.parse(raw))
    } catch (_) { setLists([]) }
  }, [])

  const saveLists = (next: ListItem[]) => {
    setLists(next)
    try { localStorage.setItem('userLists', JSON.stringify(next)) } catch (_) {}
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return alert('Please enter a title')

    const item: ListItem = {
      id: `${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      privacy,
      createdAt: new Date().toISOString(),
    }

    saveLists([item, ...lists])
    setTitle('')
    setDescription('')
    setPrivacy('public')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Create a List</h1>
          <Link href="/account/lists" className="text-sm text-emerald-600 hover:underline">Back to lists</Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="list-title" className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="list-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="My wishlist"
                title="Enter a title for your list (required)"
                aria-required="true"
                required
              />
            </div>

            <div>
              <label htmlFor="list-description" className="block text-sm font-medium text-gray-700">
                Description (optional)
              </label>
              <textarea
                id="list-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                rows={3}
                placeholder="Add a description for your list"
                title="Enter an optional description for your list"
              />
            </div>

            <div>
              <label htmlFor="list-privacy" className="block text-sm font-medium text-gray-700">
                Privacy
              </label>
              <select
                id="list-privacy"
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value as any)}
                className="mt-1 border rounded px-3 py-2"
                title="Choose who can see your list"
                aria-label="Privacy settings for your list"
              >
                <option value="public">Public - Anyone can see this list</option>
                <option value="private">Private - Only you can see this list</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button 
                type="submit" 
                className="btn bg-emerald-600 text-white px-4 py-2 rounded"
                title="Create a new list with the provided information"
              >
                Create list
              </button>
              <button 
                type="button" 
                onClick={() => { setTitle(''); setDescription(''); setPrivacy('public') }} 
                className="text-sm text-gray-600"
                title="Reset all form fields to their initial values"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Your lists</h2>
          {lists.length === 0 ? (
            <div className="bg-white rounded-xl border p-6 text-center text-gray-500" role="status" aria-live="polite">
              No lists yet — create one above.
            </div>
          ) : (
            <div className="space-y-3">
              {lists.map(l => (
                <div key={l.id} className="bg-white rounded-xl shadow-sm border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{l.title}</h3>
                      {l.description && <p className="text-sm text-gray-600 mt-1">{l.description}</p>}
                      <p className="text-xs text-gray-400 mt-2">
                        {l.privacy === 'public' ? 'Public' : 'Private'} • Created {new Date(l.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-sm">
                      <button 
                        onClick={() => { saveLists(lists.filter(x => x.id !== l.id)) }} 
                        className="text-red-600 hover:underline"
                        title={`Delete list "${l.title}"`}
                        aria-label={`Delete list ${l.title}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}