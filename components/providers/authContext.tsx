'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import Cookies from 'js-cookie';

// -----------------------------
// Define TypeScript types
// -----------------------------
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

// -----------------------------
// Auth context type
// -----------------------------
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

// -----------------------------
// Create context
// -----------------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// -----------------------------
// Provider component
// -----------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = Cookies.get('access_token');
      if (accessToken) {
        try {
          await refreshUserData();
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<LoginResponse>('/auth/login/', { email, password });
      const { access, refresh, user: userData } = response.data;

      // Save tokens in cookies
      Cookies.set('access_token', access, { expires: 1 });
      Cookies.set('refresh_token', refresh, { expires: 7 });

      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await api.post('/auth/register/', data);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.email?.[0] ||
        error.response?.data?.username?.[0] ||
        'Registration failed';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    const refreshToken = Cookies.get('refresh_token');

    if (refreshToken) {
      api.post('/auth/logout/', { refresh_token: refreshToken }).catch(() => {});
    }

    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await api.patch<User>('/auth/profile/update/', data);
      setUser(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Profile update failed');
    }
  };

  const refreshUserData = async () => {
    try {
      const response = await api.get<User>('/current-user/'); // Or /auth/current-user/
      setUser(response.data);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateProfile, refreshUserData }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// -----------------------------
// Custom hook
// -----------------------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
