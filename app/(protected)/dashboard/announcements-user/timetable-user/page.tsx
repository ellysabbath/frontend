'use client';

import React, { useState, useEffect, useRef } from 'react';

const API_URL = 'https://bahifinal.pythonanywhere.com/';

interface TimetableType {
  id: number;
  date?: string;
  title: string;
  document?: string;
}

const Timetable: React.FC = () => {
  // Get auth token
  const getAuthToken = (): string | null => localStorage.getItem('access_token');

  const authToken = getAuthToken();

  // State
  const [timetables, setTimetables] = useState<TimetableType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(window.innerWidth < 768);

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
  };

  // Handle screen resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch timetables list
  const fetchTimetables = async () => {
    setLoading(true);
    try {
      const headers: HeadersInit = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${API_URL}timetables/`, { headers });
      if (!res.ok) throw new Error('Failed to fetch timetables');

      const data: TimetableType[] = await res.json();
      setTimetables(data);
    } catch (err: any) {
      console.error('Error fetching timetables:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, []);

  // Download timetable document using download API endpoint
  const handleDownload = async (id: number, title: string) => {
    if (!id) {
      console.log('No document available for this timetable');
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
      console.error('Download error:', err.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Timetables</h2>

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
                <td colSpan={4} style={{ ...styles.td, textAlign: 'center' }}>
                  Loading timetables...
                </td>
              </tr>
            ) : timetables.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ ...styles.td, textAlign: 'center' }}>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Timetable;