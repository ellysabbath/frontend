'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_URL = 'https://bahifinal.pythonanywhere.com/api';

axios.defaults.baseURL = API_URL;

// Updated types to match Django models exactly
type Department = { 
  id: number; 
  department_name: string;
  date_created?: string;
  last_modified?: string;
};

type Content = { 
  id: number; 
  year_order: number; 
  short_description: string; 
  cost: number; 
  implementation_status: 'completed' | 'in_progress' | 'incomplete';
  created_at?: string;
  last_modified?: string;
};

type Member = { 
  id: number; 
  full_name: string; 
  mobile_number: string; 
  email: string; 
  baptism_status: 'baptized' | 'not_baptized'; 
  marital_status: 'in_marriage' | 'not_in_marriage' | 'in_relationship'; 
  membership_number: string;
  created_at?: string;
  last_modified?: string;
};

type Report = { 
  id: number; 
  title: string; 
  report_type: 'monthly' | 'quarterly' | 'annual' | 'special'; 
  report_date: string; 
  description: string; 
  file_upload?: string; 
  file?: File | null;
  created_at?: string;
  last_modified?: string;
};

type Asset = { 
  id: number; 
  title: string; 
  dateOfAnalysis: string; 
  AssetName: string; 
  totalNumberOfAssets: number; 
  abledAssetsNumber: number; 
  disabledAssetsNumber: number; 
  isRequired: 'is required' | 'not required'; 
  perCost: number;
  created_at?: string;
  last_modified?: string;
};

type StatusType = '' | 'success' | 'error' | 'verifying';

