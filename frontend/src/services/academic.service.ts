import { apiClient } from '@/lib/api';
import { PaginatedResponse, QueryParams } from './types';

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  terms?: Term[];
}

export interface Term {
  id: string;
  academic_year: string;
  academic_year_name?: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface Stream {
  id: string;
  class_obj: string;
  class_name?: string;
  name: string;
  capacity: number;
  student_count?: number;
}

export interface AcademicClass {
  id: string;
  name: string;
  code?: string;
  academic_stage?: string;
  grade_level?: string;
  order?: number;
  academic_year?: string;
  academic_year_name?: string;
  term?: string;
  term_name?: string;
  streams?: Stream[];
  total_students?: number;
  capacity?: number;
  class_teacher?: {
    id: string;
    employee_id: string;
    user: {
      first_name: string;
      last_name: string;
    };
  };
  student_count?: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  department?: string;
  is_elective?: boolean;
  is_core?: boolean;
  credit_units?: number;
  description?: string;
}

export interface TeacherAssignment {
  id: string;
  teacher: string;
  teacher_name?: string;
  teacher_email?: string;
  subject: string;
  subject_name?: string;
  subject_code?: string;
  class_obj: string;
  class_name?: string;
  stream?: string;
  stream_name?: string;
  academic_year: string;
  academic_year_name?: string;
  term?: string;
  term_name?: string;
  is_class_teacher: boolean;
  periods_per_week: number;
  created_at?: string;
}

export interface AcademicCalendarEvent {
  id: string;
  academic_year: string;
  academic_year_name?: string;
  term?: string;
  term_name?: string;
  title: string;
  description?: string;
  event_type: 'TERM_DATES' | 'EXAMINATION' | 'HOLIDAY' | 'MEETING' | 'SPORTS' | 'GENERAL' | string;
  event_type_display?: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
}

export const academicService = {
  // Academic Years
  async getAcademicYears(params?: QueryParams): Promise<PaginatedResponse<AcademicYear>> {
    const response = await apiClient.get<PaginatedResponse<AcademicYear>>('/academics/years/', { params });
    return response.data;
  },

  async createAcademicYear(payload: Partial<AcademicYear>): Promise<AcademicYear> {
    const response = await apiClient.post<AcademicYear>('/academics/years/', payload);
    return response.data;
  },

  // Terms
  async getTerms(params?: QueryParams): Promise<PaginatedResponse<Term>> {
    const response = await apiClient.get<PaginatedResponse<Term>>('/academics/terms/', { params });
    return response.data;
  },

  async createTerm(payload: Partial<Term>): Promise<Term> {
    const response = await apiClient.post<Term>('/academics/terms/', payload);
    return response.data;
  },

  // Classes
  async getClasses(params?: QueryParams): Promise<PaginatedResponse<AcademicClass>> {
    const response = await apiClient.get<PaginatedResponse<AcademicClass>>('/classes/', { params });
    return response.data;
  },

  async getClassById(id: string | number): Promise<AcademicClass> {
    const response = await apiClient.get<AcademicClass>(`/classes/${id}/`);
    return response.data;
  },

  async createClass(payload: Partial<AcademicClass>): Promise<AcademicClass> {
    const response = await apiClient.post<AcademicClass>('/classes/', payload);
    return response.data;
  },

  async updateClass(id: string | number, payload: Partial<AcademicClass>): Promise<AcademicClass> {
    const response = await apiClient.patch<AcademicClass>(`/classes/${id}/`, payload);
    return response.data;
  },

  async deleteClass(id: string | number): Promise<void> {
    await apiClient.delete(`/classes/${id}/`);
  },

  // Streams
  async getStreams(params?: QueryParams): Promise<PaginatedResponse<Stream>> {
    const response = await apiClient.get<PaginatedResponse<Stream>>('/academics/streams/', { params });
    return response.data;
  },

  async createStream(payload: Partial<Stream>): Promise<Stream> {
    const response = await apiClient.post<Stream>('/academics/streams/', payload);
    return response.data;
  },

  // Subjects
  async getSubjects(params?: QueryParams): Promise<PaginatedResponse<Subject>> {
    const response = await apiClient.get<PaginatedResponse<Subject>>('/subjects/', { params });
    return response.data;
  },

  async getSubjectById(id: string | number): Promise<Subject> {
    const response = await apiClient.get<Subject>(`/subjects/${id}/`);
    return response.data;
  },

  async createSubject(payload: Partial<Subject>): Promise<Subject> {
    const response = await apiClient.post<Subject>('/subjects/', payload);
    return response.data;
  },

  async updateSubject(id: string | number, payload: Partial<Subject>): Promise<Subject> {
    const response = await apiClient.patch<Subject>(`/subjects/${id}/`, payload);
    return response.data;
  },

  async deleteSubject(id: string | number): Promise<void> {
    await apiClient.delete(`/subjects/${id}/`);
  },

  // Teacher Assignments
  async getTeacherAssignments(params?: QueryParams): Promise<PaginatedResponse<TeacherAssignment>> {
    const response = await apiClient.get<PaginatedResponse<TeacherAssignment>>('/academics/assignments/', { params });
    return response.data;
  },

  async createTeacherAssignment(payload: Partial<TeacherAssignment> | Record<string, any>): Promise<TeacherAssignment> {
    const response = await apiClient.post<TeacherAssignment>('/academics/assignments/', payload);
    return response.data;
  },

  async deleteTeacherAssignment(id: string | number): Promise<void> {
    await apiClient.delete(`/academics/assignments/${id}/`);
  },

  // Academic Calendar
  async getAcademicCalendar(params?: QueryParams): Promise<PaginatedResponse<AcademicCalendarEvent>> {
    const response = await apiClient.get<PaginatedResponse<AcademicCalendarEvent>>('/academics/calendar/', { params });
    return response.data;
  },

  async createCalendarEvent(payload: Partial<AcademicCalendarEvent> | Record<string, any>): Promise<AcademicCalendarEvent> {
    const response = await apiClient.post<AcademicCalendarEvent>('/academics/calendar/', payload);
    return response.data;
  },

  async deleteCalendarEvent(id: string | number): Promise<void> {
    await apiClient.delete(`/academics/calendar/${id}/`);
  },
};
