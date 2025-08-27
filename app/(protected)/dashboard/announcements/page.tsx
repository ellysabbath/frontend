'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';

// Define TypeScript interfaces
interface Announcement {
  id: number;
  date: string;
  title: string;
  content: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
}

interface Comment {
  id: number;
  content: string;
}

interface FormData {
  title: string;
  content: string;
}

interface EventFormData {
  title: string;
  description: string;
  image: File | null;
}

interface AppState {
  announcements: Announcement[];
  events: Event[];
  loading: boolean;
  eventsLoading: boolean;
  isSmallScreen: boolean;
  editingAnnouncement: Announcement | null;
  showModal: boolean;
  showEventModal: boolean;
  formData: FormData;
  eventFormData: EventFormData;
}

const Announcements: React.FC = () => {
  // API endpoints
  const ANNOUNCEMENTS_API = 'https://bahifinal.pythonanywhere.com/announcements/';
  const EVENTS_API = 'https://bahifinal.pythonanywhere.com/api/header-images/';
  const COMMENTS_API = 'https://bahifinal.pythonanywhere.com/comments/';

  // CSRF & Auth token helpers
  const getCSRFToken = (): string => {
    if (typeof document === 'undefined') return '';
    const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
    return cookie ? decodeURIComponent(cookie.split('=')[1]) : '';
  };

  const getAuthToken = (): string | null => {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('access_token');
  };

  // State
  const [state, setState] = useState<AppState>({
    announcements: [],
    events: [],
    loading: true,
    eventsLoading: false,
    isSmallScreen: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    editingAnnouncement: null,
    showModal: false,
    showEventModal: false,
    formData: { title: '', content: '' },
    eventFormData: { title: '', description: '', image: null },
  });

  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState<boolean>(true);
  const [errorComments, setErrorComments] = useState<string | null>(null);

  const {
    announcements,
    events,
    loading,
    eventsLoading,
    isSmallScreen,
    editingAnnouncement,
    showModal,
    showEventModal,
    formData,
    eventFormData
  } = state;

  const csrftoken = getCSRFToken();
  const authToken = getAuthToken();
  const modalRef = useRef<HTMLDivElement>(null);
  const eventModalRef = useRef<HTMLDivElement>(null);

  // Responsive handler
  useEffect(() => {
    const handleResize = () => {
      setState(prev => ({ ...prev, isSmallScreen: window.innerWidth < 768 }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /** FETCH ANNOUNCEMENTS */
  const fetchAnnouncements = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const headers: HeadersInit = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(ANNOUNCEMENTS_API, { headers });
      if (!res.ok) throw new Error('Failed to fetch announcements');
      const data: Announcement[] = await res.json();
      setState(prev => ({ ...prev, announcements: data, loading: false }));
    } catch (err) {
      Swal.fire('Error', (err as Error).message, 'error');
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [authToken]);

  /** FETCH EVENTS */
  const fetchEvents = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, eventsLoading: true }));
      const headers: HeadersInit = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(EVENTS_API, { headers });
      if (!res.ok) throw new Error('Failed to fetch events');
      const data: Event[] = await res.json();
      setState(prev => ({ ...prev, events: data, eventsLoading: false }));
    } catch (err) {
      setState(prev => ({ ...prev, eventsLoading: false }));
    }
  }, [authToken]);

  /** FETCH COMMENTS */
  const fetchComments = async (): Promise<void> => {
    try {
      setLoadingComments(true);
      const res = await fetch(COMMENTS_API);
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data: Comment[] = await res.json();
      setComments(data);
    } catch (err) {
      setErrorComments((err as Error).message);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchEvents();
    fetchComments();
  }, [fetchAnnouncements, fetchEvents]);

  /** DELETE COMMENT WITH SWEETALERT */
  const deleteComment = async (id: number): Promise<void> => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'This comment will be deleted permanently!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (!confirm.isConfirmed) return;

    try {
      const headers: HeadersInit = { 'X-CSRFToken': csrftoken };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${COMMENTS_API}${id}/`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed to delete comment');
      setComments(prev => prev.filter(c => c.id !== id));
      Swal.fire('Deleted!', 'Comment has been deleted.', 'success');
    } catch (err) {
      Swal.fire('Error', (err as Error).message, 'error');
    }
  };

  /** ANNOUNCEMENT MODAL HANDLERS */
  const openModal = (announcement: Announcement | null = null): void => {
    setState(prev => ({
      ...prev,
      editingAnnouncement: announcement,
      showModal: true,
      formData: announcement
        ? { title: announcement.title, content: announcement.content }
        : { title: '', content: '' },
    }));
  };

  const closeModal = (): void => setState(prev => ({
    ...prev,
    showModal: false,
    editingAnnouncement: null
  }));

  /** EVENT MODAL HANDLERS */
  const openEventModal = (): void => {
    setState(prev => ({
      ...prev,
      showEventModal: true,
      eventFormData: { title: '', description: '', image: null },
    }));
  };

  const closeEventModal = (): void => setState(prev => ({
    ...prev,
    showEventModal: false
  }));

  /** ANNOUNCEMENT CRUD HELPERS */
  const handleAnnouncementOperation = async (
    method: string,
    url: string,
    payload: Partial<Announcement>
  ): Promise<Response> => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || JSON.stringify(errData));
      }
      return res;
    } catch (err) {
      Swal.fire('Error', (err as Error).message, 'error');
      throw err;
    }
  };

  /** EVENT CREATION HANDLER */
  const handleEventSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      setState(prev => ({ ...prev, eventsLoading: true }));
      const formData = new FormData();
      formData.append('title', eventFormData.title);
      formData.append('description', eventFormData.description);
      if (eventFormData.image) {
        formData.append('image', eventFormData.image);
      }
      const headers: HeadersInit = { 'X-CSRFToken': csrftoken };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(EVENTS_API, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || JSON.stringify(errData));
      }
      Swal.fire({
        title: 'Success!',
        text: 'Event created successfully',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      closeEventModal();
      fetchEvents();
    } catch (err) {
      Swal.fire('Error', (err as Error).message, 'error');
    } finally {
      setState(prev => ({ ...prev, eventsLoading: false }));
    }
  };

  /** DELETE EVENT HANDLER */
  const handleDeleteEvent = async (id: number): Promise<void> => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: "This event will be deleted permanently!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (!confirm.isConfirmed) return;

    try {
      const headers: HeadersInit = { 'X-CSRFToken': csrftoken };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${EVENTS_API}${id}/`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete event');
      Swal.fire('Deleted!', 'Event has been deleted.', 'success');
      fetchEvents();
    } catch (err) {
      Swal.fire('Error', (err as Error).message, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      const payload = { title: formData.title, content: formData.content };
      const url = editingAnnouncement ? `${ANNOUNCEMENTS_API}${editingAnnouncement.id}/` : ANNOUNCEMENTS_API;
      const method = editingAnnouncement ? 'PUT' : 'POST';
      await handleAnnouncementOperation(method, url, payload);
      Swal.fire('Success', `Announcement ${editingAnnouncement ? 'updated' : 'created'} successfully`, 'success');
      closeModal();
      fetchAnnouncements();
    } catch (err) {
      // error handled in handleAnnouncementOperation
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: "This can't be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (!confirm.isConfirmed) return;

    try {
      await handleAnnouncementOperation('DELETE', `${ANNOUNCEMENTS_API}${id}/`, {});
      Swal.fire('Deleted!', 'Announcement has been deleted.', 'success');
      fetchAnnouncements();
    } catch (err) {
      // error handled in handleAnnouncementOperation
    }
  };

  // Enhanced Styles
  const styles = {
    container: {
      width: isSmallScreen ? '95%' : '80%',
      maxWidth: '1200px',
      margin: '2rem auto',
      padding: isSmallScreen ? '1rem' : '2rem',
      backgroundColor: '#ffffff',
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
    secondaryButton: {
      backgroundColor: '#6b7280',
      color: 'white',
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
      borderBottom: '2px solid ',
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
    commentsSection: {
      marginTop: '2rem',
      paddingTop: '1.5rem',
      borderTop: '1px solid #e5e7eb',
    },
    commentsTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '1rem',
    },
    commentItem: {
      padding: '12px 16px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      marginBottom: '12px',
      backgroundColor: '#f9fafb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    commentContent: {
      color: '#4b5563',
      fontStyle: 'italic',
      margin: 0,
      flex: 1,
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
      width: isSmallScreen ? '100' : '500px',
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
      minHeight: '120px',
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
    eventsHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      margin: '2rem 0 1rem 0',
      flexDirection: isSmallScreen ? 'column' : 'row',
      gap: isSmallScreen ? '1rem' : '0',
    }as React.CSSProperties,
    eventsTitle: {
      fontSize: isSmallScreen ? '1.25rem' : '1.5rem',
      fontWeight: '600',
      color: '#2d3748',
      margin: 0,
    },
    eventImage: {
      width: '60px',
      height: '60px',
      objectFit: 'cover' as const,
      borderRadius: '6px',
    }
  };

  // Hover effects for buttons
  const buttonHoverEffect: React.CSSProperties = {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  };

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

  // ✅ This version guarantees the return type is void
  return () => {
    document.head.removeChild(style);
  };
}, []);


  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.heading}>Announcements</h2>
        <button
          style={{
            ...styles.button,
            ...styles.primaryButton,
          }}
          onClick={() => openModal()}
          onMouseOver={e => Object.assign(e.currentTarget.style, buttonHoverEffect)}
          onMouseOut={e => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = styles.button.boxShadow as string;
          }}
        >
          + New Announcement
        </button>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Content</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={styles.loadingRow}>
                  Loading announcements...
                </td>
              </tr>
            ) : announcements.length === 0 ? (
              <tr>
                <td colSpan={5} style={styles.emptyRow}>
                  No announcements found
                </td>
              </tr>
            ) : (
              announcements.map(a => (
                <tr key={a.id} style={styles.tr}>
                  <td style={styles.td}>{a.id}</td>
                  <td style={styles.td}>{new Date(a.date).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    <strong>{a.title}</strong>
                  </td>
                  <td style={styles.td}>{a.content}</td>
                  <td style={styles.td}>
                    <div style={styles.actionCell}>
                      <button
                        style={{
                          ...styles.button,
                          ...styles.secondaryButton,
                          padding: '6px 12px',
                          fontSize: '0.8rem'
                        }}
                        onClick={() => openModal(a)}
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
                        onClick={() => handleDelete(a.id)}
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

      {/* EVENTS SECTION */}
      <div style={styles.eventsHeader}>
        <h3 style={styles.eventsTitle}>Events</h3>
        <button
          style={{
            ...styles.button,
            ...styles.successButton,
          }}
          onClick={openEventModal}
          onMouseOver={e => Object.assign(e.currentTarget.style, buttonHoverEffect)}
          onMouseOut={e => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = styles.button.boxShadow as string;
          }}
        >
          + Create Event
        </button>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Image</th>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Created At</th>
              <th style={styles.th}>Updated At</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {eventsLoading ? (
              <tr>
                <td colSpan={7} style={styles.loadingRow}>
                  Loading events...
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={7} style={styles.emptyRow}>
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
                        style={styles.eventImage}
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
                    {event.updated_at ? new Date(event.updated_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionCell}>
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

      <div style={styles.commentsSection}>
        <h3 style={styles.commentsTitle}>Comments</h3>
        {loadingComments ? (
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Loading comments...</p>
        ) : errorComments ? (
          <p style={{ color: '#dc2626', fontStyle: 'italic' }}>Error: {errorComments}</p>
        ) : comments.length === 0 ? (
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No comments yet.</p>
        ) : (
          comments.map(c => (
            <div key={c.id} style={styles.commentItem}>
              <p style={styles.commentContent}>{c.content}</p>
              <button
                onClick={() => deleteComment(c.id)}
                style={{
                  ...styles.button,
                  ...styles.dangerButton,
                  padding: '4px 8px',
                  fontSize: '0.75rem'
                }}
                onMouseOver={e => Object.assign(e.currentTarget.style, buttonHoverEffect)}
                onMouseOut={e => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = styles.button.boxShadow as string;
                }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      {/* ANNOUNCEMENT MODAL */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()} ref={modalRef}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Title:</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={e => setState(prev => ({
                    ...prev,
                    formData: { ...prev.formData, title: e.target.value }
                  }))}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Content:</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={e => setState(prev => ({
                    ...prev,
                    formData: { ...prev.formData, content: e.target.value }
                  }))}
                  required
                  style={styles.textarea}
                />
              </div>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={{
                    ...styles.button,
                    ...styles.secondaryButton,
                  }}
                  onClick={closeModal}
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
                  style={{
                    ...styles.button,
                    ...styles.primaryButton,
                  }}
                  onMouseOver={e => Object.assign(e.currentTarget.style, buttonHoverEffect)}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = styles.button.boxShadow as string;
                  }}
                >
                  {editingAnnouncement ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVENT MODAL */}
      {showEventModal && (
        <div style={styles.modalOverlay} onClick={closeEventModal}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()} ref={eventModalRef}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Create New Event</h3>
            </div>
            <form onSubmit={handleEventSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Title:</label>
                <input
                  type="text"
                  name="title"
                  value={eventFormData.title}
                  onChange={e => setState(prev => ({
                    ...prev,
                    eventFormData: { ...prev.eventFormData, title: e.target.value }
                  }))}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description:</label>
                <textarea
                  name="description"
                  value={eventFormData.description}
                  onChange={e => setState(prev => ({
                    ...prev,
                    eventFormData: { ...prev.eventFormData, description: e.target.value }
                  }))}
                  required
                  style={styles.textarea}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Image:</label>
                <input
                  type="file"
                  name="image"
                  onChange={e => setState(prev => ({
                    ...prev,
                    eventFormData: { ...prev.eventFormData, image: e.target.files?.[0] || null }
                  }))}
                  style={styles.fileInput}
                />
              </div>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={{
                    ...styles.button,
                    ...styles.secondaryButton,
                  }}
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
                  style={{
                    ...styles.button,
                    ...styles.successButton,
                  }}
                  disabled={eventsLoading}
                  onMouseOver={e => {
                    if (!eventsLoading) {
                      Object.assign(e.currentTarget.style, buttonHoverEffect);
                    }
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = styles.button.boxShadow as string;
                  }}
                >
                  {eventsLoading ? 'Creating...' : 'Create Event'}
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