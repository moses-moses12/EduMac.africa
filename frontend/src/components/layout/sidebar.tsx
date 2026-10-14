'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';
import { UserAvatar } from '@/components/profile';
import {
  LayoutDashboard,
  ShieldCheck,
  GraduationCap,
  Users,
  UserCheck,
  CreditCard,
  Library,
  Award,
  Bell,
  LogOut,
  Layers,
  School,
  BookOpen,
  ClipboardList,
  Clock,
  CalendarCheck,
  FileSpreadsheet,
  BarChart3,
  History,
  Settings,
  User,
  Briefcase,
  AlertTriangle,
  Receipt,
  DollarSign,
  TrendingUp,
  FolderOpen,
  UserPlus,
  ArrowLeftRight,
  FileText,
  Search,
  CheckCircle2,
  Send,
  RotateCcw,
  BookMarked,
  Printer
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  tab: string;
  icon: React.ComponentType<{ className?: string }>;
  isLogout?: boolean;
}

interface RoleConfig {
  title: string;
  subtitle: string;
  badgeLabel: string;
  activeBg: string;
  badgeBg: string;
  items: NavItem[];
}

// 1. Teacher Menu Items
const teacherNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard/teacher?tab=overview', tab: 'overview', icon: LayoutDashboard },
  { name: 'My Classes', href: '/dashboard/teacher?tab=classes', tab: 'classes', icon: Layers },
  { name: 'My Subjects', href: '/dashboard/teacher?tab=subjects', tab: 'subjects', icon: BookOpen },
  { name: 'Students', href: '/dashboard/teacher?tab=students', tab: 'students', icon: GraduationCap },
  { name: 'Attendance', href: '/dashboard/teacher?tab=attendance', tab: 'attendance', icon: UserCheck },
  { name: 'Marks', href: '/dashboard/teacher?tab=marks', tab: 'marks', icon: FileSpreadsheet },
  { name: 'Assignments', href: '/dashboard/teacher?tab=assignments', tab: 'assignments', icon: ClipboardList },
  { name: 'Timetable', href: '/dashboard/teacher?tab=timetable', tab: 'timetable', icon: Clock },
  { name: 'Examinations', href: '/dashboard/teacher?tab=examinations', tab: 'examinations', icon: Award },
  { name: 'Notifications', href: '/dashboard/teacher?tab=notifications', tab: 'notifications', icon: Bell },
  { name: 'Profile', href: '/dashboard/teacher?tab=profile', tab: 'profile', icon: User },
  { name: 'Account', href: '/dashboard/teacher?tab=account', tab: 'account', icon: Settings },
  { name: 'Logout', href: '#logout', tab: 'logout', icon: LogOut, isLogout: true },
];

// 2. Admin Menu Items
const adminNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard/admin?tab=overview', tab: 'overview', icon: LayoutDashboard },
  { name: 'Users', href: '/dashboard/admin?tab=users', tab: 'users', icon: ShieldCheck },
  { name: 'Students', href: '/dashboard/admin?tab=students', tab: 'students', icon: GraduationCap },
  { name: 'Teachers', href: '/dashboard/admin?tab=teachers', tab: 'teachers', icon: Users },
  { name: 'Staff', href: '/dashboard/admin?tab=staff', tab: 'staff', icon: Briefcase },
  { name: 'Parents', href: '/dashboard/admin?tab=parents', tab: 'parents', icon: UserCheck },
  { name: 'Academics', href: '/dashboard/admin?tab=academics', tab: 'academics', icon: Layers },
  { name: 'Attendance', href: '/dashboard/admin?tab=attendance', tab: 'attendance', icon: CalendarCheck },
  { name: 'Examinations', href: '/dashboard/admin?tab=examinations', tab: 'examinations', icon: Award },
  { name: 'Results', href: '/dashboard/admin?tab=results', tab: 'results', icon: FileSpreadsheet },
  { name: 'Fees', href: '/dashboard/admin?tab=fees', tab: 'fees', icon: CreditCard },
  { name: 'Timetable', href: '/dashboard/admin?tab=timetable', tab: 'timetable', icon: Clock },
  { name: 'Assignments', href: '/dashboard/admin?tab=assignments', tab: 'assignments', icon: ClipboardList },
  { name: 'Library', href: '/dashboard/admin?tab=library', tab: 'library', icon: Library },
  { name: 'Reports', href: '/dashboard/admin?tab=reports', tab: 'reports', icon: BarChart3 },
  { name: 'Notifications', href: '/dashboard/admin?tab=notifications', tab: 'notifications', icon: Bell },
  { name: 'Audit Logs', href: '/dashboard/admin?tab=audit', tab: 'audit', icon: History },
  { name: 'Settings', href: '/dashboard/admin?tab=settings', tab: 'settings', icon: Settings },
  { name: 'Profile', href: '/dashboard/admin?tab=profile', tab: 'profile', icon: User },
  { name: 'Logout', href: '#logout', tab: 'logout', icon: LogOut, isLogout: true },
];

