'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { ACCESS_TOKEN } from '@/constants';
import { AuthService } from '@/lib/services';
import { redirect } from 'next/navigation';
import { AuthProvider } from '@/components/providers/authContext'; // import your provider

const ProtectedPagesLayout = ({
  children
}: {
  children: React.ReactNode
}) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = Cookies.get(ACCESS_TOKEN);
      if (!accessToken) {
        redirect('/login');
        return;
      }
      try {
        await AuthService.getUserProfile(); // optional: refresh user
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        AuthService.logout();
        redirect('/login');
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold bg-gray-100">
        wait redirecting ......
      </div>
    );
  }

  return <AuthProvider>{children}</AuthProvider>; // wrap children with AuthProvider
};

export default ProtectedPagesLayout;
