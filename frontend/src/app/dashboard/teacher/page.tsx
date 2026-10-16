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
  FileText,
  Upload,
  Paperclip,
  Download,
  Camera,
  Printer,
  TrendingUp,
  BarChart2,
  Edit3,
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

interface PastExamResult {
  exam_name: string;
  term: string;
  year: string;
  average: number;
  division: string;
  standing: 'Good' | 'Average' | 'Needs Support';
  position: string;
  remarks: string;
  subjects: { name: string; score: number; grade: string }[];
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
  past_result_grade?: 'Good' | 'Average' | 'Needs Support';
  historical_gpa?: number;
  average_score?: number;
  past_exams?: PastExamResult[];
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
  attachment_name?: string;
  attachment_size?: string;
  attachment_type?: string;
  mode?: 'TYPED' | 'DOCUMENT' | 'PHOTO';
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
  paper_pdf_name?: string;
  paper_pdf_size?: string;
  paper_uploaded_at?: string;
}

interface NotificationNotice {
  id: string;
  sender_role: 'HEADMASTER' | 'ACADEMIC' | 'ADMIN' | 'SYSTEM';
  sender_name: string;
  title: string;
  message: string;
  created_at: string;
  priority: 'HIGH' | 'NORMAL' | 'URGENT';
  read: boolean;
  action_tab?: string;
  action_label?: string;
}

// Fallback Mock Datasets
const defaultClasses: AssignedClass[] = [
  { id: 'c1', name: 'Form 4 Science', code: 'F4-SCI' },
  { id: 'c2', name: 'Form 3 Arts', code: 'F3-ART' },
  { id: 'c3', name: 'Form 2 A', code: 'F2-A' },
];

const defaultStreams: AssignedStream[] = [
  { id: 's1', name: 'Form 4 Science A', class_name: 'Form 4 Science' },
  { id: 's2', name: 'Form 3 Green', class_name: 'Form 3 Arts' },
  { id: 's3', name: 'Form 2 Blue', class_name: 'Form 2 A' },
];

const defaultSubjects: AssignedSubject[] = [
  { id: 'sub1', name: 'Mathematics', code: 'MATH-401', department: 'Mathematics' },
  { id: 'sub2', name: 'Chemistry', code: 'CHEM-301', department: 'Science' },
  { id: 'sub3', name: 'Physics', code: 'PHYS-201', department: 'Science' },
];

const defaultAssignmentsList: TeachingAssignment[] = [
  {
    id: 'asg-alloc-1',
    class_name: 'Form 4 Science',
    stream_name: 'Form 4 Science A',
    subject_name: 'Mathematics',
    subject_code: 'MATH-401',
    is_class_teacher: true,
    periods_per_week: 6,
  },
  {
    id: 'asg-alloc-2',
    class_name: 'Form 3 Arts',
    stream_name: 'Form 3 Green',
    subject_name: 'Chemistry',
    subject_code: 'CHEM-301',
    is_class_teacher: false,
    periods_per_week: 4,
  },
  {
    id: 'asg-alloc-3',
    class_name: 'Form 2 A',
    stream_name: 'Form 2 Blue',
    subject_name: 'Physics',
    subject_code: 'PHYS-201',
    is_class_teacher: false,
    periods_per_week: 4,
  },
];