// 3. Headmaster Menu Items
const headmasterNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard/headmaster?tab=overview', tab: 'overview', icon: LayoutDashboard },
  { name: 'Student Population', href: '/dashboard/headmaster?tab=students', tab: 'students', icon: GraduationCap },
  { name: 'Attendance', href: '/dashboard/headmaster?tab=attendance', tab: 'attendance', icon: CalendarCheck },
  { name: 'Academic Performance', href: '/dashboard/headmaster?tab=academics', tab: 'academics', icon: Award },
  { name: 'Fee Overview', href: '/dashboard/headmaster?tab=fees', tab: 'fees', icon: CreditCard },
  { name: 'Teacher Statistics', href: '/dashboard/headmaster?tab=teachers', tab: 'teachers', icon: Users },
  { name: 'Class Performance', href: '/dashboard/headmaster?tab=classes', tab: 'classes', icon: Layers },
  { name: 'Examinations', href: '/dashboard/headmaster?tab=examinations', tab: 'examinations', icon: FileSpreadsheet },
  { name: 'Announcements', href: '/dashboard/headmaster?tab=announcements', tab: 'announcements', icon: Bell },
  { name: 'Management Reports', href: '/dashboard/headmaster?tab=reports', tab: 'reports', icon: BarChart3 },
  { name: 'Important Alerts', href: '/dashboard/headmaster?tab=alerts', tab: 'alerts', icon: AlertTriangle },
  { name: 'Profile', href: '/dashboard/headmaster?tab=profile', tab: 'profile', icon: User },
  { name: 'Logout', href: '#logout', tab: 'logout', icon: LogOut, isLogout: true },
];

// 4. Accountant / Bursar Menu Items
const accountantNavItems: NavItem[] = [
  { name: 'Financial Overview', href: '/dashboard/accountant?tab=overview', tab: 'overview', icon: LayoutDashboard },
  { name: 'Fee Structures', href: '/dashboard/accountant?tab=fee-structures', tab: 'fee-structures', icon: Layers },
  { name: 'Invoices', href: '/dashboard/accountant?tab=invoices', tab: 'invoices', icon: FileText },
  { name: 'Payments', href: '/dashboard/accountant?tab=payments', tab: 'payments', icon: DollarSign },
  { name: 'Receipts', href: '/dashboard/accountant?tab=receipts', tab: 'receipts', icon: Receipt },
  { name: 'Balances & Debtors', href: '/dashboard/accountant?tab=balances', tab: 'balances', icon: CreditCard },
  { name: 'Financial Reports', href: '/dashboard/accountant?tab=reports', tab: 'reports', icon: TrendingUp },
  { name: 'Profile', href: '/dashboard/accountant?tab=profile', tab: 'profile', icon: User },
  { name: 'Logout', href: '#logout', tab: 'logout', icon: LogOut, isLogout: true },
];

