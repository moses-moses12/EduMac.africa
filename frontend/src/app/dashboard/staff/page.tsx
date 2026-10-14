'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { studentService, notificationService, authService } from '@/services';
import {
  UserPlus,
  UserCheck,
  GraduationCap,
  Users,
  ArrowLeftRight,
  FolderOpen,
  Search,
  Briefcase,
  Bell,
  Megaphone,
  ShieldAlert,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  FileText,
  Printer,
  Lock,
  LogOut,
  User as UserIcon,
  Check,
  Shield
} from 'lucide-react';
import { DashboardProfileTab } from '@/components/profile';

interface StudentRecord {
  id: string;
  admission_number: string;
  full_name: string;
  class_name: string;
  gender: 'MALE' | 'FEMALE';
  dob: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_relationship: string;
  residential_address: string;
  enrollment_date: string;
  status: 'ACTIVE' | 'TRANSFERRED' | 'SUSPENDED';
}

interface AdmissionApplicant {
  id: string;
  application_number: string;
  student_name: string;
  applying_for_class: string;
  previous_school: string;
  guardian_name: string;
  guardian_phone: string;
  submission_date: string;
  stage: 'INQUIRY' | 'DOCUMENTS_VERIFIED' | 'INTERVIEW_SCHEDULED' | 'OFFER_EXTENDED' | 'ENROLLED';
}

interface TransferItem {
  id: string;
  student_name: string;
  admission_number: string;
  type: 'TRANSFER_IN' | 'TRANSFER_OUT';
  partner_school: string;
  date: string;
  reason: string;
  leaving_cert_issued: boolean;
  status: 'APPROVED' | 'PENDING_CLEARANCE';
}

interface VisitorLogItem {
  id: string;
  full_name: string;
  id_number: string;
  purpose: string;
  person_to_see: string;
  badge_number: string;
  time_in: string;
  time_out?: string;
  status: 'ON_CAMPUS' | 'CHECKED_OUT';
}

interface AnnouncementNotice {
  id: string;
  title: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  target_audience: string;
  date: string;
  author: string;
}

function StaffDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const [activeTab, setActiveTab] = useState(currentTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');

  // Modals
  const [showRegModal, setShowRegModal] = useState(false);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<StudentRecord | null>(null);

  const [staffName, setStaffName] = useState('Front-Office Secretariat');

  // Master Student Records
  const [students, setStudents] = useState<StudentRecord[]>([]);

  // Admissions Pipeline Applicants
  const [admissions, setAdmissions] = useState<AdmissionApplicant[]>([]);

  // Transfers
  const [transfers, setTransfers] = useState<TransferItem[]>([]);

  // Campus Visitor Log
  const [visitors, setVisitors] = useState<VisitorLogItem[]>([]);

  // Announcements
  const [announcements, setAnnouncements] = useState<AnnouncementNotice[]>([]);

  useEffect(() => {
    setActiveTab(currentTab);

    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('sms_user');
      if (raw) {
        try {
          const u = JSON.parse(raw);
          const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
          if (name) setStaffName(name);
        } catch (_) {}
      }
    }

    async function loadData() {
      try {
        const res = await studentService.getStudents();
        const list = res?.results || (Array.isArray(res) ? res : []);
        if (Array.isArray(list)) {
          setStudents(list.map((s: any) => ({
            id: String(s.id),
            admission_number: s.admission_number,
            full_name: `${s.user?.first_name || ''} ${s.user?.last_name || ''}`.trim() || s.admission_number,
            class_name: s.current_class?.name || 'Unassigned',
            gender: s.gender || 'MALE',
            dob: s.date_of_birth || '2010-01-01',
            guardian_name: s.emergency_contact_name || 'Guardian',
            guardian_phone: s.emergency_contact_phone || '-',
            guardian_relationship: 'Guardian',
            residential_address: s.address || '-',
            enrollment_date: s.admission_date || '2026-01-01',
            status: s.status || 'ACTIVE'
          })));
        }

        const notifRes = await notificationService.getNotifications().catch(() => null);
        const notifList = notifRes?.results || (Array.isArray(notifRes) ? notifRes : []);
        if (Array.isArray(notifList) && notifList.length > 0) {
          setAnnouncements(notifList.map((n: any) => ({
            id: String(n.id),
            title: n.title,
            content: n.message || n.content || '',
            priority: n.priority || 'NORMAL',
            target_audience: 'Entire School Community',
            date: n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Today',
            author: 'Campus Administration'
          })));
        }
      } catch (err) {
        console.warn('Error loading staff portal data:', err);
      }
    }
    loadData();
  }, [currentTab]);

  // New Student Registration Form
  const [newReg, setNewReg] = useState({
    full_name: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    dob: '',
    class_name: 'Form 1 Freshmen',
    previous_school: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_relationship: 'Parent / Mother',
    residential_address: ''
  });

  // New Visitor Form
  const [newVisitor, setNewVisitor] = useState({
    full_name: '',
    id_number: '',
    purpose: '',
    person_to_see: 'Headmaster / Principal'
  });

  // New Notice Form
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    target_audience: 'All Students & Parents'
  });

  // Handlers
  const handleRegisterStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const adm = `STU-2026-${String(students.length + 10).padStart(3, '0')}`;
    const rec: StudentRecord = {
      id: `STU-${Date.now()}`,
      admission_number: adm,
      full_name: newReg.full_name,
      class_name: newReg.class_name,
      gender: newReg.gender,
      dob: newReg.dob || '2011-01-01',
      guardian_name: newReg.guardian_name,
      guardian_phone: newReg.guardian_phone,
      guardian_relationship: newReg.guardian_relationship,
      residential_address: newReg.residential_address,
      enrollment_date: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    };

    setStudents([rec, ...students]);
    setShowRegModal(false);
    setNewReg({
      full_name: '',
      gender: 'MALE',
      dob: '',
      class_name: 'Form 1 Freshmen',
      previous_school: '',
      guardian_name: '',
      guardian_phone: '',
      guardian_relationship: 'Parent / Mother',
      residential_address: ''
    });
    alert(`Student ${rec.full_name} enrolled successfully! Allocated Admission Number: ${rec.admission_number}`);
  };

  const handleSignInVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    const visBadge = `VIS-${String(visitors.length + 20).padStart(3, '0')}`;
    const item: VisitorLogItem = {
      id: `VIS-${Date.now()}`,
      full_name: newVisitor.full_name,
      id_number: newVisitor.id_number,
      purpose: newVisitor.purpose,
      person_to_see: newVisitor.person_to_see,
      badge_number: visBadge,
      time_in: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'ON_CAMPUS'
    };
    setVisitors([item, ...visitors]);
    setShowVisitorModal(false);
    setNewVisitor({ full_name: '', id_number: '', purpose: '', person_to_see: 'Headmaster / Principal' });
    alert(`Visitor ${item.full_name} checked in! Gate pass issued: Badge #${visBadge}`);
  };

  const handleCheckOutVisitor = (id: string) => {
    setVisitors(prev => prev.map(v => v.id === id ? {
      ...v,
      status: 'CHECKED_OUT',
      time_out: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } : v));
    alert('Visitor checked out! Security pass returned.');
  };

  const handlePostNotice = (e: React.FormEvent) => {
    e.preventDefault();
    const notice: AnnouncementNotice = {
      id: `ANN-${Date.now()}`,
      title: newNotice.title,
      content: newNotice.content,
      priority: newNotice.priority,
      target_audience: newNotice.target_audience,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      author: 'Front-Office Secretariat'
    };
    setAnnouncements([notice, ...announcements]);
    setShowNoticeModal(false);
    setNewNotice({ title: '', content: '', priority: 'MEDIUM', target_audience: 'All Students & Parents' });
    alert('Campus bulletin published to network & lobby display boards!');
  };

  // Filtered Students
  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admission_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.guardian_phone.includes(searchQuery) ||
      s.guardian_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === 'ALL' || s.class_name.includes(classFilter);
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-8 pb-12">


      {/* Top Actions */}
      <div className="flex justify-end gap-2.5">
        <button
          onClick={() => setShowRegModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Register Student
        </button>
        <button
          onClick={() => setShowVisitorModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Sign In Visitor
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Enrolled Pupils</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{students.length}</div>
          <div className="mt-1 text-[11px] text-slate-400">{students.length > 0 ? "Form 1 through Form 4" : "No pupils enrolled"}</div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Admissions Pipeline</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{admissions.length}</div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">Fresh intake applicants</div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Visitors on Campus</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {visitors.filter(v => v.status === 'ON_CAMPUS').length}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Security badged</div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Transfers Active</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{transfers.length}</div>
          <div className="mt-1 text-[11px] text-slate-400">Leaving certs processed</div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Live Bulletins</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{announcements.length}</div>
          <div className="mt-1 text-[11px] text-slate-400">Active notices</div>
        </div>
      </div>



      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Front-Desk Visitor Stream */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Today&apos;s Visitor Badging & Log</h2>
                  <p className="text-xs text-slate-500">Security checkpoint visitor sign-ins & escorted personnel</p>
                </div>
                <button
                  onClick={() => setShowVisitorModal(true)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-50 text-sky-800 hover:bg-sky-100"
                >
                  Sign In Guest
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      <th className="p-3">Badge #</th>
                      <th className="p-3">Visitor Name</th>
                      <th className="p-3">Purpose of Visit</th>
                      <th className="p-3">Person to See</th>
                      <th className="p-3">Time In</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visitors.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                          No visitor records logged for today.
                        </td>
                      </tr>
                    ) : (
                      visitors.map(v => (
                        <tr key={v.id} className="hover:bg-slate-50/60">
                          <td className="p-3 font-mono font-bold text-sky-700">{v.badge_number}</td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-900">{v.full_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {v.id_number}</div>
                          </td>
                          <td className="p-3 text-slate-700">{v.purpose}</td>
                          <td className="p-3 text-slate-800 font-medium">{v.person_to_see}</td>
                          <td className="p-3 text-slate-600">{v.time_in}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                v.status === 'ON_CAMPUS'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {v.status === 'ON_CAMPUS' ? 'On Campus' : 'Departed'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {v.status === 'ON_CAMPUS' ? (
                              <button
                                onClick={() => handleCheckOutVisitor(v.id)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                              >
                                Check-Out
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">Out: {v.time_out}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inquiries & Quick Actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-sky-600 font-bold text-sm">
                  <UserPlus className="w-4 h-4" />
                  <h3>Quick Student Registration</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Instantly enroll fresh student admissions into Form 1 - 4.
                </p>
                <button
                  onClick={() => setShowRegModal(true)}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Launch Registration Form
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">Admissions Pipeline Summary</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>1. Inquiries Received:</span>
                    <span className="font-bold text-slate-900">{admissions.length} Inquiries</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>2. Documents Verified:</span>
                    <span className="font-bold text-blue-600">{admissions.filter(a => a.stage === 'DOCUMENTS_VERIFIED' || a.stage === 'INTERVIEW_SCHEDULED' || a.stage === 'OFFER_EXTENDED').length} Verified</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>3. Interviews Scheduled:</span>
                    <span className="font-bold text-purple-600">{admissions.filter(a => a.stage === 'INTERVIEW_SCHEDULED').length} Scheduled</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>4. Offers Accepted:</span>
                    <span className="font-bold text-emerald-600">{admissions.filter(a => a.stage === 'OFFER_EXTENDED').length} Enrolled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>
      )}

      {/* TAB 2: STUDENT REGISTRATION */}
      {activeTab === 'registration' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Student Enrollment Portal</h2>
              <p className="text-xs text-slate-500">
                Official student registration, biological data, guardian linking, and document verification.
              </p>
            </div>
            <button
              onClick={() => setShowRegModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Open Admission Form
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <h3 className="font-bold text-slate-900 text-sm">Recently Enrolled Students (This Term)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="p-3.5">Admission #</th>
                    <th className="p-3.5">Student Full Name</th>
                    <th className="p-3.5">Class / Stream</th>
                    <th className="p-3.5">Gender</th>
                    <th className="p-3.5">Enrollment Date</th>
                    <th className="p-3.5">Guardian Contact</th>
                    <th className="p-3.5 text-right">Student Card</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                        No student registrations recorded yet. Click &quot;Open Admission Form&quot; to enroll pupils.
                      </td>
                    </tr>
                  ) : (
                    students.slice(0, 5).map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 font-mono font-bold text-sky-700">{s.admission_number}</td>
                        <td className="p-3.5 font-bold text-slate-900">{s.full_name}</td>
                        <td className="p-3.5 text-slate-700">{s.class_name}</td>
                        <td className="p-3.5">{s.gender}</td>
                        <td className="p-3.5 text-slate-500">{s.enrollment_date}</td>
                        <td className="p-3.5">
                          <div className="text-slate-800">{s.guardian_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{s.guardian_phone}</div>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedStudentProfile(s)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100"
                          >
                            View Profile
                          </button>
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

      {/* TAB 3: ADMISSIONS PIPELINE */}
      {activeTab === 'admissions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">New Applicant Admissions Pipeline</h2>
              <p className="text-xs text-slate-500">Track candidates from initial inquiry to formal campus enrollment.</p>
            </div>
          </div>

          {admissions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              No applicants currently in the admissions pipeline.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {admissions.map(adm => (
                <div key={adm.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="font-mono text-xs font-bold text-slate-500">{adm.application_number}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                      {adm.stage.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{adm.student_name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Seeking Admission: {adm.applying_for_class}</p>
                    <p className="text-[11px] text-slate-400">Previous: {adm.previous_school}</p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl space-y-1 text-xs">
                    <div className="text-slate-500">Guardian: <span className="font-bold text-slate-800">{adm.guardian_name}</span></div>
                    <div className="text-slate-500 font-mono">{adm.guardian_phone}</div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        alert(`Progressed applicant ${adm.student_name} to next admission phase.`);
                      }}
                      className="w-full py-2 text-xs font-bold bg-sky-600 text-white rounded-xl hover:bg-sky-700"
                    >
                      Advance Pipeline Stage &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: STUDENT RECORDS */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Enrolled Student Directory</h2>
              <p className="text-xs text-slate-500">Comprehensive biographical and contact records.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student or phone..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
              >
                <option value="ALL">All Forms</option>
                <option value="Form 1">Form 1</option>
                <option value="Form 2">Form 2</option>
                <option value="Form 3">Form 3</option>
                <option value="Form 4">Form 4</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="p-3.5">Admission #</th>
                    <th className="p-3.5">Student Full Name</th>
                    <th className="p-3.5">Class</th>
                    <th className="p-3.5">Gender</th>
                    <th className="p-3.5">Guardian Name</th>
                    <th className="p-3.5">Guardian Contact</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                        No student records found matching the query.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 font-mono font-bold text-sky-700">{s.admission_number}</td>
                        <td className="p-3.5 font-bold text-slate-900">{s.full_name}</td>
                        <td className="p-3.5 text-slate-700">{s.class_name}</td>
                        <td className="p-3.5">{s.gender}</td>
                        <td className="p-3.5 font-medium text-slate-800">{s.guardian_name} ({s.guardian_relationship})</td>
                        <td className="p-3.5 font-mono text-slate-600">{s.guardian_phone}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {s.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedStudentProfile(s)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100"
                          >
                            View
                          </button>
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

      {/* TAB 5: GUARDIAN INFORMATION */}
      {activeTab === 'guardians' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Guardian Contact Directory</h2>
              <p className="text-xs text-slate-500">Emergency contacts, residential addresses, and ward linkages.</p>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              No guardian records on file.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {students.map(s => (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-sm">{s.guardian_name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700">
                      {s.guardian_relationship}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ward: <strong className="text-slate-900">{s.full_name}</strong> ({s.class_name})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-slate-800 font-semibold">{s.guardian_phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600 truncate">{s.residential_address}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex gap-2">
                    <button
                      onClick={() => alert(`Calling guardian ${s.guardian_name} at ${s.guardian_phone}`)}
                      className="flex-1 py-1.5 text-xs font-semibold bg-sky-50 text-sky-700 rounded-xl hover:bg-sky-100 flex items-center justify-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      Call
                    </button>
                    <button
                      onClick={() => alert(`Opening SMS compose for guardian of ${s.full_name}`)}
                      className="flex-1 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
                    >
                      SMS
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: STUDENT TRANSFERS */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Student Transfers Management</h2>
              <p className="text-xs text-slate-500">
                School relocation clearances, transfer testimonials, and ministry NEMIS departures.
              </p>
            </div>
            <button
              onClick={() => alert('Initiated transfer-out clearance workflow.')}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-sky-600 text-white"
            >
              Initiate Transfer Clearance
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="p-3.5">Transfer Ref</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Transfer Type</th>
                    <th className="p-3.5">Partner School</th>
                    <th className="p-3.5">Transfer Date</th>
                    <th className="p-3.5">Reason</th>
                    <th className="p-3.5">Leaving Cert</th>
                    <th className="p-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transfers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                        No transfer records on file.
                      </td>
                    </tr>
                  ) : (
                    transfers.map(tr => (
                      <tr key={tr.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 font-mono font-bold text-slate-800">{tr.id}</td>
                        <td className="p-3.5 font-bold text-slate-900">{tr.student_name}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tr.type === 'TRANSFER_IN' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'
                            }`}
                          >
                            {tr.type === 'TRANSFER_IN' ? 'Incoming Transfer' : 'Outgoing Transfer'}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">{tr.partner_school}</td>
                        <td className="p-3.5 text-slate-600">{tr.date}</td>
                        <td className="p-3.5 text-slate-600 max-w-xs truncate">{tr.reason}</td>
                        <td className="p-3.5">
                          {tr.leaving_cert_issued ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Issued
                            </span>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-bold text-slate-900">{tr.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: DOCUMENT ARCHIVES */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Student Document Digital Archive</h2>
            <p className="text-xs text-slate-500">Birth certificates, immunization slips, and admission transcripts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { title: 'National Birth Certificates', count: '842 on file', type: 'PDF / Verified', icon: FileText },
              { title: 'Immunization & Health Clearance', count: '838 on file', type: 'Medical Slip', icon: CheckCircle2 },
              { title: 'School Leaving Testimonials', count: '124 on file', type: 'Official Stamp', icon: Printer },
            ].map(doc => {
              const Icon = doc.icon;
              return (
                <div key={doc.title} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{doc.title}</h3>
                      <p className="text-xs text-slate-500">{doc.type}</p>
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl text-xs font-mono font-bold text-slate-800">
                    {doc.count}
                  </div>
                  <button
                    onClick={() => alert(`Browsing ${doc.title} digital archive repository`)}
                    className="w-full py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl"
                  >
                    Open Archive &rarr;
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 8: QUICK SEARCH */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="max-w-xl mx-auto space-y-4 text-center">
            <h2 className="text-xl font-extrabold text-slate-900">Front-Desk Instant Student Lookup</h2>
            <p className="text-xs text-slate-500">
              Locate enrolled students by name, admission number, guardian phone, or residential estate.
            </p>

            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Enter student name, admission #, or parent phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {searchQuery && (
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="text-xs font-semibold text-slate-500">
                Found {filteredStudents.length} matching students:
              </div>
              {filteredStudents.map(s => (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{s.full_name}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      Adm: {s.admission_number} • Class: {s.class_name} • Parent: {s.guardian_phone}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStudentProfile(s)}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-sky-600 text-white hover:bg-sky-700"
                  >
                    View Dossier
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 9: FRONT-OFFICE & VISITOR LOGS */}
      {activeTab === 'front-office' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Security Gate Visitor & Delivery Register</h2>
              <p className="text-xs text-slate-500">Comprehensive daily log of external visitors, vendors, and packages.</p>
            </div>
            <button
              onClick={() => setShowVisitorModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              Sign In New Visitor
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="p-3.5">Badge ID</th>
                    <th className="p-3.5">Guest Name & ID</th>
                    <th className="p-3.5">Purpose of Visit</th>
                    <th className="p-3.5">Office to Visit</th>
                    <th className="p-3.5">Sign-In Time</th>
                    <th className="p-3.5">Sign-Out Time</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Gate Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visitors.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                        No visitor records logged in the security register.
                      </td>
                    </tr>
                  ) : (
                    visitors.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 font-mono font-bold text-sky-700">{v.badge_number}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{v.full_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">National ID: {v.id_number}</div>
                        </td>
                        <td className="p-3.5 text-slate-700">{v.purpose}</td>
                        <td className="p-3.5 font-medium text-slate-800">{v.person_to_see}</td>
                        <td className="p-3.5 text-slate-600">{v.time_in}</td>
                        <td className="p-3.5 text-slate-500">{v.time_out || '—'}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              v.status === 'ON_CAMPUS' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {v.status === 'ON_CAMPUS' ? 'On Campus' : 'Checked Out'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {v.status === 'ON_CAMPUS' && (
                            <button
                              onClick={() => handleCheckOutVisitor(v.id)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                            >
                              Sign Out
                            </button>
                          )}
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

      {/* TAB 10: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Campus Notice Board & Announcements</h2>
              <p className="text-xs text-slate-500">Publish institutional bulletins for pupils, parents, and visitors.</p>
            </div>
            <button
              onClick={() => setShowNoticeModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white"
            >
              <Megaphone className="w-3.5 h-3.5" />
              Publish Bulletin
            </button>
          </div>

          {announcements.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              No campus announcements published. Click &quot;Publish Bulletin&quot; to post a new notice.
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map(ann => (
                <div key={ann.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ann.priority === 'URGENT'
                            ? 'bg-rose-100 text-rose-800'
                            : ann.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {ann.priority}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{ann.title}</h3>
                    </div>
                    <span className="text-xs text-slate-400">{ann.date}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>

                  <div className="pt-2 flex justify-between items-center text-[11px] text-slate-400">
                    <span>Audience: <strong className="text-slate-700">{ann.target_audience}</strong></span>
                    <span>Issued by: {ann.author}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 11: PROFILE */}
      {activeTab === 'profile' && (
        <DashboardProfileTab
          title="Reception Staff & Front-Office Secretariat Profile"
          subtitle="Official personnel credentials, desk duties, security clearance, and profile avatar"
          extraDetails={[
            { label: 'Staff ID', val: 'STF-2023-018' },
            { label: 'Department', val: 'Front-Office Operations & Secretarial Department' },
            { label: 'Security Clearance', val: 'Level-1 Public Desk Clearance (Non-Administrative)' },
            { label: 'Duty Stations', val: 'Campus Main Gatehouse & Administrative Reception' },
            { label: 'Assigned Duties', val: 'Admissions, Student Enrolment, Visitors Badging, Guardian Directory' },
          ]}
        />
      )}

      {/* TAB 12: LOGOUT */}
      {activeTab === 'logout' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm max-w-md mx-auto text-center space-y-4 my-8">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <LogOut className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Sign Out of Reception Desk?</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Are you sure you want to end your front-office session? Ensure all visitor badges and guest passes are properly accounted for.
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
              Confirm Sign Out
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: REGISTER STUDENT */}
      {showRegModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Student Admission & Registration</h3>
                <p className="text-xs text-slate-500">Record fresh pupil biological & guardian profile</p>
              </div>
              <button onClick={() => setShowRegModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterStudent} className="space-y-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Johnathan Mutiso"
                  value={newReg.full_name}
                  onChange={e => setNewReg({ ...newReg, full_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={newReg.gender}
                    onChange={e => setNewReg({ ...newReg, gender: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={newReg.dob}
                    onChange={e => setNewReg({ ...newReg, dob: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Enrollment Class</label>
                  <select
                    value={newReg.class_name}
                    onChange={e => setNewReg({ ...newReg, class_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  >
                    <option value="Form 1 Freshmen">Form 1 Freshmen</option>
                    <option value="Form 2 Junior">Form 2 Junior</option>
                    <option value="Form 3 Senior">Form 3 Senior</option>
                    <option value="Form 4 Candidates">Form 4 Candidates</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Previous School</label>
                  <input
                    type="text"
                    placeholder="e.g. Joyland Academy"
                    value={newReg.previous_school}
                    onChange={e => setNewReg({ ...newReg, previous_school: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-3">
                <span className="font-bold text-slate-800 block text-xs">Guardian Details:</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Guardian Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mary Mutiso"
                      value={newReg.guardian_name}
                      onChange={e => setNewReg({ ...newReg, guardian_name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Guardian Phone</label>
                    <input
                      type="tel"
                      required
                      placeholder="+254 7..."
                      value={newReg.guardian_phone}
                      onChange={e => setNewReg({ ...newReg, guardian_phone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Residential Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Kileleshwa, Othaya Road Court 3"
                    value={newReg.residential_address}
                    onChange={e => setNewReg({ ...newReg, residential_address: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold"
                >
                  Complete Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SIGN IN VISITOR */}
      {showVisitorModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Sign In Campus Visitor</h3>
              <button onClick={() => setShowVisitorModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSignInVisitor} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Visitor Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Otieno"
                  value={newVisitor.full_name}
                  onChange={e => setNewVisitor({ ...newVisitor, full_name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">National ID / Passport #</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 29182390"
                  value={newVisitor.id_number}
                  onChange={e => setNewVisitor({ ...newVisitor, id_number: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Purpose of Visit</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parent teacher conference"
                  value={newVisitor.purpose}
                  onChange={e => setNewVisitor({ ...newVisitor, purpose: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Person or Department to See</label>
                <input
                  type="text"
                  required
                  value={newVisitor.person_to_see}
                  onChange={e => setNewVisitor({ ...newVisitor, person_to_see: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVisitorModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Issue Badge & Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PUBLISH NOTICE */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Publish Campus Bulletin</h3>
              <button onClick={() => setShowNoticeModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostNotice} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Visiting Scholars Seminar"
                  value={newNotice.title}
                  onChange={e => setNewNotice({ ...newNotice, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notice Content</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed announcement content..."
                  value={newNotice.content}
                  onChange={e => setNewNotice({ ...newNotice, content: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newNotice.priority}
                    onChange={e => setNewNotice({ ...newNotice, priority: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={newNotice.target_audience}
                    onChange={e => setNewNotice({ ...newNotice, target_audience: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold"
                >
                  Post Bulletin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: STUDENT PROFILE DOSSIER */}
      {selectedStudentProfile && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Apex Student Profile</span>
              <button onClick={() => setSelectedStudentProfile(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-center pb-2">
                <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-bold text-base flex items-center justify-center mx-auto mb-2">
                  {selectedStudentProfile.full_name[0]}
                </div>
                <h3 className="font-bold text-slate-900 text-base">{selectedStudentProfile.full_name}</h3>
                <span className="font-mono text-xs text-indigo-600 font-semibold">{selectedStudentProfile.admission_number}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Class:</span>
                  <span className="font-bold text-slate-900">{selectedStudentProfile.class_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gender:</span>
                  <span className="text-slate-700">{selectedStudentProfile.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date of Birth:</span>
                  <span className="text-slate-700">{selectedStudentProfile.dob}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Enrollment Date:</span>
                  <span className="text-slate-700">{selectedStudentProfile.enrollment_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Guardian Name:</span>
                  <span className="font-bold text-slate-900">{selectedStudentProfile.guardian_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Guardian Phone:</span>
                  <span className="font-mono font-bold text-sky-700">{selectedStudentProfile.guardian_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Address:</span>
                  <span className="text-slate-700 truncate max-w-[180px]">{selectedStudentProfile.residential_address}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedStudentProfile(null)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading Reception & Front-Office Dashboard...</div>}>
      <StaffDashboardContent />
    </Suspense>
  );
}
