'use client';

import React, { useState, useEffect, useRef, useCallback, ChangeEvent, FormEvent } from 'react';
import Swal from 'sweetalert2';

const API_URL = 'https://bahifinal.pythonanywhere.com/';

interface TimetableType {
  id: number;
  date?: string;
  title: string;
  document?: string;
}

interface FormDataType {
  title: string;
  document: File | null;
}

const Timetable: React.FC = () => {
  // Get CSRF token from cookies (if needed)
  const getCSRFToken = (): string => {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
    return cookie ? decodeURIComponent(cookie.split('=')[1]) : '';
  };
  const getAuthToken = (): string | null => localStorage.getItem('access_token');

  const csrftoken = getCSRFToken();
  const authToken = getAuthToken();

  // State
  const [timetables, setTimetables] = useState<TimetableType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(window.innerWidth < 768);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingTimetable, setEditingTimetable] = useState<TimetableType | null>(null);

  const [formData, setFormData] = useState<FormDataType>({
    title: '',
    document: null,
  });

  const modalRef = useRef<HTMLDivElement>(null);

  // Styles
  const styles = {
    container: {
      width: isSmallScreen ? '85%' : '70%',
      maxWidth: '1200px',
      margin: '2rem auto',
      padding: isSmallScreen ? '1rem' : '2rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      fontFamily: 'Arial, sans-serif',
    },
    heading: {
      textAlign: 'center' as const,
      marginBottom: '1.5rem',
      color: '#333',
      fontSize: isSmallScreen ? '1.4rem' : '1.8rem',
    },
    button: {
      padding: '8px 12px',
      margin: '0 4px',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontSize: isSmallScreen ? '0.6rem' : '0.6rem',
    } as React.CSSProperties,
    primaryButton: { backgroundColor: '#3b82f6', color: 'white' },
    dangerButton: { backgroundColor: '#dc3545', color: 'white' },
    successButton: {
      backgroundColor: '#28a745',
      color: 'white',
      fontSize: isSmallScreen ? '0.6rem' : '0.6rem',
    },
    secondaryButton: { backgroundColor: '#6c757d', color: 'white' },
    scrollContainer: {
      overflowX: 'auto' as const,
      overflowY: 'auto' as const,
      maxHeight: '70vh',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      minWidth: isSmallScreen ? 600 : '100%',
    },
    th: {
      borderBottom: '1px solid #ccc',
      padding: isSmallScreen ? 8 : 12,
      textAlign: 'left' as const,
      backgroundColor: '#f8f9fa',
      color: '#333',
      position: 'sticky' as const,
      top: 0,
      zIndex: 1,
    },
    td: {
      borderBottom: '1px solid #ccc',
      padding: isSmallScreen ? 8 : 12,
      textAlign: 'left' as const,
      wordBreak: 'break-word' as const,
      backgroundColor: '#fff',
    },
    modal: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      width: isSmallScreen ? '60%' : '500px',
      maxWidth: '100%',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: 500,
    },
    input: {
      width: isSmallScreen ? '60%' : '95%',
      padding: '0.5rem',
      borderRadius: '4px',
      border: '1px solid #ccc',
    },
  };

  // Add CSS animation for the alert (like comment delete success)
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

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showModal && modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeModal();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModal]);

  // Handle screen resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch timetables list
  const fetchTimetables = useCallback(async () => {
    setLoading(true);
    try {
      const headers: HeadersInit = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${API_URL}timetables/`, { headers });
      if (!res.ok) throw new Error('Failed to fetch timetables');

      const data: TimetableType[] = await res.json();
      setTimetables(data);
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchTimetables();
  }, [fetchTimetables]);

  // Handle input changes (title)
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file input (document)
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, document: e.target.files?.[0] || null }));
  };

  // Open modal for create or edit
  const openModal = (timetable: TimetableType | null) => {
    if (timetable) {
      setEditingTimetable(timetable);
      setFormData({ title: timetable.title, document: null });
    } else {
      setEditingTimetable(null);
      setFormData({ title: '', document: null });
    }
    setShowModal(true);
  };

  // Close modal and reset form
  const closeModal = () => {
    setShowModal(false);
    setEditingTimetable(null);
    setFormData({ title: '', document: null });
  };

  // Create or update timetable
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      if (formData.document) fd.append('document', formData.document);

      const url = editingTimetable
        ? `${API_URL}timetables/${editingTimetable.id}/`
        : `${API_URL}timetables/`;
      const method = editingTimetable ? 'PUT' : 'POST';

      const headers: HeadersInit = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(url, {
        method,
        headers,
        body: fd,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }

      Swal.fire({
        title: 'Success!',
        text: `Timetable ${editingTimetable ? 'updated' : 'created'} successfully`,
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
      fetchTimetables();
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  // Delete timetable
  const handleDelete = async (id: number) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This action cannot be undone!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
      });

      if (!result.isConfirmed) return;

      const headers: HeadersInit = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${API_URL}timetables/${id}/`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }

      Swal.fire({
        title: 'Deleted!',
        text: 'Timetable has been deleted.',
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
      fetchTimetables();
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  // Download timetable document using download API endpoint
  const handleDownload = async (id: number, title: string) => {
    if (!id) {
      Swal.fire('No Document', 'No document available for this timetable', 'info');
      return;
    }
    try {
      const headers: HeadersInit = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${API_URL}timetables/${id}/download/`, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Determine extension by content type fallback to .pdf
      const contentType = res.headers.get('Content-Type') || 'application/pdf';
      let extension = '';
      if (contentType.includes('pdf')) extension = '.pdf';
      else if (contentType.includes('word')) extension = '.docx';
      else if (contentType.includes('excel')) extension = '.xlsx';
      else if (contentType.includes('image')) extension = '.jpg';

      link.download = title ? `${title}${extension}` : 'timetable-document.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Timetable Management</h2>


      <div style={styles.scrollContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Document</th>
              
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ ...styles.td, textAlign: 'center' }}>
                  Loading timetables...
                </td>
              </tr>
            ) : timetables.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...styles.td, textAlign: 'center' }}>
                  No timetables found
                </td>
              </tr>
            ) : (
              timetables.map(timetable => (
                <tr key={timetable.id}>
                  <td style={styles.td}>{timetable.id}</td>
                  <td style={styles.td}>{timetable.date ? new Date(timetable.date).toLocaleDateString() : '-'}</td>
                  <td style={styles.td}>{timetable.title}</td>
                  <td style={styles.td}>
                    {timetable.document ? (
                      <button
                        style={{ ...styles.button, ...styles.primaryButton }}
                        onClick={() => handleDownload(timetable.id, timetable.title)}
                      >
                        Download
                      </button>
                    ) : (
                      'No document'
                    )}
                  </td>
                  <td style={styles.td}>

                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent} ref={modalRef}>
            <h3 style={{ marginBottom: '1rem' }}>
              {editingTimetable ? 'Edit Timetable' : 'Create New Timetable'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={styles.label} htmlFor="title">
                  Title:
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={styles.label} htmlFor="document">
                  Document: {editingTimetable && !formData.document ? '(Leave blank to keep current)' : ''}
                </label>
                <input
                  type="file"
                  id="document"
                  name="document"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  style={styles.input}
                />
              </div>


            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;