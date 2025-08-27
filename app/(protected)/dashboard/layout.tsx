'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/providers/authContext';
import { AuthService } from '@/lib/services';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user } = useAuth();

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  const onLogout = async () => {
    try {
      await AuthService.logout();
      window.location.reload();
    } catch (error) {
      console.error('Logout error: ', error);
    }
  };

  // Navigation links for admin/editor roles
  const adminEditorLinks = [
    { name: 'Home', href: '/dashboard', icon: '📊' },
    { name: 'Departments', href: '/dashboard/departments', icon: '📈' },
    { name: 'Messages & SMS', href: '/dashboard/messages', icon: '✉️' },
    { name: 'Announcements', href: '/dashboard/announcements', icon: '📣' },
    { name: 'Timetable & Calendar', href: '/dashboard/timetable', icon: '📅' },
    { name: 'Users', href: '/dashboard/users', icon: '👥' },
    { name: 'Gallery', href: '/dashboard/galary', icon: '🖼️' },
    { name: 'Writings', href: '/dashboard/writings', icon: '📚' },
    { name: 'About us', href: '/dashboard/about-us', icon: 'ℹ️' },
    { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
    { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
    { name: 'GoLive', href: '/dashboard/golive', icon: '🎥' },
    { name: 'Admin', href: '/dashboard/admin', icon: '🛠️' },
  ];

  // Navigation links for regular users
  const userLinks = [
    { name: 'Home', href: '/dashboard', icon: '📊' },
    { name: 'DepartmentsUser', href: '/dashboard/departments-user', icon: '📈' },
    { name: 'AnnouncementsUser', href: '/dashboard/announcements-user', icon: '📣' },
    { name: 'TimetableUser & Calendar', href: '/dashboard/timetable-user', icon: '📅' },
    { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
    { name: 'About us', href: '/dashboard/about-us', icon: 'ℹ️' },
    
  ];

  // Select links based on user role
  const navLinks =
    user?.role === 'admin' || user?.role === 'editor'
      ? adminEditorLinks
      : user?.role === 'user'
      ? userLinks
      : [];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0 lg:z-auto flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h4 className="text-xl font-semibold text-gray-800">BAHI SDA MANAGEMENT SYSTEM</h4>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-2 px-4 py-4">
            {navLinks.map((link) => {
              // Special case for GoLive button
              if (link.name === 'GoLive') {
                return (
                  <li key={link.name}>
                    <button
                      onClick={() => window.open('https://videoconf.pythonanywhere.com', '_blank')}
                      className="flex items-center p-3 rounded-lg transition-colors duration-200 text-gray-700 hover:bg-blue-50 hover:text-blue-600 w-full"
                    >
                      <span className="mr-3 text-lg">{link.icon}</span>
                      <span className="font-medium">{link.name}</span>
                    </button>
                  </li>
                );
              }

              // Special case for Admin button
              if (link.name === 'Admin') {
                return (
                  <li key={link.name}>
                    <button
                      onClick={() => window.open('https://bahifinal.pythonanywhere.com/admin/', '_blank')}
                      className="flex items-center p-3 rounded-lg transition-colors duration-200 text-gray-700 hover:bg-blue-50 hover:text-blue-600 w-full"
                    >
                      <span className="mr-3 text-lg">{link.icon}</span>
                      <span className="font-medium">{link.name}</span>
                    </button>
                  </li>
                );
              }

              // Default navigation Link
              return (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                      pathname === link.href
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="mr-3 text-lg">{link.icon}</span>
                    <span className="font-medium">{link.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info */}
        <div className="flex-shrink-0 p-4 border-t">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <span className="text-blue-600 font-semibold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              
              <p className="text-xs text-gray-500">{user?.role || ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-700 mr-4 p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            </div>
            <p className="text-xs text-gray-500">
              welcome{' '}
              <i className="text-1xl text-green-600">{user?.role || ''}</i> logged in as{' '}
              
            </p>
            {/* Logout Button */}
            <button
              className="py-2 px-4 cursor-pointer font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              onClick={onLogout}
            >
              <span className="text-blue-500 hover:text-blue-700">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
