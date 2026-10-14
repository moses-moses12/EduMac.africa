import { apiClient } from '@/lib/api';
import { PaginatedResponse, QueryParams } from './types';

export type NotificationCategory =
  | 'RESULT_PUBLISHED'
  | 'NEW_ASSIGNMENT'
  | 'FEE_REMINDER'
  | 'ATTENDANCE_WARNING'
  | 'EXAM_SCHEDULE'
  | 'SCHOOL_ANNOUNCEMENT'
  | 'SECURITY_EVENT'
  | 'SYSTEM'
  | 'ACADEMIC'
  | 'FEE'
  | 'EXAM'
  | 'GENERAL';

export interface NotificationItem {
  id: string;
  recipient?: string;
  recipient_name?: string;
  recipient_email?: string;
  title: string;
  message: string;
  type?: NotificationCategory;
  notification_type: NotificationCategory;
  type_display?: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  target_roles?: string[];
  is_active?: boolean;
  created_at: string;
  posted_by?: any;
}

export const notificationService = {
  async getNotifications(params?: QueryParams): Promise<PaginatedResponse<NotificationItem>> {
    const response = await apiClient.get<PaginatedResponse<NotificationItem>>('/notifications/', { params });
    return response.data;
  },

  async markAsRead(id: string | number): Promise<any> {
    const response = await apiClient.post(`/notifications/${id}/read/`);
    return response.data;
  },

  async markAllAsRead(): Promise<{ success: boolean; updated_count?: number }> {
    const response = await apiClient.post<{ success: boolean; updated_count?: number }>('/notifications/read-all/');
    return response.data;
  },

  async getUnreadCount(): Promise<{ unread_count: number }> {
    try {
      const response = await apiClient.get<{ success: boolean; unread_count: number }>('/notifications/unread-count/');
      return { unread_count: response.data.unread_count ?? 0 };
    } catch {
      return { unread_count: 0 };
    }
  },

  async createNotification(payload: {
    title: string;
    message: string;
    type?: NotificationCategory | string;
    notification_type?: NotificationCategory | string;
    recipient?: string;
  }): Promise<NotificationItem> {
    const response = await apiClient.post<NotificationItem>('/notifications/', payload);
    return response.data;
  },

  async broadcastNotification(payload: {
    title: string;
    message: string;
    target_role?: string;
    type?: NotificationCategory | string;
  }): Promise<{ success: boolean; count: number; message: string }> {
    const response = await apiClient.post<{ success: boolean; count: number; message: string }>(
      '/notifications/broadcast/',
      payload
    );
    return response.data;
  },

  async getAnnouncements(params?: QueryParams): Promise<PaginatedResponse<AnnouncementItem>> {
    try {
      const response = await apiClient.get<PaginatedResponse<AnnouncementItem>>('/communication/announcements/', { params });
      return response.data;
    } catch {
      return {
        success: true,
        count: 0,
        total_pages: 1,
        current_page: 1,
        next: null,
        previous: null,
        results: [],
      };
    }
  },

  async createAnnouncement(payload: Partial<AnnouncementItem>): Promise<AnnouncementItem> {
    const response = await apiClient.post<AnnouncementItem>('/communication/announcements/', payload);
    return response.data;
  },
};
