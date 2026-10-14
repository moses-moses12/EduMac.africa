import { apiClient } from '@/lib/api';

export interface ExecutiveReport {
  summary: {
    total_students: number;
    total_teachers: number;
    total_staff: number;
    total_classes: number;
    overall_attendance_rate: number;
    financials: {
      total_invoiced: number;
      total_collected: number;
      total_outstanding: number;
      collection_rate_pct: number;
    };
  };
  recent_activity: any[];
}

export const reportService = {
  async getExecutiveReport(): Promise<ExecutiveReport> {
    const response = await apiClient.get<ExecutiveReport>('/reports/executive/');
    return response.data;
  },

  async getAcademicReport(): Promise<any> {
    const response = await apiClient.get('/reports/academic/');
    return response.data;
  },

  async getEnrollmentAnalytics(): Promise<any> {
    const response = await apiClient.get('/reports/enrollment/');
    return response.data;
  },

  async getHeadmasterAnalytics(): Promise<any> {
    const response = await apiClient.get('/reports/headmaster/');
    return response.data;
  },

  async getAdvancedAnalytics(): Promise<any> {
    const response = await apiClient.get('/reports/analytics/');
    return response.data;
  },
};
