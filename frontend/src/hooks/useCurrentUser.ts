'use client';

import { useAuth } from '@/lib/auth-context';
import { profileService } from '@/services/profile.service';
import { User, UserRole } from '@/lib/types';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export function useCurrentUser() {
  const {
    user,
    role,
    isLoading,
    isAuthenticated,
    logout,
    updateCurrentUser,
    refreshUser,
  } = useAuth();

  const queryClient = useQueryClient();

  const uploadAvatar = useCallback(
    async (file: File): Promise<{ avatar_url: string | null; user: User }> => {
      try {
        const data = await profileService.uploadAvatar(file);
        if (data?.user) {
          updateCurrentUser(data.user);
        }
        queryClient.invalidateQueries({ queryKey: ['current-user'] });
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        return data;
      } catch (err: any) {
        // If server is unreachable (Network Error) or user is in demo mode, provide local fallback
        const isNetworkErr = err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response;
        const token = typeof window !== 'undefined' ? localStorage.getItem('sms_access_token') : null;
        const isDemoToken = token && token.startsWith('demo_token_');

        if (isNetworkErr || isDemoToken) {
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          const updatedUser: User = {
            ...(user || {
              id: 'local-user',
              username: 'admin',
              email: 'admin@school.edu',
              role: role || 'ADMIN',
              first_name: 'Admin',
              last_name: 'User',
              is_active: true,
            }),
            avatar_url: dataUrl,
            avatar: dataUrl,
          };
          updateCurrentUser(updatedUser);
          queryClient.invalidateQueries({ queryKey: ['current-user'] });
          return { avatar_url: dataUrl, user: updatedUser };
        }
        throw err;
      }
    },
    [user, role, updateCurrentUser, queryClient]
  );

  const removeAvatar = useCallback(
    async (): Promise<{ avatar_url: string | null; user: User }> => {
      try {
        const data = await profileService.removeAvatar();
        if (data?.user) {
          updateCurrentUser(data.user);
        }
        queryClient.invalidateQueries({ queryKey: ['current-user'] });
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        return data;
      } catch (err: any) {
        const isNetworkErr = err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response;
        if (isNetworkErr && user) {
          const updatedUser: User = {
            ...user,
            avatar_url: null,
            avatar: null,
          };
          updateCurrentUser(updatedUser);
          queryClient.invalidateQueries({ queryKey: ['current-user'] });
          return { avatar_url: null, user: updatedUser };
        }
        throw err;
      }
    },
    [user, updateCurrentUser, queryClient]
  );

  return {
    user,
    role,
    isLoading,
    isAuthenticated,
    logout,
    updateCurrentUser,
    refreshUser,
    uploadAvatar,
    removeAvatar,
  };
}
