/**
 * Common API Response and Query Types
 * Aligned with the Enterprise School Management System API Standard
 */

export interface PaginatedResponse<T> {
  success: boolean;
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[] | string>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: Record<string, string[] | string>;
  status_code?: number;
}

export interface QueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | undefined | null;
}
