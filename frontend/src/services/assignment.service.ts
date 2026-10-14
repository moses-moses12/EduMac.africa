import { apiClient } from '@/lib/api';
import { PaginatedResponse, QueryParams } from './types';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  academic_class: {
    id: string;
    name: string;
  } | string;
  subject: {
    id: string;
    name: string;
    code: string;
  } | string;
  assigned_by?: {
    user: {
      first_name: string;
      last_name: string;
    };
  } | string;
  due_date: string;
  max_score: number;
  attachment?: string;
  created_at?: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment: string | Assignment;
  student: {
    id: string;
    admission_number: string;
    user: {
      first_name: string;
      last_name: string;
    };
  } | string;
  submission_file?: string;
  text_submission?: string;
  submitted_at: string;
  score?: number;
  feedback?: string;
  status: 'SUBMITTED' | 'GRADED' | 'LATE';
}

export const assignmentService = {
  async getAssignments(params?: QueryParams): Promise<PaginatedResponse<Assignment>> {
    const response = await apiClient.get<PaginatedResponse<Assignment>>('/assignments/', { params });
    return response.data;
  },

  async getAssignmentById(id: string | number): Promise<Assignment> {
    const response = await apiClient.get<Assignment>(`/assignments/${id}/`);
    return response.data;
  },

  async createAssignment(payload: Partial<Assignment> | Record<string, any>): Promise<Assignment> {
    const response = await apiClient.post<Assignment>('/assignments/', payload);
    return response.data;
  },

  async updateAssignment(id: string | number, payload: Partial<Assignment> | Record<string, any>): Promise<Assignment> {
    const response = await apiClient.patch<Assignment>(`/assignments/${id}/`, payload);
    return response.data;
  },

  async deleteAssignment(id: string | number): Promise<void> {
    await apiClient.delete(`/assignments/${id}/`);
  },

  async getSubmissions(params?: QueryParams): Promise<PaginatedResponse<AssignmentSubmission>> {
    const response = await apiClient.get<PaginatedResponse<AssignmentSubmission>>('/assignments/submissions/', { params });
    return response.data;
  },

  async submitAssignment(payload: FormData | Record<string, any>): Promise<AssignmentSubmission> {
    const headers = payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    const response = await apiClient.post<AssignmentSubmission>('/assignments/submissions/', payload, { headers });
    return response.data;
  },

  async gradeSubmission(id: string | number, payload: { score: number; feedback?: string }): Promise<AssignmentSubmission> {
    const response = await apiClient.patch<AssignmentSubmission>(`/assignments/submissions/${id}/`, payload);
    return response.data;
  },

  async getMyAssignments(params?: { student_id?: string }): Promise<any> {
    const response = await apiClient.get('/assignments/me/', { params });
    return response.data;
  },
};
