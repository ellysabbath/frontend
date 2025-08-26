'use client';

import React, { useState, useEffect, useRef, useCallback, ChangeEvent, FormEvent } from 'react';
import Swal from 'sweetalert2';

const API_URL = 'https://bahifinal.pythonanywhere.com/';

interface BookType {
  id: string;
  title: string;
  date_uploaded: string;
  book_file: string;
}

interface FormDataType {
  title: string;
  file: File | null;
}

const BooksPage: React.FC = () => {
  const [books, setBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingBook, setEditingBook] = useState<BookType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FormDataType>({ title: '', file: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [tableHidden, setTableHidden] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSRF + Auth headers
  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'X-CSRFToken': document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || '',
    };
    const token = localStorage.getItem('access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // Fetch Books
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setTableHidden(true);
    try {
      const response = await fetch(`${API_URL}books/`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch books');
      const data = await response.json();
      setBooks(data);
    } catch (error: any) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Error', 
        text: error.message, 
        position: 'center',
        showConfirmButton: false,
        timer: 3000 
      });
    } finally {
      setLoading(false);
      setTableHidden(false);
    }
  }, []);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  // Modal handlers
  const openModal = (book: BookType | null = null) => {
    setEditingBook(book);
    setFormData(book ? { title: book.title, file: null } : { title: '', file: null });
    setShowModal(true);
    setTableHidden(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditingBook(null);
    setTableHidden(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Form handlers
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFormData(prev => ({ ...prev, file: e.target.files![0] }));
  };

  // API request
  const apiRequest = async (method: string, endpoint: string, data?: any, isFile = false) => {
    const options: RequestInit = { method, headers: getAuthHeaders() };
    if (data && !isFile) {
      options.headers = { ...options.headers, 'Content-Type': 'application/json' };
      options.body = JSON.stringify(data);
    } else if (data && isFile) options.body = data;

    const res = await fetch(`${API_URL}${endpoint}`, options);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Request failed');
    }
    if (res.status === 204) return null;
    return await res.json();
  };

  // Submit form (create/update)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title || (!editingBook && !formData.file)) return;
    setActionLoading(true);

    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      if (formData.file) payload.append('book_file', formData.file);

      if (editingBook) {
        await apiRequest('PUT', `books/${editingBook.id}/`, payload, true);
        Swal.fire({ 
          icon: 'success', 
          title: 'Book Updated Successfully!', 
          position: 'center',
          showConfirmButton: false,
          timer: 3000 
        });
      } else {
        await apiRequest('POST', 'books/', payload, true);
        Swal.fire({ 
          icon: 'success', 
          title: 'Book Uploaded Successfully!', 
          position: 'center',
          showConfirmButton: false,
          timer: 3000 
        });
      }

      closeModal();
      fetchBooks();
    } catch (error: any) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Error', 
        text: error.message, 
        position: 'center',
        showConfirmButton: false,
        timer: 3000 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      position: 'center',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (!result.isConfirmed) return;
    
    setActionLoading(true);
    try {
      await apiRequest('DELETE', `books/${id}/`);
      Swal.fire({ 
        icon: 'success', 
        title: 'Book Deleted Successfully!', 
        position: 'center',
        showConfirmButton: false,
        timer: 3000 
      });
      fetchBooks();
    } catch (error: any) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Error', 
        text: error.message, 
        position: 'center',
        showConfirmButton: false,
        timer: 3000 
      });
    } finally { setActionLoading(false); }
  };

  const handleDownload = (book: BookType) => {
    const a = document.createElement('a');
    a.href = book.book_file;
    a.download = book.title;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRead = (book: BookType) => window.open(book.book_file, '_blank');

  const filteredBooks = books.filter(book => book.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const formatDate = (d: string) => new Date(d).toLocaleDateString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Book Library</h1>
          <p className="text-slate-600">Manage your digital book collection</p>
        </header>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
            <input
              type="text"
              placeholder="Search books..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="border px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
            <button 
              onClick={() => openModal()} 
              className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Book
            </button>
          </div>

          {loading || tableHidden ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-800"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="p-4 text-left font-semibold rounded-tl-lg">Title</th>
                    <th className="p-4 text-left font-semibold">Date Added</th>
                    <th className="p-4 text-center font-semibold rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p>No books found</p>
                      </td>
                    </tr>
                  ) : filteredBooks.map((book, index) => (
                    <tr key={book.id} className={`hover:bg-slate-50 transition-colors ${index === filteredBooks.length - 1 ? '' : 'border-b'}`}>
                      <td className="p-4 text-slate-800 font-medium">{book.title}</td>
                      <td className="p-4 text-slate-600">{formatDate(book.date_uploaded)}</td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleDownload(book)} 
                            className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
                            title="Download"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleRead(book)} 
                            className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
                            title="Read"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => openModal(book)} 
                            className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDelete(book.id)} 
                            className="p-2 bg-slate-100 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
                            disabled={actionLoading}
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-center text-slate-700 bg-white p-3 rounded-lg shadow">
          Total Books: <span className="font-bold">{books.length}</span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={modalRef} className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-slate-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {editingBook ? 'Edit Book' : 'Upload New Book'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block font-medium mb-1 text-slate-700">Title:</label>
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleInputChange} 
                  className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500" 
                  required 
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1 text-slate-700">
                  {editingBook ? 'Replace File (optional):' : 'Book File:'}
                </label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500" 
                  accept=".pdf,.epub,.mobi,.txt" 
                  required={!editingBook} 
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="submit" 
                  disabled={actionLoading} 
                  className="flex-1 bg-slate-800 text-white py-2 rounded-lg hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : editingBook ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Update
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Upload
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={closeModal} 
                  disabled={actionLoading} 
                  className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BooksPage;