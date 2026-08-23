'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../providers';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Phone, Calendar, Edit2, Save, X } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminProfilePage() {
  const { user, status, login } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const hasFetched = useRef(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Redirect if not admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
    if (status === 'authenticated' && user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [status, user, router]);

  // Fetch admin profile - runs once when authenticated
  useEffect(() => {
    if (status === 'authenticated' && user?.role === 'ADMIN' && !hasFetched.current) {
      hasFetched.current = true;
      
      const fetchProfile = async () => {
        try {
          const token = localStorage.getItem('token');
          
          if (!token) {
            console.error('❌ No token found');
            setLoading(false);
            return;
          }

          console.log('🔑 Fetching profile with token...');
          const response = await fetch(`${API_URL}/api/profile/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          console.log('📊 Response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Profile data received:', data);
            setProfile(data.user);
            setFormData({
              name: data.user.name || '',
              phone: data.user.phone || '',
            });
          } else {
            const errorData = await response.json();
            console.error('❌ Failed to fetch profile:', errorData);
            setMessage({ 
              type: 'error', 
              text: errorData.message || 'Failed to load profile' 
            });
          }
        } catch (error) {
          console.error('❌ Error fetching profile:', error);
          setMessage({ 
            type: 'error', 
            text: 'Network error - please check your connection' 
          });
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    }
  }, [status, user, API_URL]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setMessage({ type: 'error', text: 'No authentication token found' });
        setLoading(false);
        return;
      }

      console.log('📝 Updating profile with data:', formData);
      const response = await fetch(`${API_URL}/api/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Profile updated:', data);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setProfile(data.user);
        
        // Update the user in auth context
        // This will refresh the user data in the navbar
        setFormData({
          name: data.user.name || '',
          phone: data.user.phone || '',
        });
        
        setEditing(false);
        
        // Force a refresh of the user data by re-fetching
        const refreshResponse = await fetch(`${API_URL}/api/profile/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setProfile(refreshData.user);
          // Update local storage with new user data if needed
          localStorage.setItem('user', JSON.stringify(refreshData.user));
        }
      } else {
        console.error('❌ Update failed:', data);
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('❌ Update error:', error);
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Messages */}
      {message && (
        <div
          className={`mb-3 p-2 rounded-md text-xs ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Card Header */}
        <div className="px-3 py-1.5 bg-white border-b border-gray-200 flex justify-end items-center">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          )}
        </div>

        <div className="p-3">
          {!editing ? (
            // View Mode
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {profile?.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={profile.name}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500">
                    {profile?.name?.charAt(0) || 'A'}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {profile?.name || 'Loading...'}
                  </h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                    {profile?.role || 'USER'}
                  </span>
                </div>
                
                <div className="mt-0.5 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Mail className="w-3 h-3 text-gray-400" />
                    <span className="truncate">{profile?.email || 'No email'}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <Calendar className="w-2.5 h-2.5" />
                    <span>Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Edit Mode
            <form onSubmit={handleSubmit} className="space-y-2">
              {/* Email - Display Only */}
              <div>
                <label className="block text-[10px] font-medium text-gray-500">
                  Email
                </label>
                <div className="mt-0.5 text-sm text-gray-600 truncate bg-gray-50 px-2 py-1 rounded border border-gray-200">
                  {profile?.email}
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-[10px] font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-0.5 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm py-1 px-2"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-[10px] font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-0.5 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm py-1 px-2"
                />
              </div>

              <div className="flex justify-end gap-1.5 pt-1.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: profile?.name || '',
                      phone: profile?.phone || '',
                    });
                  }}
                  className="px-2.5 py-1 text-[10px] border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-2.5 py-1 text-[10px] bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-0.5"
                >
                  <Save className="w-2.5 h-2.5" />
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}