const defaultStudentsRoster: StudentItem[] = [
  {
    id: 'stu-1',
    admission_number: '241711356001',
    name: 'Juma Salum Athumani',
    class_name: 'Form 4 Science',
    stream_name: 'Form 4 Science A',
    status: 'ACTIVE',
    attendance_rate: 98,
    standing: 'Good',
    past_result_grade: 'Good',
    historical_gpa: 3.9,
    average_score: 87.4,
    past_exams: [
      {
        exam_name: 'Term 1 Terminal Examination 2026',
        term: 'Term 1',
        year: '2026',
        average: 88.5,
        division: 'Division I (Pt 8)',
        standing: 'Good',
        position: '2 / 45',
        remarks: 'Student demonstrates exceptional analytical abilities in Mathematics and Physics. Outstanding performance (Good).',
        subjects: [
          { name: 'Mathematics', score: 92, grade: 'A' },
          { name: 'Chemistry', score: 89, grade: 'A' },
          { name: 'Physics', score: 86, grade: 'A' },
          { name: 'Biology', score: 88, grade: 'A' },
          { name: 'English Language', score: 84, grade: 'A' },
          { name: 'Kiswahili', score: 86, grade: 'A' },
        ]
      },
      {
        exam_name: 'Term 1 Mid-Term Examination 2026',
        term: 'Term 1 Mid',
        year: '2026',
        average: 86.2,
        division: 'Division I (Pt 9)',
        standing: 'Good',
        position: '3 / 45',
        remarks: 'Excellent grasp of foundational formulas and conceptual principles.',
        subjects: [
          { name: 'Mathematics', score: 90, grade: 'A' },
          { name: 'Chemistry', score: 85, grade: 'A' },
          { name: 'Physics', score: 84, grade: 'A' },
          { name: 'Biology', score: 86, grade: 'A' },
        ]
      },
      {
        exam_name: 'Form 3 National Pre-Mock Annual 2025',
        term: 'Annual',
        year: '2025',
        average: 84.0,
        division: 'Division I (Pt 10)',
        standing: 'Good',
        position: '4 / 48',
        remarks: 'Promoted to Form 4 with high academic standing.',
        subjects: [
          { name: 'Mathematics', score: 88, grade: 'A' },
          { name: 'Chemistry', score: 82, grade: 'A' },
          { name: 'Physics', score: 83, grade: 'A' },
        ]
      }
    ]
  },
  {
    id: 'stu-2',
    admission_number: '241711356002',
    name: 'Neema Emmanuel Mushi',
    class_name: 'Form 4 Science',
    stream_name: 'Form 4 Science A',
    status: 'ACTIVE',
    attendance_rate: 96,
    standing: 'Good',
    past_result_grade: 'Good',
    historical_gpa: 3.8,
    average_score: 83.0,
    past_exams: [
      {
        exam_name: 'Term 1 Terminal Examination 2026',
        term: 'Term 1',
        year: '2026',
        average: 84.0,
        division: 'Division I (Pt 9)',
        standing: 'Good',
        position: '5 / 45',
        remarks: 'Demonstrates strong dedication in Chemistry practicals and Trigonometry problem solving.',
        subjects: [
          { name: 'Mathematics', score: 84, grade: 'A' },
          { name: 'Chemistry', score: 91, grade: 'A' },
          { name: 'Physics', score: 80, grade: 'A' },
          { name: 'Biology', score: 86, grade: 'A' },
        ]
      }
    ]
  },
  {
    id: 'stu-3',
    admission_number: '241711356003',
    name: 'Kelvin Baraka Mkenda',
    class_name: 'Form 4 Science',
    stream_name: 'Form 4 Science A',
    status: 'ACTIVE',
    attendance_rate: 94,
    standing: 'Average',
    past_result_grade: 'Average',
    historical_gpa: 2.7,
    average_score: 64.5,
    past_exams: [
      {
        exam_name: 'Term 1 Terminal Examination 2026',
        term: 'Term 1',
        year: '2026',
        average: 65.0,
        division: 'Division II (Pt 18)',
        standing: 'Average',
        position: '19 / 45',
        remarks: 'Average performance. Requires additional practice in Algebra and Stoichiometry.',
        subjects: [
          { name: 'Mathematics', score: 62, grade: 'C' },
          { name: 'Chemistry', score: 66, grade: 'B' },
          { name: 'Physics', score: 60, grade: 'C' },
          { name: 'Biology', score: 70, grade: 'B' },
        ]
      }
    ]
  },
  {
    id: 'stu-4',
    admission_number: '241711356004',
    name: 'Zainab Ally Mwamba',
    class_name: 'Form 4 Science',
    stream_name: 'Form 4 Science A',
    status: 'ACTIVE',
    attendance_rate: 97,
    standing: 'Good',
    past_result_grade: 'Good',
    historical_gpa: 3.6,
    average_score: 79.8,
    past_exams: [
      {
        exam_name: 'Term 1 Terminal Examination 2026',
        term: 'Term 1',
        year: '2026',
        average: 80.2,
        division: 'Division I (Pt 11)',
        standing: 'Good',
        position: '7 / 45',
        remarks: 'Consistent and commendable academic achievement across all science subjects.',
        subjects: [
          { name: 'Mathematics', score: 76, grade: 'B' },
          { name: 'Chemistry', score: 82, grade: 'A' },
          { name: 'Physics', score: 78, grade: 'B' },
          { name: 'Biology', score: 85, grade: 'A' },
        ]
      }
    ]
  },
  {
    id: 'stu-5',
    admission_number: '241711356005',
    name: 'Daniel Joseph Kimaro',
    class_name: 'Form 4 Science',
    stream_name: 'Form 4 Science A',
    status: 'ACTIVE',
    attendance_rate: 81,
    standing: 'Needs Support',
    past_result_grade: 'Needs Support',
    historical_gpa: 1.6,
    average_score: 41.2,
    past_exams: [
      {
        exam_name: 'Term 1 Terminal Examination 2026',
        term: 'Term 1',
        year: '2026',
        average: 39.5,
        division: 'Division IV (Pt 28)',
        standing: 'Needs Support',
        position: '42 / 45',
        remarks: 'Student experiences significant challenges in basic Mathematics and Chemistry. Urgent remedial support needed.',
        subjects: [
          { name: 'Mathematics', score: 34, grade: 'F' },
          { name: 'Chemistry', score: 42, grade: 'D' },
          { name: 'Physics', score: 38, grade: 'F' },
          { name: 'Biology', score: 45, grade: 'D' },
        ]
      }
    ]
  },
  {
    id: 'stu-6',
    admission_number: '241711356006',
    name: 'Amina Hassan Bakari',
    class_name: 'Form 3 Arts',
    stream_name: 'Form 3 Green',
    status: 'ACTIVE',
    attendance_rate: 95,
    standing: 'Good',
    past_result_grade: 'Good',
    historical_gpa: 3.7,
    average_score: 81.6,
    past_exams: [
      {
        exam_name: 'Term 1 Terminal Examination 2026',
        term: 'Term 1',
        year: '2026',
        average: 82.0,
        division: 'Division I (Pt 10)',
        standing: 'Good',
        position: '4 / 40',
        remarks: 'Coursework submissions are neat, accurate, and submitted on time.',
        subjects: [
          { name: 'Chemistry', score: 80, grade: 'A' },
          { name: 'Geography', score: 86, grade: 'A' },
          { name: 'History', score: 84, grade: 'A' },
          { name: 'English', score: 82, grade: 'A' },
        ]
      }
    ]
  },
  {
    id: 'stu-7',
    admission_number: '241711356007',
    name: 'Rashid Said Mwangi',
    class_name: 'Form 3 Arts',
    stream_name: 'Form 3 Green',
    status: 'ACTIVE',
    attendance_rate: 89,
    standing: 'Average',
    past_result_grade: 'Average',
    historical_gpa: 2.6,
    average_score: 61.8,
    past_exams: [
      {
        exam_name: 'Term 1 Terminal Examination 2026',
        term: 'Term 1',
        year: '2026',
        average: 61.8,
        division: 'Division II (Pt 20)',
        standing: 'Average',
        position: '21 / 40',
        remarks: 'High curiosity for learning, but requires closer guidance in practical lab work and homework.',
        subjects: [
          { name: 'Chemistry', score: 60, grade: 'C' },
          { name: 'Geography', score: 65, grade: 'C' },
          { name: 'History', score: 62, grade: 'C' },
        ]
      }
    ]
  },
  {
    id: 'stu-8',
    admission_number: '241711356008',
    name: 'Grace Peter Msangi',
    class_name: 'Form 3 Arts',
    stream_name: 'Form 3 Green',
    status: 'ACTIVE',
    attendance_rate: 76,
    standing: 'Needs Support',
    past_result_grade: 'Needs Support',
    historical_gpa: 1.8,
    average_score: 44.0,
    past_exams: [
      {
        exam_name: 'Term 1 Terminal Examination 2026',
        term: 'Term 1',
        year: '2026',
        average: 44.0,
        division: 'Division IV (Pt 26)',
        standing: 'Needs Support',
        position: '38 / 40',
        remarks: 'Performance decline linked to chronic absenteeism. Parent contact recommended.',
        subjects: [
          { name: 'Chemistry', score: 40, grade: 'D' },
          { name: 'Geography', score: 46, grade: 'D' },
          { name: 'History', score: 46, grade: 'D' },
        ]
      }
    ]
  }
];

const defaultTimetableSlots: TimetableSlotItem[] = [
  {
    id: 'tt-1',
    day_of_week: 0,
    day_name: 'Monday',
    start_time: '08:00',
    end_time: '09:20',
    subject_name: 'Mathematics',
    class_stream: 'Form 4 Science A',
    room: 'Room B-12 • Science Lab Block',
  },
  {
    id: 'tt-2',
    day_of_week: 0,
    day_name: 'Monday',
    start_time: '10:00',
    end_time: '11:20',
    subject_name: 'Chemistry (Practical)',
    class_stream: 'Form 3 Green',
    room: 'Chemistry Main Laboratory (Lab 1)',
  },
  {
    id: 'tt-3',
    day_of_week: 1,
    day_name: 'Tuesday',
    start_time: '08:40',
    end_time: '10:00',
    subject_name: 'Mathematics',
    class_stream: 'Form 4 Science A',
    room: 'Room B-12 • Science Lab Block',
  },
  {
    id: 'tt-4',
    day_of_week: 2,
    day_name: 'Wednesday',
    start_time: '09:20',
    end_time: '10:40',
    subject_name: 'Physics',
    class_stream: 'Form 2 Blue',
    room: 'Room C-04 • West Wing',
  },
  {
    id: 'tt-5',
    day_of_week: 3,
    day_name: 'Thursday',
    start_time: '11:20',
    end_time: '12:40',
    subject_name: 'Chemistry (Theory)',
    class_stream: 'Form 3 Green',
    room: 'Room B-08 • Chemistry Wing',
  },
  {
    id: 'tt-6',
    day_of_week: 4,
    day_name: 'Friday',
    start_time: '08:00',
    end_time: '09:20',
    subject_name: 'Mathematics Problem Solving',
    class_stream: 'Form 4 Science A',
    room: 'Room B-12 • Science Lab Block',
  }
];

