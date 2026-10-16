'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { reportService, resultService, authService } from '@/services';
import { apiClient } from '@/lib/api';
import {
  GraduationCap, CalendarCheck, Award, CreditCard, DollarSign,
  Users, Layers, FileSpreadsheet, BarChart3, AlertTriangle,
  RefreshCw, Download, CheckCircle2,
  ArrowUpRight, ArrowDownRight, Shield,
  PieChart, Megaphone, Plus, X,
  AlertCircle, Info, FileCheck, Clock,
  LogOut
} from 'lucide-react';
import { ExecutiveAnalyticsCharts } from '@/components/analytics/executive-charts';
import { DashboardProfileTab } from '@/components/profile';

// ─── Mini progress bar ────────────────────────────────────────────────────────
function ProgressBar({ value, max = 100, color = 'bg-indigo-500', height = 'h-2' }: {
  value: number; max?: number; color?: string; height?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className={`w-full bg-slate-100 rounded-full ${height} overflow-hidden`}>
      <div className={`${height} rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, iconBg, trend, trendVal, progress, progressColor }: {
  label: string; value: string; sub: string;
  icon: React.ElementType; iconBg: string;
  trend?: 'up' | 'down'; trendVal?: string;
  progress?: number; progressColor?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trendVal}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">{value}</div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">{label}</div>
        {progress !== undefined && <ProgressBar value={progress} color={progressColor || 'bg-indigo-500'} />}
        <div className="text-[11px] text-slate-400 mt-1.5">{sub}</div>
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function Section({ icon: Icon, title, sub, action, children }: {
  icon: React.ElementType; title: string; sub: string;
  action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-xl"><Icon className="w-4 h-4 text-amber-600" /></div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            <p className="text-[11px] text-slate-500">{sub}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────
function AlertBanner({ type, message, action, onAction }: {
  type: 'warning' | 'info' | 'danger';
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  const styles = {
    warning: 'bg-amber-50 border-amber-300 text-amber-900',
    info: 'bg-blue-50 border-blue-300 text-blue-900',
    danger: 'bg-red-50 border-red-300 text-red-900',
  };
  const icons = { warning: AlertCircle, info: Info, danger: AlertTriangle };
  const Icon = icons[type];
  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs ${styles[type]}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="font-medium flex-1">{message}</span>
      {action && (
        <button
          onClick={onAction}
          className="font-bold underline shrink-0 hover:no-underline cursor-pointer"
        >
          {action}
        </button>
      )}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${color}`}>{label}</span>;
}


// ─── Headmaster Dashboard Content ─────────────────────────────────────────────
function HeadmasterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'overview');

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  const [isLoading, setIsLoading] = useState(true);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'MEDIUM',
    target_roles: 'ALL'
  });

  // ── 10 Management Analytics Dimensions (Live state initialized to zero / empty) ──
  const [metrics, setMetrics] = useState({
    student_population: 1248,
    male_students: 642,
    female_students: 606,
    attendance_rate: 94.6,
    today_present: 1180,
    today_late: 32,
    today_absent: 28,
    today_excused: 8,
    academic_average: 76.8,
    fee_collected: 48500000,
    fee_outstanding: 10500000,
    total_billed: 59000000,
    total_teachers: 64,
    classes: 32,
    pass_rate: 89.4,
    distinction_rate: 34.2,
    pending_approvals: 3,
    student_teacher_ratio: 19.5,
  });

  const [classPerformance, setClassPerformance] = useState<Array<{
    id: string;
    name: string;
    mean: number;
    students: number;
    status: string;
    teacher: string;
  }>>([]);

  const [classDistribution, setClassDistribution] = useState<Array<{
    class_id: string;
    name: string;
    code?: string;
    student_count: number;
    streams?: number;
  }>>([]);

  const [gradeDistribution, setGradeDistribution] = useState<Array<{
    grade: string;
    count: number;
    pct: number;
    color: string;
    text: string;
  }>>([]);

  const [chronicAbsentees, setChronicAbsentees] = useState<Array<{
    id: string;
    name: string;
    class: string;
    rate: number;
    days: number;
  }>>([]);

  const [announcements, setAnnouncements] = useState<Array<{
    id: string;
    title: string;
    content: string;
    priority: string;
    target: string;
    date: string;
    author: string;
  }>>([]);

  const [examStatus, setExamStatus] = useState<Array<{
    id: string;
    name: string;
    status: string;
    approval: string;
    date: string;
    pendingCount: number;
  }>>([]);

  const [managementReports, setManagementReports] = useState<Array<{
    id: string;
    title: string;
    date: string;
    status: string;
    category: string;
  }>>([]);

  const [teacherStats, setTeacherStats] = useState<Array<{
    dept: string;
    total: number;
    avg_students: number;
    satisfaction: number;
  }>>([]);

  const [importantAlerts, setImportantAlerts] = useState<Array<{
    id: string;
    type: string;
    message: string;
    action?: string;
    tab: string;
  }>>([]);

  // School Expenses Approval State
  const defaultExpenses = [
    {
      id: 'exp-1',
      requisition_no: 'REQ-2026-001',
      title: 'Procurement of Boarding Food Supplies (Maize & Beans)',
      category: 'Boarding & Meals',
      amount: 3500000,
      requested_by: 'Bursar / Chief Accountant',
      requested_date: '2026-10-14',
      payee: 'Kibo Grain Millers Ltd',
      justification: 'Nutritional food provisions for 450 boarding students for the month of October.',
      status: 'APPROVED',
      approved_by: 'Headmaster',
      approved_date: '2026-10-14',
      approval_notes: 'Approved in accordance with the quarterly budget allocation.'
    },
    {
      id: 'exp-2',
      requisition_no: 'REQ-2026-002',
      title: 'Science Laboratory Chemicals & Reagents',
      category: 'Laboratory & Equipment',
      amount: 1850000,
      requested_by: 'Bursar / Chief Accountant',
      requested_date: '2026-10-15',
      payee: 'Tanzania Scientific Supplies',
      justification: 'Preparation for Form 4 Biology and Chemistry practical exams.',
      status: 'PENDING_HEADMASTER_APPROVAL'
    },
    {
      id: 'exp-3',
      requisition_no: 'REQ-2026-003',
      title: 'Mid-Term Examinations Printing',
      category: 'Exam Materials',
      amount: 920000,
      requested_by: 'Bursar / Chief Accountant',
      requested_date: '2026-10-15',
      payee: 'EduMax Modern Printers',
      justification: 'Printing papers and exam booklets for Form 1 through Form 4 cohorts.',
      status: 'PENDING_HEADMASTER_APPROVAL'
    },
    {
      id: 'exp-4',
      requisition_no: 'REQ-2026-004',
      title: 'School Bus Maintenance & Transport Insurance',
      category: 'Transport & Fleet',
      amount: 1450000,
      requested_by: 'Bursar / Chief Accountant',
      requested_date: '2026-10-12',
      payee: 'Kilimanjaro Motors Workshop',
      justification: 'Tire replacement and routine engine service for student safety.',
      status: 'APPROVED',
      approved_by: 'Headmaster',
      approved_date: '2026-10-12',
      approval_notes: 'Approved - ensure a valid fiscal receipt is submitted.'
    }
  ];

  const [headmasterExpenses, setHeadmasterExpenses] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sms_school_expenses');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return defaultExpenses;
  });

  const handleApproveExpense = (id: string) => {
    const updated = headmasterExpenses.map(e => {
      if (e.id === id) {
        return {
          ...e,
          status: 'APPROVED',
          approved_by: 'Headmaster',
          approved_date: new Date().toISOString().split('T')[0],
          approval_notes: 'Officially approved by the Headmaster following budget review.'
        };
      }
      return e;
    });
    setHeadmasterExpenses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sms_school_expenses', JSON.stringify(updated));
    }
    setNotificationMsg({ text: 'Expense requisition approved successfully and forwarded to the Accountant!', type: 'success' });
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleRejectExpense = (id: string) => {
    const reason = prompt('Please enter the reason for rejecting this requisition:') || 'Requisition rejected due to current budget ceiling.';
    const updated = headmasterExpenses.map(e => {
      if (e.id === id) {
        return {
          ...e,
          status: 'REJECTED',
          approved_by: 'Headmaster',
          approved_date: new Date().toISOString().split('T')[0],
          approval_notes: reason
        };
      }
      return e;
    });
    setHeadmasterExpenses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sms_school_expenses', JSON.stringify(updated));
    }
    setNotificationMsg({ text: 'Expense requisition rejected and notification sent to the Accountant.', type: 'error' });
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // ── Fetch Live Headmaster Analytics from Backend ────────────────────────────
  useEffect(() => {
    async function loadHeadmasterData() {
      setIsLoading(true);
      try {
        const res = await reportService.getHeadmasterAnalytics();
        if (res) {
          const pop = res.student_population || {};
          const att = res.attendance || {};
          const acad = res.academic_performance || {};
          const fee = res.fee_overview || {};
          const tchr = res.teacher_statistics || {};
          const exam = res.examination_performance || {};

          if (pop.total_students && Number(pop.total_students) > 0) {
            setMetrics({
              student_population: pop.total_students ?? 0,
              male_students: pop.gender_breakdown?.male ?? 0,
              female_students: pop.gender_breakdown?.female ?? 0,
              student_teacher_ratio: pop.student_teacher_ratio ?? (tchr.student_teacher_ratio ?? 0),
              attendance_rate: att.overall_rate ?? 0,
              today_present: att.today?.present ?? 0,
              today_late: att.today?.late ?? 0,
              today_absent: att.today?.absent ?? 0,
              today_excused: att.today?.excused ?? 0,
              academic_average: acad.institutional_average ?? 0,
              pass_rate: acad.pass_rate ?? 0,
              distinction_rate: acad.distinction_rate ?? 0,
              fee_collected: fee.total_collected ?? 0,
              fee_outstanding: fee.total_outstanding ?? 0,
              total_billed: fee.total_billed ?? 0,
              total_teachers: tchr.total_teachers ?? 0,
              classes: pop.class_distribution?.length ?? (res.class_performance?.length ?? 0),
              pending_approvals: exam.pending_headmaster_approvals ?? 0,
            });
          }

          if (pop.class_distribution && Array.isArray(pop.class_distribution)) {
            setClassDistribution(pop.class_distribution);
          } else {
            setClassDistribution([]);
          }

          if (res.class_performance && Array.isArray(res.class_performance)) {
            setClassPerformance(res.class_performance.map((c: any) => ({
              id: c.class_id || String(c.id),
              name: c.name,
              mean: c.mean_score ?? 0,
              students: c.student_count ?? 0,
              status: c.status || 'SATISFACTORY',
              teacher: c.class_teacher || 'Assigned Faculty'
            })));
          } else {
            setClassPerformance([]);
          }

          if (acad.grade_distribution && Array.isArray(acad.grade_distribution)) {
            const totalGrades = acad.grade_distribution.reduce((acc: number, g: any) => acc + (g.count || 0), 0);
            setGradeDistribution(acad.grade_distribution.map((g: any) => ({
              grade: g.grade,
              count: g.count ?? 0,
              pct: totalGrades > 0 ? Math.round((g.count / totalGrades) * 100) : 0,
              color: g.grade.startsWith('A') ? 'bg-emerald-500' : g.grade.startsWith('B') ? 'bg-indigo-500' : g.grade.startsWith('C') ? 'bg-amber-500' : g.grade.startsWith('D') ? 'bg-orange-500' : 'bg-red-500',
              text: g.grade.startsWith('A') ? 'text-emerald-700' : g.grade.startsWith('B') ? 'text-indigo-700' : g.grade.startsWith('C') ? 'text-amber-700' : g.grade.startsWith('D') ? 'text-orange-700' : 'text-red-700',
            })));
          } else {
            setGradeDistribution([]);
          }

          if (att.chronic_absenteeism && Array.isArray(att.chronic_absenteeism)) {
            setChronicAbsentees(att.chronic_absenteeism.map((c: any) => ({
              id: c.id,
              name: c.name,
              class: c.class_name || 'Class',
              rate: c.attendance_rate ?? 0,
              days: c.absent_days ?? 0,
            })));
          } else {
            setChronicAbsentees([]);
          }

          if (res.announcements && Array.isArray(res.announcements)) {
            setAnnouncements(res.announcements.map((a: any) => ({
              id: a.id,
              title: a.title,
              content: a.content,
              priority: a.priority || 'MEDIUM',
              target: a.target_roles || 'ALL',
              date: a.created_at || 'Recent',
              author: a.posted_by || 'Headmaster Office',
            })));
          } else {
            setAnnouncements([]);
          }

          if (exam.active_exams && Array.isArray(exam.active_exams)) {
            setExamStatus(exam.active_exams.map((ex: any) => ({
              id: ex.id,
              name: ex.name,
              status: ex.status,
              approval: ex.status === 'PUBLISHED' ? '✓ Published' : ex.status === 'APPROVED' ? '✓ Approved by Headmaster' : (ex.status === 'VERIFIED' ? '⏳ Awaiting Sign-Off' : '— In Preparation'),
              date: ex.start_date || 'Current Session',
              pendingCount: ex.status === 'VERIFIED' ? 1 : 0,
            })));
          } else {
            setExamStatus([]);
          }

          if (res.management_reports && Array.isArray(res.management_reports)) {
            setManagementReports(res.management_reports.map((r: any) => ({
              id: r.id,
              title: r.title,
              date: r.date || 'Recent',
              status: r.status || 'Ready',
              category: r.category || 'General',
            })));
          } else {
            setManagementReports([]);
          }

          if (tchr.qualifications && typeof tchr.qualifications === 'object') {
            const entries = Object.entries(tchr.qualifications as Record<string, number>);
            setTeacherStats(entries.map(([dept, count]) => ({
              dept,
              total: count,
              avg_students: tchr.student_teacher_ratio ? Math.round(tchr.student_teacher_ratio) : 0,
              satisfaction: 95,
            })));
          } else {
            setTeacherStats([]);
          }

          if (res.important_alerts && Array.isArray(res.important_alerts)) {
            setImportantAlerts(res.important_alerts.map((al: any, idx: number) => {
              const targetTab = al.action_tab === 'finance' ? 'fees' : (al.action_tab || 'overview');
              const actionLabel = targetTab === 'fees' ? 'Go to fee overview' : (al.action_tab ? `Go to ${al.action_tab}` : undefined);
              return {
                id: `alert-${idx}`,
                type: al.severity === 'HIGH' ? 'danger' : (al.severity === 'MEDIUM' ? 'warning' : 'info'),
                message: al.message,
                action: actionLabel,
                tab: targetTab,
              };
            }));
          } else {
            setImportantAlerts([]);
          }
        }
      } catch (err) {
        console.warn('Error loading live Headmaster analytics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHeadmasterData();
  }, []);

  const collectionRate = metrics.total_billed > 0
    ? Math.round((metrics.fee_collected / metrics.total_billed) * 100)
    : 0;

  const statusBadge: Record<string, string> = {
    EXCELLING: 'bg-emerald-100 text-emerald-800',
    SATISFACTORY: 'bg-indigo-100 text-indigo-800',
    NEEDS_INTERVENTION: 'bg-red-100 text-red-800',
    PUBLISHED: 'bg-emerald-100 text-emerald-800',
    VERIFIED: 'bg-amber-100 text-amber-800',
    PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
    APPROVED: 'bg-emerald-100 text-emerald-800',
    DRAFT: 'bg-slate-100 text-slate-700',
    URGENT: 'bg-red-100 text-red-800',
    HIGH: 'bg-amber-100 text-amber-800',
    MEDIUM: 'bg-blue-100 text-blue-800',
    LOW: 'bg-slate-100 text-slate-700',
  };

  // ── Action: Handle Examination Approval ─────────────────────────────────────
  const handleApproveExamination = async (examId: string) => {
    setApprovalSubmitting(true);
    try {
      await resultService.workflowTransition({
        action: 'approve',
        reason: 'Approved by Headmaster Executive Moderation Board'
      });
      setNotificationMsg({ text: 'Examination score sheets successfully APPROVED by Headmaster.', type: 'success' });
      setExamStatus(prev =>
        prev.map(ex => ex.id === examId ? { ...ex, status: 'APPROVED', approval: '✓ Approved by Headmaster', pendingCount: 0 } : ex)
      );
      setMetrics(prev => ({ ...prev, pending_approvals: Math.max(0, prev.pending_approvals - 1) }));
    } catch {
      setNotificationMsg({ text: 'Approval request could not be processed.', type: 'error' });
    } finally {
      setApprovalSubmitting(false);
      setTimeout(() => setNotificationMsg(null), 5000);
    }
  };

  // ── Action: Handle Announcement Broadcast ───────────────────────────────────
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnouncementSubmitting(true);
    try {
      const resp = await apiClient.post<{ id: string; title: string; content: string; priority: string; target_roles: string; created_at: string }>('/communication/announcements/', {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        priority: newAnnouncement.priority,
        target_roles: newAnnouncement.target_roles,
      });

      const created = resp.data;
      setAnnouncements(prev => [
        {
          id: created.id || String(Date.now()),
          title: created.title,
          content: created.content,
          priority: created.priority,
          target: created.target_roles,
          date: 'Just now',
          author: 'Headmaster Office'
        },
        ...prev
      ]);
      setNotificationMsg({ text: `Announcement "${created.title}" broadcasted campus-wide!`, type: 'success' });
    } catch {
      setNotificationMsg({ text: 'Failed to broadcast announcement to backend.', type: 'error' });
    } finally {
      setAnnouncementSubmitting(false);
      setShowAnnouncementModal(false);
      setNewAnnouncement({ title: '', content: '', priority: 'MEDIUM', target_roles: 'ALL' });
      setTimeout(() => setNotificationMsg(null), 5000);
    }
  };

  return (
    <div className="space-y-7">
      {/* ── Page Header ── */}
      {/* ── Page Header Actions ── */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setShowAnnouncementModal(true)}
          id="btn-new-announcement"
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200 transition-all cursor-pointer"
        >
          <Megaphone className="w-3.5 h-3.5" />Post Announcement
        </button>
        <button
          onClick={() => alert('Generating official institutional management report bundle...')}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />Export Report
        </button>
      </div>

      {/* ── Notification Banner ── */}
      {notificationMsg && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
          notificationMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-500 hover:text-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── IMPORTANT ALERTS (Overview and Alerts tabs) ── */}
      {(activeTab === 'overview' || activeTab === 'alerts') && importantAlerts.length > 0 && (
        <div className="space-y-2.5">
          {importantAlerts.slice(0, activeTab === 'overview' ? 3 : undefined).map((alert) => (
            <AlertBanner
              key={alert.id}
              type={alert.type as 'warning' | 'info' | 'danger'}
              message={alert.message}
              action={alert.action || undefined}
              onAction={() => setActiveTab(alert.tab)}
            />
          ))}
        </div>
      )}

      {/* ── 1. OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <>
          {/* Top 5 Primary Management KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiCard
              label="Student Population"
              value={metrics.student_population.toLocaleString()}
              sub={metrics.student_population > 0 ? "Enrolled & verified" : "No active students"}
              icon={GraduationCap}
              iconBg="bg-indigo-600"
              progress={metrics.student_population > 0 ? Math.min((metrics.student_population / 1400) * 100, 100) : 0}
              progressColor="bg-indigo-500"
            />
            <KpiCard
              label="Daily Attendance"
              value={`${metrics.attendance_rate}%`}
              sub="School-wide daily average"
              icon={CalendarCheck}
              iconBg="bg-emerald-600"
              progress={metrics.attendance_rate}
              progressColor="bg-emerald-500"
            />
            <KpiCard
              label="Academic Average"
              value={`${metrics.academic_average}%`}
              sub="Mean institutional score"
              icon={Award}
              iconBg="bg-violet-600"
              progress={metrics.academic_average}
              progressColor="bg-violet-500"
            />
            <KpiCard
              label="Fee Collection"
              value={`${collectionRate}%`}
              sub={metrics.total_billed > 0 ? `Tsh ${(metrics.fee_collected / 1e6).toFixed(1)}M of ${(metrics.total_billed / 1e6).toFixed(1)}M` : 'No billing issued'}
              icon={CreditCard}
              iconBg="bg-teal-600"
              progress={collectionRate}
              progressColor="bg-teal-500"
            />
            <KpiCard
              label="Outstanding Fees"
              value={`Tsh ${(metrics.fee_outstanding / 1e6).toFixed(1)}M`}
              sub={metrics.fee_outstanding > 0 ? "Pending remittances" : "Zero arrears"}
              icon={AlertTriangle}
              iconBg="bg-amber-500"
              progress={metrics.total_billed > 0 ? (metrics.fee_outstanding / metrics.total_billed) * 100 : 0}
              progressColor="bg-amber-500"
            />
          </div>

          {/* Secondary Management KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              label="Total Teachers"
              value={String(metrics.total_teachers)}
              sub="Certified faculty members"
              icon={Users}
              iconBg="bg-emerald-600"
              progress={metrics.total_teachers > 0 ? 100 : 0}
              progressColor="bg-emerald-500"
            />
            <KpiCard
              label="Active Classes"
              value={String(metrics.classes)}
              sub="Registered class streams"
              icon={Layers}
              iconBg="bg-amber-600"
              progress={metrics.classes > 0 ? 100 : 0}
              progressColor="bg-amber-500"
            />
            <KpiCard
              label="Pass Rate"
              value={`${metrics.pass_rate}%`}
              sub="Qualified candidates"
              icon={CheckCircle2}
              iconBg="bg-emerald-600"
              progress={metrics.pass_rate}
              progressColor="bg-emerald-500"
            />
            <KpiCard
              label="Pending Approvals"
              value={String(metrics.pending_approvals)}
              sub="Score moderation sign-offs"
              icon={FileSpreadsheet}
              iconBg="bg-red-500"
              progress={metrics.pending_approvals > 0 ? 100 : 0}
              progressColor="bg-red-500"
            />
          </div>

          {/* ── EXECUTIVE APPROVALS & EXPENSE SIGN-OFF QUEUE ── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Executive Approvals & Sign-Off Desk</h3>
                <p className="text-xs text-slate-500">
                  {headmasterExpenses.filter(e => e.status === 'PENDING_HEADMASTER_APPROVAL').length} expense requisitions & {metrics.pending_approvals} examination results awaiting sign-off
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('expenses')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Review Expenses ({headmasterExpenses.filter(e => e.status === 'PENDING_HEADMASTER_APPROVAL').length})
              </button>
              <button
                onClick={() => setActiveTab('examinations')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                Moderation ({metrics.pending_approvals})
              </button>
            </div>
          </div>


          {/* Real Live Recharts Professional Charts Section */}
          <ExecutiveAnalyticsCharts title="Institutional Trends & Analytics" />

          {/* Charts Row: Class Performance + Grade Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Class Performance */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-xl"><BarChart3 className="w-4 h-4 text-amber-600" /></div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Class Academic Performance</h3>
                    <p className="text-[11px] text-slate-500">Mean scores per stream</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('classes')}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-800 cursor-pointer"
                >
                  View All →
                </button>
              </div>
              {classPerformance.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No class performance records for this session.
                </div>
              ) : (
                <div className="space-y-3">
                  {classPerformance.slice(0, 5).map(cls => (
                    <div key={cls.id} className="flex items-center gap-4">
                      <span className="text-xs font-semibold text-slate-700 w-20 truncate shrink-0">{cls.name}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-700 ${
                            cls.status === 'EXCELLING' ? 'bg-emerald-500' : cls.status === 'SATISFACTORY' ? 'bg-indigo-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${cls.mean}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold w-12 text-right ${
                        cls.status === 'EXCELLING' ? 'text-emerald-600' : cls.status === 'SATISFACTORY' ? 'text-indigo-600' : 'text-red-600'
                      }`}>
                        {cls.mean}%
                      </span>
                      <Badge label={cls.status === 'NEEDS_INTERVENTION' ? 'Needs Help' : cls.status.toLowerCase()} color={statusBadge[cls.status] || 'bg-slate-100 text-slate-700'} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Grade Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-violet-50 rounded-xl"><PieChart className="w-4 h-4 text-violet-600" /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Grade Distribution</h3>
                  <p className="text-[11px] text-slate-500">Current term results overview</p>
                </div>
              </div>
              {gradeDistribution.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No grade distribution records available.
                </div>
              ) : (
                <div className="space-y-3">
                  {gradeDistribution.map(g => (
                    <div key={g.grade} className="flex items-center gap-3">
                      <div className={`w-2 h-6 rounded-full ${g.color} shrink-0`} />
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className={`font-bold ${g.text}`}>{g.grade}</span>
                          <span className="text-slate-600 font-semibold">{g.count}</span>
                        </div>
                        <ProgressBar value={g.pct} color={g.color} height="h-1.5" />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 w-8 text-right">{g.pct}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Announcements + Chronic Absentees */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Announcements */}
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-xl"><Megaphone className="w-4 h-4 text-amber-600" /></div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Recent Announcements</h3>
                    <p className="text-[11px] text-slate-500">Official circulars from Headmaster Office</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('announcements')}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-800 cursor-pointer"
                >
                  View All →
                </button>
              </div>
              {announcements.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No recent announcements posted.
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.slice(0, 2).map(a => (
                    <div key={a.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-bold text-slate-900 text-xs">{a.title}</span>
                        <Badge label={a.priority} color={statusBadge[a.priority] || 'bg-slate-100 text-slate-700'} />
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{a.content.slice(0, 95)}…</p>
                      <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                        <span>Target: {a.target}</span><span>{a.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chronic Absenteeism */}
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-xl"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Chronic Absenteeism Watchlist</h3>
                    <p className="text-[11px] text-slate-500">Students below 85% attendance</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 cursor-pointer"
                >
                  View All →
                </button>
              </div>
              {chronicAbsentees.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <span className="font-semibold text-emerald-800">Zero chronic absenteeism</span>
                  <p className="text-[10px] text-slate-400">All active students maintain satisfactory attendance.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chronicAbsentees.slice(0, 4).map((s) => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-red-100 bg-red-50/50">
                      <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {s.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 text-xs">{s.name} <span className="text-slate-500 font-normal">— {s.class}</span></div>
                        <ProgressBar value={s.rate} color="bg-red-500" height="h-1.5" />
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold text-red-600">{s.rate}%</div>
                        <div className="text-[10px] text-slate-400">{s.days} days absent</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── 2. STUDENT POPULATION TAB ── */}
      {activeTab === 'students' && (
        <Section
          icon={GraduationCap}
          title="Student Population & Demographic Overview"
          sub={`${metrics.student_population} active students across ${metrics.classes} class streams`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Enrolled', val: metrics.student_population.toLocaleString(), color: 'text-indigo-700', sub: 'Active students' },
              { label: 'Male Students', val: metrics.male_students.toLocaleString(), color: 'text-sky-700', sub: metrics.student_population > 0 ? `${Math.round((metrics.male_students / metrics.student_population) * 100)}% of population` : '0%' },
              { label: 'Female Students', val: metrics.female_students.toLocaleString(), color: 'text-pink-700', sub: metrics.student_population > 0 ? `${Math.round((metrics.female_students / metrics.student_population) * 100)}% of population` : '0%' },
              { label: 'Student-Teacher Ratio', val: `${metrics.student_teacher_ratio} : 1`, color: 'text-emerald-700', sub: 'Target: < 30:1' },
            ].map((m, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className={`text-2xl font-extrabold ${m.color}`}>{m.val}</div>
                <div className="text-xs font-semibold text-slate-700 mt-1">{m.label}</div>
                <div className="text-[11px] text-slate-400">{m.sub}</div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="p-3.5 text-left">Class Stream</th>
                  <th className="p-3.5 text-left">Streams</th>
                  <th className="p-3.5 text-left">Students</th>
                  <th className="p-3.5 text-left">Avg Attendance</th>
                  <th className="p-3.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(classDistribution.length > 0 ? classDistribution : classPerformance).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                      No enrolled class demographic records found.
                    </td>
                  </tr>
                ) : (
                  (classDistribution.length > 0 ? classDistribution : classPerformance).map((c: any, i: number) => {
                    const studentCount = c.student_count ?? c.students ?? 0;
                    return (
                      <tr key={c.class_id || c.id || i} className="hover:bg-slate-50/60">
                        <td className="p-3.5 font-bold text-slate-900">{c.name}</td>
                        <td className="p-3.5 text-slate-600">{c.streams ?? 1} stream{(c.streams ?? 1) === 1 ? '' : 's'}</td>
                        <td className="p-3.5 font-bold text-indigo-700">{studentCount}</td>
                        <td className="p-3.5">
                          <span className="font-bold text-emerald-600">{metrics.attendance_rate > 0 ? `${metrics.attendance_rate}%` : '—'}</span>
                        </td>
                        <td className="p-3.5 text-emerald-600 font-semibold">Enrolled</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── 3. ATTENDANCE TAB ── */}
      {activeTab === 'attendance' && (
        <div className="space-y-5">
          <Section icon={CalendarCheck} title="School-Wide Attendance Analytics" sub="Daily roll call tracking, chronic absenteeism monitor & interventions">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Attendance Rate', val: `${metrics.attendance_rate}%`, color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
                { label: 'Chronic Absentees', val: String(chronicAbsentees.length), color: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
                { label: 'Total Enrolled', val: metrics.student_population.toLocaleString(), color: 'bg-slate-50 border-slate-200', text: 'text-slate-700', dot: 'bg-slate-400' },
                { label: 'Active Classes', val: String(metrics.classes), color: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', dot: 'bg-indigo-500' },
              ].map(s => (
                <div key={s.label} className={`p-4 rounded-xl border ${s.color}`}>
                  <div className={`w-3 h-3 rounded-full ${s.dot} mb-2`} />
                  <div className={`text-2xl font-extrabold ${s.text}`}>{s.val}</div>
                  <div className="text-xs font-semibold text-slate-600">{s.label}</div>
                </div>
              ))}
            </div>

            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Attendance Rate by Class Stream</h4>
            {classPerformance.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No class attendance records found for this period.
              </div>
            ) : (
              <div className="space-y-3">
                {classPerformance.map(cls => (
                  <div key={cls.id} className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-slate-700 w-20 truncate shrink-0">{cls.name}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${cls.mean >= 85 ? 'bg-emerald-500' : cls.mean >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(cls.mean + 10, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold w-14 text-right text-emerald-600">~{Math.min(Math.round(cls.mean + 10), 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-xl"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Chronic Absenteeism — Intervention Roster</h3>
                <p className="text-[11px] text-slate-500">Students with attendance below 85% — welfare and parent contact required</p>
              </div>
            </div>
            {chronicAbsentees.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                <span className="font-semibold text-emerald-800">No chronic absenteeism detected</span>
                <p className="text-[11px] text-slate-400 mt-0.5">All tracked students maintain acceptable attendance above 85%.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chronicAbsentees.map((s) => (
                  <div key={s.id} className="flex items-center gap-4 p-3.5 bg-red-50 rounded-xl border border-red-100">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {s.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 text-xs">{s.name}</div>
                      <div className="text-[11px] text-slate-500">{s.class} · {s.days} days absent this term</div>
                      <ProgressBar value={s.rate} color="bg-red-500" height="h-2" />
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-extrabold text-red-600">{s.rate}%</div>
                      <button
                        onClick={() => alert(`Parent follow-up dispatch triggered for ${s.name} (${s.class})`)}
                        className="text-[11px] font-semibold text-red-600 hover:underline cursor-pointer"
                      >
                        Notify Parent
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 4. ACADEMIC PERFORMANCE TAB ── */}
      {activeTab === 'academics' && (
        <Section icon={Award} title="Academic Performance Analytics" sub="Institutional results, grade distributions, and subject breakdown">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Institution Average', val: `${metrics.academic_average}%`, sub: metrics.academic_average > 0 ? 'Mean institutional performance' : 'No data recorded', color: 'text-violet-700' },
              { label: 'Pass Rate', val: `${metrics.pass_rate}%`, sub: `${metrics.pass_rate}% passed threshold`, color: 'text-emerald-700' },
              { label: 'Distinction Rate', val: `${metrics.distinction_rate}%`, sub: `${metrics.distinction_rate}% achieved distinction`, color: 'text-indigo-700' },
            ].map((m, i) => (
              <div key={i} className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs text-center">
                <div className={`text-2xl font-bold ${m.color}`}>{m.val}</div>
                <div className="text-xs font-bold text-slate-700 mt-1 uppercase tracking-wider">{m.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{m.sub}</div>
              </div>
            ))}
          </div>

          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Institutional Grade Breakdown</h4>
          {gradeDistribution.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No grade distribution records found for this term.
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {gradeDistribution.map(g => (
                <div key={g.grade} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                  <div className={`w-12 h-10 rounded-xl ${g.color} flex items-center justify-center text-white font-extrabold text-xs shrink-0`}>
                    {g.grade}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">Grade {g.grade}</span>
                      <span className="font-bold text-slate-900">{g.count} students ({g.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${g.color}`} style={{ width: `${g.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ── 5. FEE OVERVIEW TAB ── */}
      {activeTab === 'fees' && (
        <Section icon={CreditCard} title="Fee Overview & Financial Monitoring" sub="Institutional fee collection health (Management Read-Only View)">
          <AlertBanner
            type="info"
            message="Management View Only: Cash transactions, receipt generation, and fee structure modifications are segregated to the Bursary & Accounts department. Headmasters do not possess direct bursary entry permissions."
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 mb-6">
            <div className="p-5 bg-white rounded-xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Billed</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">
                Tsh {metrics.total_billed.toLocaleString()}
              </div>
              <ProgressBar value={100} color="bg-slate-400" />
              <div className="text-[11px] text-slate-400 mt-1">
                {metrics.total_billed > 0 ? `${metrics.student_population} active student invoices issued` : 'No invoices issued'}
              </div>
            </div>
            <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Collected</div>
              <div className="text-2xl font-extrabold text-emerald-900 mt-2">
                Tsh {metrics.fee_collected.toLocaleString()}
              </div>
              <ProgressBar value={collectionRate} color="bg-emerald-500" />
              <div className="text-[11px] text-emerald-600 font-medium mt-1">{collectionRate}% collection efficiency</div>
            </div>
            <div className="p-5 bg-amber-50 rounded-xl border border-amber-200">
              <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Outstanding</div>
              <div className="text-2xl font-extrabold text-amber-900 mt-2">
                Tsh {metrics.fee_outstanding.toLocaleString()}
              </div>
              <ProgressBar value={100 - collectionRate} color="bg-amber-500" />
              <div className="text-[11px] text-amber-600 font-medium mt-1">
                {metrics.fee_outstanding > 0 ? 'Pending recovery remittances' : 'Zero outstanding arrears'}
              </div>
            </div>
          </div>

          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Collection by Class Form</h4>
          {classPerformance.length === 0 && metrics.total_billed === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No class fee billing structures recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {classPerformance.map(cls => {
                const classShare = metrics.student_population > 0 ? (cls.students / metrics.student_population) : 1 / (classPerformance.length || 1);
                const target = Math.round(metrics.total_billed * classShare);
                const collected = Math.round(metrics.fee_collected * classShare);
                const pct = target > 0 ? Math.round((collected / target) * 100) : collectionRate;
                return (
                  <div key={cls.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">{cls.name}</span>
                      <span className={`font-bold ${pct >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {pct}% — Tsh {(collected / 1e6).toFixed(2)}M / {(target / 1e6).toFixed(2)}M
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div className={`h-3 rounded-full ${pct >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {/* ── 5.1 EXPENSE APPROVALS TAB ── */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <Section
            icon={CheckCircle2}
            title="School Expense Requisition Approvals"
            sub="Expense disbursements requested by the Accountant requiring executive approval by the Headmaster"
          >
            {/* KPI Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70">
                <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Pending Your Approval</div>
                <div className="text-2xl font-extrabold text-amber-900 mt-1">
                  {headmasterExpenses.filter(e => e.status === 'PENDING_HEADMASTER_APPROVAL').length} Requisitions
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">
                  TSh {headmasterExpenses.filter(e => e.status === 'PENDING_HEADMASTER_APPROVAL').reduce((s, e) => s + e.amount, 0).toLocaleString()} awaiting decision
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70">
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Approved Expenses</div>
                <div className="text-2xl font-extrabold text-emerald-900 mt-1">
                  {headmasterExpenses.filter(e => e.status === 'APPROVED').length} Approved
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  TSh {headmasterExpenses.filter(e => e.status === 'APPROVED').reduce((s, e) => s + e.amount, 0).toLocaleString()} cleared for disbursement
                </div>
              </div>

              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70">
                <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Rejected Requests</div>
                <div className="text-2xl font-extrabold text-rose-900 mt-1">
                  {headmasterExpenses.filter(e => e.status === 'REJECTED').length} Rejected
                </div>
                <div className="text-[11px] text-rose-700 mt-0.5">Declined due to budget ceiling</div>
              </div>
            </div>

            {/* Notification alert banner if exists */}
            {notificationMsg && (
              <div className={`p-3.5 mb-5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                notificationMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{notificationMsg.text}</span>
              </div>
            )}

            {/* Expense Requisitions List */}
            {headmasterExpenses.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No expense requisitions submitted by the accountant yet.
              </div>
            ) : (
              <div className="space-y-4">
                {headmasterExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      exp.status === 'PENDING_HEADMASTER_APPROVAL'
                        ? 'border-amber-300 bg-amber-50/20 shadow-xs'
                        : exp.status === 'APPROVED'
                        ? 'border-emerald-200 bg-emerald-50/15'
                        : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {exp.requisition_no}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                            {exp.category}
                          </span>
                          <span className="text-xs text-slate-400">Date: {exp.requested_date}</span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm mt-1">{exp.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          <strong>Justification:</strong> {exp.justification}
                        </p>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Payee: <strong>{exp.payee}</strong> · Requested By: <strong>{exp.requested_by}</strong>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Requested Amount</div>
                        <div className="text-xl font-black text-slate-900 font-mono">
                          TSh {exp.amount.toLocaleString()}
                        </div>
                        <div className="mt-1">
                          {exp.status === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Approved by Headmaster
                            </span>
                          ) : exp.status === 'PENDING_HEADMASTER_APPROVAL' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pending Headmaster Approval
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <X className="w-3 h-3 text-rose-600" />
                              Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar for Pending Requests */}
                    {exp.status === 'PENDING_HEADMASTER_APPROVAL' ? (
                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[11px] text-amber-800 font-medium">
                          Executive approval required before the accountant can write checks or disburse funds.
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRejectExpense(exp.id)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject Requisition
                          </button>
                          <button
                            onClick={() => handleApproveExpense(exp.id)}
                            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve Requisition
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Headmaster Remarks: <em>{exp.approval_notes || 'Decision confirmed.'}</em></span>
                        <span>Approval Date: {exp.approved_date || exp.requested_date}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* ── 6. TEACHER STATISTICS TAB ── */}
      {activeTab === 'teachers' && (
        <Section icon={Users} title="Teacher Statistics & Faculty Analytics" sub={`${metrics.total_teachers} certified faculty members across academic departments`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Total Faculty', val: String(metrics.total_teachers), sub: 'Active teaching staff', color: 'text-emerald-700' },
              { label: 'Student-Teacher Ratio', val: `${metrics.student_teacher_ratio} : 1`, sub: 'National guideline: 30:1', color: 'text-indigo-700' },
              { label: 'Avg Class Size', val: String(metrics.classes > 0 ? Math.round(metrics.student_population / metrics.classes) : 0), sub: 'Learners per stream', color: 'text-amber-700' },
            ].map((m, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className={`text-2xl font-extrabold ${m.color}`}>{m.val}</div>
                <div className="text-xs font-bold text-slate-700 mt-1">{m.label}</div>
                <div className="text-[11px] text-slate-400">{m.sub}</div>
              </div>
            ))}
          </div>

          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Departmental Load & Satisfaction</h4>
          {teacherStats.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No departmental teacher statistics recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {teacherStats.map(d => (
                <div key={d.dept} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-amber-300 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-xs">{d.dept}</span>
                      <span className="text-[11px] text-slate-500">{d.total} teachers · avg {d.avg_students} students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={d.satisfaction} color="bg-amber-500" />
                      <span className="text-xs font-bold text-amber-600 w-10 text-right">{d.satisfaction}%</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Academic satisfaction index</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ── 7. CLASS PERFORMANCE TAB ── */}
      {activeTab === 'classes' && (
        <Section icon={Layers} title="Class Performance Rankings" sub="Mean academic scores per stream">
          {classPerformance.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200/80">
              No class performance records found for this academic session.
            </div>
          ) : (
            <div className="space-y-4">
              {classPerformance.map((cls, i) => (
                <div
                  key={cls.id}
                  className={`p-5 rounded-xl border ${
                    cls.status === 'NEEDS_INTERVENTION' ? 'border-red-200 bg-red-50/30' : cls.status === 'EXCELLING' ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-sm shrink-0 ${
                        cls.status === 'EXCELLING' ? 'bg-emerald-500' : cls.status === 'NEEDS_INTERVENTION' ? 'bg-red-500' : 'bg-indigo-500'
                      }`}>
                        #{i + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{cls.name}</div>
                        <div className="text-[11px] text-slate-500">Faculty: {cls.teacher} · {cls.students} students</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-extrabold ${
                        cls.status === 'EXCELLING' ? 'text-emerald-600' : cls.status === 'NEEDS_INTERVENTION' ? 'text-red-600' : 'text-indigo-600'
                      }`}>
                        {cls.mean}%
                      </span>
                      <Badge label={cls.status === 'NEEDS_INTERVENTION' ? 'Needs Intervention' : cls.status.toLowerCase()} color={statusBadge[cls.status] || 'bg-slate-100 text-slate-700'} />
                    </div>
                  </div>
                  <ProgressBar
                    value={cls.mean}
                    color={cls.status === 'EXCELLING' ? 'bg-emerald-500' : cls.status === 'NEEDS_INTERVENTION' ? 'bg-red-500' : 'bg-indigo-500'}
                    height="h-2.5"
                  />
                  {cls.status === 'NEEDS_INTERVENTION' && (
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span className="text-[11px] text-red-700 font-medium">Academic intervention recommended — schedule faculty conference.</span>
                      </div>
                      <button
                        onClick={() => alert(`Departmental intervention order drafted for ${cls.name}`)}
                        className="text-xs font-bold text-red-600 hover:text-red-800 underline cursor-pointer"
                      >
                        Draft Intervention Order
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ── 8. EXAMINATIONS TAB ── */}
      {activeTab === 'examinations' && (
        <Section icon={FileSpreadsheet} title="Examination Performance & Moderation Approvals" sub="Tier 3 Headmaster Executive Sign-Off (VERIFIED → APPROVED)">
          {metrics.pending_approvals > 0 && (
            <AlertBanner
              type="danger"
              message={`${metrics.pending_approvals} examination result sheets are verified by the Examinations Officer and require your formal executive sign-off before publication.`}
              action="Approve Batch Now"
              onAction={() => examStatus[0] && handleApproveExamination(examStatus[0].id)}
            />
          )}
          {examStatus.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200/80">
              No examination moderation batches currently awaiting Headmaster sign-off.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {examStatus.map((ex) => (
                <div key={ex.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50 hover:border-amber-300 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900">{ex.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Scheduled Period: {ex.date}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{ex.approval}</span>
                      <Badge label={ex.status.replace('_', ' ')} color={statusBadge[ex.status] || 'bg-slate-100 text-slate-700'} />
                      {(ex.status === 'VERIFIED' || ex.status === 'PENDING_APPROVAL') && (
                        <button
                          onClick={() => handleApproveExamination(ex.id)}
                          disabled={approvalSubmitting}
                          className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          {approvalSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
                          Approve Score Sheets
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
            <Shield className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong>Results Moderation Policy:</strong> The Headmaster approves or rejects result moderation batches at Tier 3 of the lifecycle (<span className="font-mono text-amber-800">VERIFIED → APPROVED</span>). Headmasters cannot tamper with individual raw student marks; score alterations must follow the Examinations Department moderation process.
            </div>
          </div>
        </Section>
      )}

      {/* ── 9. ANNOUNCEMENTS TAB ── */}
      {activeTab === 'announcements' && (
        <Section
          icon={Megaphone}
          title="Official Institutional Announcements"
          sub="Broadcast circulars and official decrees from the Headmaster Office"
          action={
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />Post Announcement
            </button>
          }
        >
          {announcements.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200/80">
              No official announcements posted yet. Click &quot;Post Announcement&quot; to broadcast.
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map(a => (
                <div key={a.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50 hover:border-amber-300 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-bold text-slate-900 text-sm">{a.title}</h4>
                    <Badge label={a.priority} color={statusBadge[a.priority] || 'bg-slate-100 text-slate-700'} />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{a.content}</p>
                  <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Target Audience: <strong className="text-slate-600">{a.target}</strong></span>
                    <div className="flex items-center gap-2">
                      <span>{a.date}</span>
                      <span>· {a.author}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ── 10. MANAGEMENT REPORTS TAB ── */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <ExecutiveAnalyticsCharts title="Institutional Reports & Historical Analytics Engine" />
          <Section
            icon={BarChart3}
            title="Management Reports & Analytics Engine"
            sub="Executive reports for governance, auditing, and institutional planning"
            action={
              <button
                onClick={() => alert('Generating consolidated management report bundle...')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />Export All
              </button>
            }
          >
            {managementReports.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200/80">
                No management reports generated yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {managementReports.map((r) => (
                  <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-amber-300 transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">{r.category}</span>
                    </div>
                    <div className="font-semibold text-slate-900 text-xs mb-3">{r.title}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">{r.date}</span>
                      <div className="flex items-center gap-2">
                        <Badge label={r.status} color={r.status === 'Ready' || r.status === 'READY' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'} />
                        {(r.status === 'Ready' || r.status === 'READY') && (
                          <button
                            onClick={() => alert(`Downloading executive document: ${r.title}`)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* ── 11. IMPORTANT ALERTS TAB ── */}
      {activeTab === 'alerts' && (
        <Section icon={AlertTriangle} title="Important Alerts & Critical Action Items" sub="Urgent notices requiring Headmaster review or administrative awareness">
          {importantAlerts.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200/80">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">All Systems Operational</p>
              <p className="text-[11px] text-slate-400 mt-1">No critical management alerts or pending interventions requiring attention.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {importantAlerts.map((alert) => (
                <AlertBanner
                  key={alert.id}
                  type={alert.type as 'warning' | 'info' | 'danger'}
                  message={alert.message}
                  action={alert.action || undefined}
                  onAction={() => setActiveTab(alert.tab)}
                />
              ))}
            </div>
          )}

        </Section>
      )}

      {/* ── 12. PROFILE & SECURITY TAB ── */}
      {(activeTab === 'profile' || activeTab === 'account' || activeTab === 'security') && (
        <DashboardProfileTab
          title="Headmaster Executive Profile"
          subtitle="Executive identity, management credentials, and avatar photo"
          initialOpenPassword={activeTab === 'security'}
          extraDetails={[
            { label: 'Qualifications', val: 'PhD Education Management, M.Ed' },
            { label: 'Role Classification', val: 'Executive Management (Non-Technical)' },
            { label: 'Administrative Rights', val: 'Results Approval, Circulars, Analytics' },
            { label: 'Restricted Privileges', val: 'User Account Administration & Audit Logs (Enforced)' },
          ]}
        />
      )}

      {/* ── 13. LOGOUT CONFIRMATION TAB ── */}
      {activeTab === 'logout' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm max-w-md mx-auto text-center space-y-4 my-8">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <LogOut className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Log Out of Headmaster Management Hub?</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Are you sure you want to conclude your executive session? All unsaved circulars will be discarded and you will return to the secure sign-in portal.
          </p>
          <div className="flex items-center justify-center gap-3 pt-3">
            <button
              onClick={() => setActiveTab('overview')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              Cancel & Return
            </button>
            <button
              onClick={() => authService.logout()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer"
            >
              Confirm Log Out
            </button>
          </div>
        </div>
      )}

      {/* ── POST ANNOUNCEMENT MODAL ── */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Post Official Announcement</h3>
                <p className="text-xs text-slate-500 mt-0.5">Broadcast circular to selected campus groups</p>
              </div>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="space-y-4 text-xs" onSubmit={handleCreateAnnouncement}>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Announcement Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End-Term Examination Schedule"
                  value={newAnnouncement.title}
                  onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Priority</label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={e => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Target Audience</label>
                  <select
                    value={newAnnouncement.target_roles}
                    onChange={e => setNewAnnouncement({ ...newAnnouncement, target_roles: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="ALL">All Campus (Everyone)</option>
                    <option value="TEACHER">Teachers & Faculty Only</option>
                    <option value="STUDENT">Students Only</option>
                    <option value="STAFF">Administrative Staff Only</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Announcement Content</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter detailed official decree or notification..."
                  value={newAnnouncement.content}
                  onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={announcementSubmitting}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {announcementSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Megaphone className="w-3.5 h-3.5" />}
                  Broadcast Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HeadmasterDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />Loading executive dashboard...</div>}>
      <HeadmasterContent />
    </Suspense>
  );
}
