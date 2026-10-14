import { apiClient } from '@/lib/api';
import { User } from '@/lib/types';

export interface AvatarUploadResponse {
  success: boolean;
  message: string;
  data: {
    avatar_url: string | null;
    user: User;
  };
}

export interface ProfileResponse {
  success: boolean;
  message?: string;
  data: User;
}

export const profileService = {
  /**
   * Retrieve the authenticated user's profile from the backend.
   */
  async getProfile(): Promise<User> {
    const res = await apiClient.get<ProfileResponse>('/auth/me/');
    if (res.data?.data) {
      return res.data.data;
    }
    return res.data as unknown as User;
  },

  /**
   * Partially update user profile details (first_name, last_name, phone_number, address).
   */
  async updateProfile(payload: Partial<User>): Promise<User> {
    const res = await apiClient.patch<ProfileResponse>('/auth/me/', payload);
    return res.data.data;
  },

  /**
   * Upload and persist user avatar image (multipart form data).
   */
  async uploadAvatar(file: File): Promise<AvatarUploadResponse['data']> {
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await apiClient.post<AvatarUploadResponse>('/auth/profile/avatar/', formData);

    return res.data.data;
  },

  /**
   * Delete authenticated user's avatar image from storage.
   */
  async removeAvatar(): Promise<AvatarUploadResponse['data']> {
    const res = await apiClient.delete<AvatarUploadResponse>('/auth/profile/avatar/');
    return res.data.data;
  },

  /**
   * Administrative avatar management for specific user account.
   */
  async adminUploadUserAvatar(userId: string, file: File): Promise<AvatarUploadResponse['data']> {
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await apiClient.post<AvatarUploadResponse>(`/auth/users/${userId}/avatar/`, formData);

    return res.data.data;
  },

  async adminRemoveUserAvatar(userId: string): Promise<AvatarUploadResponse['data']> {
    const res = await apiClient.delete<AvatarUploadResponse>(`/auth/users/${userId}/avatar/`);
    return res.data.data;
  },
};
