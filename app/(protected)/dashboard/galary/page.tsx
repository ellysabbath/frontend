'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';

// Event interface
interface Event {
  id: number;
  title: string;
  description: string;
  image?: string;
  created_at?: string;
}

interface EventFormData {
  title: string;
  description: string;
  image: File | null;
}

const EVENTS_API = 'https://bahifinal.pythonanywhere.com/api/header-images/';

const getCSRFToken = (): string => {
  if (typeof document === 'undefined') return '';
  const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
  return cookie ? decodeURIComponent(cookie.split('=')[1]) : '';
};

const getAuthToken = (): string | null => {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('access_token');
};

const Announcements: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventFormData, setEventFormData] = useState<EventFormData>({ 
    title: '', 
    description: '', 
    image: null 
  });
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSmallScreen, setIsSmallScreen] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [hoveredImage, setHoveredImage] = useState<number | null>(null);

  const csrftoken = getCSRFToken();
  const authToken = getAuthToken();
  const eventModalRef = useRef<HTMLDivElement>(null);

  // Responsive handler
  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setEventsLoading(true);
      const headers: HeadersInit = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(EVENTS_API, { headers });
      if (!res.ok) throw new Error('Failed to fetch events');
      const data: Event[] = await res.json();
      setEvents(data);
    } catch (err) {
      setStatus('error');
      setErrorMessage((err as Error).message);
    } finally {
      setEventsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Success Alert (like verify-email page)
  const showSuccess = (msg: string) => {
    setStatus('success');
    setStatusMessage(msg);
    setTimeout(() => setStatus('idle'), 2000);
  };

  // Error Alert
  const showError = (msg: string) => {
    setStatus('error');
    setErrorMessage(msg);
    setTimeout(() => setStatus('idle'), 2500);
  };

  // EVENT CREATE/EDIT HANDLER
  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const formData = new FormData();
      formData.append('title', eventFormData.title);
      formData.append('description', eventFormData.description);
      if (eventFormData.image) formData.append('image', eventFormData.image);
      
      const headers: HeadersInit = { 'X-CSRFToken': csrftoken };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      
      let url = EVENTS_API;
      let method = 'POST';
      
      if (editingEvent) {
        url = `${EVENTS_API}${editingEvent.id}/`;
        method = 'PUT';
      }
      
      const res = await fetch(url, {
        method,
        headers,
        body: formData,
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || JSON.stringify(errData));
      }
      
      setShowEventModal(false);
      setEditingEvent(null);
      setEventFormData({ title: '', description: '', image: null });
      fetchEvents();
      showSuccess(editingEvent ? 'Event updated successfully.' : 'Event added successfully.');
    } catch (err) {
      showError((err as Error).message);
    }
  };

  // DELETE EVENT HANDLER
  const handleDeleteEvent = async (id: number) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: "This event will be deleted permanently!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });
    if (!confirm.isConfirmed) return;
    setStatus('loading');
    try {
      const headers: HeadersInit = { 'X-CSRFToken': csrftoken };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${EVENTS_API}${id}/`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete event');
      fetchEvents();
      showSuccess('Event deleted successfully.');
    } catch (err) {
      showError((err as Error).message);
    }
  };

  // Open modal for add/edit
  const openEventModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setEventFormData({ 
        title: event.title || '', 
        description: event.description || '', 
        image: null 
      });
    } else {
      setEditingEvent(null);
      setEventFormData({ title: '', description: '', image: null });
    }
    setShowEventModal(true);
  };

  // Close modal
  const closeEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setEventFormData({ title: '', description: '', image: null });
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEventFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEventFormData(prev => ({
      ...prev,
      image: e.target.files?.[0] || null
    }));
  };

  // Styles
  const styles = {
    container: {
      width: isSmallScreen ? '95%' : '80%',
      maxWidth: '1200px',
      margin: '2rem auto',
      padding: isSmallScreen ? '1rem' : '2rem',
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 6px 15px rgba(0,0,0,0.08)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      flexDirection: isSmallScreen ? 'column' : 'row',
      gap: isSmallScreen ? '1rem' : '0',
    }as React.CSSProperties,
    heading: {
      color: '#2d3748',
      fontSize: isSmallScreen ? '1.5rem' : '2rem',
      fontWeight: '600',
      margin: 0,
    },
    button: {
      padding: '10px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as React.CSSProperties,
    primaryButton: {
      backgroundColor: '#4f46e5',
      color: 'white',
      boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)',
    },
    dangerButton: {
      backgroundColor: '#dc2626',
      color: 'white',
      boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)',
    },
    successButton: {
      backgroundColor: '#10b981',
      color: 'white',
      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
    },
    tableContainer: {
      overflowX: 'auto' as const,
      overflowY: 'auto' as const,
      maxHeight: '60vh',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      marginBottom: '2rem',
      position: 'relative' as const,
    },
    table: {
      width: '100%',
      borderCollapse: 'separate' as const,
      borderSpacing: 0,
      minWidth: isSmallScreen ? '600px' : 'auto',
    },
    th: {
      padding: isSmallScreen ? '12px 8px' : '16px 12px',
      textAlign: 'left' as const,
      backgroundColor: '#f9fafb',
      color: '#374151',
      fontWeight: '600',
      fontSize: '0.875rem',
      position: 'sticky' as const,
      top: 0,
      zIndex: 10,
      borderBottom: '2px solid #e5e7eb',
    },
    td: {
      padding: isSmallScreen ? '12px 8px' : '16px 12px',
      textAlign: 'left' as const,
      borderBottom: '1px solid #f3f4f6',
      fontSize: '0.875rem',
      color: '#4b5563',
    },
    tr: {
      transition: 'background-color 0.2s',
    } as React.CSSProperties,
    actionCell: {
      display: 'flex',
      gap: '8px',
    },
    modalOverlay: {
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
      padding: isSmallScreen ? '1rem' : '0',
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '12px',
      width: isSmallScreen ? '100%' : '500px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      overflowY: 'auto' as const,
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    },
    modalHeader: {
      marginBottom: '1.5rem',
    },
    modalTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#1f2937',
      margin: 0,
    },
    formGroup: {
      marginBottom: '1.5rem',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: '500',
      color: '#374151',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      fontSize: '1rem',
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,
    textarea: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      fontSize: '1rem',
      minHeight: '100px',
      resize: 'vertical' as const,
      boxSizing: 'border-box' as const,
    },
    fileInput: {
      width: '100%',
      padding: '0.5rem',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      fontSize: '1rem',
      boxSizing: 'border-box' as const,
    },
    modalActions: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
    },
    loadingRow: {
      textAlign: 'center' as const,
      padding: '2rem',
      color: '#6b7280',
    },
    emptyRow: {
      textAlign: 'center' as const,
      padding: '2rem',
      color: '#6b7280',
      fontStyle: 'italic',
    },
    eventImage: {
      width: '60px',
      height: '60px',
      objectFit: 'cover' as const,
      borderRadius: '6px',
      transition: 'transform 0.3s ease',
      cursor: 'pointer',
    },
    eventImageHovered: {
      transform: 'scale(1.5)',
      zIndex: 100,
      position: 'relative' as const,
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    }
  };

  // Button hover effect
  const buttonHoverEffect: React.CSSProperties = {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  };

  // Success/Error UI (like verify-email)
  const renderStatusAlert = () => {
    if (status === 'success') {
      return (
        <div className="text-center mb-4">
          <div className="flex justify-center mb-2">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          <p className="text-green-700">{statusMessage}</p>
        </div>
      );
    }
    if (status === 'error') {
      return (
        <div className="text-center mb-4">
          <div className="flex justify-center mb-2">
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
          </div>
          <p className="text-red-700">{errorMessage}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.heading}>Events</h2>
        <button
          style={{ ...styles.button, ...styles.successButton }}
          onClick={() => openEventModal()}
          onMouseOver={e => Object.assign(e.currentTarget.style, buttonHoverEffect)}
          onMouseOut={e => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = styles.button.boxShadow as string;
          }}
        >
          + Add Event
        </button>
      </div>

      {renderStatusAlert()}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Image</th>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Created At</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {eventsLoading ? (
              <tr>
                <td colSpan={6} style={styles.loadingRow}>
                  Loading events...
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={6} style={styles.emptyRow}>
                  No events found
                </td>
              </tr>
            ) : (
              events.map(event => (
                <tr key={event.id} style={styles.tr}>
                  <td style={styles.td}>{event.id}</td>
                  <td style={styles.td}>
                    {event.image && (
                      <img
                        src={event.image}
                        alt={event.title}
                        style={{
                          ...styles.eventImage,
                          ...(hoveredImage === event.id ? styles.eventImageHovered : {})
                        }}
                        onMouseEnter={() => setHoveredImage(event.id)}
                        onMouseLeave={() => setHoveredImage(null)}
                      />
                    )}
                  </td>
                  <td style={styles.td}>
                    <strong>{event.title}</strong>
                  </td>
                  <td style={styles.td}>{event.description}</td>
                  <td style={styles.td}>
                    {event.created_at ? new Date(event.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionCell}>
                      <button
                        style={{
                          ...styles.button,
                          ...styles.primaryButton,
                          padding: '6px 12px',
                          fontSize: '0.8rem'
                        }}
                        onClick={() => openEventModal(event)}
                        onMouseOver={e => Object.assign(e.currentTarget.style, buttonHoverEffect)}
                        onMouseOut={e => {
                          e.currentTarget.style.transform = '';
                          e.currentTarget.style.boxShadow = styles.button.boxShadow as string;
                        }}
                      >
                        Edit
                      </button>
                      <button
                        style={{
                          ...styles.button,
                          ...styles.dangerButton,
                          padding: '6px 12px',
                          fontSize: '0.8rem'
                        }}
                        onClick={() => handleDeleteEvent(event.id)}
                        onMouseOver={e => Object.assign(e.currentTarget.style, buttonHoverEffect)}
                        onMouseOut={e => {
                          e.currentTarget.style.transform = '';
                          e.currentTarget.style.boxShadow = styles.button.boxShadow as string;
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* EVENT MODAL */}
      {showEventModal && (
        <div style={styles.modalOverlay} onClick={closeEventModal}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()} ref={eventModalRef}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingEvent ? 'Edit Event' : 'Add New Event'}</h3>
            </div>
            <form onSubmit={handleEventSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Title:</label>
                <input
                  type="text"
                  name="title"
                  value={eventFormData.title}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description:</label>
                <textarea
                  name="description"
                  value={eventFormData.description}
                  onChange={handleInputChange}
                  style={styles.textarea}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Image:</label>
                <input
                  type="file"
                  name="image"
                  onChange={handleFileChange}
                  style={styles.fileInput}
                  required={!editingEvent}
                />
              </div>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={{ ...styles.button, ...styles.dangerButton }}
                  onClick={closeEventModal}
                  onMouseOver={e => Object.assign(e.currentTarget.style, buttonHoverEffect)}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = styles.button.boxShadow as string;
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...styles.button, ...styles.successButton }}
                  disabled={status === 'loading'}
                  onMouseOver={e => {
                    if (status !== 'loading') Object.assign(e.currentTarget.style, buttonHoverEffect);
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = styles.button.boxShadow as string;
                  }}
                >
                  {status === 'loading'
                    ? (editingEvent ? 'Updating...' : 'Creating...')
                    : (editingEvent ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;