// 5. Librarian Menu Items
const librarianNavItems: NavItem[] = [
  { name: 'Library Overview', href: '/dashboard/librarian?tab=overview', tab: 'overview', icon: LayoutDashboard },
  { name: 'Book Catalog', href: '/dashboard/librarian?tab=books', tab: 'books', icon: BookOpen },
  { name: 'Categories & Authors', href: '/dashboard/librarian?tab=categories', tab: 'categories', icon: BookMarked },
  { name: 'Book Copies', href: '/dashboard/librarian?tab=copies', tab: 'copies', icon: Layers },
  { name: 'Borrowed Books', href: '/dashboard/librarian?tab=borrowed', tab: 'borrowed', icon: ClipboardList },
  { name: 'Returned Books', href: '/dashboard/librarian?tab=returned', tab: 'returned', icon: RotateCcw },
  { name: 'Overdue Books', href: '/dashboard/librarian?tab=overdue', tab: 'overdue', icon: AlertTriangle },
  { name: 'Fines & Penalties', href: '/dashboard/librarian?tab=fines', tab: 'fines', icon: Receipt },
  { name: 'Borrowing History', href: '/dashboard/librarian?tab=history', tab: 'history', icon: History },
  { name: 'Profile', href: '/dashboard/librarian?tab=profile', tab: 'profile', icon: User },
  { name: 'Logout', href: '#logout', tab: 'logout', icon: LogOut, isLogout: true },
];

// 6. Examination Officer Menu Items
const examNavItems: NavItem[] = [
  { name: 'Exam Hub Overview', href: '/dashboard/exam?tab=overview', tab: 'overview', icon: LayoutDashboard },
  { name: 'Examinations', href: '/dashboard/exam?tab=examinations', tab: 'examinations', icon: Award },
  { name: 'Exam Schedules', href: '/dashboard/exam?tab=schedules', tab: 'schedules', icon: CalendarCheck },
  { name: 'Candidates Roll', href: '/dashboard/exam?tab=candidates', tab: 'candidates', icon: GraduationCap },
  { name: 'Subjects & Papers', href: '/dashboard/exam?tab=subjects', tab: 'subjects', icon: BookOpen },
  { name: 'Marks Entry & Ledger', href: '/dashboard/exam?tab=marks', tab: 'marks', icon: FileSpreadsheet },
  { name: 'Grade Rules', href: '/dashboard/exam?tab=grades', tab: 'grades', icon: Layers },
  { name: 'Result Verification', href: '/dashboard/exam?tab=verification', tab: 'verification', icon: CheckCircle2 },
  { name: 'Result Approval', href: '/dashboard/exam?tab=approval', tab: 'approval', icon: ShieldCheck },
  { name: 'Result Publication', href: '/dashboard/exam?tab=publication', tab: 'publication', icon: Send },
  { name: 'Report Cards', href: '/dashboard/exam?tab=report-cards', tab: 'report-cards', icon: Printer },
  { name: 'Academic Analytics', href: '/dashboard/exam?tab=analytics', tab: 'analytics', icon: BarChart3 },
  { name: 'Profile', href: '/dashboard/exam?tab=profile', tab: 'profile', icon: User },
  { name: 'Logout', href: '#logout', tab: 'logout', icon: LogOut, isLogout: true },
];

// 7. Front-Office / Staff Menu Items
const staffNavItems: NavItem[] = [
  { name: 'Front-Office Hub', href: '/dashboard/staff?tab=overview', tab: 'overview', icon: LayoutDashboard },
  { name: 'Student Registration', href: '/dashboard/staff?tab=registration', tab: 'registration', icon: UserPlus },
  { name: 'Admissions Pipeline', href: '/dashboard/staff?tab=admissions', tab: 'admissions', icon: UserCheck },
  { name: 'Student Records', href: '/dashboard/staff?tab=students', tab: 'students', icon: GraduationCap },
  { name: 'Guardian Information', href: '/dashboard/staff?tab=guardians', tab: 'guardians', icon: Users },
  { name: 'Student Transfers', href: '/dashboard/staff?tab=transfers', tab: 'transfers', icon: ArrowLeftRight },
  { name: 'Document Archives', href: '/dashboard/staff?tab=documents', tab: 'documents', icon: FolderOpen },
  { name: 'Search Students', href: '/dashboard/staff?tab=search', tab: 'search', icon: Search },
  { name: 'Front-Office & Visitors', href: '/dashboard/staff?tab=front-office', tab: 'front-office', icon: Briefcase },
  { name: 'Announcements', href: '/dashboard/staff?tab=announcements', tab: 'announcements', icon: Bell },
  { name: 'Profile', href: '/dashboard/staff?tab=profile', tab: 'profile', icon: User },
  { name: 'Logout', href: '#logout', tab: 'logout', icon: LogOut, isLogout: true },
];

