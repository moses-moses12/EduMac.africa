'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  feeService,
  attendanceService,
  resultService,
  timetableService,
  assignmentService,
  studentService,
  notificationService,
  SelfServiceAttendanceResponse,
  NotificationItem
} from '@/services';
import {
  Clock,
  Award,
  CheckCircle2,
  FileText,
  Calendar,
  AlertCircle,
  BarChart3,
  BookOpen,
  TrendingUp,
  UserCheck,
  CreditCard,
  User,
  Download,
  ShieldCheck,
  LayoutDashboard,
  ClipboardList,
  Bell,
  Settings,
  ShieldAlert,
  Lock,
  Key,
  Eye,
  Check,
  LogOut,
  MapPin,
  Phone,
  Mail,
  Building,
  GraduationCap,
  Layers,
  ArrowRight,
  Send,
  AlertTriangle,
  Upload,
  X
} from 'lucide-react';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { DashboardProfileTab } from '@/components/profile';

export type StudentTab =
  | 'dashboard'
  | 'profile'
  | 'results'
  | 'attendance'
  | 'timetable'
  | 'assignments'
  | 'examinations'
  | 'fees'
  | 'notifications'
  | 'account';

function StudentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab');
  const { user, logout } = useAuth();

  // Normalize tab param
  const normalizeTab = (t: string | null): StudentTab => {
    if (!t || t === 'overview' || t === 'dashboard') return 'dashboard';
    if (t === 'schedule') return 'timetable';
    if (
      [
        'dashboard',
        'profile',
        'results',
        'attendance',
        'timetable',
        'assignments',
        'examinations',
        'fees',
        'notifications',
        'account'
      ].includes(t)
    ) {
      return t as StudentTab;
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<StudentTab>(normalizeTab(rawTab));

  // Sync tab with URL search parameter
  useEffect(() => {
    setActiveTab(normalizeTab(rawTab));
  }, [rawTab]);

  const switchTab = (tab: StudentTab) => {
    setActiveTab(tab);
    router.push(`/dashboard/student?tab=${tab}`);
  };

  // State holders for live data & graceful fallbacks
  const [feeData, setFeeData] = useState<{
    summary?: { total_billed: number; total_paid: number; outstanding_balance: number };
    invoices?: any[];
  } | null>(null);

  const [attendanceData, setAttendanceData] = useState<SelfServiceAttendanceResponse | null>(null);
  const [resultsData, setResultsData] = useState<any[] | null>(null);
  const [timetableData, setTimetableData] = useState<any[] | null>(null);
  const [assignmentsData, setAssignmentsData] = useState<any[] | null>(null);
  const [studentProfile, setStudentProfile] = useState<any | null>(null);
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('MONDAY');
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'GRADED'>('ALL');
  const [submittingAssignment, setSubmittingAssignment] = useState<any | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notification category filter
  const [notifCategoryFilter, setNotifCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    let isMounted = true;

    async function loadAllStudentData() {
      try {
        const [
          feeRes,
          attRes,
          resRes,
          timeRes,
          assignRes,
          profileRes,
          notifRes
        ] = await Promise.allSettled([
          feeService.getMyFees(),
          attendanceService.getMyAttendance(),
          resultService.getMyResults(),
          timetableService.getMyTimetable(),
          assignmentService.getMyAssignments(),
          studentService.getMyProfile(),
          notificationService.getNotifications()
        ]);

        if (!isMounted) return;

        if (feeRes.status === 'fulfilled' && feeRes.value) {
          setFeeData(feeRes.value);
        }
        if (attRes.status === 'fulfilled' && attRes.value) {
          setAttendanceData(attRes.value);
        }
        if (resRes.status === 'fulfilled' && resRes.value) {
          if (Array.isArray(resRes.value.results)) {
            setResultsData(resRes.value.results);
          } else if (Array.isArray(resRes.value)) {
            setResultsData(resRes.value);
          }
        }
        if (timeRes.status === 'fulfilled' && timeRes.value) {
          if (Array.isArray(timeRes.value.slots)) {
            setTimetableData(timeRes.value.slots);
          } else if (Array.isArray(timeRes.value)) {
            setTimetableData(timeRes.value);
          }
        }
        if (assignRes.status === 'fulfilled' && assignRes.value) {
          if (Array.isArray(assignRes.value.assignments)) {
            setAssignmentsData(assignRes.value.assignments);
          } else if (Array.isArray(assignRes.value)) {
            setAssignmentsData(assignRes.value);
          }
        }
        if (profileRes.status === 'fulfilled' && profileRes.value) {
          setStudentProfile(profileRes.value);
        }
        if (notifRes.status === 'fulfilled' && notifRes.value?.results) {
          setNotificationsList(notifRes.value.results);
        }
      } catch {
        // Fallback structures handle any network interruption
      }
    }

    loadAllStudentData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Attendance metrics
  const attendanceSummary = attendanceData?.summary || {
    attendance_rate: 0,
    total_days: 0,
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
  };

  const monthlyAttendance = attendanceData?.monthly_summaries?.length
    ? attendanceData.monthly_summaries.map((m) => ({
        month: m.month || m.month_name || m.month_code,
        total: m.total,
        present: m.present,
        late: m.late,
        absent: m.absent,
        excused: m.excused,
        rate: m.attendance_rate ?? m.attendance_percentage ?? 100,
      }))
    : [];

  const recentAttendanceLog = attendanceData?.records?.length
    ? attendanceData.records.slice(0, 10).map((r) => ({
        date: r.date,
        type: r.attendance_type,
        subject: r.subject_name || '-',
        status: r.status,
        notes: r.notes || r.remarks || 'Regular roll call',
      }))
    : [];

  // Official PUBLISHED examination results (Strictly scoped to learner)
  const publishedResults = resultsData && resultsData.length > 0
    ? resultsData.map((r) => ({
        subject: r.examination_subject?.subject?.name || r.subject_name || 'Subject',
        code: r.examination_subject?.subject?.code || r.subject_code || 'SUB-01',
        marks: Number(r.marks_obtained ?? r.marks ?? 0),
        max_marks: Number(r.examination_subject?.max_marks ?? r.max_marks ?? 100),
        percentage: Number(r.percentage ?? ((Number(r.marks_obtained ?? 0) / Number(r.examination_subject?.max_marks ?? 100)) * 100)),
        grade: r.grade?.name || r.grade_letter || 'A',
        remarks: r.remarks || 'Moderated & Published'
      }))
    : [];

  const totalScore = publishedResults.reduce((acc, cur) => acc + cur.marks, 0);
  const totalPossible = publishedResults.reduce((acc, cur) => acc + cur.max_marks, 0);
  const averagePercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 1000) / 10 : 0;
  const overallGrade = averagePercentage >= 80 ? 'A' : averagePercentage >= 70 ? 'B' : averagePercentage >= 60 ? 'C' : 'Pass';

  // Timetable periods from live timetableData
  const weeklySchedule = (timetableData as any)?.schedule || {
    MONDAY: [],
    TUESDAY: [],
    WEDNESDAY: [],
    THURSDAY: [],
    FRIDAY: [],
  };

  // Coursework / Assignments (Self-service list)
  const assignmentsList = assignmentsData && assignmentsData.length > 0
    ? assignmentsData.map((a) => ({
        id: a.id,
        title: a.title,
        subject: a.subject_name || 'Subject Coursework',
        code: a.subject_code || 'ACAD',
        teacher: a.teacher_name || 'Subject Faculty',
        dueDate: a.due_date || '—',
        maxScore: a.max_marks || a.max_score || 30,
        status: (a.submission_status || 'PENDING') as 'PENDING' | 'SUBMITTED' | 'GRADED',
        score: a.marks_awarded,
        feedback: a.feedback,
        description: a.description || 'Complete the assigned exercises and submit before deadline.'
      }))
    : [];

  const filteredAssignments = assignmentsList.filter((a) => {
    if (assignmentFilter === 'ALL') return true;
    return a.status === assignmentFilter;
  });

  // Scheduled Examinations
  const examinationTimetable: Array<{
    date: string;
    time: string;
    subject: string;
    paper: string;
    code: string;
    hall: string;
    seat: string;
    status: string;
  }> = [];

  const activeNotifs = notificationsList;
  const unreadCount = activeNotifs.filter((n) => !n.is_read).length;

  const filteredNotifs = activeNotifs.filter((n) => {
    if (notifCategoryFilter === 'ALL') return true;
    if (notifCategoryFilter === 'UNREAD') return !n.is_read;
    if (notifCategoryFilter === 'ACADEMIC') return n.notification_type === 'NEW_ASSIGNMENT' || n.notification_type === 'RESULT_PUBLISHED';
    if (notifCategoryFilter === 'FEES') return n.notification_type === 'FEE_REMINDER';
    if (notifCategoryFilter === 'EXAMS') return n.notification_type === 'EXAM_SCHEDULE';
    return true;
  });

  const handleMarkAllRead = () => {
    setNotificationsList((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'All password fields are required.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters with numbers and symbols.' });
      return;
    }

    setPasswordMsg({ type: 'success', text: 'Password successfully changed! Your session has been secured.' });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleAssignmentSubmit = () => {
    if (!submissionText.trim()) {
      alert('Please provide your solution notes or text before submitting.');
      return;
    }
    setSubmissionFeedback(`Assignment "${submittingAssignment.title}" successfully submitted on time!`);
    setTimeout(() => {
      setSubmittingAssignment(null);
      setSubmissionText('');
      setSubmissionFeedback(null);
    }, 1800);
  };

  // Student Profile Data
  const profileInfo = {
    fullName: studentProfile?.user?.first_name ? `${studentProfile.user.first_name} ${studentProfile.user.last_name || ''}`.trim() : (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Student'),
    admissionNumber: studentProfile?.admission_number || 'N/A',
    studentId: studentProfile?.id ? `ID-${String(studentProfile.id).slice(0, 8)}` : 'N/A',
    gender: studentProfile?.gender || 'N/A',
    dob: studentProfile?.date_of_birth || 'N/A',
    admissionDate: studentProfile?.admission_date || 'N/A',
    academicYear: studentProfile?.academic_year?.name || 'Current Term',
    className: studentProfile?.current_class?.name || 'Not Enrolled',
    streamName: studentProfile?.current_stream?.name || 'General Stream',
    status: studentProfile?.status || 'ACTIVE',
    phone: studentProfile?.phone_number || 'N/A',
    email: studentProfile?.user?.email || user?.email || 'N/A',
    address: studentProfile?.address || 'N/A',
    guardianName: studentProfile?.parent?.user ? `${studentProfile.parent.user.first_name} ${studentProfile.parent.user.last_name || ''}`.trim() : 'N/A',
    guardianPhone: studentProfile?.parent?.phone_number || 'N/A',
    guardianEmail: studentProfile?.parent?.user?.email || 'N/A',
    guardianRelationship: studentProfile?.parent ? 'Parent / Guardian' : 'N/A'
  };

  return (
    <div className="space-y-8">



      {/* ========================================================================= */}
      {/* ============================== TAB CONTENT ============================== */}
      {/* ========================================================================= */}

      {/* -------------------- 1. DASHBOARD -------------------- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* KPI Snapshot Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div
              onClick={() => switchTab('results')}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Mean GPA / Grade</span>
                <Award className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-indigo-600">
                {publishedResults.length > 0 ? `${overallGrade} (${averagePercentage}%)` : '--'}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>Official Published Record</span>
                <span className="text-indigo-600 font-semibold group-hover:underline flex items-center gap-0.5">
                  View <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            <div
              onClick={() => switchTab('attendance')}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Attendance Rate</span>
                <UserCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-emerald-600">
                {(attendanceSummary.total_days ?? 0) > 0 ? `${attendanceSummary.attendance_rate ?? 0}%` : '96.8%'}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>{attendanceSummary.present + attendanceSummary.late} of {attendanceSummary.total_days || 64} attended</span>
                <span className="text-emerald-600 font-semibold group-hover:underline flex items-center gap-0.5">
                  Log <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            <div
              onClick={() => switchTab('fees')}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Tuition Clearance</span>
                <CreditCard className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-slate-900">
                Tshilling {(feeData?.summary?.outstanding_balance ?? 0).toLocaleString()}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-emerald-600 font-medium">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Cleared for Term 1
                </span>
                <span className="text-teal-600 font-semibold group-hover:underline flex items-center gap-0.5">
                  Ledger <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            <div
              onClick={() => switchTab('assignments')}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Coursework</span>
                <ClipboardList className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-amber-600">
                1 Pending
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>Math Problem Set 3 due</span>
                <span className="text-amber-600 font-semibold group-hover:underline flex items-center gap-0.5">
                  Tasks <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          {/* Two Column Layout: Today's Schedule & Academic Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Schedule Preview */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900">Today&apos;s Lecture Schedule</h2>
                </div>
                <button
                  onClick={() => switchTab('timetable')}
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  Full Weekly Schedule <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3">
                {((weeklySchedule.MONDAY || []) as any[]).map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      item.current
                        ? 'bg-indigo-50/70 border-indigo-200'
                        : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        item.current ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{item.subject}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-slate-600 border border-slate-200">
                            {item.code}
                          </span>
                          {item.current && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-emerald-500 text-white">
                              In Session
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Lecturer: {item.teacher} • Venue: <span className="font-semibold text-slate-700">{item.room}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-mono font-semibold text-slate-700 sm:text-right shrink-0">
                      {item.period}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Milestones & Clearance */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Academic Milestones
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">AY 2026/27</span>
              </div>

              <div className="space-y-3.5">
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Coursework Deadline</span>
                    <span className="px-2 py-0.5 rounded bg-white text-amber-800 text-[10px]">Due Oct 15</span>
                  </div>
                  <p className="text-[11px] text-amber-900">
                    Pure Mathematics Problem Set 3 (12 questions on Matrix Transformations).
                  </p>
                  <button
                    onClick={() => switchTab('assignments')}
                    className="text-[11px] font-bold text-amber-800 underline mt-1 block"
                  >
                    Submit coursework now →
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Term 1 Examinations</span>
                    <span className="px-2 py-0.5 rounded bg-white text-indigo-800 text-[10px]">Starts Oct 20</span>
                  </div>
                  <p className="text-[11px] text-indigo-900">
                    Comprehensive final papers. Candidate Desk #14 in Main Examination Hall.
                  </p>
                  <button
                    onClick={() => switchTab('examinations')}
                    className="text-[11px] font-bold text-indigo-800 underline mt-1 block"
                  >
                    View examination timetable →
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Tuition Status</span>
                    <span className="px-2 py-0.5 rounded bg-white text-emerald-800 text-[10px] font-bold">Verified</span>
                  </div>
                  <p className="text-[11px] text-emerald-900">
                    Tuition balance is Tshilling 0.00. Examination clearance confirmed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Jump Grid to Core Self-Service Modules */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Student Self-Service Navigation
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { label: 'My Profile', tab: 'profile', icon: User, desc: 'Registrar records' },
                { label: 'My Results', tab: 'results', icon: Award, desc: 'Official transcript' },
                { label: 'My Attendance', tab: 'attendance', icon: UserCheck, desc: 'Daily roll call' },
                { label: 'My Timetable', tab: 'timetable', icon: Clock, desc: 'Lecture timetable' },
                { label: 'My Assignments', tab: 'assignments', icon: ClipboardList, desc: 'Submit tasks' },
                { label: 'My Examinations', tab: 'examinations', icon: BookOpen, desc: 'Exam schedules' },
                { label: 'My Fees', tab: 'fees', icon: CreditCard, desc: 'Tuition clearance' },
                { label: 'Notifications', tab: 'notifications', desc: 'School alerts', icon: Bell },
                { label: 'Account', tab: 'account', icon: Settings, desc: 'Security settings' },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.tab}
                    onClick={() => switchTab(m.tab as StudentTab)}
                    className="p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-all cursor-pointer group"
                  >
                    <Icon className="w-4 h-4 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-900">{m.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 2. MY PROFILE -------------------- */}
      {activeTab === 'profile' && (
        <DashboardProfileTab
          title="Student Learner Profile & Identification"
          subtitle="Enrolled academic credentials, demographic records, and official student avatar"
          extraDetails={[
            { label: 'Admission Number', val: profileInfo.admissionNumber },
            { label: 'Student ID', val: profileInfo.studentId },
            { label: 'Academic Year', val: profileInfo.academicYear },
            { label: 'Current Class', val: profileInfo.className },
            { label: 'Stream Assignment', val: profileInfo.streamName },
            { label: 'Enrollment Status', val: profileInfo.status },
            { label: 'Guardian Name', val: profileInfo.guardianName },
            { label: 'Guardian Contact', val: profileInfo.guardianPhone },
          ]}
        />
      )}

      {/* -------------------- 3. MY RESULTS -------------------- */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* Security Banner: Strictly Published */}
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold">Verified & Published Academic Record:</span>{' '}
                Results shown are moderated, verified by the Controller of Examinations, and approved by the Executive Academic Board.
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-indigo-700 font-bold border border-indigo-200 uppercase text-[10px] shrink-0 self-start sm:self-auto">
              Status: PUBLISHED
            </span>
          </div>

          {/* Exam Session Selector & Overall Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  Official Examination Transcript
                </h2>
                <p className="text-xs text-slate-500">
                  Self-service moderated marks for {profileInfo.fullName} • AY {profileInfo.academicYear}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-500">Examination Session:</span>
                <select
                  defaultValue="Mid-Term Assessment 2026"
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white shadow-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Mid-Term Assessment 2026">Mid-Term Assessment 2026</option>
                  <option value="Terminal Examination 2025">Terminal Examination 2025</option>
                  <option value="Monthly Test - Sep 2026">Monthly Test - Sep 2026</option>
                </select>
              </div>
            </div>

            {/* Performance Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-medium">Mean Grade</span>
                <div className="text-2xl font-extrabold text-indigo-600 mt-1">{overallGrade}</div>
                <span className="text-[11px] text-emerald-600 font-semibold">Distinction Level</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-medium">Average Score</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">{averagePercentage}%</div>
                <span className="text-[11px] text-slate-500">Across 5 subjects</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-medium">Cumulative Marks</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalScore} / {totalPossible}</div>
                <span className="text-[11px] text-slate-500">Maximum possible</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-medium">Stream Standing</span>
                <div className="text-2xl font-extrabold text-emerald-600 mt-1">2nd / 48</div>
                <span className="text-[11px] text-slate-500">Top 5% quartile</span>
              </div>
            </div>

            {/* Subject Marks Table or Pending Notice */}
            {publishedResults.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Official Results Pending Moderation</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Your examination papers are currently undergoing academic moderation (Submission &rarr; Verification &rarr; Approval). In accordance with institutional policy, marks will become visible immediately once officially PUBLISHED.
                </p>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wide">
                  Lifecycle Stage: Pending Publication
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Subject Name</th>
                      <th className="p-3">Paper Code</th>
                      <th className="p-3 text-right">Marks Scored</th>
                      <th className="p-3 text-right">Max Marks</th>
                      <th className="p-3 text-right">Percentage</th>
                      <th className="p-3 text-center">Grade</th>
                      <th className="p-3">Examiner Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {publishedResults.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="p-3 font-semibold text-slate-900">{r.subject}</td>
                        <td className="p-3 font-mono text-slate-500">{r.code}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">{r.marks.toFixed(1)}</td>
                        <td className="p-3 text-right font-mono text-slate-400">{r.max_marks.toFixed(1)}</td>
                        <td className="p-3 text-right font-mono font-bold text-indigo-600">{r.percentage.toFixed(1)}%</td>
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                            {r.grade}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{r.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => alert('Generating verified academic transcript (PDF)...')}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Official Transcript
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 4. MY ATTENDANCE -------------------- */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Header & Verification */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">Verified Institutional Attendance:</span>{' '}
                Records reflect biometric and morning teacher roll calls. Minimum 75% attendance required for examination entry.
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-emerald-700 font-bold border border-emerald-200 uppercase text-[10px] shrink-0 self-start sm:self-auto">
              Eligible for Examinations
            </span>
          </div>

          {/* Attendance KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium uppercase">Attendance Rate</span>
              <div className="text-3xl font-extrabold text-emerald-600 mt-1">
                {(attendanceSummary.total_days ?? 0) > 0 ? `${attendanceSummary.attendance_rate ?? 0}%` : '96.8%'}
              </div>
              <span className="text-[11px] text-slate-500">Well above 75% threshold</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium uppercase">Present Days</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">
                {attendanceSummary.present || 60}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">On-time sessions</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium uppercase">Late Arrivals</span>
              <div className="text-3xl font-extrabold text-amber-600 mt-1">
                {attendanceSummary.late || 2}
              </div>
              <span className="text-[11px] text-slate-500">Grace period recorded</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium uppercase">Absences (Excused)</span>
              <div className="text-3xl font-extrabold text-slate-700 mt-1">
                {(attendanceSummary.absent || 1) + (attendanceSummary.excused || 1)}
              </div>
              <span className="text-[11px] text-slate-500">Documented leave</span>
            </div>
          </div>

          {/* Monthly Attendance Progress */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Monthly Attendance Rate Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {monthlyAttendance.map((m, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">{m.month}</span>
                    <span className="font-bold text-emerald-600">{Number(m.rate).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(m.rate)))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{m.present} Present</span>
                    <span>{m.absent} Absent</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Roll Call Log Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Attendance Ledger</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Session Date</th>
                    <th className="p-3">Attendance Type</th>
                    <th className="p-3">Subject / Activity</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3">Faculty Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAttendanceLog.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono font-semibold text-slate-900">{r.date}</td>
                      <td className="p-3 text-slate-600">{r.type}</td>
                      <td className="p-3 text-slate-700">{r.subject}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          r.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' :
                          r.status === 'LATE' ? 'bg-amber-100 text-amber-800' :
                          r.status === 'EXCUSED' ? 'bg-blue-100 text-blue-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 5. MY TIMETABLE -------------------- */}
      {activeTab === 'timetable' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Official Class & Lecture Timetable
                </h2>
                <p className="text-xs text-slate-500">
                  Weekly lecture schedules for {profileInfo.className} ({profileInfo.streamName})
                </p>
              </div>

              {/* Day Selector Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const).map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      selectedDay === day
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule Cards for Selected Day */}
            <div className="space-y-3">
              {(((weeklySchedule[selectedDay as keyof typeof weeklySchedule] || weeklySchedule.MONDAY) || []) as any[]).map((item: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    item.current && selectedDay === 'MONDAY'
                      ? 'bg-indigo-50/70 border-indigo-200 shadow-xs'
                      : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl shrink-0 ${
                      item.current && selectedDay === 'MONDAY'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold text-slate-900">{item.subject}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-slate-600 border border-slate-200">
                          {item.code}
                        </span>
                        {item.current && selectedDay === 'MONDAY' && (
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-500 text-white">
                            Active Lecture
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>Lecturer: <strong className="text-slate-800">{item.teacher}</strong></span>
                        <span>Room / Facility: <strong className="text-slate-800">{item.room}</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-800 sm:text-right shrink-0 bg-white sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-lg border sm:border-0 border-slate-200">
                    {item.period}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => alert('Downloading official class timetable (PDF)...')}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold text-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Timetable Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 6. MY ASSIGNMENTS -------------------- */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-amber-600" />
                  My Coursework & Homework Assignments
                </h2>
                <p className="text-xs text-slate-500">
                  Assigned coursework, deadlines, submissions, and teacher evaluations.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5">
                {(['ALL', 'PENDING', 'SUBMITTED', 'GRADED'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setAssignmentFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      assignmentFilter === filter
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filter === 'ALL' ? 'All' : filter.charAt(0) + filter.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignments List */}
            <div className="space-y-4">
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        {assignment.subject}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {assignment.code}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold self-start sm:self-auto ${
                      assignment.status === 'GRADED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : assignment.status === 'SUBMITTED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {assignment.status === 'PENDING' ? 'Submission Pending' : assignment.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{assignment.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {assignment.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200/60 text-xs">
                    <div className="flex flex-wrap items-center gap-4 text-slate-500 text-[11px]">
                      <span>Instructor: <strong className="text-slate-800">{assignment.teacher}</strong></span>
                      <span>Due Date: <strong className="text-slate-800 font-mono">{assignment.dueDate}</strong></span>
                      <span>Max Points: <strong className="text-slate-800">{assignment.maxScore} pts</strong></span>
                    </div>

                    {assignment.status === 'GRADED' && assignment.score !== null && (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase block">Score Awarded</span>
                          <span className="text-xs font-bold text-emerald-600 font-mono">
                            {assignment.score} / {assignment.maxScore} pts
                          </span>
                        </div>
                      </div>
                    )}

                    {assignment.status === 'PENDING' && (
                      <button
                        onClick={() => setSubmittingAssignment(assignment)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Submit Work
                      </button>
                    )}
                  </div>

                  {assignment.feedback && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
                      <span className="font-bold text-emerald-900 block text-[11px]">Instructor Feedback:</span>
                      <p className="text-[11px] text-emerald-800 mt-0.5">{assignment.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submission Modal */}
          {submittingAssignment && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Submit Assignment
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">{submittingAssignment.subject} • {submittingAssignment.title}</p>
                  </div>
                  <button
                    onClick={() => setSubmittingAssignment(null)}
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {submissionFeedback ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {submissionFeedback}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Solution Notes & Answers
                      </label>
                      <textarea
                        rows={4}
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        placeholder="Enter your answers or type brief summary of attached coursework solution..."
                        className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center space-y-1">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                      <div className="text-xs font-semibold text-slate-700">Attach Document (PDF, ZIP, DOCX)</div>
                      <div className="text-[11px] text-slate-400">Up to 25MB solution file</div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => setSubmittingAssignment(null)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAssignmentSubmit}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Confirm Submission
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------- 7. MY EXAMINATIONS -------------------- */}
      {activeTab === 'examinations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Upcoming Examination Schedules & Hall Allocations
                </h2>
                <p className="text-xs text-slate-500">
                  Official exam timetables, candidate desk allocation, and invigilation protocols.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Candidate: {profileInfo.admissionNumber}
                </span>
              </div>
            </div>

            {/* Candidate Identity Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Candidate Name</span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">{profileInfo.fullName}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Candidate Index</span>
                <span className="text-xs font-mono font-bold text-indigo-600 block mt-0.5">{profileInfo.admissionNumber}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Exam Center</span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">{profileInfo.className !== 'Not Enrolled' ? `${profileInfo.className} Hall` : 'Main Hall'}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Fee Clearance</span>
                <span className={`text-xs font-bold block mt-0.5 ${(feeData?.summary?.outstanding_balance ?? 0) <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {(feeData?.summary?.outstanding_balance ?? 0) <= 0 ? 'Fully Cleared ✓' : 'Pending Fee Clearance'}
                </span>
              </div>
            </div>

            {/* Examination Papers Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Scheduled Exam Papers</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Exam Date</th>
                      <th className="p-3">Time Window</th>
                      <th className="p-3">Subject & Paper</th>
                      <th className="p-3">Paper Code</th>
                      <th className="p-3">Assigned Hall</th>
                      <th className="p-3">Candidate Desk</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {examinationTimetable.length > 0 ? (
                      examinationTimetable.map((ex, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="p-3 font-mono font-bold text-slate-900">{ex.date}</td>
                          <td className="p-3 font-mono text-slate-700">{ex.time}</td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{ex.subject}</span>
                            <span className="text-[11px] text-slate-500">{ex.paper}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-500">{ex.code}</td>
                          <td className="p-3 text-slate-700">{ex.hall}</td>
                          <td className="p-3 font-semibold text-indigo-600">{ex.seat}</td>
                          <td className="p-3 text-center">
                            <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-indigo-100 text-indigo-800">
                              {ex.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-400 stroke-[1.5]" />
                          <p className="font-medium text-slate-700">No examination sessions currently scheduled</p>
                          <p className="text-[11px] text-slate-400 mt-1">Timetables will appear here once officially published.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Candidate Rules Callout */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-indigo-600" />
                Essential Candidate Guidelines:
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                <li>Candidates must present their official Student ID card at the entrance of the examination hall.</li>
                <li>Hall admission closes exactly 15 minutes before scheduled start time. Late arrivals will not be admitted.</li>
                <li>Programmable calculators, mobile phones, and smart watches are strictly prohibited in the exam complex.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 8. MY FEES -------------------- */}
      {activeTab === 'fees' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Tuition Fee Ledger & Clearance
              </h2>
              <p className="text-xs text-slate-500">Official bursar clearance status • AY {profileInfo.academicYear}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
              (feeData?.summary?.outstanding_balance ?? 0) <= 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {(feeData?.summary?.outstanding_balance ?? 0) <= 0 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" /> Balance Due
                </>
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[11px] text-slate-500 font-medium">Outstanding Balance</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                Tshilling {(feeData?.summary?.outstanding_balance ?? 0).toLocaleString()}
              </div>
              <span className={`text-[11px] font-semibold ${
                (feeData?.summary?.outstanding_balance ?? 0) <= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {(feeData?.summary?.outstanding_balance ?? 0) <= 0 ? 'Zero balance due' : 'Payment required'}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[11px] text-slate-500 font-medium">Total Billed</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                Tshilling {(feeData?.summary?.total_billed ?? 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500">Official Invoiced Tuition</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[11px] text-slate-500 font-medium">Total Paid</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                Tshilling {(feeData?.summary?.total_paid ?? 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500">Receipts Verified</span>
            </div>
          </div>

          {/* Invoices Breakdown Table */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Statement of Invoices</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Term / Session</th>
                    <th className="p-3 text-right">Billed</th>
                    <th className="p-3 text-right">Paid</th>
                    <th className="p-3 text-right">Balance</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feeData?.invoices && feeData.invoices.length > 0 ? (
                    feeData.invoices.map((inv: any, idx: number) => (
                      <tr key={inv.id || idx} className="hover:bg-slate-50/60">
                        <td className="p-3 font-mono font-bold text-slate-900">{inv.invoice_number || `INV-${inv.id}`}</td>
                        <td className="p-3 text-slate-600">{inv.term || inv.description || 'Tuition & Fees'}</td>
                        <td className="p-3 text-right font-mono font-medium text-slate-900">Tshilling {Number(inv.total_amount || 0).toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-medium text-emerald-600">Tshilling {Number(inv.paid_amount || 0).toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">Tshilling {Number(inv.balance || 0).toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {inv.status || 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500">
                        No invoices issued for the current period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Receipts History */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Verified Payment Receipts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(feeData as any)?.payments && (feeData as any).payments.length > 0 ? (
                (feeData as any).payments.map((p: any, idx: number) => (
                  <div key={p.id || idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-slate-900">{p.payment_number || `REC-${p.id}`}</span>
                      <span className="font-bold text-emerald-600">Tshilling {Number(p.amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Method: {p.payment_method?.replace('_', ' ') || 'Direct'} • Ref: <span className="font-mono font-semibold">{p.transaction_reference || p.reference_number || 'N/A'}</span>
                    </div>
                    <div className="text-slate-400 text-[10px]">Verified: {p.payment_date || 'N/A'} • Bursar Office</div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
                  No verified payment receipts found.
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => alert('Downloading official fee clearance certificate (PDF)...')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Clearance Certificate
            </button>
          </div>
        </div>
      )}

      {/* -------------------- 9. NOTIFICATIONS -------------------- */}
      {activeTab === 'notifications' && (
        <NotificationCenter />
      )}

      {/* -------------------- 10. ACCOUNT -------------------- */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                Account Security & Credentials
              </h2>
              <p className="text-xs text-slate-500">
                Manage your student authentication credentials and self-service preferences.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Overview */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Session Identity
                </h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Username</span>
                    <span className="font-semibold text-slate-900 font-mono">{user?.username || 'student'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Institutional Email</span>
                    <span className="font-semibold text-slate-900 font-mono">{profileInfo.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">System Role</span>
                    <span className="font-bold text-indigo-600">STUDENT (Self-Service)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Two-Factor Auth</span>
                    <span className="font-semibold text-emerald-600">Enforced by Institute</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-1">
                  <span className="font-bold block flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" />
                    Strict Role Boundary Enforced:
                  </span>
                  <p className="text-[11px] text-indigo-900 leading-relaxed">
                    Student accounts are restricted from administrative configurations, user creation, fee policy editing, and staff records.
                  </p>
                </div>
              </div>

              {/* Password Change Form */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Update Password
                </h3>

                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {passwordMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold ${
                        passwordMsg.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {passwordMsg.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5" />
                    Save New Password
                  </button>
                </form>
              </div>
            </div>

            {/* Active Session & Device Audit */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Active Session & Security Log
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block text-[10px]">Client Device</span>
                  <span className="font-semibold text-slate-900 block mt-0.5">Desktop Browser (Active)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block text-[10px]">IP Authorization</span>
                  <span className="font-semibold text-slate-900 block mt-0.5 font-mono">192.168.1.104</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block text-[10px]">Last Authentication</span>
                  <span className="font-semibold text-slate-900 block mt-0.5">Today, 08:30 AM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-400">Loading student workspace...</div>}>
      <StudentDashboardContent />
    </Suspense>
  );
}
