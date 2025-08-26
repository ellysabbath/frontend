'use client';

import React, { useState, useEffect, useRef } from 'react';

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

interface AppState {
  announcements: Announcement[];
  events: Event[];
  loading: boolean;
  eventsLoading: boolean;
  isSmallScreen: boolean;
}

const Announcements: React.FC = () => {
  // API endpoints
  const ANNOUNCEMENTS_API = 'https://bahifinal.pythonanywhere.com/announcements/';
  const EVENTS_API = 'https://bahifinal.pythonanywhere.com/api/header-images/';
  const COMMENTS_API = 'https://bahifinal.pythonanywhere.com/comments/';

  // Auth token helper
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
  } = state;

  const authToken = getAuthToken();

  // Responsive handler
  useEffect(() => {
    const handleResize = () => {
      setState(prev => ({ ...prev, isSmallScreen: window.innerWidth < 768 }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /** FETCH ANNOUNCEMENTS */
  const fetchAnnouncements = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const headers: HeadersInit = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(ANNOUNCEMENTS_API, { headers });
      if (!res.ok) throw new Error('Failed to fetch announcements');
      const data: Announcement[] = await res.json();
      setState(prev => ({ ...prev, announcements: data, loading: false }));
    } catch (err) {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  /** FETCH EVENTS */
  const fetchEvents = async () => {
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
  };

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
  }, []);

  // Enhanced Styles
// Must be inside the component, after `isSmallScreen` is available
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
  } as React.CSSProperties,

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexDirection: isSmallScreen ? 'column' : 'row',
    gap: isSmallScreen ? '1rem' : '0',
  } as React.CSSProperties,

  heading: {
    color: '#2d3748',
    fontSize: isSmallScreen ? '1.5rem' : '2rem',
    fontWeight: 600,
    margin: 0,
  } as React.CSSProperties,

  tableContainer: {
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: '60vh',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '2rem',
    position: 'relative',
  } as React.CSSProperties,

  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    minWidth: isSmallScreen ? '600px' : 'auto',
  } as React.CSSProperties,

  th: {
    padding: isSmallScreen ? '12px 8px' : '16px 12px',
    textAlign: 'left',
    backgroundColor: '#f9fafb',
    color: '#374151',
    fontWeight: 600,
    fontSize: '0.875rem',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    borderBottom: '2px solid #e5e7eb',
  } as React.CSSProperties,

  td: {
    padding: isSmallScreen ? '12px 8px' : '16px 12px',
    textAlign: 'left',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '0.875rem',
    color: '#4b5563',
  } as React.CSSProperties,

  tr: {
    transition: 'background-color 0.2s',
  } as React.CSSProperties,

  commentsSection: {
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #e5e7eb',
  } as React.CSSProperties,

  commentsTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '1rem',
  } as React.CSSProperties,

  commentItem: {
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '12px',
    backgroundColor: '#f9fafb',
  } as React.CSSProperties,

  commentContent: {
    color: '#4b5563',
    fontStyle: 'italic',
    margin: 0,
  } as React.CSSProperties,

  loadingRow: {
    textAlign: 'center',
    padding: '2rem',
    color: '#6b7280',
  } as React.CSSProperties,

  emptyRow: {
    textAlign: 'center',
    padding: '2rem',
    color: '#6b7280',
    fontStyle: 'italic',
  } as React.CSSProperties,

  eventsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '2rem 0 1rem 0',
    flexDirection: isSmallScreen ? 'column' : 'row',
    gap: isSmallScreen ? '1rem' : '0',
  } as React.CSSProperties,

  eventsTitle: {
    fontSize: isSmallScreen ? '1.25rem' : '1.5rem',
    fontWeight: 600,
    color: '#2d3748',
    margin: 0,
  } as React.CSSProperties,

  eventImage: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '6px',
  } as React.CSSProperties,
};


  

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.heading}>Announcements</h2>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Content</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={styles.loadingRow}>
                  Loading announcements...
                </td>
              </tr>
            ) : announcements.length === 0 ? (
              <tr>
                <td colSpan={4} style={styles.emptyRow}>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* EVENTS SECTION */}
      <div style={styles.eventsHeader}>
        <h3 style={styles.eventsTitle}>Events</h3>
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
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Announcements;