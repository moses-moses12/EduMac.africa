import { apiClient } from '@/lib/api';
import { PaginatedResponse, QueryParams } from './types';

export interface TimetableSlot {
  id: string;
  academic_class: {
    id: string;
    name: string;
  } | string;
  subject: {
    id: string;
    name: string;
    code: string;
  } | string;
  teacher?: {
    id: string;
    user: {
      first_name: string;
      last_name: string;
    };
  } | string;
  day_of_week: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  start_time: string;
  end_time: string;
  room_number?: string;
}

export const timetableService = {
  async getTimetable(params?: QueryParams): Promise<PaginatedResponse<TimetableSlot>> {
    const response = await apiClient.get<PaginatedResponse<TimetableSlot>>('/timetable/', { params });
    return response.data;
  },

  async getTimetableSlotById(id: string | number): Promise<TimetableSlot> {
    const response = await apiClient.get<TimetableSlot>(`/timetable/${id}/`);
    return response.data;
  },

  async createTimetableSlot(payload: Partial<TimetableSlot> | Record<string, any>): Promise<TimetableSlot> {
    const response = await apiClient.post<TimetableSlot>('/timetable/', payload);
    return response.data;
  },

  async updateTimetableSlot(id: string | number, payload: Partial<TimetableSlot> | Record<string, any>): Promise<TimetableSlot> {
    const response = await apiClient.patch<TimetableSlot>(`/timetable/${id}/`, payload);
    return response.data;
  },

  async deleteTimetableSlot(id: string | number): Promise<void> {
    await apiClient.delete(`/timetable/${id}/`);
  },

  async getMyTimetable(params?: { student_id?: string }): Promise<any> {
    const response = await apiClient.get('/timetable/me/', { params });
    return response.data;
  },
};