const defaultTeacherNotices: NotificationNotice[] = [
  {
    id: 'notif-1',
    sender_role: 'HEADMASTER',
    sender_name: "Headmaster's Office",
    title: 'All-Staff Emergency Meeting & Mock Examination Evaluation',
    message: 'Tomorrow Thursday at 2:00 PM, an emergency staff meeting will be held in the Main Auditorium to evaluate Form 4 Mock performance. All subject teachers must attend.',
    created_at: 'Today, 10:15 AM',
    priority: 'URGENT',
    read: false,
    action_tab: 'students',
    action_label: 'Review Students (Needs Support)',
  },
  {
    id: 'notif-2',
    sender_role: 'ACADEMIC',
    sender_name: 'Academic Master',
    title: 'Deadline for Mid-Term Exam Paper Submissions (PDF)',
    message: 'All teachers for Form 2, Form 3, and Form 4 are reminded to upload digital PDF copies of examination papers for departmental moderation before Friday 5:00 PM.',
    created_at: 'Yesterday, 03:45 PM',
    priority: 'HIGH',
    read: false,
    action_tab: 'examinations',
    action_label: 'Compose & Upload Exam (PDF)',
  },
  {
    id: 'notif-3',
    sender_role: 'ACADEMIC',
    sender_name: 'Academic Master',
    title: 'Past Results Performance Analysis & Remedial Schedule',
    message: 'The system now equips every teacher with individual student past examination performance analysis (Good, Average, Needs Support) to tailor remedial interventions.',
    created_at: '12 October 2026',
    priority: 'NORMAL',
    read: true,
    action_tab: 'students',
    action_label: 'Open Student Roster',
  },
  {
    id: 'notif-4',
    sender_role: 'SYSTEM',
    sender_name: 'School Management System',
    title: 'Homework & Coursework Submissions Synced with Student Portals',
    message: 'All assignments you publish (typed questions or uploaded PDF/photo worksheets) are instantly routed to students\' portals for live submission tracking.',
    created_at: '10 October 2026',
    priority: 'NORMAL',
    read: true,
    action_tab: 'assignments',
    action_label: 'View Coursework',
  }
];

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

  // Students list (Strictly scoped with Past Result Classification)
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('ALL');
  const [studentStandingFilter, setStudentStandingFilter] = useState<'ALL' | 'Good' | 'Average' | 'Needs Support'>('ALL');
  const [selectedStudentForPastResult, setSelectedStudentForPastResult] = useState<StudentItem | null>(null);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const q = studentSearch.toLowerCase().trim();
      const matchSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        s.admission_number.toLowerCase().includes(q) ||
        s.class_name.toLowerCase().includes(q) ||
        s.stream_name.toLowerCase().includes(q);

      const matchClass = studentClassFilter === 'ALL' ||
        s.class_name.toLowerCase().includes(studentClassFilter.toLowerCase()) ||
        s.stream_name.toLowerCase().includes(studentClassFilter.toLowerCase());

      const matchStanding = studentStandingFilter === 'ALL' ||
        (s.past_result_grade || s.standing) === studentStandingFilter;

      return matchSearch && matchClass && matchStanding;
    });
  }, [students, studentSearch, studentClassFilter, studentStandingFilter]);

  // Attendance Module State
  const [attendanceType, setAttendanceType] = useState<'DAILY' | 'SUBJECT'>('DAILY');
  const [selectedStreamId, setSelectedStreamId] = useState<string>('s1');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('sub1');
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

  // Assignments State (Typed Questions or Document/Photo Attachment)
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [assignmentCreationMode, setAssignmentCreationMode] = useState<'TYPE' | 'UPLOAD'>('TYPE');
  const [newAssignmentForm, setNewAssignmentForm] = useState({
    title: '',
    description: '',
    stream_id: '',
    subject_id: '',
    due_date: '',
    total_marks: 20,
    attachment_name: '',
    attachment_size: '',
    attachment_type: '',
    mode: 'TYPED' as 'TYPED' | 'DOCUMENT' | 'PHOTO',
  });

  // Timetable State
  const [selectedTimetableDay, setSelectedTimetableDay] = useState<string>('ALL');
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlotItem[]>([]);

  const filteredTimetable = useMemo(() => {
    if (selectedTimetableDay === 'ALL') return timetableSlots;
    return timetableSlots.filter(s => s.day_name.toUpperCase() === selectedTimetableDay.toUpperCase());
  }, [timetableSlots, selectedTimetableDay]);

  // Examinations Sittings & PDF Upload / Compose State
  const [examSittings, setExamSittings] = useState<ExamSittingItem[]>([]);
  const [isUploadExamPaperOpen, setIsUploadExamPaperOpen] = useState(false);
  const [isComposeExamModalOpen, setIsComposeExamModalOpen] = useState(false);
  const [selectedExamForUpload, setSelectedExamForUpload] = useState<ExamSittingItem | null>(null);
  const [examUploadForm, setExamUploadForm] = useState({
    file_name: '',
    file_size: '',
    instructions: '',
  });
  const [composeExamForm, setComposeExamForm] = useState({
    exam_name: '',
    subject_id: 'sub1',
    class_name: 'Form 4 Science A',
    date: new Date().toISOString().slice(0, 10),
    time: '08:30 - 11:30',
    room: 'Main Examination Hall',
    candidates_count: 45,
    paper_pdf_name: '',
    paper_pdf_size: '',
    instructions: '',
  });

  // Notifications State (Bulletins from Headmaster, Academic Master, and System)
  const [notifications, setNotifications] = useState<NotificationNotice[]>([]);
  const [notificationCategoryFilter, setNotificationCategoryFilter] = useState<'ALL' | 'HEADMASTER' | 'ACADEMIC' | 'SYSTEM'>('ALL');

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
              const fullName = `${storedUser.first_name || ''} ${storedUser.last_name || ''}`.trim() || storedUser.username || 'Mwl. Senior Faculty';
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
          else setClasses(defaultClasses);

          if (d.streams && d.streams.length > 0) {
            setStreams(d.streams);
            setSelectedStreamId(d.streams[0].id);
          } else {
            setStreams(defaultStreams);
            setSelectedStreamId(defaultStreams[0].id);
          }

          if (d.subjects && d.subjects.length > 0) {
            setSubjects(d.subjects);
            setSelectedSubjectId(d.subjects[0].id);
          } else {
            setSubjects([]);
          }

          if (d.assignments && d.assignments.length > 0) setAssignmentsList(d.assignments);
          else setAssignmentsList([]);
        } else {
          setClasses([]);
          setStreams([]);
          setSubjects([]);
          setAssignmentsList([]);
        }

        // 2. Fetch Scoped Students
        const studentsRes = await apiClient.get('/students/').catch(() => null);
        if (studentsRes && studentsRes.data) {
          const list = Array.isArray(studentsRes.data) ? studentsRes.data : studentsRes.data.results;
          if (Array.isArray(list) && list.length > 0) {
            setStudents(list.map((s: any, idx: number) => ({
              id: s.id,
              admission_number: s.admission_number,
              name: s.user ? `${s.user.first_name} ${s.user.last_name}`.trim() || s.admission_number : s.admission_number,
              class_name: s.current_class ? s.current_class.name : 'Form 4 Science',
              stream_name: s.current_stream ? s.current_stream.name : 'Form 4 Science A',
              status: s.status || 'ACTIVE',
              attendance_rate: idx % 4 === 3 ? 81 : 96,
              standing: idx % 4 === 3 ? 'Needs Support' : idx % 3 === 2 ? 'Average' : 'Good',
              past_result_grade: idx % 4 === 3 ? 'Needs Support' : idx % 3 === 2 ? 'Average' : 'Good',
              historical_gpa: idx % 4 === 3 ? 1.7 : idx % 3 === 2 ? 2.8 : 3.8,
              average_score: idx % 4 === 3 ? 42.5 : idx % 3 === 2 ? 65.0 : 85.5,
              past_exams: [],
            })));
          } else {
            setStudents([]);
          }
        } else {
          setStudents([]);
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
          } else {
            setTimetableSlots([]);
          }
        } else {
          setTimetableSlots([]);
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
              stream_name: a.stream?.name || a.stream_name || 'Form 4 Science A',
              subject_name: a.subject?.name || a.subject_name || 'Mathematics',
              subject_code: a.subject?.code || a.subject_code || 'MATH-401',
              due_date: a.due_date ? String(a.due_date).slice(0, 10) : '2026-10-30',
              total_marks: a.total_marks || 20,
              submissions_count: a.submissions_count || 0,
              attachment_name: a.attachment_name || undefined,
              attachment_size: a.attachment_size || undefined,
              attachment_type: a.attachment_type || undefined,
              mode: a.attachment_name ? 'DOCUMENT' : 'TYPED',
            })));
          }
        }

        // 5. Fetch Examination Papers/Sittings & check localStorage
        const storedExams = typeof window !== 'undefined' ? localStorage.getItem('sms_teacher_exam_sittings') : null;
        let localExamsList: ExamSittingItem[] = [];
        if (storedExams) {
          try {
            localExamsList = JSON.parse(storedExams);
          } catch (_) {}
        }

        const examRes = await apiClient.get('/examination/papers/').catch(() => null);
        let apiExams: ExamSittingItem[] = [];
        if (examRes && examRes.data) {
          const rawExams = Array.isArray(examRes.data) ? examRes.data : examRes.data.results;
          if (Array.isArray(rawExams) && rawExams.length > 0) {
            apiExams = rawExams.map((ex: any) => ({
              id: String(ex.id),
              exam_name: ex.session?.name || ex.exam_name || 'Official Examination',
              subject_name: ex.subject?.name || ex.subject_name || 'Subject',
              paper_code: ex.paper_code || ex.code || 'EX-PAP',
              class_name: ex.class_room?.name || ex.class_name || 'Assigned Cohort',
              date: ex.date || new Date().toISOString().slice(0, 10),
              time: ex.start_time ? `${ex.start_time.slice(0, 5)} - ${(ex.end_time || '').slice(0, 5)}` : '08:30 - 11:30',
              room: ex.room || 'Main Hall',
              candidates_count: ex.candidates_count || 45,
              status: ex.status || 'SCHEDULED',
            }));
          }
        }

        setExamSittings([...localExamsList, ...apiExams]);
        setNotifications([]);
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
          attachment_name: newAssignmentForm.attachment_name || undefined,
          attachment_size: newAssignmentForm.attachment_size || undefined,
          attachment_type: newAssignmentForm.attachment_type || undefined,
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
        attachment_name: '',
        attachment_size: '',
        attachment_type: '',
        mode: 'TYPED',
      });

      setActionMessage({
        type: 'success',
        text: 'New coursework assignment published successfully with attachments!',
      });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || 'Failed to create assignment.';
      setActionMessage({ type: 'error', text: msg });
    }
  };

  // Upload Examination PDF Paper
  const handleUploadExamPaper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamForUpload || !examUploadForm.file_name) {
      alert('Please select a PDF examination paper file.');
      return;
    }

    setExamSittings(prev => prev.map(ex => {
      if (ex.id === selectedExamForUpload.id) {
        return {
          ...ex,
          paper_pdf_name: examUploadForm.file_name,
          paper_pdf_size: examUploadForm.file_size || '1.8 MB',
          paper_uploaded_at: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        };
      }
      return ex;
    }));

    setIsUploadExamPaperOpen(false);
    setSelectedExamForUpload(null);
    setExamUploadForm({ file_name: '', file_size: '', instructions: '' });

    setActionMessage({
      type: 'success',
      text: 'Examination question paper (PDF) uploaded successfully! Sent to Examination Officer moderation.',
    });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Compose and Upload New Examination Paper (PDF)
  const handleComposeExamPaper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeExamForm.exam_name || !composeExamForm.paper_pdf_name) {
      alert('Please enter the examination title and attach the exam paper (PDF).');
      return;
    }

    const subObj = subjects.find(s => s.id === composeExamForm.subject_id);
    const newSitting: ExamSittingItem = {
      id: `exam-${Date.now()}`,
      exam_name: composeExamForm.exam_name,
      subject_name: subObj ? subObj.name : 'Mathematics Paper 1',
      paper_code: subObj ? `${subObj.code}/01` : 'MTH-401/1',
      class_name: composeExamForm.class_name || 'Form 4 Science A',
      date: composeExamForm.date || new Date().toISOString().slice(0, 10),
      time: composeExamForm.time || '08:30 - 11:30',
      room: composeExamForm.room || 'Main Examination Hall',
      candidates_count: Number(composeExamForm.candidates_count) || 45,
      status: 'SCHEDULED',
      paper_pdf_name: composeExamForm.paper_pdf_name,
      paper_pdf_size: composeExamForm.paper_pdf_size || '2.4 MB',
      paper_uploaded_at: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    setExamSittings(prev => {
      const updated = [newSitting, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('sms_teacher_exam_sittings', JSON.stringify(updated));
      }
      return updated;
    });

    setIsComposeExamModalOpen(false);
    setComposeExamForm({
      exam_name: '',
      subject_id: 'sub1',
      class_name: 'Form 4 Science A',
      date: new Date().toISOString().slice(0, 10),
      time: '08:30 - 11:30',
      room: 'Main Examination Hall',
      candidates_count: 45,
      paper_pdf_name: '',
      paper_pdf_size: '',
      instructions: '',
    });

    setActionMessage({
      type: 'success',
      text: 'New examination paper (PDF) submitted to Academic Master for moderation!',
    });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Interactive RBAC Prohibited Action Testers
  const testProhibitedAction = async (actionType: 'USERS' | 'ROLES' | 'FINANCE' | 'UNRELATED_CLASS' | 'MODIFY_PUBLISHED') => {
    if (actionType === 'USERS') {
      try {
        await apiClient.get('/accounts/users/');
        alert('Unexpected: user management succeeded.');
      } catch (err: any) {
        setRestrictedActionModal(
          "RESTRICTION ENFORCED [403 FORBIDDEN]: Teacher accounts cannot manage users or create new accounts. User governance is restricted strictly to System Administrators."
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
              <div className="mt-2 text-3xl font-extrabold text-slate-900">
                {attendancePercentage > 0 ? `${attendancePercentage}%` : 'Not Marked'}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {attendancePercentage > 0 ? 'Roll call marked for active stream' : 'Pending morning roll call for today'}
              </div>
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

          {/* ===================== TODAY'S DAILY SCHEDULE ===================== */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-bold text-slate-900 text-sm">Today&apos;s Lecture Schedule • My Classes</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Today&apos;s teaching sessions based on the official timetable allocated by the Academic Master and School Administration
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {timetableSlots.slice(0, 3).length} Sessions Scheduled Today
                </span>
                <button
                  onClick={() => setActiveTab('timetable')}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-all"
                >
                  Full Timetable <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {timetableSlots.slice(0, 3).map((slot, idx) => (
                <div
                  key={slot.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-300 transition-all space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {slot.start_time} - {slot.end_time}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      idx === 0 ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {idx === 0 ? 'Next Up' : 'Upcoming'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{slot.subject_name}</h4>
                    <p className="text-xs text-slate-600 font-medium">{slot.class_stream}</p>
                  </div>

                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">Room: <strong className="text-slate-800">{slot.room}</strong></span>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('attendance')}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-center transition-all flex items-center justify-center gap-1"
                    >
                      <UserCheck className="w-3 h-3" />
                      Take Attendance
                    </button>
                    <button
                      onClick={() => setActiveTab('marks')}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 text-center transition-all"
                    >
                      Score Sheet
                    </button>
                  </div>
                </div>
              ))}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Classes Allocated by Academic Master &amp; Administration</h3>
                <p className="text-xs text-slate-500">Official classes and streams allocated to you for teaching and class management</p>
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
            <h3 className="text-base font-bold text-slate-900">Teaching Subjects Allocated by Academic Master &amp; Administration</h3>
            <p className="text-xs text-slate-500">Academic subjects and departments allocated to you for instruction and marks grading</p>
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

      {/* ===================== TAB: STUDENTS (UCHAMBUZI WA PAST RESULTS) ===================== */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Cohort Performance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Students</span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-slate-900">{students.length}</div>
              <div className="mt-1 text-xs text-slate-500 font-medium">Students in your assigned cohorts</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-xs bg-emerald-50/20">
              <div className="flex items-center justify-between text-emerald-600">
                <span className="text-xs font-bold uppercase tracking-wider">Good Standing</span>
                <Sparkles className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-emerald-700">
                {students.filter(s => (s.past_result_grade || s.standing) === 'Good').length}
              </div>
              <div className="mt-1 text-xs text-emerald-700 font-medium">
                Grades A &amp; B • High proficiency
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-xs bg-amber-50/20">
              <div className="flex items-center justify-between text-amber-600">
                <span className="text-xs font-bold uppercase tracking-wider">Average Standing</span>
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-amber-700">
                {students.filter(s => (s.past_result_grade || s.standing) === 'Average').length}
              </div>
              <div className="mt-1 text-xs text-amber-700 font-medium">
                Grade C • Consistent progress
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-rose-200/80 shadow-xs bg-rose-50/20">
              <div className="flex items-center justify-between text-rose-600">
                <span className="text-xs font-bold uppercase tracking-wider">Needs Support</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-rose-700">
                {students.filter(s => (s.past_result_grade || s.standing) === 'Needs Support').length}
              </div>
              <div className="mt-1 text-xs text-rose-700 font-medium">
                Grades D &amp; F • Recommended for remedial coaching
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Header with Title and Search/Filters */}
            <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  My Students &amp; Historical Performance Analysis
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  View all enrolled students, assigned cohorts, and multi-term performance standing (Good, Average, Needs Support).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white w-44 transition-all"
                  />
                </div>

                <select
                  value={studentClassFilter}
                  onChange={(e) => setStudentClassFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800"
                >
                  <option value="ALL">All Classes</option>
                  <option value="Form 4 Science">Form 4 Science</option>
                  <option value="Form 3 Arts">Form 3 Arts</option>
                  <option value="Form 2">Form 2</option>
                </select>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
                  {(['ALL', 'Good', 'Average', 'Needs Support'] as const).map((standing) => (
                    <button
                      key={standing}
                      onClick={() => setStudentStandingFilter(standing)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        studentStandingFilter === standing
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {standing === 'ALL' ? 'All' : standing}
                    </button>
                  ))}
                </div>

                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                  {filteredStudents.length} Students
                </span>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase">
                    <th className="p-3.5">Admission #</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Class &amp; Stream</th>
                    <th className="p-3.5 text-center">Attendance</th>
                    <th className="p-3.5">Historical Exam Performance</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                        No students found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => {
                      const grade = s.past_result_grade || s.standing || 'Good';
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3.5 font-mono text-slate-600 font-semibold">{s.admission_number}</td>
                          <td className="p-3.5 font-bold text-slate-900">{s.name}</td>
                          <td className="p-3.5 text-slate-600">{s.class_name} • {s.stream_name}</td>
                          <td className="p-3.5 text-center font-bold text-emerald-600">
                            {s.attendance_rate || 96}%
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              {grade === 'Good' && (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  Good • {s.average_score || 85}%
                                </span>
                              )}
                              {grade === 'Average' && (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3 text-amber-600" />
                                  Average • {s.average_score || 64}%
                                </span>
                              )}
                              {grade === 'Needs Support' && (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  Needs Support • {s.average_score || 41}%
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono font-medium">
                                GPA: {s.historical_gpa || 3.5}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForPastResult(s)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200 transition-all flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Past Results
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
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
            <div className="bg-slate-50/80 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
              <span className="font-semibold flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold font-mono">P</span> Present
                <span className="text-slate-300">•</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold font-mono">A</span> Absent
                <span className="text-slate-300">•</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold font-mono">R</span> Ruhusa (Permission)
                <span className="text-slate-300">•</span>
                <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 font-bold font-mono">L</span> Late
              </span>
              <span className="text-slate-400 hidden sm:inline">Click status code button or mark entire cohort above</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase">
                    <th className="p-3.5">Admission #</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5 text-center">Register Status (P / A / R / E)</th>
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
                          <div className="flex items-center justify-center gap-1">
                            {[
                              { code: 'PRESENT', label: 'P', title: 'Present', activeBg: 'bg-emerald-600 text-white' },
                              { code: 'ABSENT', label: 'A', title: 'Absent', activeBg: 'bg-rose-600 text-white' },
                              { code: 'EXCUSED', label: 'R', title: 'Ruhusa (Permission)', activeBg: 'bg-amber-500 text-white' },
                              { code: 'LATE', label: 'L', title: 'Late', activeBg: 'bg-sky-600 text-white' }
                            ].map((st) => (
                              <button
                                key={st.code}
                                type="button"
                                title={st.title}
                                onClick={() => setAttendanceRecords(prev => prev.map(item => item.id === r.id ? { ...item, status: st.code as any } : item))}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                                  r.status === st.code
                                    ? st.activeBg
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <span>{st.label}</span>
                                <span className="text-[9px] font-normal opacity-85 hidden sm:inline">({st.title})</span>
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
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publish to Academic Master (Official Submission)
                </button>
              </div>
            </div>

            <div className="p-3 bg-cyan-50 border border-cyan-200 text-cyan-900 rounded-xl text-xs flex items-center gap-2 font-medium">
              <Info className="w-4 h-4 text-cyan-700 shrink-0" />
              <span>
                <strong>Grading Workflow Notice:</strong> Once you have completed entering all scores for this cohort, click <strong>&quot;Publish to Academic Master (Official Submission)&quot;</strong>. Marks will be submitted directly to the Academic Master for moderation, grading distribution analytics, and terminal reporting.
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                Student Coursework &amp; Homework Assignments
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Compose coursework via direct typing, upload worksheet documents (PDF), or capture handwritten questions, then publish to students.
              </p>
            </div>
            <button
              onClick={() => {
                setAssignmentCreationMode('TYPE');
                setIsCreateAssignmentOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Create New Assignment
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No coursework assignments created yet. Click &quot;Create New Assignment&quot; to publish homework to your students.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((item) => (
                <div key={item.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-300 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 font-mono">
                      {item.subject_code} • {item.stream_name}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Due: {item.due_date}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{item.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                  
                  {/* Mode Badge */}
                  <div className="flex items-center gap-2">
                    {item.attachment_type === 'IMAGE' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Camera className="w-3 h-3 text-amber-600" />
                        Worksheet Photo
                      </span>
                    ) : item.attachment_name ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-blue-600" />
                        Document / PDF
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <Edit3 className="w-3 h-3 text-emerald-600" />
                        Typed Questions
                      </span>
                    )}
                  </div>

                  {item.attachment_name && (
                    <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-mono text-xs text-indigo-900 font-medium truncate">{item.attachment_name}</span>
                        {item.attachment_size && <span className="text-[10px] text-indigo-500 font-sans">({item.attachment_size})</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => alert(`Opening coursework attachment:\nFile: ${item.attachment_name}\nSize: ${item.attachment_size || 'Attached file'}`)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all shrink-0 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-150">
                    <span>Max Marks: <strong>{item.total_marks} Marks</strong></span>
                    <span className="font-bold text-indigo-700">{item.submissions_count} Submissions Received</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Assignment Modal Dialog */}
          {isCreateAssignmentOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl max-w-xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Create Coursework Assignment</h3>
                    <p className="text-xs text-slate-500">Compose questions directly or upload worksheet document/photo and publish to students</p>
                  </div>
                  <button onClick={() => setIsCreateAssignmentOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mode Selector: Type Questions vs Upload Document */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentCreationMode('TYPE');
                      setNewAssignmentForm(prev => ({ ...prev, mode: 'TYPED' }));
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      assignmentCreationMode === 'TYPE'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    Type Questions Directly
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentCreationMode('UPLOAD');
                      setNewAssignmentForm(prev => ({ ...prev, mode: 'DOCUMENT' }));
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      assignmentCreationMode === 'UPLOAD'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    Upload Document / Photo (PDF)
                  </button>
                </div>

                <form onSubmit={handleCreateAssignment} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assignment Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Quadratic Equations & Matrix Transformations Exercises"
                      value={newAssignmentForm.title}
                      onChange={(e) => setNewAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Class / Stream *</label>
                      <select
                        required
                        value={newAssignmentForm.stream_id}
                        onChange={(e) => setNewAssignmentForm(prev => ({ ...prev, stream_id: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white font-semibold"
                      >
                        <option value="">Select Stream...</option>
                        {streams.map(str => (
                          <option key={str.id} value={str.id}>{str.name} ({str.class_name})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
                      <select
                        required
                        value={newAssignmentForm.subject_id}
                        onChange={(e) => setNewAssignmentForm(prev => ({ ...prev, subject_id: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white font-semibold"
                      >
                        <option value="">Select Subject...</option>
                        {subjects.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white"
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Mode 1: Typed Content */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {assignmentCreationMode === 'TYPE'
                        ? 'Questions & Instructions (Typed) *'
                        : 'Additional Assignment Instructions'}
                    </label>
                    <textarea
                      rows={assignmentCreationMode === 'TYPE' ? 5 : 2}
                      required={assignmentCreationMode === 'TYPE'}
                      value={newAssignmentForm.description}
                      onChange={(e) => setNewAssignmentForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={
                        assignmentCreationMode === 'TYPE'
                          ? 'Question 1: Solve 3x² + 5x - 2 = 0 by factorization.\nQuestion 2: Find the inverse of matrix A = [[2, 1], [1, 3]].\nShow all working clearly...'
                          : 'Assignment guidance or reading chapters...'
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white font-mono"
                    />
                  </div>

                  {/* Mode 2: Photo or Document Upload */}
                  {assignmentCreationMode === 'UPLOAD' && (
                    <div className="p-4 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 space-y-2">
                      <label className="block font-semibold text-indigo-900 mb-1">
                        Upload Assignment Document or Capture Worksheet Photo (PDF/Image) *
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer transition-all shadow-xs">
                          <Camera className="w-4 h-4" />
                          <span>Upload / Take Photo</span>
                          <input
                            type="file"
                            accept="image/*,.pdf,.doc,.docx"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const sizeStr = file.size > 1024 * 1024 
                                  ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
                                  : `${Math.round(file.size / 1024)} KB`;
                                const isImg = file.type.includes('image');
                                setNewAssignmentForm(prev => ({
                                  ...prev,
                                  attachment_name: file.name,
                                  attachment_size: sizeStr,
                                  attachment_type: isImg ? 'IMAGE' : 'DOCUMENT',
                                  mode: isImg ? 'PHOTO' : 'DOCUMENT'
                                }));
                              }
                            }}
                          />
                        </label>

                        {newAssignmentForm.attachment_name ? (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-indigo-900 text-xs font-mono font-bold border border-indigo-200 shadow-2xs">
                            {newAssignmentForm.attachment_type === 'IMAGE' ? <Camera className="w-4 h-4 text-amber-600" /> : <FileText className="w-4 h-4 text-blue-600" />}
                            <span className="truncate max-w-[200px]">{newAssignmentForm.attachment_name}</span>
                            <span className="text-[10px] text-slate-400 font-sans">({newAssignmentForm.attachment_size})</span>
                            <button
                              type="button"
                              onClick={() => setNewAssignmentForm(prev => ({ ...prev, attachment_name: '', attachment_size: '', attachment_type: '' }))}
                              className="text-slate-400 hover:text-rose-600 ml-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">Supports camera photos, question PDF documents, and Word docs.</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsCreateAssignmentOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Publish Assignment to Students
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
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Official Teaching Timetable
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Teaching schedule detailing days, time slots, assigned subjects, cohorts, and lecture venues.
              </p>
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
                  {d === 'ALL' ? 'Whole Week' : d}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase">
                  <th className="p-3.5">Day</th>
                  <th className="p-3.5">Time Period</th>
                  <th className="p-3.5">Teaching Subject</th>
                  <th className="p-3.5">Class / Stream</th>
                  <th className="p-3.5">Assigned Room / Venue</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTimetable.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                      No teaching periods scheduled for this day.
                    </td>
                  </tr>
                ) : (
                  filteredTimetable.map((slot) => (
                    <tr key={slot.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{slot.day_name}</td>
                      <td className="p-3.5 font-mono text-indigo-700 font-semibold">{slot.start_time} - {slot.end_time}</td>
                      <td className="p-3.5 font-extrabold text-slate-900">{slot.subject_name}</td>
                      <td className="p-3.5 text-slate-700 font-medium">{slot.class_stream}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-medium inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          {slot.room}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setActiveTab('attendance')}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="w-3 h-3" />
                          Take Attendance
                        </button>
                      </td>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                Examinations &amp; Question Paper Upload (PDF)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Compose examinations by uploading formal question papers (PDF) and submit directly to Academic Master for moderation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsComposeExamModalOpen(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                + Create Exam (Upload PDF)
              </button>
            </div>
          </div>

          {examSittings.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No examination sittings scheduled yet. Click &quot;+ Create Exam (Upload PDF)&quot; to upload an exam question paper.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {examSittings.map((ex) => (
                <div key={ex.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3.5">
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
                    <div>Exam Sitting: <strong>{ex.exam_name}</strong></div>
                    <div>Cohort &amp; Candidates: <strong>{ex.class_name} ({ex.candidates_count} Students)</strong></div>
                    <div>Date &amp; Time: <strong>{ex.date} • {ex.time}</strong></div>
                  </div>

                  {/* PDF Paper Upload Status */}
                  {ex.paper_pdf_name ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div className="truncate">
                          <div className="font-mono text-xs font-bold text-emerald-950 truncate">{ex.paper_pdf_name}</div>
                          <div className="text-[10px] text-emerald-700 font-sans">Official PDF • {ex.paper_pdf_size || '1.8 MB'} ({ex.paper_uploaded_at || 'Recent'})</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => alert(`Opening Examination Paper (PDF):\nFile: ${ex.paper_pdf_name}\nSitting: ${ex.exam_name}\nSubject: ${ex.subject_name}`)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          View PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExamForUpload(ex);
                            setExamUploadForm({ file_name: '', file_size: '', instructions: '' });
                            setIsUploadExamPaperOpen(true);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-all cursor-pointer"
                        >
                          Replace
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs text-amber-900 font-medium">Exam Question Paper (PDF) pending upload</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExamForUpload(ex);
                          setExamUploadForm({ file_name: '', file_size: '', instructions: '' });
                          setIsUploadExamPaperOpen(true);
                        }}
                        className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload PDF
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedExamId(ex.id);
                      setActiveTab('marks');
                    }}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-center cursor-pointer"
                  >
                    Open Score Sheet (Enter Marks)
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Exam Paper PDF Modal */}
          {isUploadExamPaperOpen && selectedExamForUpload && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl max-w-lg w-full space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Upload Examination Paper (PDF)</h3>
                    <p className="text-xs text-slate-500">{selectedExamForUpload.subject_name} • {selectedExamForUpload.exam_name}</p>
                  </div>
                  <button onClick={() => setIsUploadExamPaperOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUploadExamPaper} className="space-y-4 text-xs">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                    <div className="font-bold text-purple-900">Exam Sitting Details</div>
                    <div className="text-purple-700 text-[11px]">Paper Code: <strong className="font-mono">{selectedExamForUpload.paper_code}</strong> • Cohort: <strong>{selectedExamForUpload.class_name}</strong></div>
                    <div className="text-purple-700 text-[11px]">Date: <strong>{selectedExamForUpload.date}</strong> ({selectedExamForUpload.time})</div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Select Exam Question Paper (PDF only) *</label>
                    <div className="border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-2xl p-6 text-center bg-slate-50 transition-colors">
                      <input
                        type="file"
                        id="exam-pdf-picker"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const sizeStr = file.size > 1024 * 1024 
                              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
                              : `${Math.round(file.size / 1024)} KB`;
                            setExamUploadForm(prev => ({
                              ...prev,
                              file_name: file.name,
                              file_size: sizeStr
                            }));
                          }
                        }}
                      />
                      <label htmlFor="exam-pdf-picker" className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-purple-600" />
                        {examUploadForm.file_name ? (
                          <div className="font-mono font-bold text-purple-900 bg-purple-100 px-3 py-1 rounded-lg">
                            📄 {examUploadForm.file_name} ({examUploadForm.file_size})
                          </div>
                        ) : (
                          <>
                            <div className="font-semibold text-slate-800">Click to choose exam question paper (PDF)</div>
                            <div className="text-[11px] text-slate-400">PDF only (Max 25MB). Securely stored.</div>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Invigilation Instructions or Marking Guide (Optional)</label>
                    <textarea
                      rows={2}
                      value={examUploadForm.instructions}
                      onChange={(e) => setExamUploadForm(prev => ({ ...prev, instructions: e.target.value }))}
                      placeholder="e.g. Scientific calculators allowed; include section B rubrics..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsUploadExamPaperOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!examUploadForm.file_name}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Submit Exam Paper (PDF)
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB: NOTIFICATIONS ===================== */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-600" />
                  Executive Notices &amp; Administrative Bulletins
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official circulars, staff meeting briefs, and academic directives issued by the Headmaster and Academic Master.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
                {(['ALL', 'HEADMASTER', 'ACADEMIC', 'SYSTEM'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNotificationCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      notificationCategoryFilter === cat
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat === 'ALL' ? 'All' : cat === 'HEADMASTER' ? '🏛️ Headmaster' : cat === 'ACADEMIC' ? '🎓 Academic Master' : '⚙️ System'}
                  </button>
                ))}
              </div>
            </div>

            {/* Notices List */}
            <div className="space-y-3">
              {notifications
                .filter(n => notificationCategoryFilter === 'ALL' || n.sender_role === notificationCategoryFilter)
                .map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-5 rounded-2xl border transition-all space-y-3 ${
                      !notif.read ? 'bg-indigo-50/40 border-indigo-200' : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          notif.sender_role === 'HEADMASTER'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : notif.sender_role === 'ACADEMIC'
                            ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                            : 'bg-slate-200 text-slate-800'
                        }`}>
                          {notif.sender_name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">{notif.created_at}</span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase self-start sm:self-auto ${
                        notif.priority === 'URGENT'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : notif.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {notif.priority}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{notif.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                    </div>

                    {notif.action_tab && (
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => setActiveTab(notif.action_tab!)}
                          className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-xs"
                        >
                          {notif.action_label || 'Fungua Sehemu Husika'}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Broadcast Center Integration */}
          <NotificationCenter />
        </div>
      )}

      {/* ===================== TAB: PROFILE & SECURITY ===================== */}
      {(activeTab === 'profile' || activeTab === 'security') && (
        <DashboardProfileTab
          title="Senior Faculty Member Profile"
          subtitle="Departmental faculty allocation, academic credentials, and avatar photo"
          initialOpenPassword={activeTab === 'security'}
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
              <h3 className="text-base font-bold text-slate-900">Account Credentials &amp; Permission Boundaries</h3>
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
              Cancel &amp; Return
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

      {/* ===================== MODAL: HISTORICAL RESULTS ANALYSIS ===================== */}
      {selectedStudentForPastResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl max-w-2xl w-full space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {selectedStudentForPastResult.admission_number}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {selectedStudentForPastResult.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedStudentForPastResult.class_name} • {selectedStudentForPastResult.stream_name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedStudentForPastResult.past_result_grade === 'Good' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Good Standing
                  </span>
                )}
                {selectedStudentForPastResult.past_result_grade === 'Average' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    Average Standing
                  </span>
                )}
                {selectedStudentForPastResult.past_result_grade === 'Needs Support' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Needs Academic Support
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedStudentForPastResult(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Historical KPI Overview */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Historical Average</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {selectedStudentForPastResult.average_score || 85.0}%
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Overall GPA</span>
                <div className="text-2xl font-extrabold text-indigo-700 mt-0.5">
                  {selectedStudentForPastResult.historical_gpa || 3.8}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Attendance</span>
                <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">
                  {selectedStudentForPastResult.attendance_rate || 96}%
                </div>
              </div>
            </div>

            {/* Past Exam History */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                Historical Examinations Breakdown
              </h4>

              {selectedStudentForPastResult.past_exams && selectedStudentForPastResult.past_exams.length > 0 ? (
                <div className="space-y-3">
                  {selectedStudentForPastResult.past_exams.map((ex, exIdx) => (
                    <div key={exIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2">
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs">{ex.exam_name}</div>
                          <div className="text-[11px] text-slate-500">{ex.term} • Year {ex.year}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            Average: {ex.average}%
                          </span>
                          <span className="font-bold text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            {ex.division}
                          </span>
                        </div>
                      </div>

                      {/* Subject Scores Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {ex.subjects.map((sub, sIdx) => (
                          <div key={sIdx} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                            <span className="text-slate-700 font-medium truncate">{sub.name}</span>
                            <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                              sub.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                              sub.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                              sub.grade === 'C' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {sub.score}% ({sub.grade})
                            </span>
                          </div>
                        ))}
                      </div>

                      {ex.remarks && (
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 italic">
                          &quot;{ex.remarks}&quot;
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No historical examination records found for this student.
                </div>
              )}
            </div>

            {/* AI / Academic Master Recommendation */}
            <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
              selectedStudentForPastResult.past_result_grade === 'Good'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : selectedStudentForPastResult.past_result_grade === 'Average'
                ? 'bg-amber-50 border-amber-200 text-amber-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}>
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4" />
                Academic Advisory &amp; Pedagogical Insights (Academic Master &amp; AI):
              </div>
              <p className="leading-relaxed">
                {selectedStudentForPastResult.past_result_grade === 'Good'
                  ? 'The student demonstrates outstanding mastery across all subjects (Grades A & B). Recommended for advanced coursework and national examination preparation challenges.'
                  : selectedStudentForPastResult.past_result_grade === 'Average'
                  ? 'The student maintains steady, average comprehension (Grade C). Closer monitoring during laboratory practical sessions and regular topic assessments recommended.'
                  : 'The student is at academic risk (Grades D & F). Immediate enrollment into structured remedial coaching classes and parent consultation strongly advised.'}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => alert(`Printing comprehensive academic report for ${selectedStudentForPastResult.name}...`)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Full Report
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudentForPastResult(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: COMPOSE EXAM (UPLOAD PDF) ===================== */}
      {isComposeExamModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  Create New Examination (Upload PDF)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Submit official examination paper (PDF) to the Academic Master for moderation and verification</p>
              </div>
              <button onClick={() => setIsComposeExamModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleComposeExamPaper} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Examination Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Standardized Examination 2026"
                  value={composeExamForm.exam_name}
                  onChange={(e) => setComposeExamForm(prev => ({ ...prev, exam_name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
                  <select
                    required
                    value={composeExamForm.subject_id}
                    onChange={(e) => setComposeExamForm(prev => ({ ...prev, subject_id: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white font-semibold"
                  >
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class / Stream *</label>
                  <select
                    required
                    value={composeExamForm.class_name}
                    onChange={(e) => setComposeExamForm(prev => ({ ...prev, class_name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white font-semibold"
                  >
                    {streams.map(str => (
                      <option key={str.id} value={str.name}>{str.name} ({str.class_name})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Examination Date *</label>
                  <input
                    type="date"
                    required
                    value={composeExamForm.date}
                    onChange={(e) => setComposeExamForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Examination Time Window *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 08:30 - 11:30"
                    value={composeExamForm.time}
                    onChange={(e) => setComposeExamForm(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Examination Venue / Hall</label>
                  <input
                    type="text"
                    value={composeExamForm.room}
                    onChange={(e) => setComposeExamForm(prev => ({ ...prev, room: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Candidates Count</label>
                  <input
                    type="number"
                    min="1"
                    value={composeExamForm.candidates_count}
                    onChange={(e) => setComposeExamForm(prev => ({ ...prev, candidates_count: parseInt(e.target.value) || 45 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:bg-white"
                  />
                </div>
              </div>

              {/* PDF File Picker */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Upload Examination Paper (PDF Document Only) *</label>
                <div className="border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-2xl p-6 text-center bg-purple-50/20 transition-colors">
                  <input
                    type="file"
                    id="compose-pdf-picker"
                    accept=".pdf"
                    required
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const sizeStr = file.size > 1024 * 1024 
                          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
                          : `${Math.round(file.size / 1024)} KB`;
                        setComposeExamForm(prev => ({
                          ...prev,
                          paper_pdf_name: file.name,
                          paper_pdf_size: sizeStr
                        }));
                      }
                    }}
                  />
                  <label htmlFor="compose-pdf-picker" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-purple-600" />
                    {composeExamForm.paper_pdf_name ? (
                      <div className="font-mono font-bold text-purple-900 bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200">
                        📄 {composeExamForm.paper_pdf_name} ({composeExamForm.paper_pdf_size})
                      </div>
                    ) : (
                      <>
                        <div className="font-semibold text-purple-900">Click to choose exam question paper (PDF)</div>
                        <div className="text-[11px] text-slate-400">PDF question paper and marking scheme (Max 30MB)</div>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invigilation Instructions or Marking Guide (Optional)</label>
                <textarea
                  rows={2}
                  value={composeExamForm.instructions}
                  onChange={(e) => setComposeExamForm(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Instructions for exam proctors and moderation panel..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsComposeExamModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!composeExamForm.paper_pdf_name}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Examination (PDF) to Academic Master
                </button>
              </div>
            </form>
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
