export type UserRole = 
  | 'ADMIN'
  | 'HEADMASTER'
  | 'ACADEMIC'
  | 'TEACHER'
  | 'STUDENT'
  | 'ACCOUNTANT'
  | 'LIBRARIAN'
  | 'EXAM_OFFICER'
  | 'STAFF';

export interface User {
  id: string;
  email: string;
  username?: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number?: string;
  address?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  date_joined?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: AuthTokens;
  };
}

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface Term {
  id: string;
  name: string;
  academic_year: string | AcademicYear;
  academic_year_name?: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface SchoolClass {
  id: string;
  name: string;
  code: string;
  order: number;
}

export interface Stream {
  id: string;
  name: string;
  class_obj: string;
  class_name?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  is_core: boolean;
}

export interface Student {
  id: string;
  user: User;
  admission_number: string;
  current_class?: SchoolClass;
  current_class_name?: string;
  stream?: Stream;
  stream_name?: string;
  parent?: Record<string, unknown>;
  date_of_birth?: string;
  gender?: string;
  admission_date?: string;
  is_active: boolean;
}

export interface Teacher {
  id: string;
  user: User;
  employee_id: string;
  designation: string;
  qualification: string;
  joining_date: string;
  is_active: boolean;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  student: string | Student;
  student_admission?: string;
  student_name?: string;
  fee_structure: string;
  fee_structure_name?: string;
  total_amount: string | number;
  paid_amount: string | number;
  balance: string | number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE' | 'CANCELLED';
  due_date: string;
  created_at: string;
}

export interface Examination {
  id: string;
  name: string;
  academic_year: string;
  term: string;
  term_name?: string;
  start_date: string;
  end_date: string;
  is_published: boolean;
}

export interface Book {
  id: string;
  title: string;
  isbn: string;
  author: string;
  category: string;
  category_name?: string;
  total_copies: number;
  available_copies: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  target_audience: string;
  created_at: string;
  author_name?: string;
}

export interface AuditLogItem {
  id: string;
  user_email: string;
  user_role?: string;
  action: string;
  model_name?: string;
  object_id?: string;
  timestamp?: string;
  created_at?: string;
  ip_address?: string;
  details?: string;
  description?: string;
  changes?: Record<string, unknown>;
}