// 8. Student Menu Items
const studentNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard/student?tab=dashboard', tab: 'dashboard', icon: LayoutDashboard },
  { name: 'My Profile', href: '/dashboard/student?tab=profile', tab: 'profile', icon: User },
  { name: 'My Results', href: '/dashboard/student?tab=results', tab: 'results', icon: Award },
  { name: 'My Attendance', href: '/dashboard/student?tab=attendance', tab: 'attendance', icon: UserCheck },
  { name: 'My Timetable', href: '/dashboard/student?tab=timetable', tab: 'timetable', icon: Clock },
  { name: 'My Assignments', href: '/dashboard/student?tab=assignments', tab: 'assignments', icon: ClipboardList },
  { name: 'My Examinations', href: '/dashboard/student?tab=examinations', tab: 'examinations', icon: BookOpen },
  { name: 'My Fees', href: '/dashboard/student?tab=fees', tab: 'fees', icon: CreditCard },
  { name: 'Notifications', href: '/dashboard/student?tab=notifications', tab: 'notifications', icon: Bell },
  { name: 'Account', href: '/dashboard/student?tab=account', tab: 'account', icon: Settings },
  { name: 'Logout', href: '#logout', tab: 'logout', icon: LogOut, isLogout: true },
];

// 9. Parent Menu Items
const parentNavItems: NavItem[] = [
  { name: 'Linked Children', href: '/dashboard/parent?tab=children', tab: 'children', icon: Users },
  { name: "Children's Results", href: '/dashboard/parent?tab=results', tab: 'results', icon: Award },
  { name: 'Attendance', href: '/dashboard/parent?tab=attendance', tab: 'attendance', icon: UserCheck },
  { name: 'Fee Balances', href: '/dashboard/parent?tab=fees', tab: 'fees', icon: CreditCard },
  { name: 'Payment History', href: '/dashboard/parent?tab=payments', tab: 'payments', icon: Receipt },
  { name: 'Class Timetable', href: '/dashboard/parent?tab=timetable', tab: 'timetable', icon: Clock },
  { name: 'Assignments', href: '/dashboard/parent?tab=assignments', tab: 'assignments', icon: ClipboardList },
  { name: 'Announcements', href: '/dashboard/parent?tab=announcements', tab: 'announcements', icon: FileText },
  { name: 'Logout', href: '#logout', tab: 'logout', icon: LogOut, isLogout: true },
];

// 10. Academic Affairs Menu Items
const academicNavItems: NavItem[] = [
  { name: 'Classes & Streams', href: '/dashboard/academic?tab=classes', tab: 'classes', icon: Layers },
  { name: 'Subject Curriculum', href: '/dashboard/academic?tab=subjects', tab: 'subjects', icon: BookOpen },
  { name: 'Academic Terms', href: '/dashboard/academic?tab=terms', tab: 'terms', icon: CalendarCheck },
  { name: 'Dean Profile', href: '/dashboard/academic?tab=profile', tab: 'profile', icon: User },
  { name: 'Logout', href: '#logout', tab: 'logout', icon: LogOut, isLogout: true },
];

