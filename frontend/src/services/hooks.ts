'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService, Student } from './student.service';
import { teacherService, Teacher, StaffMember } from './teacher.service';
import { attendanceService, AttendanceRecord } from './attendance.service';
import { resultService, ResultRecord, Examination } from './result.service';
import { feeService, FeeStructure, Invoice, Payment } from './fee.service';
import { timetableService, TimetableSlot } from './timetable.service';
import { assignmentService, Assignment } from './assignment.service';
import { libraryService, Book, BookLoan } from './library.service';
import { notificationService, NotificationItem } from './notification.service';
import { academicService, AcademicClass, Subject } from './academic.service';
import { reportService } from './report.service';
import { QueryParams } from './types';

// ==========================================
// 1. STUDENTS HOOKS
// ==========================================
export function useStudents(params?: QueryParams) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => studentService.getStudents(params),
  });
}

export function useStudent(id: string | number) {
  return useQuery({
    queryKey: ['student', id],
    queryFn: () => studentService.getStudentById(id),
    enabled: Boolean(id),
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Student> | Record<string, any>) => studentService.createStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<Student> | Record<string, any> }) =>
      studentService.updateStudent(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', variables.id] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => studentService.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

// ==========================================
// 2. TEACHERS & STAFF HOOKS
// ==========================================
export function useTeachers(params?: QueryParams) {
  return useQuery({
    queryKey: ['teachers', params],
    queryFn: () => teacherService.getTeachers(params),
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => teacherService.createTeacher(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
}

export function useStaff(params?: QueryParams) {
  return useQuery({
    queryKey: ['staff', params],
    queryFn: () => teacherService.getStaff(params),
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => teacherService.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

// ==========================================
// 3. ATTENDANCE HOOKS
// ==========================================
export function useAttendance(params?: QueryParams) {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: () => attendanceService.getAttendance(params),
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      student: string;
      academic_class: string;
      date: string;
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
      remarks?: string;
    }) => attendanceService.markAttendance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

// ==========================================
// 4. RESULTS & EXAMINATIONS HOOKS
// ==========================================
export function useResults(params?: QueryParams) {
  return useQuery({
    queryKey: ['results', params],
    queryFn: () => resultService.getResults(params),
  });
}

export function useSubmitMarks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      student: string;
      examination_subject: string;
      marks_obtained: number;
      remarks?: string;
    }) => resultService.submitMarks(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
    },
  });
}

export function useExaminations(params?: QueryParams) {
  return useQuery({
    queryKey: ['examinations', params],
    queryFn: () => resultService.getExaminations(params),
  });
}

// ==========================================
// 5. FEES & PAYMENTS HOOKS
// ==========================================
export function useFeeStructures(params?: QueryParams) {
  return useQuery({
    queryKey: ['fees', 'structures', params],
    queryFn: () => feeService.getFeeStructures(params),
  });
}

export function useInvoices(params?: QueryParams) {
  return useQuery({
    queryKey: ['fees', 'invoices', params],
    queryFn: () => feeService.getInvoices(params),
  });
}

export function usePayments(params?: QueryParams) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => feeService.getPayments(params),
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      invoice: string;
      amount: number | string;
      payment_method: string;
      reference_number?: string;
    }) => feeService.recordPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['fees', 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
  });
}

export function useFinancialSummary() {
  return useQuery({
    queryKey: ['financial-summary'],
    queryFn: () => feeService.getFinancialSummary(),
    staleTime: 30 * 1000,
  });
}

// ==========================================
// 6. TIMETABLE HOOKS
// ==========================================
export function useTimetable(params?: QueryParams) {
  return useQuery({
    queryKey: ['timetable', params],
    queryFn: () => timetableService.getTimetable(params),
  });
}

export function useCreateTimetableSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<TimetableSlot> | Record<string, any>) =>
      timetableService.createTimetableSlot(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
    },
  });
}

// ==========================================
// 7. ASSIGNMENTS HOOKS
// ==========================================
export function useAssignments(params?: QueryParams) {
  return useQuery({
    queryKey: ['assignments', params],
    queryFn: () => assignmentService.getAssignments(params),
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Assignment> | Record<string, any>) =>
      assignmentService.createAssignment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

// ==========================================
// 8. LIBRARY HOOKS
// ==========================================
export function useBooks(params?: QueryParams) {
  return useQuery({
    queryKey: ['library', 'books', params],
    queryFn: () => libraryService.getBooks(params),
  });
}

export function useBookLoans(params?: QueryParams) {
  return useQuery({
    queryKey: ['library', 'loans', params],
    queryFn: () => libraryService.getLoans(params),
  });
}

export function useIssueLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { book: string; borrower: string; due_date: string }) =>
      libraryService.issueLoan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useReturnBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (loanId: string | number) => libraryService.returnBook(loanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

// ==========================================
// 9. NOTIFICATIONS HOOKS
// ==========================================
export function useNotifications(params?: QueryParams) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationService.getNotifications(params),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ==========================================
// 10. ACADEMICS & REPORTS HOOKS
// ==========================================
export function useClasses(params?: QueryParams) {
  return useQuery({
    queryKey: ['classes', params],
    queryFn: () => academicService.getClasses(params),
  });
}

export function useSubjects(params?: QueryParams) {
  return useQuery({
    queryKey: ['subjects', params],
    queryFn: () => academicService.getSubjects(params),
  });
}

export function useExecutiveReport() {
  return useQuery({
    queryKey: ['reports', 'executive'],
    queryFn: () => reportService.getExecutiveReport(),
  });
}

export function useAdvancedAnalytics() {
  return useQuery({
    queryKey: ['reports', 'analytics'],
    queryFn: () => reportService.getAdvancedAnalytics(),
  });
}
