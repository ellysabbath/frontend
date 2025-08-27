'use client';

import React, { useState, useEffect, useRef, useCallback, ChangeEvent, FormEvent } from 'react';
import Swal from 'sweetalert2';

const API_URL = 'https://bahifinal.pythonanywhere.com/';

interface ContactType {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  role: string;
  is_active: boolean;
}

interface FormDataType {
  name: string;
  email: string;
  phone_number: string;
  role: string;
  is_active: boolean;
}

const UsersPage: React.FC = () => {
  // State management
  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(window.innerWidth < 768);
  const [editingContact, setEditingContact] = useState<ContactType | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    email: '',
    phone_number: '',
    role: 'user',
    is_active: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [tableHidden, setTableHidden] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Authentication helpers
  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-CSRFToken': document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='))?.split('=')[1] || ''
    };
    const token = localStorage.getItem('access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // Responsive handler
  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Click outside modal handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showModal && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModal]);

  // Add CSS animation for the alert
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    
  }, []);

  // API request handler
  const apiRequest = async (method: string, endpoint: string, data: any = null) => {
    try {
      const url = `${API_URL}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: getAuthHeaders(),
      };
      if (data) options.body = JSON.stringify(data);

      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          throw new Error(text || 'Request failed');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }

      if (method === 'DELETE' || response.status === 204) {
        return null;
      }
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response');
      }
      return await response.json();
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
      throw error;
    }
  };

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('GET', 'contacts/');
      setContacts(data);
    } catch {
      // Error handled in apiRequest
    } finally {
      setLoading(false);
      setTableHidden(false); // Show table after fetch
    }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  // Form handlers
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }));
  };

  // Modal handlers
  const openModal = (contact: ContactType | null = null) => {
    setTableHidden(true);
    setEditingContact(contact);
    setFormData(contact ? { ...contact } : {
      name: '',
      email: '',
      phone_number: '',
      role: 'user',
      is_active: true
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingContact(null);
    setTableHidden(false);
  };

  // Contact operations
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setTableHidden(true);
    try {
      const endpoint = editingContact
        ? `contacts/${editingContact.id}/`
        : 'contacts/';
      const method = editingContact ? 'PUT' : 'POST';

      await apiRequest(method, endpoint, formData);

      Swal.fire({
        title: 'Success!',
        text: `Contact ${editingContact ? 'updated' : 'created'} successfully`,
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.style.animation = 'slideInRight 0.5s, slideOutRight 0.5s 2.5s';
        }
      });

      closeModal();
      fetchContacts();
    } catch {
      // Error handled in apiRequest
      setTableHidden(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (contactId: number) => {
    setActionLoading(true);
    setTableHidden(true);
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        await apiRequest('DELETE', `contacts/${contactId}/`);
        Swal.fire({
          title: 'Deleted!',
          text: 'Contact has been deleted.',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.style.animation = 'slideInRight 0.5s, slideOutRight 0.5s 2.5s';
          }
        });
        fetchContacts();
      } else {
        setTableHidden(false);
      }
    } catch {
      // Error handled in apiRequest
      setTableHidden(false);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtering
  const filteredContacts = contacts.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">User Management</h1>
        <p className="text-gray-600">Manage and monitor all user accounts</p>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="user">User</option>
            </select>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              onClick={() => openModal()}
            >
              Add User
            </button>
          </div>
        </div>

        {!tableHidden && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading users...</td>
                  </tr>
                ) : filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No users found</td>
                  </tr>
                ) : (
                  filteredContacts.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-medium">{user.name[0]}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'active' : 'inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{user.phone_number || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 text-sm"
                            onClick={() => openModal(user)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 text-sm"
                            onClick={() => handleDelete(user.id)}
                            disabled={actionLoading}
                          >
                            {actionLoading ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {tableHidden && (
          <div className="flex items-center justify-center py-12">
            <span className="text-blue-600 font-semibold text-lg animate-pulse">
              Processing...
            </span>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
            ref={modalRef}
          >
            <h3 className="text-xl font-semibold mb-4">
              {editingContact ? 'Edit User' : 'Create New User'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block font-medium mb-1">Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Phone Number:</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                  pattern="^\+?255?\d{9,15}$"
                  title="Phone number must be in format: '+255xxxxxxxxx'"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Role:</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="user">User</option>
                  <option value="Admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              {editingContact && (
                <div className="mb-4">
                  <label className="block font-medium mb-1">Status:</label>
                  <select
                    name="is_active"
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={handleStatusChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-md font-semibold hover:bg-green-700 transition"
                disabled={actionLoading}
              >
                {actionLoading
                  ? editingContact
                    ? 'Updating...'
                    : 'Creating...'
                  : editingContact
                  ? 'Update User'
                  : 'Create User'}
              </button>
              <button
                type="button"
                className="w-full bg-gray-400 text-white py-2 rounded-md mt-2"
                onClick={closeModal}
                disabled={actionLoading}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;