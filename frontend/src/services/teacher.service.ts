import { apiClient } from '@/lib/api';
import { PaginatedResponse, QueryParams } from './types';

export interface Teacher {
  id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
  };
  employee_id: string;
  specialization?: string;
  qualification?: string;
  department?: string;
  joining_date?: string;
  is_class_teacher?: boolean;
}

export interface StaffMember {
  id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
  };
  employee_id: string;
  designation: string;
  department?: string;
  employment_type?: string;
  joining_date?: string;
}

export const teacherService = {
  async getMyProfile(): Promise<any> {
    const response = await apiClient.get('/staff/teachers/me/');
    return response.data;
  },

  async getTeachers(params?: QueryParams): Promise<PaginatedResponse<Teacher>> {
    const response = await apiClient.get<PaginatedResponse<Teacher>>('/staff/teachers/', { params });
    return response.data;
  },

  async getTeacherById(id: string | number): Promise<Teacher> {
    const response = await apiClient.get<Teacher>(`/teachers/${id}/`);
    return response.data;
  },

  async createTeacher(payload: Record<string, any>): Promise<Teacher> {
    const response = await apiClient.post<Teacher>('/teachers/', payload);
    return response.data;
  },

  async updateTeacher(id: string | number, payload: Record<string, any>): Promise<Teacher> {
    const response = await apiClient.patch<Teacher>(`/teachers/${id}/`, payload);
    return response.data;
  },

  async deleteTeacher(id: string | number): Promise<void> {
    await apiClient.delete(`/teachers/${id}/`);
  },

  async getStaff(params?: QueryParams): Promise<PaginatedResponse<StaffMember>> {
    const response = await apiClient.get<PaginatedResponse<StaffMember>>('/staff/', { params });
    return response.data;
  },

  async getStaffById(id: string | number): Promise<StaffMember> {
    const response = await apiClient.get<StaffMember>(`/staff/${id}/`);
    return response.data;
  },

  async createStaff(payload: Record<string, any>): Promise<StaffMember> {
    const response = await apiClient.post<StaffMember>('/staff/', payload);
    return response.data;
  },

  async updateStaff(id: string | number, payload: Record<string, any>): Promise<StaffMember> {
    const response = await apiClient.patch<StaffMember>(`/staff/${id}/`, payload);
    return response.data;
  },

  async deleteStaff(id: string | number): Promise<void> {
    await apiClient.delete(`/staff/${id}/`);
  },
};
