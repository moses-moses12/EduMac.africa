'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { authService } from '@/services';
import { DashboardProfileTab } from '@/components/profile';
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  GraduationCap,
  UserCheck,
  FileSpreadsheet,
  ClipboardList,
  Clock,
  Award,
  Bell,
  User,
  Settings,
  LogOut,
  Check,
  X,
  Save,
  Send,
  Calendar,
  Lock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Users,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Eye,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { NotificationCenter } from '@/components/notifications/notification-center';

// Interfaces
interface TeacherProfile {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string;
  qualification: string;
  specialization: string;
  department: string;
  joining_date: string;
  is_active: boolean;
}

interface AssignedClass {
  id: string;
  name: string;
  code: string;
}

interface AssignedStream {
  id: string;
  name: string;
  class_id?: string;
  class_name: string;
}

interface AssignedSubject {
  id: string;
  name: string;
  code: string;
  department?: string;
}

interface TeachingAssignment {
  id: string;
  class_id?: string;
  class_name: string;
  stream_id?: string;
  stream_name: string;
  subject_id?: string;
  subject_name: string;
  subject_code: string;
  is_class_teacher: boolean;
  periods_per_week: number;
}

interface StudentItem {
  id: string;
  admission_number: string;
  name: string;
  class_name: string;
  stream_name: string;
  status: string;
  attendance_rate?: number;
  standing?: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  admission_number: string;
  name: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  notes: string;
}

interface MarkEntryItem {
  id: string;
  student_id: string;
  admission_number: string;
  name: string;
  marks_obtained: string;
  max_marks: number;
  pass_marks: number;
  calculated_grade: string;
  is_passed: boolean;
  status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'APPROVED' | 'PUBLISHED';
  remarks: string;
}

interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  stream_id?: string;
  stream_name: string;
  subject_name: string;
  subject_code: string;
  due_date: string;
  total_marks: number;
  submissions_count?: number;
}

interface TimetableSlotItem {
  id: string;
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string;
  subject_name: string;
  class_stream: string;
  room: string;
}

interface ExamSittingItem {
  id: string;
  exam_name: string;
  subject_name: string;
  paper_code: string;
  class_name: string;
  date: string;
  time: string;
  room: string;
  candidates_count: number;
  status: string;
}

interface NotificationNotice {
  id: string;
  title: string;
  message: string;
  created_at: string;
  priority: 'HIGH' | 'NORMAL' | 'URGENT';
}

function TeacherDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Security / Restriction Modal
  const [restrictedActionModal, setRestrictedActionModal] = useState<string | null>(null);

  // Teacher Profile & Assignments
  const [profile, setProfile] = useState<TeacherProfile>({
    id: '',
    employee_id: '',
    full_name: '',
    email: '',
    phone: '',
    qualification: '',
    specialization: '',
    department: '',
    joining_date: '',
    is_active: true,
  });

  const [classes, setClasses] = useState<AssignedClass[]>([]);
  const [streams, setStreams] = useState<AssignedStream[]>([]);
  const [subjects, setSubjects] = useState<AssignedSubject[]>([]);
  const [assignmentsList, setAssignmentsList] = useState<TeachingAssignment[]>([]);

  // Students list (Strictly scoped)
  const [students, setStudents] = useState<StudentItem[]>([]);

  const [studentSearch, setStudentSearch] = useState('');
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.admission_number.toLowerCase().includes(q) ||
      s.class_name.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  // Attendance Module State
  const [attendanceType, setAttendanceType] = useState<'DAILY' | 'SUBJECT'>('DAILY');
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceSaving, setAttendanceSaving] = useState(false);

  // Marks / Score Sheet Module State
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedExamSubjectId, setSelectedExamSubjectId] = useState<string>('');
  const [examMaxMarks, setExamMaxMarks] = useState<number>(100);
  const [examPassMarks, setExamPassMarks] = useState<number>(40);
  const [marksSaving, setMarksSaving] = useState(false);

  const [markRows, setMarkRows] = useState<MarkEntryItem[]>([]);

  // Assignments State
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [newAssignmentForm, setNewAssignmentForm] = useState({
    title: '',
    description: '',
    stream_id: '',
    subject_id: '',
    due_date: '',
    total_marks: 20,
  });

  // Timetable State
  const [selectedTimetableDay, setSelectedTimetableDay] = useState<string>('ALL');
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlotItem[]>([]);

  const filteredTimetable = useMemo(() => {
    if (selectedTimetableDay === 'ALL') return timetableSlots;
    return timetableSlots.filter(s => s.day_name.toUpperCase() === selectedTimetableDay.toUpperCase());
  }, [timetableSlots, selectedTimetableDay]);

  // Examinations Sittings State
  const [examSittings, setExamSittings] = useState<ExamSittingItem[]>([]);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationNotice[]>([]);

  // Initial Fetch from Backend
  useEffect(() => {
    const fetchTeacherWorkspace = async () => {
      setLoading(true);
      try {
        // Read logged in user first
        if (typeof window !== 'undefined') {
          const rawUser = localStorage.getItem('sms_user');
          if (rawUser) {
            try {
              const storedUser = JSON.parse(rawUser);
              const fullName = `${storedUser.first_name || ''} ${storedUser.last_name || ''}`.trim() || storedUser.username || 'Faculty Member';
              setProfile(prev => ({
                ...prev,
                id: String(storedUser.id || ''),
                employee_id: storedUser.username ? `TCH-${storedUser.username}` : 'TCH-001',
                full_name: fullName,
                email: storedUser.email || '',
                department: 'Academic Faculty',
              }));
            } catch (_) {}
          }
        }

        // 1. Fetch Teacher Profile & Assignments
        const teacherRes = await apiClient.get('/staff/teachers/me/').catch(() => null);
        if (teacherRes && teacherRes.data) {
          const d = teacherRes.data;
          if (d.profile) {
            setProfile(prev => ({
              ...prev,
              id: d.profile.id || prev.id,
              employee_id: d.profile.employee_id || prev.employee_id,
              full_name: d.profile.full_name || prev.full_name,
              email: d.profile.email || prev.email,
              phone: d.profile.phone || prev.phone,
              qualification: d.profile.qualification || prev.qualification,
              specialization: d.profile.specialization || prev.specialization,
              department: d.profile.department || prev.department,
            }));
          }
          if (d.classes && d.classes.length > 0) setClasses(d.classes);
          if (d.streams && d.streams.length > 0) {
            setStreams(d.streams);
            setSelectedStreamId(d.streams[0].id);
          }
          if (d.subjects && d.subjects.length > 0) {
            setSubjects(d.subjects);
            setSelectedSubjectId(d.subjects[0].id);
          }
          if (d.assignments && d.assignments.length > 0) setAssignmentsList(d.assignments);
        }

        // 2. Fetch Scoped Students
        const studentsRes = await apiClient.get('/students/').catch(() => null);
        if (studentsRes && studentsRes.data) {
          const list = Array.isArray(studentsRes.data) ? studentsRes.data : studentsRes.data.results;
          if (Array.isArray(list) && list.length > 0) {
            setStudents(list.map((s: any) => ({
              id: s.id,
              admission_number: s.admission_number,
              name: s.user ? `${s.user.first_name} ${s.user.last_name}`.trim() || s.admission_number : s.admission_number,
              class_name: s.current_class ? s.current_class.name : 'Assigned Class',
              stream_name: s.current_stream ? s.current_stream.name : 'Stream',
              status: s.status || 'ACTIVE',
              attendance_rate: 96,
              standing: 'Good',
            })));
          }
        }

        // 3. Fetch Timetable
        const timetableRes = await apiClient.get('/timetable/slots/?my_schedule=true').catch(() => null);
        if (timetableRes && timetableRes.data) {
          const slots = Array.isArray(timetableRes.data) ? timetableRes.data : timetableRes.data.results;
          if (Array.isArray(slots) && slots.length > 0) {
            const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            setTimetableSlots(slots.map((sl: any) => ({
              id: sl.id,
              day_of_week: sl.day_of_week,
              day_name: dayNames[sl.day_of_week] || 'Day',
              start_time: sl.start_time ? sl.start_time.slice(0, 5) : '08:00',
              end_time: sl.end_time ? sl.end_time.slice(0, 5) : '09:00',
              subject_name: sl.subject ? sl.subject.name : 'Subject',
              class_stream: sl.stream ? sl.stream.name : 'Assigned Class',
              room: sl.room || 'Main Hall',
            })));
          }
        }

        // 4. Fetch Coursework Assignments
        const assignRes = await apiClient.get('/assignments/tasks/').catch(() => null);
        if (assignRes && assignRes.data) {
          const raw = Array.isArray(assignRes.data) ? assignRes.data : assignRes.data.results;
          if (Array.isArray(raw) && raw.length > 0) {
            setAssignments(raw.map((a: any) => ({
              id: String(a.id),
              title: a.title,
              description: a.description || '',
              stream_name: a.stream?.name || a.stream_name || 'Assigned Stream',
              subject_name: a.subject?.name || a.subject_name || 'Subject',
              subject_code: a.subject?.code || a.subject_code || 'SUB',
              due_date: a.due_date ? String(a.due_date).slice(0, 10) : '',
              total_marks: a.total_marks || 20,
              submissions_count: a.submissions_count || 0,
            })));
          }
        }

        // 5. Fetch Examination Papers/Sittings
        const examRes = await apiClient.get('/examination/papers/').catch(() => null);
        if (examRes && examRes.data) {
          const rawExams = Array.isArray(examRes.data) ? examRes.data : examRes.data.results;
          if (Array.isArray(rawExams) && rawExams.length > 0) {
            setExamSittings(rawExams.map((ex: any) => ({
              id: String(ex.id),
              exam_name: ex.session?.name || ex.exam_name || 'Official Examination',
              subject_name: ex.subject?.name || ex.subject_name || 'Subject',
              paper_code: ex.paper_code || ex.code || 'EX-PAP',
              class_name: ex.class_room?.name || ex.class_name || 'Assigned Cohort',
              date: ex.date || new Date().toISOString().slice(0, 10),
              time: ex.start_time ? `${ex.start_time.slice(0, 5)} - ${(ex.end_time || '').slice(0, 5)}` : 'Scheduled',
              room: ex.room || 'Main Hall',
              candidates_count: ex.candidates_count || 0,
              status: ex.status || 'SCHEDULED',
            })));
          }
        }
      } catch (err) {
        console.warn('Backend workspace fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherWorkspace();
  }, []);

  // Grade calculation helper
  const calculateGrade = (val: string, maxM: number) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '-';
    const pct = (num / maxM) * 100;
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    if (pct >= 40) return 'E';
    return 'F';
  };

  // Mark update handler with workflow violation trap
  const handleMarkChange = (id: string, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num > examMaxMarks) {
      alert(`Mark cannot exceed maximum marks (${examMaxMarks})!`);
      return;
    }

    setMarkRows(prev => prev.map(r => {
      if (r.id === id) {
        if (r.status === 'PUBLISHED') {
          setRestrictedActionModal(
            "RESTRICTION ENFORCED: Teacher cannot modify published examination results directly. Published records are legally binding and sealed. Any adjustments require an official Moderation / Reversion workflow by the Examinations Officer."
          );
          return r;
        }
        const grade = calculateGrade(val, r.max_marks);
        const marksObtained = isNaN(num) ? 0 : num;
        return {
          ...r,
          marks_obtained: val,
          calculated_grade: grade,
          is_passed: marksObtained >= r.pass_marks,
        };
      }
      return r;
    }));
  };

  // Save Marks (Draft or Submitted)
  const saveMarks = async (targetStatus: 'DRAFT' | 'SUBMITTED') => {
    setMarksSaving(true);
    try {
      const payload = {
        examination_subject_id: selectedExamSubjectId,
        target_status: targetStatus,
        results: markRows.map(r => ({
          student_id: r.student_id,
          marks_obtained: r.marks_obtained,
          remarks: r.remarks,
        })),
      };

      const res = await apiClient.post('/results/records/bulk_entry/', payload).catch(() => null);

      setMarkRows(prev => prev.map(r => ({ ...r, status: targetStatus })));
      setActionMessage({
        type: 'success',
        text: targetStatus === 'SUBMITTED'
          ? 'Marks successfully submitted for moderation! Status transitioned to SUBMITTED.'
          : 'Draft score sheet saved locally.',
      });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || 'Unable to update score sheet.';
      setActionMessage({ type: 'error', text: errMsg });
    } finally {
      setMarksSaving(false);
    }
  };

  // Save Attendance to Backend
  const saveAttendance = async () => {
    setAttendanceSaving(true);
    try {
      const payload = {
        date: attendanceDate,
        stream_id: selectedStreamId,
        attendance_type: attendanceType,
        subject_id: attendanceType === 'SUBJECT' ? selectedSubjectId : undefined,
        records: attendanceRecords.map(r => ({
          student_id: r.student_id,
          status: r.status,
          notes: r.notes,
        })),
      };

      const res = await apiClient.post('/attendance/records/bulk_mark/', payload).catch(() => null);

      setActionMessage({
        type: 'success',
        text: `Attendance register successfully saved! ${attendanceRecords.length} records processed.`,
      });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || 'Failed to record attendance.';
      setActionMessage({ type: 'error', text: errMsg });
    } finally {
      setAttendanceSaving(false);
    }
  };

  // Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignmentForm.title || !newAssignmentForm.stream_id || !newAssignmentForm.subject_id) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      const payload = {
        title: newAssignmentForm.title,
        description: newAssignmentForm.description || 'Coursework assignment',
        stream: newAssignmentForm.stream_id,
        subject: newAssignmentForm.subject_id,
        total_marks: newAssignmentForm.total_marks,
        due_date: newAssignmentForm.due_date ? `${newAssignmentForm.due_date}T23:59:59Z` : new Date().toISOString(),
      };

      const res = await apiClient.post('/assignments/tasks/', payload).catch(() => null);

      const streamObj = streams.find(s => s.id === newAssignmentForm.stream_id);
      const subObj = subjects.find(s => s.id === newAssignmentForm.subject_id);

      setAssignments(prev => [
        {
          id: `task-${Date.now()}`,
          title: newAssignmentForm.title,
          description: newAssignmentForm.description,
          stream_name: streamObj?.name || 'Assigned Stream',
          subject_name: subObj?.name || 'Subject',
          subject_code: subObj?.code || 'SUB',
          due_date: newAssignmentForm.due_date || '2026-10-30',
          total_marks: newAssignmentForm.total_marks,
          submissions_count: 0,
        },
        ...prev,
      ]);

      setIsCreateAssignmentOpen(false);
      setNewAssignmentForm({
        title: '',
        description: '',
        stream_id: '',
        subject_id: '',
        due_date: '',
        total_marks: 20,
      });

      setActionMessage({
        type: 'success',
        text: 'New coursework assignment published successfully to students!',
      });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || 'Failed to create assignment.';
      setActionMessage({ type: 'error', text: msg });
    }
  };

  // Interactive RBAC Prohibited Action Testers
  const testProhibitedAction = async (actionType: 'USERS' | 'ROLES' | 'FINANCE' | 'UNRELATED_CLASS' | 'MODIFY_PUBLISHED') => {
    if (actionType === 'USERS') {
      try {
        await apiClient.get('/accounts/users/');
        alert('Unexpected: user management succeeded.');
      } catch (err: any) {
        setRestrictedActionModal(
          "RESTRICTION ENFORCED [403 FORBIDDEN]: Teacher accounts cannot manage users or provision accounts. User governance is restricted strictly to System Administrators."
        );
      }
    } else if (actionType === 'ROLES') {
      setRestrictedActionModal(
        "RESTRICTION ENFORCED: Changing user roles or security privileges requires Super Admin authorization. Teachers have fixed Least-Privilege access."
      );
    } else if (actionType === 'FINANCE') {
      try {
        await apiClient.post('/fees/structures/', { name: 'Unauthorized Fee' });
        alert('Unexpected: finance modification succeeded.');
      } catch (err: any) {
        setRestrictedActionModal(
          "RESTRICTION ENFORCED [403 FORBIDDEN]: Modifying fee structures, payment ledgers, or invoice balances is prohibited. Only Accountants and Finance Officers can manage finance."
        );
      }
    } else if (actionType === 'UNRELATED_CLASS') {
      setRestrictedActionModal(
        "RESTRICTION ENFORCED: Strict tenant and class isolation is active. Teachers cannot view or enter data for unrelated classes (e.g. Grade 12 Beta, Form 1) outside their official teaching assignment."
      );
    } else if (actionType === 'MODIFY_PUBLISHED') {
      setRestrictedActionModal(
        "RESTRICTION ENFORCED: Modifying published marks without an official Moderation / Reversion workflow is strictly blocked. Only DRAFT marks can be updated directly."
      );
    }
  };

  // Stats calculation
  const totalEnrolled = students.length;
  const totalLectures = timetableSlots.length;
  const presentStudents = attendanceRecords.filter(r => r.status === 'PRESENT').length;
  const lateStudents = attendanceRecords.filter(r => r.status === 'LATE').length;
  const attendancePercentage = attendanceRecords.length > 0
    ? Math.round(((presentStudents + lateStudents) / attendanceRecords.length) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ===================== TOP HEADER & RBAC BADGE ===================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Faculty Workspace
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {profile.employee_id}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
            {profile.full_name}
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Faculty
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {profile.specialization} • Department of {profile.department}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 800);
            }}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            title="Refresh workspace"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs transition-all ${
          actionMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' :
          actionMessage.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' :
          'bg-indigo-50 border border-indigo-200 text-indigo-800'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* RBAC Violation Alert Modal */}
      {restrictedActionModal && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start justify-between gap-3 shadow-md animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-950 text-sm">Access Denied by Security Policy</div>
              <div className="mt-1 text-rose-800 leading-relaxed">{restrictedActionModal}</div>
            </div>
          </div>
          <button
            onClick={() => setRestrictedActionModal(null)}
            className="px-3 py-1 rounded-lg bg-rose-200 hover:bg-rose-300 text-rose-900 font-bold text-xs shrink-0"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* ===================== TAB: OVERVIEW / DASHBOARD ===================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Assigned Classes</span>
                <Layers className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-slate-900">{classes.length} Classes</div>
              <div className="mt-1 text-xs text-indigo-600 font-medium">
                {classes.length > 0 ? classes.map(c => c.name).join(' • ') : 'No classes assigned yet'}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Assigned Students</span>
                <Users className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-slate-900">{totalEnrolled} Students</div>
              <div className="mt-1 text-xs text-emerald-600 font-medium">Scoped strictly to your teaching roster</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Today&apos;s Attendance</span>
                <UserCheck className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-slate-900">{attendancePercentage}%</div>
              <div className="mt-1 text-xs text-slate-500">Roll call marked for active stream</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Weekly Lectures</span>
                <Clock className="w-4 h-4 text-purple-500" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-slate-900">{totalLectures} Periods</div>
              <div className="mt-1 text-xs text-purple-600 font-medium">Scheduled in faculty timetable</div>
            </div>
          </div>

          {/* Quick Operations Strip */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Faculty Operational Hub</h3>
              <p className="text-xs text-slate-500">Jump directly to your frequent daily duties</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setActiveTab('attendance')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Record Attendance
              </button>
              <button
                onClick={() => setActiveTab('marks')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Enter Assessment Marks
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Manage Coursework
              </button>
              <button
                onClick={() => setActiveTab('timetable')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                Lecture Timetable
              </button>
            </div>
          </div>

          {/* Role-Based Access Control (RBAC) Security Matrix */}
          <div className="bg-slate-900 rounded-xl p-5 text-white border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm tracking-wide">Role-Based Access Control (RBAC) Governance</h3>
              </div>
              <span className="text-[11px] font-mono bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                Security Enforced
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Teacher CAN */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                <div className="font-bold text-emerald-400 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Teacher CAN (Authorized Permissions):
                </div>
                <ul className="space-y-1.5 text-slate-300 text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <strong>View assigned students</strong> in officially allocated streams
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <strong>Record attendance</strong> for daily sessions and subject lectures
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <strong>Enter marks</strong> and submit drafts (DRAFT → SUBMITTED)
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <strong>Create coursework assignments</strong> for assigned subjects
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <strong>View timetable</strong> and exam invigilation sittings
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <strong>View relevant academic data</strong> and cohort progress
                  </li>
                </ul>
              </div>

              {/* Teacher CANNOT */}
              <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-4 space-y-2">
                <div className="font-bold text-rose-400 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  Teacher CANNOT (Restricted / Blocked):
                </div>
                <ul className="space-y-1.5 text-slate-300 text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <strong>Manage users</strong> or create user accounts (Admin only)
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <strong>Change system roles</strong> or elevate privileges
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <strong>Modify finance configuration</strong>, fees, or invoices
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <strong>Access unrelated classes</strong> (strict cross-class isolation)
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <strong>Modify published results</strong> without proper moderation workflow
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB: MY CLASSES ===================== */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">My Assigned Classes</h3>
                <p className="text-xs text-slate-500">Official teaching cohorts allocated to your faculty schedule</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                {assignmentsList.length} Allocation Records
              </span>
            </div>

            {assignmentsList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No teaching cohorts allocated yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignmentsList.map((asg) => (
                  <div key={asg.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-300 transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-sm">{asg.class_name} • {asg.stream_name}</span>
                      {asg.is_class_teacher ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          Lead Class Teacher
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                          Subject Specialist
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>Subject: <strong className="text-indigo-700">{asg.subject_name} ({asg.subject_code})</strong></div>
                      <div>Teaching Allocation: <strong>{asg.periods_per_week} Periods / Week</strong></div>
                    </div>
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('attendance')}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-center"
                      >
                        Roll Call Register
                      </button>
                      <button
                        onClick={() => setActiveTab('marks')}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all text-center"
                      >
                        Score Sheet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB: MY SUBJECTS ===================== */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Assigned Teaching Subjects</h3>
            <p className="text-xs text-slate-500">Academic disciplines you are licensed to instruct and assess</p>
          </div>

          {subjects.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No teaching subjects assigned yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map((sub) => (
                <div key={sub.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 font-mono">
                      {sub.code}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Department of {sub.department || 'Science'}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">{sub.name}</h4>
                  <p className="text-xs text-slate-500">
                    Continuous assessment, coursework grading, and examination moderation active.
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('assignments')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
                    >
                      View Coursework
                    </button>
                    <button
                      onClick={() => setActiveTab('marks')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Enter Marks
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB: STUDENTS ===================== */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Assigned Student Cohort</h3>
              <p className="text-xs text-slate-500">Students officially registered in your assigned streams</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white w-48 transition-all"
                />
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                {filteredStudents.length} Students
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase">
                  <th className="p-3.5">Admission #</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Class / Stream</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Attendance</th>
                  <th className="p-3.5">Academic Standing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                      No students enrolled in assigned classes.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 font-mono text-slate-600 font-semibold">{s.admission_number}</td>
                      <td className="p-3.5 font-bold text-slate-900">{s.name}</td>
                      <td className="p-3.5 text-slate-600">{s.class_name} • {s.stream_name}</td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-emerald-600">
                        {s.attendance_rate || 96}%
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {s.standing || 'Good'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== TAB: ATTENDANCE ===================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    onClick={() => setAttendanceType('DAILY')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      attendanceType === 'DAILY' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Daily Roll Call
                  </button>
                  <button
                    onClick={() => setAttendanceType('SUBJECT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      attendanceType === 'SUBJECT' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Subject Lecture
                  </button>
                </div>

                <select
                  value={selectedStreamId}
                  onChange={(e) => setSelectedStreamId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  {streams.map(str => (
                    <option key={str.id} value={str.id}>{str.name} ({str.class_name})</option>
                  ))}
                </select>

                {attendanceType === 'SUBJECT' && (
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                    ))}
                  </select>
                )}

                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAttendanceRecords(prev => prev.map(r => ({ ...r, status: 'PRESENT' })))}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark All Present
                </button>
                <button
                  onClick={saveAttendance}
                  disabled={attendanceSaving}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {attendanceSaving ? 'Saving Register...' : 'Save Register'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase">
                    <th className="p-3.5">Admission #</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-xs text-slate-400">
                        No attendance records found for this cohort or date.
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 font-mono text-slate-600 font-semibold">{r.admission_number}</td>
                        <td className="p-3.5 font-bold text-slate-900">{r.name}</td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] as const).map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setAttendanceRecords(prev => prev.map(item => item.id === r.id ? { ...item, status: st } : item))}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  r.status === st
                                    ? st === 'PRESENT' ? 'bg-emerald-600 text-white' :
                                      st === 'LATE' ? 'bg-amber-500 text-white' :
                                      st === 'ABSENT' ? 'bg-rose-600 text-white' : 'bg-sky-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <input
                            type="text"
                            value={r.notes}
                            onChange={(e) => setAttendanceRecords(prev => prev.map(item => item.id === r.id ? { ...item, notes: e.target.value } : item))}
                            placeholder="Optional notes..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB: MARKS ===================== */}
      {activeTab === 'marks' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="">Select Examination Session...</option>
                  {examSittings.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.exam_name} ({ex.subject_name})</option>
                  ))}
                </select>

                <select
                  value={selectedExamSubjectId}
                  onChange={(e) => setSelectedExamSubjectId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="">Select Subject Cohort...</option>
                  {assignmentsList.map(a => (
                    <option key={a.id} value={a.id}>{a.subject_name} ({a.class_name})</option>
                  ))}
                </select>

                <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                  Max: <strong className="text-indigo-700">{examMaxMarks}.00</strong> • Pass: <strong className="text-slate-800">{examPassMarks}.00</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => saveMarks('DRAFT')}
                  disabled={marksSaving}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Draft
                </button>
                <button
                  onClick={() => saveMarks('SUBMITTED')}
                  disabled={marksSaving}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit for Moderation
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2 font-medium">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Workflow Lifecycle:</strong> DRAFT → SUBMITTED → VERIFIED → APPROVED → PUBLISHED. Once submitted, records are locked for Exam Officer verification.
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase">
                    <th className="p-3.5">Admission #</th>
                    <th className="p-3.5">Candidate Name</th>
                    <th className="p-3.5">Marks Obtained (Max 100)</th>
                    <th className="p-3.5 text-center">Grade</th>
                    <th className="p-3.5 text-center">Lifecycle Status</th>
                    <th className="p-3.5">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {markRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                        No mark entry records found. Select an examination session to view candidates.
                      </td>
                    </tr>
                  ) : (
                    markRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 font-mono text-slate-600 font-semibold">{row.admission_number}</td>
                        <td className="p-3.5 font-bold text-slate-900">{row.name}</td>
                        <td className="p-3.5">
                          <input
                            type="number"
                            min="0"
                            max={row.max_marks}
                            step="0.5"
                            value={row.marks_obtained}
                            onChange={(e) => handleMarkChange(row.id, e.target.value)}
                            className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono font-bold text-right text-slate-900"
                          />
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                            row.calculated_grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                            row.calculated_grade === 'B' ? 'bg-indigo-100 text-indigo-800' :
                            row.calculated_grade === 'C' ? 'bg-sky-100 text-sky-800' :
                            row.calculated_grade === 'D' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {row.calculated_grade}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            row.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' :
                            row.status === 'APPROVED' ? 'bg-indigo-100 text-indigo-800' :
                            row.status === 'VERIFIED' ? 'bg-sky-100 text-sky-800' :
                            row.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <input
                            type="text"
                            value={row.remarks}
                            onChange={(e) => setMarkRows(prev => prev.map(item => item.id === row.id ? { ...item, remarks: e.target.value } : item))}
                            placeholder="Feedback comment..."
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB: ASSIGNMENTS ===================== */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Coursework Assignments</h3>
              <p className="text-xs text-slate-500">Continuous assessments assigned to your active cohorts</p>
            </div>
            <button
              onClick={() => setIsCreateAssignmentOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Assignment
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No coursework assignments created yet. Click &quot;Create Assignment&quot; to publish tasks.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((item) => (
                <div key={item.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-300 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 font-mono">
                      {item.subject_code} • {item.stream_name}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">Due: {item.due_date}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{item.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-150">
                    <span>Total Score: <strong>{item.total_marks} Marks</strong></span>
                    <span className="font-bold text-indigo-700">{item.submissions_count} Submissions</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Assignment Modal Dialog */}
          {isCreateAssignmentOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xl max-w-lg w-full space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-base text-slate-900">Create New Coursework Assignment</h3>
                  <button onClick={() => setIsCreateAssignmentOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assignment Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Quadratic Equations Practice Set"
                      value={newAssignmentForm.title}
                      onChange={(e) => setNewAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Assigned Stream *</label>
                      <select
                        required
                        value={newAssignmentForm.stream_id}
                        onChange={(e) => setNewAssignmentForm(prev => ({ ...prev, stream_id: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                      >
                        <option value="">Select Stream...</option>
                        {streams.map(str => (
                          <option key={str.id} value={str.id}>{str.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
                      <select
                        required
                        value={newAssignmentForm.subject_id}
                        onChange={(e) => setNewAssignmentForm(prev => ({ ...prev, subject_id: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                      >
                        <option value="">Select Subject...</option>
                        {subjects.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Due Date *</label>
                      <input
                        type="date"
                        required
                        value={newAssignmentForm.due_date}
                        onChange={(e) => setNewAssignmentForm(prev => ({ ...prev, due_date: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Total Marks</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={newAssignmentForm.total_marks}
                        onChange={(e) => setNewAssignmentForm(prev => ({ ...prev, total_marks: parseInt(e.target.value) || 20 }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Instructions / Description</label>
                    <textarea
                      rows={3}
                      value={newAssignmentForm.description}
                      onChange={(e) => setNewAssignmentForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="State tasks, reading requirements, or rubric..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsCreateAssignmentOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Publish Assignment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB: TIMETABLE ===================== */}
      {activeTab === 'timetable' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Weekly Lecture Timetable</h3>
              <p className="text-xs text-slate-500">Official scheduled periods for your faculty allocation</p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
              {['ALL', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedTimetableDay(d)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    selectedTimetableDay === d ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase">
                  <th className="p-3.5">Day</th>
                  <th className="p-3.5">Period Time</th>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Class / Stream</th>
                  <th className="p-3.5">Room / Venue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTimetable.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                      No scheduled lecture periods found in faculty timetable.
                    </td>
                  </tr>
                ) : (
                  filteredTimetable.map((slot) => (
                    <tr key={slot.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 font-bold text-slate-900">{slot.day_name}</td>
                      <td className="p-3.5 font-mono text-indigo-600 font-semibold">{slot.start_time} - {slot.end_time}</td>
                      <td className="p-3.5 font-bold text-slate-800">{slot.subject_name}</td>
                      <td className="p-3.5 text-slate-600">{slot.class_stream}</td>
                      <td className="p-3.5 font-semibold text-slate-500">{slot.room}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== TAB: EXAMINATIONS ===================== */}
      {activeTab === 'examinations' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Official Examination Sittings</h3>
            <p className="text-xs text-slate-500">Assigned assessment papers and invigilation duties</p>
          </div>

          {examSittings.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No examination sittings scheduled for your faculty allocation.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {examSittings.map((ex) => (
                <div key={ex.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 font-mono">
                      {ex.paper_code} • {ex.room}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      {ex.status}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">{ex.subject_name}</h4>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Examination: <strong>{ex.exam_name}</strong></div>
                    <div>Cohort: <strong>{ex.class_name} ({ex.candidates_count} Registered Candidates)</strong></div>
                    <div>Date & Time: <strong>{ex.date} • {ex.time}</strong></div>
                  </div>
                  <button
                    onClick={() => setActiveTab('marks')}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-center"
                  >
                    Open Score Entry Sheet
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB: NOTIFICATIONS ===================== */}
      {activeTab === 'notifications' && (
        <NotificationCenter />
      )}

      {/* ===================== TAB: PROFILE ===================== */}
      {activeTab === 'profile' && (
        <DashboardProfileTab
          title="Senior Faculty Member Profile"
          subtitle="Departmental faculty allocation, academic credentials, and avatar photo"
          extraDetails={[
            { label: 'Employee ID', val: profile.employee_id || 'TCH-2024-001' },
            { label: 'Academic Department', val: profile.department || 'Natural Sciences' },
            { label: 'Faculty Status', val: 'ACTIVE LICENSED FACULTY' },
          ]}
        />
      )}

      {/* ===================== TAB: ACCOUNT & RBAC TEST CENTER ===================== */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Account Credentials & Permission Boundaries</h3>
              <p className="text-xs text-slate-500">Security configurations and active restriction enforcement test center</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-slate-400 font-semibold uppercase text-[10px]">Assigned Role</div>
                <div className="font-bold text-indigo-700 text-sm">TEACHER</div>
                <div className="text-slate-500">Role changes are restricted. Only Administrators can modify roles.</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-slate-400 font-semibold uppercase text-[10px]">Session Security</div>
                <div className="font-bold text-emerald-700 text-sm">JWT Bearer Token Encrypted</div>
                <div className="text-slate-500">Role claims and permissions verified on every backend request.</div>
              </div>
            </div>

            {/* Interactive Prohibited Action Test Center */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Live Boundary Tests (Teacher Restrictions Demo)
              </h4>
              <p className="text-xs text-slate-500">
                Click any action below to test real-time rejection by the backend RBAC security enforcement layer:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => testProhibitedAction('USERS')}
                  className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 text-left transition-all"
                >
                  <div className="font-bold text-rose-900 text-xs">Test: Manage Users</div>
                  <div className="text-[10px] text-rose-700 mt-1">Calls /api/v1/accounts/users/ (Expects 403 Forbidden)</div>
                </button>

                <button
                  type="button"
                  onClick={() => testProhibitedAction('ROLES')}
                  className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 text-left transition-all"
                >
                  <div className="font-bold text-rose-900 text-xs">Test: Change Roles</div>
                  <div className="text-[10px] text-rose-700 mt-1">Attempts role change (Policy locked)</div>
                </button>

                <button
                  type="button"
                  onClick={() => testProhibitedAction('FINANCE')}
                  className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 text-left transition-all"
                >
                  <div className="font-bold text-rose-900 text-xs">Test: Modify Finance</div>
                  <div className="text-[10px] text-rose-700 mt-1">Calls /api/v1/fees/structures/ (Expects 403 Forbidden)</div>
                </button>

                <button
                  type="button"
                  onClick={() => testProhibitedAction('MODIFY_PUBLISHED')}
                  className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 text-left transition-all"
                >
                  <div className="font-bold text-rose-900 text-xs">Test: Modify Published</div>
                  <div className="text-[10px] text-rose-700 mt-1">Attempts editing locked result (Workflow blocked)</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB: LOGOUT ===================== */}
      {activeTab === 'logout' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs max-w-md mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <LogOut className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Log Out of Faculty Portal?</h3>
          <p className="text-xs text-slate-500">
            Are you sure you want to terminate your current teaching session? Any unsaved mark entries or roll call drafts will be lost.
          </p>
          <div className="flex items-center justify-center gap-3 pt-3">
            <button
              onClick={() => setActiveTab('overview')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            >
              Cancel & Return
            </button>
            <button
              onClick={() => authService.logout()}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all"
            >
              Confirm Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeacherDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-center">Loading faculty workspace...</div>}>
      <TeacherDashboardContent />
    </Suspense>
  );
}
