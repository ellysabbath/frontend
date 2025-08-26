'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/authContext';
import Swal from 'sweetalert2';

interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  bio: string;
  profile_picture: string;
  is_newsletter_subscribed: boolean;
  website_url: string;
  github_url: string;
  linkedin_url: string;
  profile_completion_percentage: number;
  is_profile_complete: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData>({
    id:'',
    email: '',
    first_name: '',
    last_name: '',
    full_name: '',
    role: '',
    bio: '',
    profile_picture: '',
    is_newsletter_subscribed: false,
    website_url: '',
    github_url: '',
    linkedin_url: '',
    profile_completion_percentage: 0,
    is_profile_complete: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: false,
    darkMode: false,
    autoSave: true,
    language: 'english',
  });

  // Use relative API path through Next.js proxy - same as ProfilePage
  const API_BASE_PATH = '/api/profile';

  // Show success toast notification
  const showSuccessToast = (message: string) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  };

  // Show error toast notification
  const showErrorToast = (message: string) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: message,
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  };

  // Fetch user data on component mount - same pattern as ProfilePage
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get the current user data through proxy - same API endpoint
        const response = await fetch(`${API_BASE_PATH}/current-user/`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch user data: ${response.status}`);
        }
        
        const userData = await response.json();
        setUserData(userData);
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        const errorMessage = err.message || 'Failed to load user data. Please try again later.';
        setError(errorMessage);
        showErrorToast(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (field: keyof UserData, value: string | boolean) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const handleSettingsChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: keyof UserData) => {
    setUserData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (!user?.id) {
        throw new Error('User ID not available');
      }
      
      setIsSaving(true);
      
      // Update user profile data - same API pattern as ProfilePage
      const response = await fetch(`${API_BASE_PATH}/users/${user.id}/`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: userData.first_name,
          last_name: userData.last_name,
          bio: userData.bio,
          website_url: userData.website_url,
          github_url: userData.github_url,
          linkedin_url: userData.linkedin_url,
          is_newsletter_subscribed: userData.is_newsletter_subscribed,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update: ${response.status}`);
      }
      
      const updatedData = await response.json();
      setUserData(updatedData);
      showSuccessToast('Settings updated successfully!');
      
    } catch (err: any) {
      console.error('Error updating settings:', err);
      const errorMessage = err.message || 'Failed to update settings. Please try again.';
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reload the original data - same pattern as ProfilePage
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error && !userData.email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 mb-4 text-center">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-red-800 text-center mb-6">{error}</div>
          <button 
            className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and settings</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSaveChanges}>
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Account Settings</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Profile Settings */}
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={userData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={userData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Last Name"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={userData.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                    readOnly
                    disabled
                  />
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    rows={4}
                    value={userData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about yourself"
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-4">Social Links</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={userData.website_url}
                    onChange={(e) => handleInputChange('website_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
                  <input
                    type="url"
                    value={userData.github_url}
                    onChange={(e) => handleInputChange('github_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://whatsapp/chat/me"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                  <input
                    type="url"
                    value={userData.linkedin_url}
                    onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://facebook.com/in/username"
                  />
                </div>
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-4">Newsletter</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="newsletter"
                  checked={userData.is_newsletter_subscribed}
                  onChange={() => handleCheckboxChange('is_newsletter_subscribed')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="newsletter" className="ml-2 block text-sm text-gray-700">
                  Subscribe to newsletter
                </label>
              </div>
            </div>

            {/* Preferences */}
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-4">Preferences</h3>
              <div className="space-y-4">
                {[
                  { label: 'Enable Notifications', field: 'notifications' },
                  { label: 'Email Updates', field: 'emailUpdates' },
                  { label: 'Dark Mode', field: 'darkMode' },
                  { label: 'Auto Save', field: 'autoSave' },
                ].map((item) => (
                  <div key={item.field} className="flex items-center">
<input
  type="checkbox"
  id={item.field}
  checked={Boolean(settings[item.field as keyof typeof settings])} // ✅ Fix
  onChange={(e) => handleSettingsChange(item.field, e.target.checked)}
  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
/>

                    <label htmlFor={item.field} className="ml-2 block text-sm text-gray-700">
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-4">Language & Region</h3>
              <select
                value={settings.language}
                onChange={(e) => handleSettingsChange('language', e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex space-x-4 pt-4">
              <button 
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button 
                type="button"
                onClick={handleCancel}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}