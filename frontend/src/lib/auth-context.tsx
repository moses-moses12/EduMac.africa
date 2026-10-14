'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from './api';
import { User, UserRole, LoginResponse } from './types';

export type { UserRole };

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  quickLoginAs: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => Promise<boolean>;
  updateCurrentUser: (updatedUser: Partial<User> | User) => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const roleEmailMap: Record<UserRole, string> = {
  ADMIN: 'admin@school.edu',
  HEADMASTER: 'headmaster@school.edu',
  ACADEMIC: 'academic@school.edu',
  TEACHER: 'teacher@school.edu',
  STUDENT: 'student@school.edu',
  PARENT: 'parent@school.edu',
  ACCOUNTANT: 'accountant@school.edu',
  LIBRARIAN: 'librarian@school.edu',
  EXAM_OFFICER: 'exam@school.edu',
  STAFF: 'staff@school.edu',
};

function getInitialUser(): User | null {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sms_access_token');
    const storedUser = localStorage.getItem('sms_user');
    if (token && token.startsWith('demo_token_')) {
      localStorage.removeItem('sms_access_token');
      localStorage.removeItem('sms_refresh_token');
      localStorage.removeItem('sms_user');
      return null;
    }
    if (storedUser && token) {
      try {
        return JSON.parse(storedUser);
      } catch (err) {
        console.error('Failed to parse cached user', err);
      }
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const updateCurrentUser = (updatedUser: Partial<User> | User) => {
    setUser((prev) => {
      if (!prev) return updatedUser as User;
      const merged = { ...prev, ...updatedUser };
      if (typeof window !== 'undefined') {
        localStorage.setItem('sms_user', JSON.stringify(merged));
      }
      return merged;
    });
  };

  const refreshUser = async (): Promise<User | null> => {
    try {
      const res = await apiClient.get('/auth/me/');
      if (res.data?.success && res.data.data) {
        const verifiedUser = res.data.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('sms_user', JSON.stringify(verifiedUser));
        }
        setUser(verifiedUser);
        return verifiedUser;
      }
    } catch {
      // keep existing user
    }
    return user;
  };

  // The backend is ALWAYS the authority for the role and active session.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sms_access_token');
      if (token) {
        if (token.startsWith('demo_token_')) {
          localStorage.removeItem('sms_access_token');
          localStorage.removeItem('sms_refresh_token');
          localStorage.removeItem('sms_user');
          document.cookie = 'sms_user_role=; path=/; max-age=0';
          document.cookie = 'sms_access_token=; path=/; max-age=0';
          setUser(null);
          return;
        }

        apiClient
          .get('/auth/me/')
          .then((res) => {
            if (res.data?.success && res.data.data) {
              const verifiedUser = res.data.data;
              localStorage.setItem('sms_user', JSON.stringify(verifiedUser));
              setUser(verifiedUser);
            }
          })
          .catch(() => {
            // If backend rejects credentials or token expired, invalidate local session
            localStorage.removeItem('sms_access_token');
            localStorage.removeItem('sms_refresh_token');
            localStorage.removeItem('sms_user');
            document.cookie = 'sms_user_role=; path=/; max-age=0';
            document.cookie = 'sms_access_token=; path=/; max-age=0';
            setUser(null);
          });
      }
    }
  }, []);

  const redirectByRole = (userRole: UserRole) => {
    const roleRoutes: Record<UserRole, string> = {
      ADMIN: '/dashboard/admin',
      HEADMASTER: '/dashboard/headmaster',
      ACADEMIC: '/dashboard/academic',
      TEACHER: '/dashboard/teacher',
      STUDENT: '/dashboard/student',
      PARENT: '/dashboard/parent',
      ACCOUNTANT: '/dashboard/accountant',
      LIBRARIAN: '/dashboard/librarian',
      EXAM_OFFICER: '/dashboard/exam',
      STAFF: '/dashboard/staff',
    };
    router.push(roleRoutes[userRole] || '/dashboard');
  };

  const login = async (email: string, password = 'Password123!'): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await apiClient.post<LoginResponse>('/auth/login/', {
        email,
        username: email,
        password,
      });

      if (res.data && res.data.success) {
        const { user: loggedInUser, tokens } = res.data.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('sms_access_token', tokens.access);
          localStorage.setItem('sms_refresh_token', tokens.refresh);
          localStorage.setItem('sms_user', JSON.stringify(loggedInUser));
          document.cookie = `sms_user_role=${loggedInUser.role}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `sms_access_token=${tokens.access}; path=/; max-age=604800; SameSite=Lax`;
        }
        setUser(loggedInUser);
        redirectByRole(loggedInUser.role);
        return true;
      }
      return false;
    } catch (err: any) {
      // Security Enforcement: Invalidate any local tokens or mock credentials
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sms_access_token');
        localStorage.removeItem('sms_refresh_token');
        localStorage.removeItem('sms_user');
        document.cookie = 'sms_user_role=; path=/; max-age=0';
        document.cookie = 'sms_access_token=; path=/; max-age=0';
      }
      setUser(null);

      // Extract accurate server validation or network error
      const status = err?.response?.status;
      const errorData = err?.response?.data;
      let errorMsg = 'Invalid username or password. Please verify your credentials.';

      if (status === 429) {
        errorMsg = 'Too many login attempts. For system security, please wait a minute before trying again.';
      } else if (errorData) {
        if (typeof errorData.message === 'string' && errorData.message && errorData.message !== 'Authentication failed') {
          errorMsg = errorData.message;
        } else if (errorData.errors) {
          const nonField = errorData.errors.non_field_errors;
          const detail = errorData.errors.detail;
          if (Array.isArray(nonField) && nonField.length > 0) {
            errorMsg = nonField[0];
          } else if (Array.isArray(detail) && detail.length > 0) {
            errorMsg = detail[0];
          } else if (typeof nonField === 'string') {
            errorMsg = nonField;
          } else if (typeof detail === 'string') {
            errorMsg = detail;
          }
        }
      } else if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
        errorMsg = 'Cannot connect to authentication server. Please ensure the backend server is running.';
      }

      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginAs = async (email: string) => {
    return login(email, 'Password123!');
  };

  const switchRole = async (newRole: UserRole) => {
    const email = roleEmailMap[newRole];
    if (email) {
      return login(email, 'Password123!');
    }
    return false;
  };

  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        const refresh = localStorage.getItem('sms_refresh_token');
        if (refresh) {
          await apiClient.post('/auth/logout/', { refresh }).catch(() => {});
        }
      }
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sms_access_token');
        localStorage.removeItem('sms_refresh_token');
        localStorage.removeItem('sms_user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        sessionStorage.clear();
        document.cookie = 'sms_user_role=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'sms_access_token=; path=/; max-age=0; SameSite=Lax';
        setUser(null);
        window.location.href = '/login';
      } else {
        setUser(null);
        router.push('/login');
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        quickLoginAs,
        logout,
        switchRole,
        updateCurrentUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
