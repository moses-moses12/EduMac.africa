'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authService, reportService, auditService, studentService, Student, academicService, feeService, resultService, timetableService, assignmentService, libraryService, notificationService, Invoice, Examination, Book, Assignment, TimetableSlot } from '@/services';
import { User, AuditLogItem } from '@/lib/types';
import {
  LayoutDashboard, Users, GraduationCap, Briefcase, UserCheck,
  Layers, CalendarCheck, Award, FileSpreadsheet, CreditCard,
  Clock, ClipboardList, Library, BarChart3, Bell, History,
  Settings, ShieldCheck, Search, Plus, RefreshCw, AlertTriangle,
  X, TrendingUp, Download, Building, TrendingDown, CheckCircle2,
  BookOpen, Eye, Edit, Trash2, MoreHorizontal, Activity,
  DollarSign, BookMarked, User as UserIcon, Lock, Zap,
  PieChart, ArrowUpRight, ArrowDownRight, Shield, Globe, LogOut
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { DataTable, ColumnDef, TableFilter } from '@/components/ui/data-table';
import { StudentFormModal } from '@/components/forms/student-form-modal';
import { AuditViewer } from '@/components/audit/audit-viewer';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { ErrorBoundary } from '@/components/error-boundary';
import { DashboardProfileTab } from '@/components/profile';

// Dynamic code splitting for heavy charting component (Requirement 34: Performance)
const ExecutiveAnalyticsCharts = dynamic(
  () => import('@/components/analytics/executive-charts').then((mod) => mod.ExecutiveAnalyticsCharts),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 bg-slate-900/60 rounded-2xl animate-pulse flex items-center justify-center text-slate-400 text-xs font-mono">
        Loading analytics engine...
      </div>
    ),
  }
);

