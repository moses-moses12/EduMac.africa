import { apiClient } from '@/lib/api';
import { PaginatedResponse, QueryParams } from './types';

export type StudentStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'GRADUATED'
  | 'TRANSFERRED'
  | 'SUSPENDED'
  | 'ARCHIVED';

export interface Student {
  id: string;
  admission_number: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
  };
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | string;
  gender_display?: string;
  date_of_birth?: string;
  address?: string;
  blood_group?: string;
  emergency_contact?: string;
  academic_year?: string;
  academic_year_name?: string;
  current_class?: {
    id: string;
    name: string;
    grade_level?: string;
  } | string;
  class_name?: string;
  current_stream?: {
    id: string;
    name: string;
  } | string;
  stream_name?: string;
  parent?: {
    id: string;
    user: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number?: string;
    };
    relationship_type?: string;
  } | string;
  parent_name?: string;
  parent_phone?: string;
  admission_date?: string;
  status: StudentStatus | string;
  status_display?: string;
  profile_photo?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface StudentEnrollment {
  id: string;
  student: string | Student;
  academic_class: string;
  academic_year: string;
  term?: string;
  enrollment_date?: string;
  status?: string;
  is_active: boolean;
}

export interface Parent {
  id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
  };
  relationship_type: string;
  occupation?: string;
  address?: string;
}

export interface StudentStatistics {
  total_students: number;
  active: number;
  inactive: number;
  graduated: number;
  transferred: number;
  suspended: number;
  archived: number;
  gender_breakdown: {
    male: number;
    female: number;
    other: number;
  };
}

export const studentService = {
  async getStudents(params?: QueryParams): Promise<PaginatedResponse<Student>> {
    const response = await apiClient.get<PaginatedResponse<Student>>('/students/', { params });
    return response.data;
  },

  async getStudentById(id: string | number): Promise<Student> {
    const response = await apiClient.get<Student>(`/students/${id}/`);
    return response.data;
  },

  async createStudent(payload: Partial<Student> | Record<string, any>): Promise<Student> {
    const response = await apiClient.post<Student>('/students/', payload);
    return response.data;
  },

  async updateStudent(id: string | number, payload: Partial<Student> | Record<string, any>): Promise<Student> {
    const response = await apiClient.patch<Student>(`/students/${id}/`, payload);
    return response.data;
  },

  async changeStudentStatus(id: string | number, status: StudentStatus): Promise<{ success: boolean; message: string; student: Student }> {
    const response = await apiClient.post<{ success: boolean; message: string; student: Student }>(`/students/${id}/change_status/`, { status });
    return response.data;
  },

  async getStudentStatistics(): Promise<StudentStatistics> {
    const response = await apiClient.get<StudentStatistics>('/students/statistics/');
    return response.data;
  },

  async getMyProfile(): Promise<Student> {
    const response = await apiClient.get<Student>('/students/me/');
    return response.data;
  },

  async deleteStudent(id: string | number): Promise<void> {
    await apiClient.delete(`/students/${id}/`);
  },

  async getEnrollments(params?: QueryParams): Promise<PaginatedResponse<StudentEnrollment>> {
    const response = await apiClient.get<PaginatedResponse<StudentEnrollment>>('/students/enrollments/', { params });
    return response.data;
  },

  async createEnrollment(payload: Record<string, any>): Promise<StudentEnrollment> {
    const response = await apiClient.post<StudentEnrollment>('/students/enrollments/', payload);
    return response.data;
  },

  async getParents(params?: QueryParams): Promise<PaginatedResponse<Parent>> {
    const response = await apiClient.get<PaginatedResponse<Parent>>('/parents/', { params });
    return response.data;
  },

  async createParent(payload: Record<string, any>): Promise<Parent> {
    const response = await apiClient.post<Parent>('/parents/', payload);
    return response.data;
  },

  async getParentMyProfile(): Promise<any> {
    const response = await apiClient.get('/parents/me/');
    return response.data;
  },

  async getParentChildren(): Promise<{ parent_id: string; parent_name: string; total_children: number; children: Student[] }> {
    const response = await apiClient.get('/parents/children/');
    return response.data;
  },
};
