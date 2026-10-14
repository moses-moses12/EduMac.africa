import { apiClient } from '@/lib/api';
import { ApiResponse } from './types';

export interface LoginPayload {
  email?: string;
  username?: string;
  password?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_active: boolean;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  phone_number?: string;
  profile_picture?: string;
  is_active: boolean;
  date_joined?: string;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthTokens> {
    const response = await apiClient.post<AuthTokens>('/auth/login/', payload);
    const data = response.data;
    if (typeof window !== 'undefined' && data.access) {
      localStorage.setItem('sms_access_token', data.access);
      if (data.refresh) {
        localStorage.setItem('sms_refresh_token', data.refresh);
      }
      if (data.user) {
        localStorage.setItem('sms_user', JSON.stringify(data.user));
      }
    }
    return data;
  },

  async register(payload: Record<string, any>): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/auth/register/', payload);
    return response.data;
  },

  async refreshToken(refresh: string): Promise<{ access: string }> {
    const response = await apiClient.post<{ access: string }>('/auth/refresh/', { refresh });
    if (typeof window !== 'undefined' && response.data.access) {
      localStorage.setItem('sms_access_token', response.data.access);
    }
    return response.data;
  },

  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/auth/profile/');
    return response.data;
  },

  async updateProfile(payload: Partial<UserProfile>): Promise<UserProfile> {
    const response = await apiClient.patch<UserProfile>('/auth/profile/', payload);
    return response.data;
  },

  async changePassword(payload: { old_password: string; new_password: string }): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/auth/change-password/', payload);
    return response.data;
  },

  async getUsers(params?: Record<string, any>): Promise<any> {
    const response = await apiClient.get('/auth/users/', { params });
    return response.data;
  },

  async createUser(payload: Record<string, any>): Promise<any> {
    const response = await apiClient.post('/auth/users/', payload);
    return response.data;
  },

  async setUserPassword(userId: string, password: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/auth/users/${userId}/set-password/`, { password });
    return response.data;
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sms_access_token');
      localStorage.removeItem('sms_refresh_token');
      localStorage.removeItem('sms_user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      sessionStorage.clear();
      document.cookie = 'sms_user_role=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'sms_access_token=; path=/; max-age=0; SameSite=Lax';
      window.location.href = '/login';
    }
  },
};