// ─── Mini progress bar component ─────────────────────────────────────────────
function ProgressBar({ value, max = 100, color = 'bg-indigo-500' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
      <div className={`h-1.5 rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, iconColor, trend, trendVal, barValue, barColor
}: {
  label: string; value: string; sub: string;
  icon: React.ElementType; iconColor: string;
  trend?: 'up' | 'down'; trendVal?: string;
  barValue?: number; barColor?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${iconColor} bg-opacity-10`}>
          <Icon className={`w-4 h-4 ${iconColor.replace('bg-', 'text-')}`} />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trendVal}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{label}</div>
        {barValue !== undefined && <ProgressBar value={barValue} color={barColor} />}
        <div className="text-[11px] text-slate-400 mt-1.5">{sub}</div>
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, sub, action }: {
  icon: React.ElementType; title: string; sub: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-xl">
          <Icon className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="text-[11px] text-slate-500">{sub}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${color}`}>{label}</span>;
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(tabParam || 'overview');

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  const [metrics, setMetrics] = useState({
    total_students: 0, total_teachers: 0, total_staff: 0, total_classes: 0,
    attendance_rate: 0, total_collected: 0, total_outstanding: 0,
    academic_average: 0, total_parents: 0, active_users: 0
  });

  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<User | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('Password123!');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ username: '', email: '', first_name: '', last_name: '', role: 'TEACHER', password: 'Password123!' });
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<any>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('');
  const [liveStudents, setLiveStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [examinationsList, setExaminationsList] = useState<Examination[]>([]);
  const [timetableSlotsList, setTimetableSlotsList] = useState<TimetableSlot[]>([]);
  const [assignmentsList, setAssignmentsList] = useState<Assignment[]>([]);
  const [booksList, setBooksList] = useState<Book[]>([]);
  const [realNotifications, setRealNotifications] = useState<any[]>([]);

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const res = await studentService.getStudents({ page_size: 100 });
      if (res?.results) {
        setLiveStudents(res.results);
      }
    } catch {
      // Graceful fallback
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleStudentStatusChange = async (studentId: string, newStatus: any) => {
    try {
      await studentService.changeStudentStatus(studentId, newStatus);
      fetchStudents();
      fetchData();
    } catch {
      alert('Failed to update student status');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        execRes, usersRes, logsRes, invRes, subRes, examRes, ttRes, asgRes, bookRes, notifRes
      ] = await Promise.allSettled([
        reportService.getExecutiveReport(),
        authService.getUsers(),
        auditService.getAuditLogs(),
        feeService.getInvoices({ page_size: 100 }),
        academicService.getSubjects(),
        resultService.getExaminations({ page_size: 50 }),
        timetableService.getTimetable({ page_size: 50 }),
        assignmentService.getAssignments({ page_size: 50 }),
        libraryService.getBooks({ page_size: 50 }),
        notificationService.getNotifications({ page_size: 20 })
      ]);
      let uList: User[] = [];
      if (usersRes.status === 'fulfilled' && usersRes.value) {
        uList = (usersRes.value as any).results || usersRes.value || [];
        setUsers(uList);
      }
      if (logsRes.status === 'fulfilled' && logsRes.value) {
        setAuditLogs((logsRes.value as any).results || logsRes.value || []);
      }
      if (invRes.status === 'fulfilled' && invRes.value) {
        setInvoices((invRes.value as any).results || invRes.value || []);
      }
      if (subRes.status === 'fulfilled' && subRes.value) {
        setSubjectsList((subRes.value as any).results || subRes.value || []);
      }
      if (examRes.status === 'fulfilled' && examRes.value) {
        setExaminationsList((examRes.value as any).results || examRes.value || []);
      }
      if (ttRes.status === 'fulfilled' && ttRes.value) {
        setTimetableSlotsList((ttRes.value as any).results || ttRes.value || []);
      }
      if (asgRes.status === 'fulfilled' && asgRes.value) {
        setAssignmentsList((asgRes.value as any).results || asgRes.value || []);
      }
      if (bookRes.status === 'fulfilled' && bookRes.value) {
        setBooksList((bookRes.value as any).results || bookRes.value || []);
      }
      if (notifRes.status === 'fulfilled' && notifRes.value) {
        setRealNotifications((notifRes.value as any).results || notifRes.value || []);
      }
      if (execRes.status === 'fulfilled' && (execRes.value as any)?.metrics) {
        setMetrics((prev) => ({
          ...prev,
          ...(execRes.value as any).metrics,
          active_users: (execRes.value as any).metrics.active_users || uList.length,
        }));
      } else if (uList.length > 0) {
        setMetrics((prev) => ({
          ...prev,
          active_users: uList.length,
          total_teachers: uList.filter(u => u.role === 'TEACHER').length,
          total_staff: uList.filter(u => u.role === 'STAFF').length,
          total_parents: uList.filter(u => u.role === 'PARENT').length,
        }));
      }
    } catch { /* graceful fallback */ } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    fetchStudents();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.createUser(newUser);
      setShowAddUserModal(false);
      fetchData();
    } catch { setShowAddUserModal(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetModal) return;
    setResetSubmitting(true);
    setResetMessage(null);
    try {
      await authService.setUserPassword(showResetModal.id, resetPasswordVal);
      setResetMessage(`Password successfully updated for ${showResetModal.username || showResetModal.email}!`);
      setTimeout(() => {
        setShowResetModal(null);
        setResetMessage(null);
        setResetPasswordVal('Password123!');
      }, 1400);
    } catch {
      setResetMessage('Failed to update password. Ensure minimum 8 characters.');
    } finally {
      setResetSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchSearch = u.email.toLowerCase().includes(q) || u.first_name.toLowerCase().includes(q) || u.last_name.toLowerCase().includes(q);
    return matchSearch && (selectedRole === 'ALL' || u.role === selectedRole);
  });

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-700', HEADMASTER: 'bg-amber-100 text-amber-800',
    TEACHER: 'bg-emerald-100 text-emerald-800', STUDENT: 'bg-indigo-100 text-indigo-800',
    PARENT: 'bg-purple-100 text-purple-800', ACCOUNTANT: 'bg-teal-100 text-teal-800',
    LIBRARIAN: 'bg-orange-100 text-orange-800', EXAM_OFFICER: 'bg-pink-100 text-pink-800',
    ACADEMIC: 'bg-cyan-100 text-cyan-800', STAFF: 'bg-slate-200 text-slate-700',
  };

  // Dynamic fee bar chart grouped by class from real invoices
  const feeBarData = React.useMemo(() => {
    if (!invoices || invoices.length === 0) return [];
    const grouped: Record<string, { collected: number; target: number }> = {};
    invoices.forEach(inv => {
      const clsName = typeof inv.student === 'object' && inv.student?.current_class?.name
        ? inv.student.current_class.name
        : 'General Class';
      if (!grouped[clsName]) grouped[clsName] = { collected: 0, target: 0 };
      grouped[clsName].target += Number(inv.total_amount || 0);
      grouped[clsName].collected += Number(inv.paid_amount || 0);
    });
    return Object.entries(grouped).map(([label, data]) => ({
      label,
      collected: data.collected,
      target: data.target,
    }));
  }, [invoices]);

  const gradeDistribution = [
    { grade: 'A', count: 248, color: 'bg-emerald-500', pct: 20 },
    { grade: 'B', count: 387, color: 'bg-indigo-500', pct: 31 },
    { grade: 'C', count: 326, color: 'bg-amber-500', pct: 26 },
    { grade: 'D', count: 187, color: 'bg-orange-500', pct: 15 },
    { grade: 'E', count: 100, color: 'bg-red-500', pct: 8 },
  ];

  const attendanceByClass = [
    { name: 'Form 1A', rate: 98.2 }, { name: 'Form 1B', rate: 97.4 },
    { name: 'Form 2A', rate: 96.8 }, { name: 'Form 2B', rate: 95.1 },
    { name: 'Form 3A', rate: 97.9 }, { name: 'Form 3B', rate: 94.3 },
    { name: 'Form 4A', rate: 96.5 }, { name: 'Form 4B', rate: 97.1 },
  ];

  const totalFeeBilled = metrics.total_collected + metrics.total_outstanding;
  const collectionRate = totalFeeBilled > 0 ? Math.round((metrics.total_collected / totalFeeBilled) * 100) : 0;

  return (
    <div className="space-y-7">
      <Breadcrumbs items={[{ label: 'System Administration', href: '/dashboard/admin' }, { label: activeTab.toUpperCase() }]} />
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-900 text-white uppercase tracking-wider">
              System Administration
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              All systems operational
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">Admin Control Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Institutional oversight, user management, lifecycle control & immutable audit trail.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddUserModal(true)}
            id="btn-provision-user"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Provision User
          </button>
          <button
            onClick={fetchData}
            id="btn-refresh-data"
            className={`p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 10 KPI Metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Students" value={metrics.total_students ? metrics.total_students.toLocaleString() : '0'} sub={metrics.total_students > 0 ? "Enrolled & active" : "No active students"}
          icon={GraduationCap} iconColor="bg-indigo-500" barValue={metrics.total_students} barColor="bg-indigo-500" />
        <StatCard label="Total Teachers" value={String(metrics.total_teachers)} sub={metrics.total_teachers > 0 ? "Certified faculty" : "No faculty registered"}
          icon={Users} iconColor="bg-emerald-500" barValue={metrics.total_teachers} barColor="bg-emerald-500" />
        <StatCard label="Total Staff" value={String(metrics.total_staff)} sub={metrics.total_staff > 0 ? "Non-instructional" : "No staff registered"}
          icon={Briefcase} iconColor="bg-purple-500" barValue={metrics.total_staff} barColor="bg-purple-500" />
        <StatCard label="Total Classes" value={String(metrics.total_classes)} sub={metrics.total_classes > 0 ? "Active form levels & streams" : "No classes registered"}
          icon={Layers} iconColor="bg-amber-500" barValue={metrics.total_classes} barColor="bg-amber-500" />
        <StatCard label="Attendance Rate" value={metrics.attendance_rate > 0 ? `${metrics.attendance_rate}%` : '0%'} sub={metrics.attendance_rate > 0 ? "Institutional daily avg" : "No attendance recorded"}
          icon={CalendarCheck} iconColor="bg-emerald-500" barValue={metrics.attendance_rate} barColor="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Fee Collection" value={metrics.total_collected > 0 ? `Tshilling ${(metrics.total_collected / 1000000).toFixed(1)}M` : 'Tshilling 0.00'} sub={`${collectionRate}% of total billed`}
          icon={CreditCard} iconColor="bg-teal-500" barValue={collectionRate} barColor="bg-teal-500" />
        <StatCard label="Outstanding Fees" value={metrics.total_outstanding > 0 ? `Tshilling ${(metrics.total_outstanding / 1000000).toFixed(1)}M` : 'Tshilling 0.00'} sub={metrics.total_outstanding > 0 ? "Pending remittances" : "No outstanding fees"}
          icon={AlertTriangle} iconColor="bg-amber-500" barValue={totalFeeBilled > 0 ? (metrics.total_outstanding / totalFeeBilled) * 100 : 0} barColor="bg-amber-500" />
        <StatCard label="Academic Performance" value={metrics.academic_average > 0 ? `${metrics.academic_average}%` : '0%'} sub={metrics.academic_average > 0 ? "Institutional mean score" : "No examinations recorded"}
          icon={Award} iconColor="bg-violet-500" barValue={metrics.academic_average} barColor="bg-violet-500" />
        <StatCard label="Active Users" value={metrics.active_users ? metrics.active_users.toLocaleString() : (users.length ? String(users.length) : '0')} sub="Active accounts in system"
          icon={Activity} iconColor="bg-sky-500" barValue={metrics.active_users ? 100 : 0} barColor="bg-sky-500" />
        <StatCard label="Parents Linked" value={metrics.total_parents ? metrics.total_parents.toLocaleString() : '0'} sub={metrics.total_parents > 0 ? "Guardian accounts" : "No guardians linked"}
          icon={UserIcon} iconColor="bg-pink-500" barValue={metrics.total_parents} barColor="bg-pink-500" />
      </div>

      {/* ── Overview Row: Recent Activities + Notifications ── */}
      {(activeTab === 'overview') && (
        <>
          {/* Institutional Trends & Analytics Engine (Live Recharts) */}
          <ErrorBoundary
            fallbackTitle="Analytics Visualizer Offline"
            fallbackMessage="Failed to load visual trend charts. Your tabular data is unaffected."
          >
            <ExecutiveAnalyticsCharts title="Institutional Trends & System Intelligence (Recharts Analytics)" />
          </ErrorBoundary>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Fee Collection Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
              <SectionHeader icon={BarChart3} title="Fee Collection by Form Level" sub="Term 1 2026/2027 – Collected vs. Target" />
              <div className="space-y-3.5 mt-2">
                {feeBarData.map((d) => {
                  const pct = Math.round((d.collected / d.target) * 100);
                  return (
                    <div key={d.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">{d.label}</span>
                        <span className="font-mono text-slate-500">Tshilling {(d.collected / 1000000).toFixed(2)}M / {(d.target / 1000000).toFixed(2)}M</span>
                        <span className={`font-bold ${pct >= 90 ? 'text-emerald-600' : pct >= 75 ? 'text-amber-600' : 'text-red-500'}`}>{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-1000 ${pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grade Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
              <SectionHeader icon={PieChart} title="Grade Distribution" sub="Academic year 2026/27 results" />
              <div className="space-y-3 mt-2">
                {gradeDistribution.map(g => (
                  <div key={g.grade} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg ${g.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>{g.grade}</div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">Grade {g.grade}</span>
                        <span className="font-bold text-slate-700">{g.count} students</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${g.color}`} style={{ width: `${g.pct}%` }} />
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono w-8 text-right">{g.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activities + Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-100 rounded-xl"><History className="w-4 h-4 text-slate-600" /></div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Recent System Activities</h3>
                    <p className="text-[11px] text-slate-500">Live audit event stream</p>
                  </div>
                </div>
                <button onClick={() => setActiveTab('audit')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">View All →</button>
              </div>
              <div className="space-y-2.5">
                {auditLogs.length > 0 ? (
                  auditLogs.slice(0, 6).map((al: any, i: number) => {
                    const user = al.user?.email || al.user_email || 'admin@school.edu';
                    const action = al.action || 'AUDIT_LOG';
                    const resource = al.model_name ? `${al.model_name} ${al.object_id ? `(#${String(al.object_id).slice(0, 8)})` : ''}` : (al.object_type || al.details || 'System Record');
                    const ip = al.ip_address || '127.0.0.1';
                    const time = al.timestamp ? new Date(al.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recent';
                    const severity = action.includes('DELETE') || action.includes('FAIL') ? 'warning' : 'success';
                    return (
                      <div key={al.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${severity === 'success' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">{action}</span>
                          </div>
                          <div className="text-xs font-semibold text-slate-800 truncate mt-0.5">{resource}</div>
                          <div className="text-[11px] text-slate-400 truncate">{user} · IP {ip}</div>
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">{time}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 font-medium">No recent audit log activities recorded</div>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 rounded-xl"><Bell className="w-4 h-4 text-amber-600" /></div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                    <p className="text-[11px] text-slate-500">{realNotifications.filter(n => !n.is_read).length} unread alerts</p>
                  </div>
                </div>
                <button onClick={() => setActiveTab('notifications')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">View All →</button>
              </div>
              <div className="space-y-2.5">
                {realNotifications.length > 0 ? (
                  realNotifications.map((n, i) => (
                    <div key={n.id || i} className={`p-3 rounded-xl border text-xs ${!n.is_read ? 'bg-indigo-50/60 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                          <span className="font-bold text-slate-900">{n.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">{n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recent'}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.message || n.desc}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 font-medium">No system notifications found</div>
                )}
              </div>
            </div>
          </div>

          {/* Attendance by Class */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
            <SectionHeader icon={CalendarCheck} title="Attendance Rate by Classroom" sub="Current term daily average per stream" />
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {attendanceByClass.map(cls => (
                <div key={cls.name} className="text-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className={`text-lg font-extrabold ${cls.rate >= 97 ? 'text-emerald-600' : cls.rate >= 95 ? 'text-amber-600' : 'text-red-500'}`}>
                    {cls.rate}%
                  </div>
                  <div className="text-[11px] font-semibold text-slate-600 mt-0.5">{cls.name}</div>
                  <div className="w-full bg-slate-200 rounded-full h-1 mt-1.5">
                    <div
                      className={`h-1 rounded-full ${cls.rate >= 97 ? 'bg-emerald-500' : cls.rate >= 95 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${cls.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── USERS MODULE ── */}
      {(activeTab === 'users') && (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <SectionHeader
              icon={ShieldCheck}
              title="User Identity & Access Management"
              sub="Provision, audit, and deactivate accounts across all 10 system roles"
              action={
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add User
                </button>
              }
            />
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search by name or email..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="ALL">All Roles</option>
                {['ADMIN','HEADMASTER','ACADEMIC','TEACHER','STUDENT','PARENT','ACCOUNTANT','LIBRARIAN','EXAM_OFFICER','STAFF'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="p-4">User</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length > 0 ? filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.first_name?.[0]}{u.last_name?.[0]}
                        </div>
                        <span className="font-semibold text-slate-900">{u.first_name} {u.last_name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-semibold text-indigo-600 text-[11px]">{u.username || u.email.split('@')[0]}</td>
                    <td className="p-4 font-mono text-slate-600 text-[11px]">{u.email}</td>
                    <td className="p-4">
                      <Badge label={u.role} color={roleColors[u.role] || 'bg-slate-100 text-slate-700'} />
                    </td>
                    <td className="p-4 text-slate-400">{u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '—'}</td>
                    <td className="p-4">
                      <Badge label={u.is_active ? 'Active' : 'Inactive'} color={u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setShowResetModal(u); setResetPasswordVal('Password123!'); setResetMessage(null); }} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 cursor-pointer">Reset Pwd</button>
                        <button onClick={() => alert(`Editing ${u.email}`)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"><Edit className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 text-xs font-medium">
                      No user accounts found matching the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STUDENTS MODULE (DataTable) ── */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <DataTable
            title="Institutional Student Roster"
            subtitle="Live directory of enrolled students with admission details, class placement, status management, and instant tuition invoicing."
            data={liveStudents
              .map((s) => ({
                id: s.id,
                admission_number: s.admission_number,
                name: s.full_name || (s.user ? `${s.user.first_name} ${s.user.last_name}`.trim() : s.first_name ? `${s.first_name} ${s.last_name || ''}`.trim() : s.admission_number),
                email: s.email || s.user?.email || 'N/A',
                phone: s.phone_number || s.user?.phone_number || 'N/A',
                cls: s.class_name || (typeof s.current_class === 'object' ? s.current_class?.name : s.current_class) || 'Unassigned',
                stream: s.stream_name || (typeof s.current_stream === 'object' ? s.current_stream?.name : s.current_stream) || '',
                gender: s.gender || 'MALE',
                status: s.status || 'ACTIVE',
                photo: s.profile_photo,
                raw: s,
              }))
              .filter((s) => {
                const matchesSearch =
                  !studentSearch ||
                  s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                  s.admission_number.toLowerCase().includes(studentSearch.toLowerCase()) ||
                  s.email.toLowerCase().includes(studentSearch.toLowerCase());
                const matchesClass = !studentClassFilter || s.cls === studentClassFilter;
                const matchesStatus = !studentStatusFilter || s.status === studentStatusFilter;
                return matchesSearch && matchesClass && matchesStatus;
              })}
            columns={[
              {
                id: 'admission',
                header: 'Admission #',
                accessorKey: 'admission_number',
                sortable: true,
                cell: (row: any) => (
                  <div>
                    <span className="font-mono text-indigo-400 font-semibold">{row.admission_number}</span>
                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-[100px]">{row.id.slice(0, 8)}...</div>
                  </div>
                ),
              },
              {
                id: 'student',
                header: 'Student Profile',
                sortable: true,
                cell: (row: any) => (
                  <div className="flex items-center gap-2.5">
                    {row.photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={row.photo}
                        alt={row.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                        onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${row.gender === 'FEMALE' || row.gender === 'F' ? 'bg-pink-500' : 'bg-indigo-600'}`}>
                        {row.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-slate-100">{row.name}</div>
                      <div className="text-[11px] text-slate-400">{row.email} {row.phone !== 'N/A' ? `• ${row.phone}` : ''}</div>
                    </div>
                  </div>
                ),
              },
              {
                id: 'class',
                header: 'Class & Stream',
                sortable: true,
                cell: (row: any) => (
                  <div className="flex flex-col">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-medium text-xs inline-block w-fit">
                      {row.cls}
                    </span>
                    {row.stream && (
                      <span className="text-[10px] text-slate-400 mt-0.5">{row.stream}</span>
                    )}
                  </div>
                ),
              },
              {
                id: 'gender',
                header: 'Gender',
                cell: (row: any) => (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${row.gender === 'FEMALE' || row.gender === 'F' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {row.gender}
                  </span>
                ),
              },
              {
                id: 'status',
                header: 'Status',
                sortable: true,
                cell: (row: any) => {
                  const statusColors: Record<string, string> = {
                    ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    INACTIVE: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
                    GRADUATED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                    TRANSFERRED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                    SUSPENDED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    ARCHIVED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                  };
                  const colorCls = statusColors[row.status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
                  return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colorCls}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {row.status}
                    </span>
                  );
                },
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (row: any) => (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedStudentForEdit(row.raw);
                        setShowStudentModal(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition text-xs font-medium cursor-pointer"
                    >
                      Edit
                    </button>
                    {row.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleStudentStatusChange(row.id, 'SUSPENDED')}
                        title="Suspend Student"
                        className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition text-[10px] font-semibold cursor-pointer"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStudentStatusChange(row.id, 'ACTIVE')}
                        title="Activate Student"
                        className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition text-[10px] font-semibold cursor-pointer"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
            rowKey={(row: any) => row.id}
            searchPlaceholder="Search by name, admission #, email..."
            searchQuery={studentSearch}
            onSearchChange={setStudentSearch}
            filters={[
              {
                id: 'class',
                label: 'Class',
                value: studentClassFilter,
                onChange: setStudentClassFilter,
                options: [
                  { label: 'All Classes', value: '' },
                  { label: 'Form 1', value: 'Form 1' },
                  { label: 'Form 2', value: 'Form 2' },
                  { label: 'Form 3', value: 'Form 3' },
                  { label: 'Form 4', value: 'Form 4' },
                ],
              },
              {
                id: 'status',
                label: 'Status',
                value: studentStatusFilter,
                onChange: setStudentStatusFilter,
                options: [
                  { label: 'All Statuses', value: '' },
                  { label: 'Active', value: 'ACTIVE' },
                  { label: 'Inactive', value: 'INACTIVE' },
                  { label: 'Graduated', value: 'GRADUATED' },
                  { label: 'Transferred', value: 'TRANSFERRED' },
                  { label: 'Suspended', value: 'SUSPENDED' },
                  { label: 'Archived', value: 'ARCHIVED' },
                ],
              },
            ]}
            enableSelection={true}
            bulkActions={[
              {
                label: 'Export Selected',
                onClick: (selected) => alert(`Exporting ${selected.length} students to CSV...`),
              },
            ]}
            headerAction={
              <button
                onClick={() => {
                  setSelectedStudentForEdit(null);
                  setShowStudentModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Enroll Student
              </button>
            }
          />
        </div>
      )}

      {/* ── TEACHERS MODULE ── */}
      {activeTab === 'teachers' && (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
          <SectionHeader
            icon={Users}
            title="Faculty Registry"
            sub={`${users.filter(u => u.role === 'TEACHER').length} certified instructional faculty members`}
            action={
              <button
                onClick={() => { setNewUser(prev => ({ ...prev, role: 'TEACHER' })); setShowAddUserModal(true); }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Teacher
              </button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="p-3.5">Teacher</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Username</th>
                  <th className="p-3.5">Date Joined</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.filter(u => u.role === 'TEACHER').length > 0 ? (
                  users.filter(u => u.role === 'TEACHER').map(t => {
                    const initials = `${t.first_name?.[0] || ''}${t.last_name?.[0] || ''}`.toUpperCase() || 'TC';
                    const name = `${t.first_name || ''} ${t.last_name || ''}`.trim() || t.username;
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs shrink-0">{initials}</div>
                            <span className="font-semibold text-slate-900">{name}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-purple-700 text-[11px]">{t.email}</td>
                        <td className="p-3.5 text-slate-600 font-mono text-[11px]">{t.username}</td>
                        <td className="p-3.5 text-slate-600">{t.date_joined ? new Date(t.date_joined).toLocaleDateString() : '—'}</td>
                        <td className="p-3.5"><Badge label={t.is_active ? 'Active' : 'Inactive'} color={t.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'} /></td>
                        <td className="p-3.5 text-right">
                          <button onClick={() => { setShowResetModal(t); setResetPasswordVal('Password123!'); setResetMessage(null); }} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 cursor-pointer">Reset Pwd</button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400 text-xs font-medium">
                      No teachers currently registered in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STAFF MODULE ── */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
          <SectionHeader
            icon={Briefcase}
            title="Non-Instructional Staff Directory"
            sub={`${users.filter(u => u.role === 'STAFF').length} registered support personnel`}
            action={
              <button
                onClick={() => { setNewUser(prev => ({ ...prev, role: 'STAFF' })); setShowAddUserModal(true); }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Staff
              </button>
            }
          />
          {users.filter(u => u.role === 'STAFF').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.filter(u => u.role === 'STAFF').map(s => {
                const initials = `${s.first_name?.[0] || ''}${s.last_name?.[0] || ''}`.toUpperCase() || 'ST';
                const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.username;
                return (
                  <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-purple-300 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xs">{initials}</div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{name}</div>
                        <div className="text-[11px] text-slate-500">{s.email}</div>
                        <div className="text-[10px] font-mono text-slate-400">{s.username}</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                      <Badge label={s.is_active ? 'Active' : 'Inactive'} color={s.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'} />
                      <button onClick={() => { setShowResetModal(s); setResetPasswordVal('Password123!'); setResetMessage(null); }} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer">Reset Pwd</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs font-medium">
              No staff members registered in the database.
            </div>
          )}
        </div>
      )}

      {/* ── PARENTS MODULE ── */}
      {activeTab === 'parents' && (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
          <SectionHeader
            icon={UserCheck}
            title="Parent & Guardian Registry"
            sub={`${users.filter(u => u.role === 'PARENT').length} registered legal guardians`}
            action={
              <button
                onClick={() => { setNewUser(prev => ({ ...prev, role: 'PARENT' })); setShowAddUserModal(true); }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Parent
              </button>
            }
          />
          {users.filter(u => u.role === 'PARENT').length > 0 ? (
            <div className="space-y-3">
              {users.filter(u => u.role === 'PARENT').map(p => {
                const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username;
                return (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900">{name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{p.email} · Registered Guardian</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">Username: {p.username}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge label={p.is_active ? 'Active' : 'Inactive'} color={p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} />
                      <button onClick={() => { setShowResetModal(p); setResetPasswordVal('Password123!'); setResetMessage(null); }} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer">Reset Pwd</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs font-medium">
              No parent accounts currently registered in the database.
            </div>
          )}
        </div>
      )}

      {/* ── ACADEMICS MODULE ── */}
      {activeTab === 'academics' && (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
          <SectionHeader icon={Layers} title="Academic Structure & Curriculum Engine" sub={`${subjectsList.length} subjects registered in curriculum`} />
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="p-3.5">Subject</th><th className="p-3.5">Code</th>
                  <th className="p-3.5">Type</th><th className="p-3.5">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjectsList.length > 0 ? (
                  subjectsList.map((sub: any, i: number) => (
                    <tr key={sub.id || i} className="hover:bg-slate-50/60">
                      <td className="p-3.5 font-semibold text-slate-900">{sub.name}</td>
                      <td className="p-3.5 font-mono text-indigo-700">{sub.code}</td>
                      <td className="p-3.5"><Badge label={sub.is_core ? 'Core' : 'Elective'} color={sub.is_core ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'} /></td>
                      <td className="p-3.5 text-slate-600">{sub.department || 'General'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-400 text-xs font-medium">
                      No academic subjects found in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ATTENDANCE MODULE ── */}
      {activeTab === 'attendance' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
            <SectionHeader icon={CalendarCheck} title="Institutional Attendance Overview" sub="Real-time daily roll call metrics" />
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="text-3xl font-extrabold text-emerald-600">{metrics.attendance_rate > 0 ? `${metrics.attendance_rate}%` : '0%'}</div>
              <div className="text-xs font-bold text-slate-700 mt-1 uppercase tracking-wider">Overall Institutional Rate</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Calculated from student daily and subject attendance records</div>
            </div>
          </div>
        </div>
      )}

      {/* ── EXAMINATIONS MODULE ── */}
      {activeTab === 'examinations' && (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
          <SectionHeader icon={FileSpreadsheet} title="Examinations Management" sub={`${examinationsList.length} examination sessions recorded`} />
          {examinationsList.length > 0 ? (
            <div className="space-y-4">
              {examinationsList.map((ex: any, i: number) => (
                <div key={ex.id || i} className="p-5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900">{ex.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{ex.term_name || ex.term || 'Term'} · {ex.academic_year_name || ex.academic_year || 'Academic Year'} · {ex.start_date || 'Date TBD'}</div>
                    </div>
                    <Badge label={ex.status || (ex.is_published ? 'PUBLISHED' : 'DRAFT')} color={ex.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs font-medium">
              No examination sessions configured in database.
            </div>
          )}
        </div>
      )}

      {/* ── RESULTS MODULE ── */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
          <SectionHeader icon={Award} title="Academic Results & Grade Moderation" sub="Published results available to students and parents" />
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div className="text-3xl font-extrabold text-violet-700">{metrics.academic_average > 0 ? `${metrics.academic_average}%` : '0%'}</div>
            <div className="text-xs font-bold text-slate-700 mt-1 uppercase tracking-wider">Institution Academic Average</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Aggregated from verified and published score sheets</div>
          </div>
        </div>
      )}

      {/* ── FEES MODULE ── */}
      {activeTab === 'fees' && (() => {
        const totalInvoiced = invoices.reduce((acc, inv) => acc + Number(inv.total_amount || 0), 0);
        const totalCollected = invoices.reduce((acc, inv) => acc + Number(inv.paid_amount || 0), 0);
        const totalOutstanding = invoices.reduce((acc, inv) => acc + Number(inv.balance || 0), 0);
        const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;
        const outstandingPct = totalInvoiced > 0 ? Math.round((totalOutstanding / totalInvoiced) * 100) : 0;
        const pendingCount = invoices.filter(inv => Number(inv.balance || 0) > 0).length;

        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-2">Tshilling {totalInvoiced.toLocaleString()}</div>
                <ProgressBar value={100} color="bg-slate-400" />
                <div className="text-[11px] text-slate-400 mt-1">{invoices.length} student invoices</div>
              </div>
              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-sm">
                <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Total Collected</div>
                <div className="text-2xl font-extrabold text-emerald-900 mt-2">Tshilling {totalCollected.toLocaleString()}</div>
                <ProgressBar value={collectionRate} color="bg-emerald-500" />
                <div className="text-[11px] text-emerald-600 font-medium mt-1">{collectionRate}% collection rate</div>
              </div>
              <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 shadow-sm">
                <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Outstanding Balance</div>
                <div className="text-2xl font-extrabold text-amber-900 mt-2">Tshilling {totalOutstanding.toLocaleString()}</div>
                <ProgressBar value={outstandingPct} color="bg-amber-500" />
                <div className="text-[11px] text-amber-600 font-medium mt-1">{pendingCount} student(s) with pending balance</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
              <SectionHeader icon={CreditCard} title="Recent Invoices & Payment Status" sub="Live student billing records from finance ledger" />
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                      <th className="p-3.5">Invoice #</th>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Billed</th>
                      <th className="p-3.5">Paid</th>
                      <th className="p-3.5">Balance</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.length > 0 ? (
                      invoices.map((inv) => {
                        const studentName = typeof inv.student === 'object' && inv.student?.user
                          ? `${inv.student.user.first_name} ${inv.student.user.last_name}`
                          : (typeof inv.student === 'object' ? inv.student?.admission_number : String(inv.student || '—'));
                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/60">
                            <td className="p-3.5 font-mono text-indigo-700 font-bold">{inv.invoice_number}</td>
                            <td className="p-3.5 font-semibold text-slate-800">{studentName}</td>
                            <td className="p-3.5 font-mono text-slate-700">Tshilling {Number(inv.total_amount).toLocaleString()}</td>
                            <td className="p-3.5 font-mono text-emerald-600 font-semibold">Tshilling {Number(inv.paid_amount).toLocaleString()}</td>
                            <td className="p-3.5 font-mono text-amber-600 font-semibold">Tshilling {Number(inv.balance).toLocaleString()}</td>
                            <td className="p-3.5">
                              <Badge
                                label={inv.status}
                                color={
                                  inv.status === 'PAID'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : inv.status === 'PARTIALLY_PAID'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-amber-100 text-amber-700'
                                }
                              />
                            </td>
                            <td className="p-3.5 text-slate-400">{inv.due_date || '—'}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-slate-400 text-xs font-medium">
                          No student invoices found in database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── TIMETABLE MODULE ── */}
      {activeTab === 'timetable' && (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
          <SectionHeader icon={Clock} title="Institutional Master Timetable" sub={`${timetableSlotsList.length} scheduled periods across classrooms`} />
          {timetableSlotsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="p-3.5">Day</th>
                    <th className="p-3.5">Time</th>
                    <th className="p-3.5">Class</th>
                    <th className="p-3.5">Subject</th>
                    <th className="p-3.5">Teacher</th>
                    <th className="p-3.5">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timetableSlotsList.map((slot: any, i: number) => (
                    <tr key={slot.id || i} className="hover:bg-slate-50/60">
                      <td className="p-3.5 font-bold text-slate-700">{slot.day_of_week}</td>
                      <td className="p-3.5 font-mono text-slate-500">{slot.start_time} - {slot.end_time}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{typeof slot.academic_class === 'object' ? slot.academic_class?.name : slot.academic_class}</td>
                      <td className="p-3.5 text-indigo-700 font-semibold">{typeof slot.subject === 'object' ? slot.subject?.name : slot.subject}</td>
                      <td className="p-3.5 text-slate-600">{typeof slot.teacher === 'object' && slot.teacher?.user ? `${slot.teacher.user.first_name} ${slot.teacher.user.last_name}` : 'Assigned Teacher'}</td>
                      <td className="p-3.5 text-slate-400">{slot.room_number || 'Main Classroom'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs font-medium">
              No master timetable slots currently scheduled.
            </div>
          )}
        </div>
      )}

      {/* ── ASSIGNMENTS MODULE ── */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
          <SectionHeader icon={ClipboardList} title="School-Wide Coursework & Assignments" sub={`${assignmentsList.length} active assignments in system`} />
          {assignmentsList.length > 0 ? (
            <div className="space-y-3">
              {assignmentsList.map((a: any, i: number) => (
                <div key={a.id || i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{a.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Subject: {typeof a.subject === 'object' ? a.subject?.name : a.subject} · Due: {a.due_date || '—'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-indigo-700">Max Score: {a.max_score}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs font-medium">
              No coursework assignments recorded.
            </div>
          )}
        </div>
      )}

      {/* ── LIBRARY MODULE ── */}
      {activeTab === 'library' && (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
          <SectionHeader icon={Library} title="Resource Centre & Library Holdings" sub={`${booksList.length} cataloged titles`} />
          {booksList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="p-3.5">Title</th>
                    <th className="p-3.5">Author</th>
                    <th className="p-3.5">ISBN</th>
                    <th className="p-3.5">Total Copies</th>
                    <th className="p-3.5">Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {booksList.map((b: any, i: number) => (
                    <tr key={b.id || i} className="hover:bg-slate-50/60">
                      <td className="p-3.5 font-semibold text-slate-900">{b.title}</td>
                      <td className="p-3.5 text-slate-700">{b.author}</td>
                      <td className="p-3.5 font-mono text-slate-500">{b.isbn || '—'}</td>
                      <td className="p-3.5 font-bold text-slate-700">{b.total_copies}</td>
                      <td className="p-3.5 text-emerald-600 font-semibold">{b.available_copies}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs font-medium">
              No library holdings currently registered in the database.
            </div>
          )}
        </div>
      )}

      {/* ── REPORTS MODULE ── */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <ErrorBoundary
            fallbackTitle="Analytics Visualizer Offline"
            fallbackMessage="Failed to load visual trend charts. Your tabular data is unaffected."
          >
            <ExecutiveAnalyticsCharts title="Administrator System Analytics & Trends Engine (Live Recharts)" />
          </ErrorBoundary>
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
            <SectionHeader icon={BarChart3} title="Executive Analytics & Reports Engine" sub="Demographic breakdowns, fee ratios, academic distribution"
              action={
                <button onClick={() => alert('Exporting consolidated report...')} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">
                  <Download className="w-3.5 h-3.5" />Export PDF
                </button>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Term 1 Fee Collection Report', date: 'Oct 11, 2026', status: 'Ready', icon: CreditCard, color: 'emerald' },
                { title: 'Academic Performance Overview', date: 'Oct 10, 2026', status: 'Ready', icon: Award, color: 'violet' },
                { title: 'Attendance Analytics Report', date: 'Oct 10, 2026', status: 'Ready', icon: CalendarCheck, color: 'teal' },
                { title: 'Student Demographic Report', date: 'Oct 08, 2026', status: 'Ready', icon: GraduationCap, color: 'indigo' },
                { title: 'Faculty Utilization Report', date: 'Oct 07, 2026', status: 'Ready', icon: Users, color: 'emerald' },
                { title: 'End-Term Exam Performance', date: 'Pending', status: 'Pending', icon: FileSpreadsheet, color: 'amber' },
              ].map((r, i) => {
                const Icon = r.icon;
                return (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-indigo-300 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-xl bg-${r.color}-100`}><Icon className={`w-4 h-4 text-${r.color}-700`} /></div>
                      <div className="font-semibold text-slate-900 text-xs">{r.title}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">{r.date}</span>
                      <div className="flex items-center gap-2">
                        <Badge label={r.status} color={r.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'} />
                        {r.status === 'Ready' && <button onClick={() => alert(`Downloading ${r.title}`)} className="p-1 hover:bg-slate-200 rounded text-slate-500"><Download className="w-3.5 h-3.5" /></button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS MODULE (Enterprise Live Notification Center) ── */}
      {activeTab === 'notifications' && (
        <ErrorBoundary
          fallbackTitle="Notification Center Unavailable"
          fallbackMessage="Unable to load real-time notification stream. Please check connection and retry."
        >
          <NotificationCenter />
        </ErrorBoundary>
      )}

      {/* ── AUDIT LOGS MODULE ── */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <ErrorBoundary
            fallbackTitle="Audit Trail Unavailable"
            fallbackMessage="Audit log service temporarily unavailable. Please retry."
          >
            <AuditViewer />
          </ErrorBoundary>
        </div>
      )}

      {/* ── SETTINGS MODULE ── */}
      {(activeTab === 'settings') && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
            <SectionHeader icon={Settings} title="Institution Settings & System Configuration" sub="School identity, academic session parameters & integrations" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { label: 'Institution Name', val: 'Apex Academy International' },
                { label: 'Country & Curriculum', val: 'Kenya — CBC / KCSE Framework' },
                { label: 'System Version', val: 'Apex SMS Enterprise v2.4 (Next.js 16 + DRF)' },
                { label: 'Database Engine', val: 'PostgreSQL 16 / SQLite (30 Relational Models)' },
                { label: 'Security Level', val: 'RBAC + JWT Auth (Zero Trust)' },
                { label: 'API Version', val: 'REST API v1 — Swagger & ReDoc enabled' },
              ].map((s, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
                  <div className="font-bold text-slate-900 mt-1">{s.val}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
            <SectionHeader icon={Shield} title="Security & Access Control" sub="RBAC configuration and system permission matrix" />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {['ADMIN','HEADMASTER','TEACHER','STUDENT','PARENT','ACCOUNTANT','LIBRARIAN','EXAM_OFFICER','ACADEMIC','STAFF'].map(r => (
                <div key={r} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                  <Badge label={r} color={roleColors[r] || 'bg-slate-100 text-slate-700'} />
                  <div className="text-[10px] text-emerald-600 font-semibold mt-2">Active</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PROFILE MODULE ── */}
      {activeTab === 'profile' && (
        <DashboardProfileTab
          title="System Administrator Profile"
          subtitle="Administrative directory credentials, account security, and avatar photo"
          extraDetails={[
            { label: 'Security Privilege', val: 'Tier-1 Root Superuser' },
            { label: 'Access Scope', val: 'Full System Administration' },
          ]}
        />
      )}

      {/* ── LOGOUT MODULE ── */}
      {activeTab === 'logout' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm max-w-md mx-auto text-center space-y-4 my-8">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <LogOut className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Log Out of Admin Control Center?</h3>
          <p className="text-xs text-slate-500">
            Are you sure you want to terminate your administrative session? You will be redirected to the secure login page.
          </p>
          <div className="flex items-center justify-center gap-3 pt-3">
            <button
              onClick={() => setActiveTab('overview')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              Cancel & Return
            </button>
            <button
              onClick={() => authService.logout()}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer"
            >
              Confirm Log Out
            </button>
          </div>
        </div>
      )}

      {/* ── PROVISION USER MODAL ── */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Provision New User Account</h3>
                <p className="text-xs text-slate-500 mt-0.5">Create account with institutional role & credentials</p>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Username</label>
                  <input type="text" placeholder="e.g. jdoe" value={newUser.username}
                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input type="email" required placeholder="name@school.edu" value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">First Name</label>
                  <input type="text" required placeholder="First Name" value={newUser.first_name}
                    onChange={e => setNewUser({ ...newUser, first_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Last Name</label>
                  <input type="text" required placeholder="Last Name" value={newUser.last_name}
                    onChange={e => setNewUser({ ...newUser, last_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">System Role</label>
                <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 font-semibold"
                >
                  {['TEACHER','STUDENT','PARENT','ACCOUNTANT','LIBRARIAN','EXAM_OFFICER','ACADEMIC','HEADMASTER','ADMIN','STAFF'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Initial Password</label>
                <input type="password" required minLength={8} value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddUserModal(false)} className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs cursor-pointer">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RESET PASSWORD MODAL ── */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Set Account Password</h3>
              <button onClick={() => setShowResetModal(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="font-semibold text-slate-800">{showResetModal?.first_name} {showResetModal?.last_name}</div>
              <div className="text-slate-500 font-mono text-[11px]">Email: {showResetModal?.email}</div>
              <div className="text-slate-500 font-mono text-[11px]">Username: <strong className="text-indigo-600">{showResetModal?.username || showResetModal?.email.split('@')[0]}</strong></div>
              <div className="text-[10px] font-bold text-slate-600 uppercase mt-1">Role: {showResetModal?.role}</div>
            </div>

            {resetMessage && (
              <div className={`p-2.5 rounded-lg text-xs font-medium ${resetMessage.includes('successfully') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                {resetMessage}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700">New Password</label>
                  <button type="button" onClick={() => setResetPasswordVal('Password123!')} className="text-[10px] text-indigo-600 hover:underline cursor-pointer">
                    Reset to default
                  </button>
                </div>
                <input
                  type="text"
                  required
                  minLength={8}
                  value={resetPasswordVal}
                  onChange={e => setResetPasswordVal(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono text-slate-800"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Minimum 8 characters. Default is Password123!</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowResetModal(null)} className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer disabled:opacity-50"
                >
                  {resetSubmitting ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── STUDENT FORM MODAL (React Hook Form + Zod) ── */}
      <StudentFormModal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        initialData={selectedStudentForEdit}
        onSuccess={() => {
          fetchData();
          fetchStudents();
        }}
      />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />Loading admin console...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