// Complete Role Registry
const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  ADMIN: {
    title: 'Admin Console',
    subtitle: 'System Administration',
    badgeLabel: 'Console',
    activeBg: 'bg-indigo-600 text-white shadow-sm',
    badgeBg: 'bg-indigo-500/20 text-indigo-300',
    items: adminNavItems,
  },
  HEADMASTER: {
    title: 'Executive Governance',
    subtitle: 'Headmaster Office',
    badgeLabel: 'Analytics',
    activeBg: 'bg-amber-600 text-white shadow-sm font-semibold',
    badgeBg: 'bg-amber-500/20 text-amber-300',
    items: headmasterNavItems,
  },
  ACADEMIC: {
    title: 'Academic Affairs',
    subtitle: 'Dean of Academics',
    badgeLabel: 'Curriculum',
    activeBg: 'bg-indigo-600 text-white shadow-sm font-semibold',
    badgeBg: 'bg-indigo-500/20 text-indigo-300',
    items: academicNavItems,
  },
  TEACHER: {
    title: 'Teacher Workspace',
    subtitle: 'Faculty Portal',
    badgeLabel: 'Classroom',
    activeBg: 'bg-emerald-600 text-white shadow-sm',
    badgeBg: 'bg-emerald-500/20 text-emerald-300',
    items: teacherNavItems,
  },
  STUDENT: {
    title: 'Student Portal',
    subtitle: 'Scholar Workspace',
    badgeLabel: 'Student',
    activeBg: 'bg-indigo-600 text-white shadow-sm',
    badgeBg: 'bg-indigo-500/20 text-indigo-300',
    items: studentNavItems,
  },
  PARENT: {
    title: 'Parent Portal',
    subtitle: 'Guardian Dashboard',
    badgeLabel: 'Guardian',
    activeBg: 'bg-purple-600 text-white shadow-sm',
    badgeBg: 'bg-purple-500/20 text-purple-300',
    items: parentNavItems,
  },
  ACCOUNTANT: {
    title: 'Bursar & Finance',
    subtitle: 'Fiscal Accounts',
    badgeLabel: 'Fiscal',
    activeBg: 'bg-teal-600 text-white shadow-sm font-semibold',
    badgeBg: 'bg-teal-500/20 text-teal-300',
    items: accountantNavItems,
  },
  LIBRARIAN: {
    title: 'Library Center',
    subtitle: 'Resource Catalog',
    badgeLabel: 'Catalog',
    activeBg: 'bg-amber-600 text-white shadow-sm font-semibold',
    badgeBg: 'bg-amber-500/20 text-amber-300',
    items: librarianNavItems,
  },
  EXAM_OFFICER: {
    title: 'Examinations Office',
    subtitle: 'Controller of Exams',
    badgeLabel: 'Moderation',
    activeBg: 'bg-purple-600 text-white shadow-sm font-semibold',
    badgeBg: 'bg-purple-500/20 text-purple-300',
    items: examNavItems,
  },
  STAFF: {
    title: 'Campus Reception',
    subtitle: 'Front-Office Staff',
    badgeLabel: 'Admissions',
    activeBg: 'bg-sky-600 text-white shadow-sm font-semibold',
    badgeBg: 'bg-sky-500/20 text-sky-300',
    items: staffNavItems,
  },
};

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  const { user, role, logout } = useAuth();

  // Determine current active role strictly
  const activeRole: UserRole = role || (pathname.includes('/student') ? 'STUDENT' : pathname.includes('/parent') ? 'PARENT' : pathname.includes('/academic') ? 'ACADEMIC' : 'ADMIN');
  const config = ROLE_CONFIGS[activeRole] || ROLE_CONFIGS['ADMIN'];

  return (
    <aside className="w-72 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 shrink-0 sticky top-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white border border-indigo-500/30">
            <School className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white block">Apex SMS</span>
            <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">
              {config.title}
            </span>
          </div>
        </Link>
      </div>

      {/* Role Context Header */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          <span className="text-[11px] font-semibold text-slate-300">{config.subtitle}</span>
        </div>
        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${config.badgeBg}`}>
          {config.badgeLabel}
        </span>
      </div>

      {/* Navigation List - Strictly isolated to active role only */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {config.items.map((item) => {
          const isActive = currentTab === item.tab || ((item.tab === 'overview' || item.tab === 'dashboard' || item.tab === 'children') && !searchParams.get('tab') && pathname.includes(item.href.split('?')[0]));
          const Icon = item.icon;

          if (item.isLogout) {
            return (
              <button
                key={item.tab}
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all text-left mt-2 cursor-pointer"
              >
                <Icon className="w-4 h-4 text-rose-400" />
                <span>{item.name}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.tab}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? config.activeBg
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <UserAvatar user={user} size="sm" bordered status="online" className="shrink-0" />
          <div className="truncate">
            <div className="text-xs font-semibold text-white truncate">
              {user ? `${user.first_name} ${user.last_name}` : `${activeRole} User`}
            </div>
            <div className="text-[10px] text-indigo-400 truncate font-mono">
              {activeRole}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign out / Logout"
          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={<aside className="w-72 bg-slate-900 h-screen sticky top-0" />}>
      <SidebarContent />
    </Suspense>
  );
}