const DepartmentsPage: React.FC = () => {
  // State management
  const [departments, setDepartments] = useState<Department[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedDepartmentName, setSelectedDepartmentName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'contents' | 'members' | 'reports' | 'assets'>('contents');
  
  // Initialize with proper types
  const [newContent, setNewContent] = useState<Content>({ 
    year_order: 0, 
    short_description: '', 
    cost: 0, 
    implementation_status: 'incomplete', 
    id: 0 
  });
  
  const [newMember, setNewMember] = useState<Member>({ 
    full_name: '', 
    mobile_number: '', 
    email: '', 
    baptism_status: 'not_baptized', 
    marital_status: 'not_in_marriage', 
    membership_number: '', 
    id: 0 
  });
  
  const [newReport, setNewReport] = useState<Report>({ 
    title: '', 
    report_type: 'monthly', 
    report_date: '', 
    description: '', 
    file: null, 
    id: 0 
  });
  
  const [newAssets, setNewAssets] = useState<Asset>({ 
    title: '', 
    dateOfAnalysis: '', 
    AssetName: '', 
    totalNumberOfAssets: 0, 
    abledAssetsNumber: 0, 
    disabledAssetsNumber: 0, 
    isRequired: 'is required', 
    perCost: 0, 
    id: 0 
  });

  const [loading, setLoading] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusType>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // SweetAlert configuration
  const showAlert = (title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    Swal.fire({
      title,
      text,
      icon,
      confirmButtonColor: '#3b82f6',
    });
  };

  // Validation functions
  const validateContent = (content: Content): string[] => {
    const errors: string[] = [];
    if (!content.year_order || content.year_order <= 0) errors.push('Year/Order must be a positive number');
    if (!content.short_description || content.short_description.length < 10) errors.push('Description must be at least 10 characters');
    if (!content.cost || content.cost <= 0) errors.push('Cost must be a positive number');
    return errors;
  };

  const validateMember = (member: Member): string[] => {
    const errors: string[] = [];
    if (!member.full_name || member.full_name.length < 3) errors.push('Full name must be at least 3 characters');
    if (!member.membership_number) errors.push('Membership number is required');
    if (member.email && !/\S+@\S+\.\S+/.test(member.email)) errors.push('Invalid email format');
    return errors;
  };

  const validateReport = (report: Report): string[] => {
    const errors: string[] = [];
    if (!report.title) errors.push('Title is required');
    if (!report.report_date) errors.push('Report date is required');
    return errors;
  };

  const validateAsset = (asset: Asset): string[] => {
    const errors: string[] = [];
    if (!asset.title || asset.title.length < 3) errors.push('Title must be at least 3 characters');
    if (!asset.AssetName) errors.push('Asset name is required');
    if (asset.totalNumberOfAssets <= 0) errors.push('Total number must be positive');
    if (asset.abledAssetsNumber < 0) errors.push('Abled assets cannot be negative');
    if (asset.disabledAssetsNumber < 0) errors.push('Disabled assets cannot be negative');
    if (asset.abledAssetsNumber + asset.disabledAssetsNumber !== asset.totalNumberOfAssets) {
      errors.push('Abled + Disabled assets must equal Total assets');
    }
    if (asset.perCost <= 0) errors.push('Per cost must be positive');
    return errors;
  };

  // Responsive handler
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => setIsSmallScreen(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Click outside modal handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showModal && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowModal(false);
        setEditingItem(null);
        setEditingType(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModal]);

  // API request handler
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-CSRFToken': document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || ''
    };
    const token = localStorage.getItem('access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const apiRequest = async (method: string, endpoint: string, data: any = null, config: any = {}) => {
    try {
      setStatus('verifying');
      const options: any = {
        method,
        url: endpoint,
        headers: getAuthHeaders(),
        ...config
      };
      if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
        options.data = data;
      }
      const response = await axios(options);
      setStatus('success');
      return response.data;
    } catch (error: any) {
      setStatus('error');
      const errorMsg = error.response?.data?.detail || 
                      JSON.stringify(error.response?.data) || 
                      error.message;
      setErrorMessage(errorMsg);
      throw error;
    }
  };

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('GET', '/departments/');
      setDepartments(data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch contents/members/reports/assets
  const fetchContents = useCallback(async (departmentId: number | null, departmentName: string) => {
    setLoading(true);
    try {
      let endpoint = '/department-contents/';
      if (departmentId) endpoint = `/departments/${departmentId}/contents/`;
      else if (departmentName) endpoint = `/departments/by-name/${encodeURIComponent(departmentName)}/contents/`;
      else return;
      const data = await apiRequest('GET', endpoint);
      setContents(data);
    } catch (error) {
      console.error('Failed to fetch contents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMembers = useCallback(async (departmentId: number | null, departmentName: string) => {
    setLoading(true);
    try {
      let endpoint = '/department-members/';
      if (departmentId) endpoint = `/departments/${departmentId}/members/`;
      else if (departmentName) endpoint = `/department-members/?department_name=${encodeURIComponent(departmentName)}`;
      else return;
      const data = await apiRequest('GET', endpoint);
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async (departmentId: number | null, departmentName: string) => {
    setLoading(true);
    try {
      let endpoint = '/department-reports/';
      if (departmentId) endpoint = `/departments/${departmentId}/reports/`;
      else if (departmentName) endpoint = `/department-reports/?department_name=${encodeURIComponent(departmentName)}`;
      else return;
      const data = await apiRequest('GET', endpoint);
      setReports(data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAssets = useCallback(async (departmentId: number | null, departmentName: string) => {
    setLoading(true);
    try {
      let endpoint = '/department-assets/';
      if (departmentId) endpoint = `/departments/${departmentId}/assets/`;
      else if (departmentName) endpoint = `/department-assets/?department_name=${encodeURIComponent(departmentName)}`;
      else return;
      const data = await apiRequest('GET', endpoint);
      setAssets(data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);
  useEffect(() => {
    if (selectedDepartment || selectedDepartmentName) {
      if (activeTab === 'contents') fetchContents(selectedDepartment, selectedDepartmentName);
      else if (activeTab === 'members') fetchMembers(selectedDepartment, selectedDepartmentName);
      else if (activeTab === 'reports') fetchReports(selectedDepartment, selectedDepartmentName);
      else if (activeTab === 'assets') fetchAssets(selectedDepartment, selectedDepartmentName);
    }
  }, [selectedDepartment, selectedDepartmentName, activeTab, fetchContents, fetchMembers, fetchReports, fetchAssets]);

  // Department handlers
  const handleAddDepartment = async () => {
    if (!newDepartment.trim()) {
      showAlert('Error', 'Department name cannot be empty', 'error');
      return;
    }
    
    if (newDepartment.length < 2) {
      showAlert('Error', 'Department name must be at least 2 characters', 'error');
      return;
    }
    
    try {
      const response = await apiRequest('POST', '/departments/', { department_name: newDepartment.trim() });
      setDepartments([...departments, response]);
      setNewDepartment('');
      showAlert('Success', 'Department added successfully');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.detail || 'Failed to add department', 'error');
    }
  };

  const handleDeleteDepartment = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete the department "${name}". This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      await apiRequest('DELETE', `/departments/${id}/`);
      setDepartments(departments.filter(dept => dept.id !== id));
      if (selectedDepartment === id || selectedDepartmentName === name) {
        setSelectedDepartment(null);
        setSelectedDepartmentName('');
        setContents([]);
        setMembers([]);
        setReports([]);
        setAssets([]);
      }
      showAlert('Deleted!', 'Department has been deleted successfully.');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.detail || 'Failed to delete department', 'error');
    }
  };

  // Content handlers
  const handleAddContent = async () => {
    if (!selectedDepartment && !selectedDepartmentName) {
      showAlert('Error', 'Please select a department first', 'error');
      return;
    }
    
    const errors = validateContent(newContent);
    if (errors.length > 0) {
      showAlert('Validation Error', errors.join('\n'), 'error');
      return;
    }
    
    try {
      const departmentPayload = selectedDepartment ? { department: selectedDepartment } : { department_name: selectedDepartmentName };
      const response = await apiRequest('POST', '/department-contents/', { ...newContent, ...departmentPayload });
      setContents([...contents, response]);
      setNewContent({ year_order: 0, short_description: '', cost: 0, implementation_status: 'incomplete', id: 0 });
      showAlert('Success', 'Content added successfully');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.detail || 'Failed to add content', 'error');
    }
  };

  const handleDeleteContent = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You are about to delete this content. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      await apiRequest('DELETE', `/department-contents/${id}/`);
      setContents(contents.filter(content => content.id !== id));
      showAlert('Deleted!', 'Content has been deleted successfully.');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.detail || 'Failed to delete content', 'error');
    }
  };

  // Member handlers
  const handleAddMember = async () => {
    if (!selectedDepartment && !selectedDepartmentName) {
      showAlert('Error', 'Please select a department first', 'error');
      return;
    }
    
    const errors = validateMember(newMember);
    if (errors.length > 0) {
      showAlert('Validation Error', errors.join('\n'), 'error');
      return;
    }
    
    try {
      const departmentPayload = selectedDepartment ? { department: selectedDepartment } : { department_name: selectedDepartmentName };
      const response = await apiRequest('POST', '/department-members/', { ...newMember, ...departmentPayload });
      setMembers([...members, response]);
      setNewMember({ full_name: '', mobile_number: '', email: '', baptism_status: 'not_baptized', marital_status: 'not_in_marriage', membership_number: '', id: 0 });
      showAlert('Success', 'Member added successfully');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.detail || 'Failed to add member', 'error');
    }
  };

  const handleDeleteMember = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You are about to delete this member. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      await apiRequest('DELETE', `/department-members/${id}/`);
      setMembers(members.filter(member => member.id !== id));
      showAlert('Deleted!', 'Member has been deleted successfully.');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.detail || 'Failed to delete member', 'error');
    }
  };

  // Assets handlers
  const handleAddAssets = async () => {
    if (!selectedDepartment && !selectedDepartmentName) {
      showAlert('Error', 'Please select a department first', 'error');
      return;
    }
    
    const errors = validateAsset(newAssets);
    if (errors.length > 0) {
      showAlert('Validation Error', errors.join('\n'), 'error');
      return;
    }
    
    try {
      const departmentPayload = selectedDepartment ? { department: selectedDepartment } : { department_name: selectedDepartmentName };
      const response = await apiRequest('POST', '/department-assets/', { ...newAssets, ...departmentPayload });
      setAssets([...assets, response]);
      setNewAssets({ title: '', dateOfAnalysis: '', AssetName: '', totalNumberOfAssets: 0, abledAssetsNumber: 0, disabledAssetsNumber: 0, isRequired: 'is required', perCost: 0, id: 0 });
      showAlert('Success', 'Asset added successfully');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.detail || 'Failed to add asset', 'error');
    }
  };

  const handleDeleteAssets = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You are about to delete this asset. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      await apiRequest('DELETE', `/department-assets/${id}/`);
      setAssets(assets.filter(asset => asset.id !== id));
      showAlert('Deleted!', 'Asset has been deleted successfully.');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.detail || 'Failed to delete asset', 'error');
    }
  };

  // Report handlers
  const handleAddReport = async () => {
    if (!selectedDepartment && !selectedDepartmentName) {
      showAlert('Error', 'Please select a department first', 'error');
      return;
    }
    
    const errors = validateReport(newReport);
    if (errors.length > 0) {
      showAlert('Validation Error', errors.join('\n'), 'error');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('title', newReport.title);
      formData.append('report_type', newReport.report_type);
      formData.append('report_date', newReport.report_date);
      formData.append('description', newReport.description);
      if (newReport.file) formData.append('file_upload', newReport.file);
      if (selectedDepartment) formData.append('department', String(selectedDepartment));
      else formData.append('department_name', selectedDepartmentName);
      
      const response = await apiRequest('POST', '/department-reports/', formData, { 
        headers: { 
          'Content-Type': 'multipart/form-data',
          'X-CSRFToken': document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || ''
        } 
      });
      setReports([...reports, response]);
      setNewReport({ title: '', report_type: 'monthly', report_date: '', description: '', file: null, id: 0 });
      showAlert('Success', 'Report added successfully');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.detail || 'Failed to add report', 'error');
    }
  };

  const handleDeleteReport = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You are about to delete this report. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      await apiRequest('DELETE', `/department-reports/${id}/`);
      setReports(reports.filter(report => report.id !== id));
      showAlert('Deleted!', 'Report has been deleted successfully.');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.detail || 'Failed to delete report', 'error');
    }
  };

  // Update handler for all types
  const handleUpdateItem = async (item: any) => {
    try {
      let endpoint = '', method = 'PUT', payload: any = item, config: any = {};
      
      // Validate before updating
      if (editingType === 'content') {
        const errors = validateContent(item);
        if (errors.length > 0) {
          showAlert('Validation Error', errors.join('\n'), 'error');
          return;
        }
        endpoint = `/department-contents/${item.id}/`;
      } else if (editingType === 'member') {
        const errors = validateMember(item);
        if (errors.length > 0) {
          showAlert('Validation Error', errors.join('\n'), 'error');
          return;
        }
        endpoint = `/department-members/${item.id}/`;
      } else if (editingType === 'report') {
        const errors = validateReport(item);
        if (errors.length > 0) {
          showAlert('Validation Error', errors.join('\n'), 'error');
          return;
        }
        endpoint = `/department-reports/${item.id}/`;
        const formData = new FormData();
        formData.append('title', item.title);
        formData.append('report_type', item.report_type);
        formData.append('report_date', item.report_date);
        formData.append('description', item.description);
        if (item.file) formData.append('file_upload', item.file);
        payload = formData;
        config = { 
          headers: { 
            'Content-Type': 'multipart/form-data',
            'X-CSRFToken': document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || ''
          } 
        };
      } else if (editingType === 'assets') {
        const errors = validateAsset(item);
        if (errors.length > 0) {
          showAlert('Validation Error', errors.join('\n'), 'error');
          return;
        }
        endpoint = `/department-assets/${item.id}/`;
      }

      await apiRequest(method, endpoint, payload, config);

      if (editingType === 'content') setContents(contents.map(c => c.id === item.id ? item : c));
      else if (editingType === 'member') setMembers(members.map(m => m.id === item.id ? item : m));
      else if (editingType === 'report') setReports(reports.map(r => r.id === item.id ? item : r));
      else if (editingType === 'assets') setAssets(assets.map(a => a.id === item.id ? item : a));

      setShowModal(false);
      setEditingItem(null);
      setEditingType(null);
      showAlert(
  'Success', 
  `${editingType ? editingType.charAt(0).toUpperCase() + editingType.slice(1) : 'Item'} updated successfully`
);

    } catch (error: any) {
      showAlert('Error', error.response?.data?.detail || `Failed to update ${editingType}`, 'error');
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.department_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Styles
  const styles = {
    container: {
      width: isSmallScreen ? '95%' : '90%',
      maxWidth: '1400px',
      margin: '1rem auto',
      padding: isSmallScreen ? '1rem' : '2rem',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    heading: {
      textAlign: 'center' as const,
      marginBottom: '2rem',
      color: '#1f2937',
      fontSize: isSmallScreen ? '1.5rem' : '2rem',
      fontWeight: 700,
    },
    statusIndicator: {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      color: 'white',
      fontSize: '0.9rem',
      zIndex: 1001,
      backgroundColor: 
        status === 'success' ? '#10b981' :
        status === 'error' ? '#ef4444' :
        status === 'verifying' ? '#f59e0b' : 'transparent',
      display: status ? 'block' : 'none',
    },
    button: {
      padding: '0.75rem 1rem',
      margin: '0 0.25rem',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 500,
      transition: 'all 0.2s ease',
    } as React.CSSProperties,
    primaryButton: { backgroundColor: '#3b82f6', color: 'white' },
    dangerButton: { backgroundColor: '#ef4444', color: 'white' },
    successButton: { backgroundColor: '#10b981', color: 'white' },
    secondaryButton: { backgroundColor: '#6b7280', color: 'white' },
    scrollContainer: {
      overflowX: 'auto' as const,
      overflowY: 'auto' as const,
      maxHeight: '60vh',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: 'white',
    },
    listContainer: {
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      backgroundColor: 'white',
    },
    listHeader: {
      backgroundColor: '#f9fafb',
      padding: '1rem',
      fontWeight: 600,
      borderBottom: '1px solid #e5e7eb',
      color: '#374151',
    },
    listItem: {
      padding: '1rem',
      borderBottom: '1px solid #f3f4f6',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'background-color 0.2s ease',
    },
    selectedItem: {
      backgroundColor: '#eff6ff',
      borderLeft: '4px solid #3b82f6',
    },
    formContainer: {
      backgroundColor: '#f9fafb',
      padding: '1.5rem',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      border: '1px solid #e5e7eb',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: isSmallScreen ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: 500,
      color: '#374151',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      fontSize: '0.9rem',
      transition: 'border-color 0.2s ease',
    },
    textArea: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      minHeight: '100px',
      resize: 'vertical' as const,
      fontSize: '0.9rem',
    },
    modal: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '12px',
      width: isSmallScreen ? '90%' : '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      overflowY: 'auto' as const,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    statusBadge: (status: string) => ({
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'capitalize' as const,
      backgroundColor:
        status === 'completed' || status === 'baptized' || status === 'is required' ? '#dcfce7' :
        status === 'in_progress' || status === 'in_marriage' || status === 'in_relationship' ? '#fef3c7' :
        '#fee2e2',
      color:
        status === 'completed' || status === 'baptized' || status === 'is required' ? '#166534' :
        status === 'in_progress' || status === 'in_marriage' || status === 'in_relationship' ? '#92400e' :
        '#991b1b',
    }),
    tabContainer: {
      display: 'flex',
      marginBottom: '1.5rem',
      borderBottom: '1px solid #e5e7eb',
      overflowX: 'auto' as const,
    },
    tab: {
      padding: '0.75rem 1.5rem',
      cursor: 'pointer',
      borderBottom: '2px solid transparent',
      marginRight: '0.5rem',
      whiteSpace: 'nowrap' as const,
      fontSize: '0.9rem',
      fontWeight: 500,
      color: '#6b7280',
      transition: 'all 0.2s ease',
    },
    activeTab: {
      borderBottom: '2px solid #3b82f6',
      color: '#3b82f6',
    },
    fileLink: {
      color: '#3b82f6',
      textDecoration: 'underline',
      fontSize: '0.9rem',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      backgroundColor: 'white',
    },
    tableHeader: {
      backgroundColor: '#f9fafb',
      padding: '0.75rem',
      textAlign: 'left' as const,
      borderBottom: '1px solid #e5e7eb',
      fontWeight: 600,
      color: '#374151',
      fontSize: '0.9rem',
    },
    tableCell: {
      padding: '0.75rem',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '0.9rem',
      color: '#374151',
    },
  };

  return (
    <div style={styles.container}>
      {/* Status Indicator */}
      <div style={styles.statusIndicator}>
        {status === 'success' && '✓ Success'}
        {status === 'error' && '✗ Error'}
        {status === 'verifying' && '⟳ Processing...'}
      </div>

      <h1 style={styles.heading}>Department Management System</h1>

      {/* Search and Add Department */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: isSmallScreen ? 'column' : 'row', gap: '1rem', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search departments..."
            style={{ ...styles.input, flex: 1 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: isSmallScreen ? 'column' : 'row', gap: '1rem', alignItems: 'end' }}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Add New Department</label>
            <input
              type="text"
              placeholder="Enter department name (min 2 characters)"
              style={styles.input}
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddDepartment()}
            />
          </div>
          <button
            onClick={handleAddDepartment}
            style={{ ...styles.button, ...styles.primaryButton }}
            disabled={!newDepartment.trim() || newDepartment.length < 2}
          >
            Add Department
          </button>
        </div>
        
        {/* Departments List */}
        <div style={styles.listContainer}>
          <h2 style={styles.listHeader}>
            Departments ({filteredDepartments.length})
          </h2>
          {loading && departments.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              Loading departments...
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              No departments found
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {filteredDepartments.map(dept => (
                <li
                  key={dept.id}
                  style={{
                    ...styles.listItem,
                    ...((selectedDepartment === dept.id || selectedDepartmentName === dept.department_name) 
                      ? styles.selectedItem : {})
                  }}
                >
                  <span
                    onClick={() => {
                      setSelectedDepartment(dept.id);
                      setSelectedDepartmentName('');
                    }}
                    style={{ 
                      cursor: 'pointer', 
                      flex: 1, 
                      marginRight: '1rem',
                      fontWeight: (selectedDepartment === dept.id || selectedDepartmentName === dept.department_name) ? 600 : 400,
                      color: '#374151',
                    }}
                  >
                    {dept.department_name}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        setSelectedDepartment(null);
                        setSelectedDepartmentName(dept.department_name);
                      }}
                      style={{ ...styles.button, ...styles.secondaryButton }}
                    >
                      Select by Name
                    </button>
                    <button
                      onClick={() => handleDeleteDepartment(dept.id, dept.department_name)}
                      style={{ ...styles.button, ...styles.dangerButton }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Department Contents/Members/Reports/Assets */}
      {(selectedDepartment || selectedDepartmentName) && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ ...styles.heading, fontSize: '1.5rem', textAlign: 'left', marginBottom: '1rem' }}>
            {activeTab === 'contents' ? 'Contents' : 
             activeTab === 'members' ? 'Members' : 
             activeTab === 'reports' ? 'Reports' : 'Assets'} for{' '}
            <span style={{ color: '#3b82f6' }}>
              {selectedDepartment
                ? departments.find(d => d.id === selectedDepartment)?.department_name
                : selectedDepartmentName}
            </span>
          </h2>
          
          {/* Tabs */}
          <div style={styles.tabContainer}>
            {['contents', 'members', 'reports', 'assets'].map(tab => (
              <div
                key={tab}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab ? styles.activeTab : {})
                }}
                onClick={() => setActiveTab(tab as any)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </div>
            ))}
          </div>

          {/* Contents Tab */}
          {activeTab === 'contents' && (
            <div>
              <div style={styles.formContainer}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Add New Content</h3>
                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Year/Order *</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={newContent.year_order || ''}
                      onChange={(e) => setNewContent({...newContent, year_order: parseInt(e.target.value) || 0})}
                      placeholder="Enter year or order number"
                      min="1"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Cost *</label>
                    <input
                      type="number"
                      step="0.01"
                      style={styles.input}
                      value={newContent.cost || ''}
                      onChange={(e) => setNewContent({...newContent, cost: parseFloat(e.target.value) || 0})}
                      placeholder="Enter estimated cost"
                      min="0"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Implementation Status</label>
                    <select
                      style={styles.input}
                      value={newContent.implementation_status}
                      onChange={(e) => setNewContent({...newContent, implementation_status: e.target.value as any})}
                    >
                      <option value="incomplete">Incomplete</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: isSmallScreen ? '1' : '1 / -1' }}>
                    <label style={styles.label}>Short Description * (min 10 characters)</label>
                    <textarea
                      style={styles.textArea}
                      value={newContent.short_description}
                      onChange={(e) => setNewContent({...newContent, short_description: e.target.value})}
                      placeholder="Enter detailed description (minimum 10 characters)"
                    />
                    <small style={{ color: '#6b7280' }}>
                      {newContent.short_description.length}/10 characters minimum
                    </small>
                  </div>
                </div>
                <button 
                  onClick={handleAddContent} 
                  style={{...styles.button, ...styles.primaryButton}}
                  disabled={!newContent.year_order || !newContent.short_description || newContent.short_description.length < 10 || !newContent.cost}
                >
                  Add Content
                </button>
              </div>

              <div style={styles.scrollContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Year/Order</th>
                      <th style={styles.tableHeader}>Description</th>
                      <th style={styles.tableHeader}>Cost</th>
                      <th style={styles.tableHeader}>Status</th>
                      <th style={styles.tableHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contents.map(content => (
                      <tr key={content.id}>
                        <td style={styles.tableCell}>{content.year_order}</td>
                        <td style={styles.tableCell}>
                          <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {content.short_description}
                          </div>
                        </td>
                        <td style={styles.tableCell}>${content.cost.toLocaleString()}</td>
                        <td style={styles.tableCell}>
                          <span style={styles.statusBadge(content.implementation_status)}>
                            {content.implementation_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <button
                            onClick={() => {
                              setEditingItem(content);
                              setEditingType('content');
                              setShowModal(true);
                            }}
                            style={{...styles.button, ...styles.secondaryButton, marginRight: '0.5rem'}}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteContent(content.id)}
                            style={{...styles.button, ...styles.dangerButton}}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {contents.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    No contents found. Add your first content above.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div>
              <div style={styles.formContainer}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Add New Member</h3>
                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Full Name * (min 3 characters)</label>
                    <input
                      type="text"
                      style={styles.input}
                      value={newMember.full_name}
                      onChange={(e) => setNewMember({...newMember, full_name: e.target.value})}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Mobile Number</label>
                    <input
                      type="tel"
                      style={styles.input}
                      value={newMember.mobile_number}
                      onChange={(e) => setNewMember({...newMember, mobile_number: e.target.value})}
                      placeholder="Enter mobile number"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Email</label>
                    <input
                      type="email"
                      style={styles.input}
                      value={newMember.email}
                      onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Membership Number *</label>
                    <input
                      type="text"
                      style={styles.input}
                      value={newMember.membership_number}
                      onChange={(e) => setNewMember({...newMember, membership_number: e.target.value})}
                      placeholder="Enter membership number"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Baptism Status</label>
                    <select
                      style={styles.input}
                      value={newMember.baptism_status}
                      onChange={(e) => setNewMember({...newMember, baptism_status: e.target.value as any})}
                    >
                      <option value="not_baptized">Not Baptized</option>
                      <option value="baptized">Baptized</option>
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Marital Status</label>
                    <select
                      style={styles.input}
                      value={newMember.marital_status}
                      onChange={(e) => setNewMember({...newMember, marital_status: e.target.value as any})}
                    >
                      <option value="not_in_marriage">Not in Marriage</option>
                      <option value="in_marriage">In Marriage</option>
                      <option value="in_relationship">In Relationship</option>
                    </select>
                  </div>
                </div>
                <button 
                  onClick={handleAddMember} 
                  style={{...styles.button, ...styles.primaryButton}}
                  disabled={!newMember.full_name || newMember.full_name.length < 3 || !newMember.membership_number}
                >
                  Add Member
                </button>
              </div>

              <div style={styles.scrollContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Name</th>
                      <th style={styles.tableHeader}>Mobile</th>
                      <th style={styles.tableHeader}>Email</th>
                      <th style={styles.tableHeader}>Membership #</th>
                      <th style={styles.tableHeader}>Baptism</th>
                      <th style={styles.tableHeader}>Marital</th>
                      <th style={styles.tableHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(member => (
                      <tr key={member.id}>
                        <td style={styles.tableCell}>{member.full_name}</td>
                        <td style={styles.tableCell}>{member.mobile_number || 'N/A'}</td>
                        <td style={styles.tableCell}>{member.email || 'N/A'}</td>
                        <td style={styles.tableCell}>{member.membership_number}</td>
                        <td style={styles.tableCell}>
                          <span style={styles.statusBadge(member.baptism_status)}>
                            {member.baptism_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <span style={styles.statusBadge(member.marital_status)}>
                            {member.marital_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <button
                            onClick={() => {
                              setEditingItem(member);
                              setEditingType('member');
                              setShowModal(true);
                            }}
                            style={{...styles.button, ...styles.secondaryButton, marginRight: '0.5rem'}}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            style={{...styles.button, ...styles.dangerButton}}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {members.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    No members found. Add your first member above.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              <div style={styles.formContainer}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Add New Report</h3>
                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Title *</label>
                    <input
                      type="text"
                      style={styles.input}
                      value={newReport.title}
                      onChange={(e) => setNewReport({...newReport, title: e.target.value})}
                      placeholder="Enter report title"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Report Type</label>
                    <select
                      style={styles.input}
                      value={newReport.report_type}
                      onChange={(e) => setNewReport({...newReport, report_type: e.target.value as any})}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annual">Annual</option>
                      <option value="special">Special</option>
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Report Date *</label>
                    <input
                      type="date"
                      style={styles.input}
                      value={newReport.report_date}
                      onChange={(e) => setNewReport({...newReport, report_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>File Upload</label>
                    <input
                      type="file"
                      style={styles.input}
                      onChange={(e) => setNewReport({...newReport, file: e.target.files?.[0] || null})}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                    />
                  </div>
                  <div style={{gridColumn: '1 / -1'}}>
                    <label style={styles.label}>Description</label>
                    <textarea
                      style={styles.textArea}
                      value={newReport.description}
                      onChange={(e) => setNewReport({...newReport, description: e.target.value})}
                      placeholder="Enter report description"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleAddReport} 
                  style={{...styles.button, ...styles.primaryButton}}
                  disabled={!newReport.title || !newReport.report_date}
                >
                  Add Report
                </button>
              </div>

              <div style={styles.scrollContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Title</th>
                      <th style={styles.tableHeader}>Type</th>
                      <th style={styles.tableHeader}>Date</th>
                      <th style={styles.tableHeader}>Description</th>
                      <th style={styles.tableHeader}>File</th>
                      <th style={styles.tableHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(report => (
                      <tr key={report.id}>
                        <td style={styles.tableCell}>{report.title}</td>
                        <td style={styles.tableCell}>
                          <span style={styles.statusBadge(report.report_type)}>
                            {report.report_type}
                          </span>
                        </td>
                        <td style={styles.tableCell}>{new Date(report.report_date).toLocaleDateString()}</td>
                        <td style={styles.tableCell}>
                          <div style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {report.description || 'No description'}
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          {report.file_upload ? (
                            <a 
                              href={`${report.file_upload}` }
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={styles.fileLink}
                            >
                              View File
                            </a>
                          ) : (
                            'No file'
                          )}
                        </td>
                        <td style={styles.tableCell}>
                          <button
                            onClick={() => {
                              setEditingItem(report);
                              setEditingType('report');
                              setShowModal(true);
                            }}
                            style={{...styles.button, ...styles.secondaryButton, marginRight: '0.5rem'}}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            style={{...styles.button, ...styles.dangerButton}}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reports.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    No reports found. Add your first report above.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assets Tab */}
          {activeTab === 'assets' && (
            <div>
              <div style={styles.formContainer}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Add New Asset</h3>
                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Title * (min 3 characters)</label>
                    <input
                      type="text"
                      style={styles.input}
                      value={newAssets.title}
                      onChange={(e) => setNewAssets({...newAssets, title: e.target.value})}
                      placeholder="Enter asset title"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Date of Analysis</label>
                    <input
                      type="date"
                      style={styles.input}
                      value={newAssets.dateOfAnalysis}
                      onChange={(e) => setNewAssets({...newAssets, dateOfAnalysis: e.target.value})}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Asset Name *</label>
                    <input
                      type="text"
                      style={styles.input}
                      value={newAssets.AssetName}
                      onChange={(e) => setNewAssets({...newAssets, AssetName: e.target.value})}
                      placeholder="Enter asset name"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Total Number of Assets *</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={newAssets.totalNumberOfAssets || ''}
                      onChange={(e) => {
                        const total = parseInt(e.target.value) || 0;
                        setNewAssets({...newAssets, totalNumberOfAssets: total});
                      }}
                      placeholder="Enter total number"
                      min="0"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Abled Assets *</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={newAssets.abledAssetsNumber || ''}
                      onChange={(e) => {
                        const abled = parseInt(e.target.value) || 0;
                        setNewAssets({
                          ...newAssets, 
                          abledAssetsNumber: abled,
                          disabledAssetsNumber: Math.max(0, newAssets.totalNumberOfAssets - abled)
                        });
                      }}
                      placeholder="Enter abled assets"
                      min="0"
                      max={newAssets.totalNumberOfAssets}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Disabled Assets *</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={newAssets.disabledAssetsNumber || ''}
                      onChange={(e) => {
                        const disabled = parseInt(e.target.value) || 0;
                        setNewAssets({
                          ...newAssets, 
                          disabledAssetsNumber: disabled,
                          abledAssetsNumber: Math.max(0, newAssets.totalNumberOfAssets - disabled)
                        });
                      }}
                      placeholder="Enter disabled assets"
                      min="0"
                      max={newAssets.totalNumberOfAssets}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Is Required</label>
                    <select
                      style={styles.input}
                      value={newAssets.isRequired}
                      onChange={(e) => setNewAssets({...newAssets, isRequired: e.target.value as any})}
                    >
                      <option value="is required">Required</option>
                      <option value="not required">Not Required</option>
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Cost Per Asset *</label>
                    <input
                      type="number"
                      step="0.01"
                      style={styles.input}
                      value={newAssets.perCost || ''}
                      onChange={(e) => setNewAssets({...newAssets, perCost: parseFloat(e.target.value) || 0})}
                      placeholder="Enter cost per asset"
                      min="0"
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                  <small style={{ color: '#374151' }}>
                    <strong>Validation:</strong> Abled ({newAssets.abledAssetsNumber}) + Disabled ({newAssets.disabledAssetsNumber}) = Total ({newAssets.totalNumberOfAssets})
                    {newAssets.abledAssetsNumber + newAssets.disabledAssetsNumber !== newAssets.totalNumberOfAssets && 
                      <span style={{ color: '#ef4444' }}> ⚠️ Numbers don't match!</span>
                    }
                  </small>
                </div>
                <button 
                  onClick={handleAddAssets} 
                  style={{...styles.button, ...styles.primaryButton}}
                  disabled={
                    !newAssets.title || 
                    newAssets.title.length < 3 || 
                    !newAssets.AssetName || 
                    newAssets.totalNumberOfAssets <= 0 || 
                    newAssets.perCost <= 0 ||
                    newAssets.abledAssetsNumber + newAssets.disabledAssetsNumber !== newAssets.totalNumberOfAssets
                  }
                >
                  Add Asset
                </button>
              </div>

              <div style={styles.scrollContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Title</th>
                      <th style={styles.tableHeader}>Analysis Date</th>
                      <th style={styles.tableHeader}>Asset Name</th>
                      <th style={styles.tableHeader}>Total</th>
                      <th style={styles.tableHeader}>Abled</th>
                      <th style={styles.tableHeader}>Disabled</th>
                      <th style={styles.tableHeader}>Required</th>
                      <th style={styles.tableHeader}>Per Cost</th>
                      <th style={styles.tableHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map(asset => (
                      <tr key={asset.id}>
                        <td style={styles.tableCell}>{asset.title}</td>
                        <td style={styles.tableCell}>
                          {asset.dateOfAnalysis ? new Date(asset.dateOfAnalysis).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={styles.tableCell}>{asset.AssetName}</td>
                        <td style={styles.tableCell}>{asset.totalNumberOfAssets}</td>
                        <td style={styles.tableCell}>{asset.abledAssetsNumber}</td>
                        <td style={styles.tableCell}>{asset.disabledAssetsNumber}</td>
                        <td style={styles.tableCell}>
                          <span style={styles.statusBadge(asset.isRequired)}>
                            {asset.isRequired}
                          </span>
                        </td>
                        <td style={styles.tableCell}>${asset.perCost.toLocaleString()}</td>
                        <td style={styles.tableCell}>
                          <button
                            onClick={() => {
                              setEditingItem(asset);
                              setEditingType('assets');
                              setShowModal(true);
                            }}
                            style={{...styles.button, ...styles.secondaryButton, marginRight: '0.5rem'}}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAssets(asset.id)}
                            style={{...styles.button, ...styles.dangerButton}}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {assets.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    No assets found. Add your first asset above.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showModal && editingItem && (
        <div style={styles.modal}>
          <div style={styles.modalContent} ref={modalRef}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#374151' }}>
              Edit {editingType === 'content' ? 'Content' : 
                    editingType === 'member' ? 'Member' : 
                    editingType === 'report' ? 'Report' : 'Asset'}
            </h3>
            
            {editingType === 'content' && (
              <div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Year/Order *</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={editingItem.year_order || ''}
                    onChange={(e) => setEditingItem({...editingItem, year_order: parseInt(e.target.value) || 0})}
                    min="1"
                  />
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Short Description * (min 10 characters)</label>
                  <textarea
                    style={styles.textArea}
                    value={editingItem.short_description}
                    onChange={(e) => setEditingItem({...editingItem, short_description: e.target.value})}
                  />
                  <small style={{ color: '#6b7280' }}>
                    {editingItem.short_description?.length || 0}/10 characters minimum
                  </small>
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Cost *</label>
                  <input
                    type="number"
                    step="0.01"
                    style={styles.input}
                    value={editingItem.cost || ''}
                    onChange={(e) => setEditingItem({...editingItem, cost: parseFloat(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Status</label>
                  <select
                    style={styles.input}
                    value={editingItem.implementation_status}
                    onChange={(e) => setEditingItem({...editingItem, implementation_status: e.target.value})}
                  >
                    <option value="incomplete">Incomplete</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            )}
            
            {editingType === 'member' && (
              <div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Full Name * (min 3 characters)</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={editingItem.full_name}
                    onChange={(e) => setEditingItem({...editingItem, full_name: e.target.value})}
                  />
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Mobile Number</label>
                  <input
                    type="tel"
                    style={styles.input}
                    value={editingItem.mobile_number}
                    onChange={(e) => setEditingItem({...editingItem, mobile_number: e.target.value})}
                  />
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    style={styles.input}
                    value={editingItem.email}
                    onChange={(e) => setEditingItem({...editingItem, email: e.target.value})}
                  />
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Membership Number *</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={editingItem.membership_number}
                    onChange={(e) => setEditingItem({...editingItem, membership_number: e.target.value})}
                  />
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Baptism Status</label>
                  <select
                    style={styles.input}
                    value={editingItem.baptism_status}
                    onChange={(e) => setEditingItem({...editingItem, baptism_status: e.target.value})}
                  >
                    <option value="not_baptized">Not Baptized</option>
                    <option value="baptized">Baptized</option>
                  </select>
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Marital Status</label>
                  <select
                    style={styles.input}
                    value={editingItem.marital_status}
                    onChange={(e) => setEditingItem({...editingItem, marital_status: e.target.value})}
                  >
                    <option value="not_in_marriage">Not in Marriage</option>
                    <option value="in_marriage">In Marriage</option>
                    <option value="in_relationship">In Relationship</option>
                  </select>
                </div>
              </div>
            )}
            
            {editingType === 'report' && (
              <div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Title *</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                  />
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Report Type</label>
                  <select
                    style={styles.input}
                    value={editingItem.report_type}
                    onChange={(e) => setEditingItem({...editingItem, report_type: e.target.value})}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                    <option value="special">Special</option>
                  </select>
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Report Date *</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={editingItem.report_date}
                    onChange={(e) => setEditingItem({...editingItem, report_date: e.target.value})}
                  />
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>File Upload</label>
                  <input
                    type="file"
                    style={styles.input}
                    onChange={(e) => setEditingItem({...editingItem, file: e.target.files?.[0] || null})}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                  />
                  {editingItem.file_upload && (
                    <small style={{ color: '#6b7280' }}>
                      Current file: <a href={`${API_URL}${editingItem.file_upload}`} target="_blank" rel="noopener noreferrer">View</a>
                    </small>
                  )}
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    style={styles.textArea}
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            {editingType === 'assets' && (
              <div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Title * (min 3 characters)</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                  />
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Date of Analysis</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={editingItem.dateOfAnalysis}
                    onChange={(e) => setEditingItem({...editingItem, dateOfAnalysis: e.target.value})}
                  />
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Asset Name *</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={editingItem.AssetName}
                    onChange={(e) => setEditingItem({...editingItem, AssetName: e.target.value})}
                  />
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Total Number of Assets *</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={editingItem.totalNumberOfAssets || ''}
                    onChange={(e) => {
                      const total = parseInt(e.target.value) || 0;
                      setEditingItem({...editingItem, totalNumberOfAssets: total});
                    }}
                    min="0"
                  />
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Abled Assets *</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={editingItem.abledAssetsNumber || ''}
                    onChange={(e) => {
                      const abled = parseInt(e.target.value) || 0;
                      setEditingItem({
                        ...editingItem, 
                        abledAssetsNumber: abled,
                        disabledAssetsNumber: Math.max(0, editingItem.totalNumberOfAssets - abled)
                      });
                    }}
                    min="0"
                    max={editingItem.totalNumberOfAssets}
                  />
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Disabled Assets *</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={editingItem.disabledAssetsNumber || ''}
                    onChange={(e) => {
                      const disabled = parseInt(e.target.value) || 0;
                      setEditingItem({
                        ...editingItem, 
                        disabledAssetsNumber: disabled,
                        abledAssetsNumber: Math.max(0, editingItem.totalNumberOfAssets - disabled)
                      });
                    }}
                    min="0"
                    max={editingItem.totalNumberOfAssets}
                  />
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Is Required</label>
                  <select
                    style={styles.input}
                    value={editingItem.isRequired}
                    onChange={(e) => setEditingItem({...editingItem, isRequired: e.target.value})}
                  >
                    <option value="is required">Required</option>
                    <option value="not required">Not Required</option>
                  </select>
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <label style={styles.label}>Cost Per Asset *</label>
                  <input
                    type="number"
                    step="0.01"
                    style={styles.input}
                    value={editingItem.perCost || ''}
                    onChange={(e) => setEditingItem({...editingItem, perCost: parseFloat(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                  <small style={{ color: '#374151' }}>
                    <strong>Validation:</strong> Abled ({editingItem.abledAssetsNumber}) + Disabled ({editingItem.disabledAssetsNumber}) = Total ({editingItem.totalNumberOfAssets})
                    {editingItem.abledAssetsNumber + editingItem.disabledAssetsNumber !== editingItem.totalNumberOfAssets && 
                      <span style={{ color: '#ef4444' }}> ⚠️ Numbers don't match!</span>
                    }
                  </small>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => handleUpdateItem(editingItem)}
                style={{ ...styles.button, ...styles.successButton, flex: 1 }}
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                  setEditingType(null);
                }}
                style={{ ...styles.button, ...styles.secondaryButton, flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;