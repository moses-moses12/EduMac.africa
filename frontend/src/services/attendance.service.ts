import { apiClient } from '@/lib/api';
import { PaginatedResponse, QueryParams } from './types';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type AttendanceType = 'DAILY' | 'CLASS' | 'SUBJECT';

export interface AttendanceRecord {
  id: string;
  student: string | {
    id: string;
    admission_number: string;
    user?: {
      first_name: string;
      last_name: string;
    };
  };
  student_admission?: string;
  student_name?: string;
  class_obj?: string;
  class_name?: string;
  stream?: string;
  stream_name?: string;
  subject?: string;
  subject_name?: string;
  date: string;
  attendance_type: AttendanceType | string;
  status: AttendanceStatus;
  status_display?: string;
  notes?: string;
  remarks?: string;
  recorded_by_name?: string;
}

export interface AttendanceSummary {
  total_records: number;
  total_days?: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  present_rate?: number;
  attendance_rate?: number;
}

export interface MonthlyAttendanceSummary {
  month?: string;
  month_name?: string;
  month_code: string;
  total: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  attendance_rate?: number;
  attendance_percentage?: number;
}

export interface SelfServiceAttendanceResponse {
  student_id: string;
  student_admission: string;
  student_name: string;
  class_name: string;
  stream_name: string;
  linked_children?: Array<{
    id: string;
    admission_number: string;
    name: string;
    class_name: string;
    stream_name: string;
  }>;
  summary: AttendanceSummary;
  monthly_summaries: MonthlyAttendanceSummary[];
  records: AttendanceRecord[];
}

export interface AttendanceReport {
  overall_summary: AttendanceSummary & { overall_attendance_rate: number };
  chronic_absenteeism_count: number;
  chronic_absenteeism: Array<{
    student_id: string;
    admission_number: string;
    name: string;
    stream: string;
    total_days: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
    attendance_percentage: number;
  }>;
  students_breakdown: Array<{
    student_id: string;
    admission_number: string;
    name: string;
    stream: string;
    total_days: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
    attendance_percentage: number;
  }>;
}

export const attendanceService = {
  async getAttendance(params?: QueryParams): Promise<PaginatedResponse<AttendanceRecord>> {
    const response = await apiClient.get<PaginatedResponse<AttendanceRecord>>('/attendance/records/', { params });
    return response.data;
  },

  async getAttendanceById(id: string | number): Promise<AttendanceRecord> {
    const response = await apiClient.get<AttendanceRecord>(`/attendance/records/${id}/`);
    return response.data;
  },

  async markAttendance(payload: {
    student: string;
    stream?: string;
    class_obj?: string;
    date: string;
    attendance_type?: AttendanceType;
    status: AttendanceStatus;
    notes?: string;
  }): Promise<AttendanceRecord> {
    const response = await apiClient.post<AttendanceRecord>('/attendance/records/', payload);
    return response.data;
  },

  async markBulkAttendance(payload: {
    date: string;
    stream_id?: string;
    attendance_type?: AttendanceType;
    subject_id?: string;
    records: Array<{
      student_id: string;
      status: AttendanceStatus;
      notes?: string;
    }>;
  }): Promise<{ success: boolean; message: string; date: string }> {
    const response = await apiClient.post('/attendance/records/bulk_mark/', payload);
    return response.data;
  },

  async getAttendanceSummary(params?: QueryParams): Promise<AttendanceSummary> {
    const response = await apiClient.get<AttendanceSummary>('/attendance/records/summary/', { params });
    return response.data;
  },

  async getMonthlySummary(params?: QueryParams): Promise<{ monthly_summaries: MonthlyAttendanceSummary[] }> {
    const response = await apiClient.get<{ monthly_summaries: MonthlyAttendanceSummary[] }>('/attendance/records/monthly_summary/', { params });
    return response.data;
  },

  async getAttendanceReport(params?: QueryParams): Promise<AttendanceReport> {
    const response = await apiClient.get<AttendanceReport>('/attendance/records/reports/', { params });
    return response.data;
  },

  async getMyAttendance(params?: { student_id?: string }): Promise<SelfServiceAttendanceResponse> {
    const response = await apiClient.get<SelfServiceAttendanceResponse>('/attendance/me/', { params });
    return response.data;
  },
};
