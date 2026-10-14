import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to inject JWT access token and clean FormData headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sms_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // If data is FormData, remove manual application/json so browser sets multipart/form-data with boundary
    if (config.data instanceof FormData && config.headers) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      } else {
        delete (config.headers as any)['Content-Type'];
        delete (config.headers as any)['content-type'];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401s and refresh tokens
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('sms_refresh_token');
        if (refreshToken) {
          try {
            const res = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
              refresh: refreshToken,
            });
            const newAccess = res.data.access;
            localStorage.setItem('sms_access_token', newAccess);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            }
            return apiClient(originalRequest);
          } catch {
            localStorage.removeItem('sms_access_token');
            localStorage.removeItem('sms_refresh_token');
            localStorage.removeItem('sms_user');
            if (window.location.pathname !== '/login') {
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.assign('/login?expired=true');
            }
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export interface ApiErrorResponse {
  message: string;
  errors: Record<string, string[]>;
  statusCode?: number;
  isNetworkError?: boolean;
}

/**
 * Enterprise API Error Formatter
 * Formats backend structured responses, extracts human-friendly messages,
 * and ensures raw Python tracebacks or stack traces are never shown to end users.
 */
export function formatApiError(error: unknown): ApiErrorResponse {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as any;

    // Handle Network / Offline / Timeout failures
    if (!error.response) {
      return {
        message: 'Unable to reach the school system server. Please check your internet connection or try again shortly.',
        errors: { network: ['Connection timed out or failed to reach host.'] },
        statusCode: 0,
        isNetworkError: true,
      };
    }

    // Backend custom_exception_handler envelope: { success: false, message: "...", errors: { ... } }
    let friendlyMessage = data?.message || '';
    const errors: Record<string, string[]> = {};

    if (data?.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
      Object.entries(data.errors).forEach(([field, val]) => {
        if (Array.isArray(val)) {
          errors[field] = val.map(String);
        } else if (typeof val === 'string') {
          errors[field] = [val];
        }
      });
    }

    // Sanitize any raw Python exception words or tracebacks
    const tracebackKeywords = ['traceback (most recent call last)', 'django.', 'operationalerror', 'syntaxerror', 'sqlexception', 'pymysql', 'psycopg2', 'sqlite3.'];
    const lowerMessage = (friendlyMessage || '').toLowerCase();
    const hasTraceback = tracebackKeywords.some((kw) => lowerMessage.includes(kw));

    if (hasTraceback || status === 500) {
      friendlyMessage = 'An unexpected server error occurred while processing your request. Please contact system support.';
    }

    if (!friendlyMessage) {
      if (status === 400) friendlyMessage = 'Invalid data submitted. Please check the form and try again.';
      else if (status === 401) friendlyMessage = 'Your session has expired. Please sign in again.';
      else if (status === 403) friendlyMessage = 'You do not have permission to perform this action.';
      else if (status === 404) friendlyMessage = 'The requested resource was not found.';
      else friendlyMessage = 'A request error occurred. Please try again.';
    }

    return {
      message: friendlyMessage,
      errors,
      statusCode: status,
      isNetworkError: false,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected client error occurred.',
      errors: {},
      statusCode: 500,
    };
  }

  return {
    message: 'An unknown error occurred.',
    errors: {},
    statusCode: 500,
  };
}

export const demoAccounts = [
  { role: 'ADMIN', username: 'admin', email: 'admin@school.edu', password: 'Password123!', label: 'System Admin', desc: 'Full administration, security & audit logs' },
  { role: 'HEADMASTER', username: 'headmaster', email: 'headmaster@school.edu', password: 'Password123!', label: 'Headmaster / Principal', desc: 'Executive oversight, metrics & approvals' },
  { role: 'ACADEMIC', username: 'academic', email: 'academic@school.edu', password: 'Password123!', label: 'Academic Officer', desc: 'Curriculum, classes, subjects & timetable' },
  { role: 'TEACHER', username: 'teacher', email: 'teacher@school.edu', password: 'Password123!', label: 'Teacher', desc: 'Attendance, grading marksheets & assignments' },
  { role: 'STUDENT', username: 'student', email: 'student@school.edu', password: 'Password123!', label: 'Student', desc: 'Results, schedule, fee statement & library' },
  { role: 'PARENT', username: 'parent', email: 'parent@school.edu', password: 'Password123!', label: 'Parent / Guardian', desc: 'Children performance, attendance & payments' },
  { role: 'ACCOUNTANT', username: 'accountant', email: 'accountant@school.edu', password: 'Password123!', label: 'Finance / Bursar', desc: 'Fee structures, invoices, payments & receipts' },
  { role: 'LIBRARIAN', username: 'librarian', email: 'librarian@school.edu', password: 'Password123!', label: 'Librarian', desc: 'Book catalog, lending lifecycle & overdue fines' },
  { role: 'EXAM_OFFICER', username: 'exam', email: 'exam@school.edu', password: 'Password123!', label: 'Examinations Officer', desc: 'Exam schedules, grading rubrics & report cards' },
  { role: 'STAFF', username: 'staff', email: 'staff@school.edu', password: 'Password123!', label: 'Campus Staff', desc: 'Notices, visitors log & campus inquiries' },
];
