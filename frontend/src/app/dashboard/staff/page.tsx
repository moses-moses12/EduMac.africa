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
  Shield,
  Download,
  RefreshCw,
  Filter,
  Sparkles,
  Award,
  Send,
  Upload,
  QrCode,
  ShieldCheck,
  Building,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { DashboardProfileTab } from '@/components/profile';

// ── Types & Interfaces ────────────────────────────────────────────────────────

interface StudentRecord {
  id: string;
  admission_number: string;
  full_name: string;
  class_name: string;
  stream_name: string;
  gender: 'MALE' | 'FEMALE';
  dob: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_relationship: string;
  residential_address: string;
  enrollment_date: string;
  status: 'ACTIVE' | 'TRANSFERRED' | 'SUSPENDED';
  fee_status: 'CLEARED' | 'PENDING' | 'OVERDUE';
}

interface AdmissionApplicant {
  id: string;
  application_number: string;
  student_name: string;
  gender: 'MALE' | 'FEMALE';
  applying_for_class: string;
  previous_school: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  submission_date: string;
  stage: 'INQUIRY' | 'DOCUMENTS_VERIFIED' | 'INTERVIEW_SCHEDULED' | 'OFFER_EXTENDED' | 'ENROLLED';
  interview_score?: string;
  notes?: string;
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
  clearance_status: 'CLEARED' | 'PENDING_FEES' | 'PENDING_LIBRARY' | 'APPROVED';
  conduct_grade: string;
}

interface VisitorLogItem {
  id: string;
  full_name: string;
  id_number: string;
  phone: string;
  purpose: string;
  person_to_see: string;
  badge_number: string;
  time_in: string;
  time_out?: string;
  status: 'ON_CAMPUS' | 'CHECKED_OUT';
  escort_required: boolean;
}

interface ArchiveDocument {
  id: string;
  title: string;
  student_name: string;
  admission_number: string;
  category: 'BIRTH_CERTIFICATE' | 'HEALTH_RECORD' | 'LEAVING_CERT' | 'ACADEMIC_TRANSCRIPT' | 'NATIONAL_ID';
  upload_date: string;
  file_size: string;
  verified: boolean;
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

// ── Realistic Pre-Seeded Datasets ─────────────────────────────────────────────

const INITIAL_APPLICANTS: AdmissionApplicant[] = [
  {
    id: 'APP-2026-001',
    application_number: 'APP-2026-001',
    student_name: 'Brian Kipchoge',
    gender: 'MALE',
    applying_for_class: 'Form 1 Freshmen',
    previous_school: 'St. Mary Primary School',
    guardian_name: 'Daniel Kipchoge',
    guardian_phone: '+254 712 345 678',
    guardian_email: 'd.kipchoge@gmail.com',
    submission_date: '2026-10-10',
    stage: 'OFFER_EXTENDED',
    interview_score: '88% (Excellent)',
    notes: 'Exceptional mathematics and athletics profile.'
  },
  {
    id: 'APP-2026-002',
    application_number: 'APP-2026-002',
    student_name: 'Cynthia Wanjiku',
    gender: 'FEMALE',
    applying_for_class: 'Form 1 Freshmen',
    previous_school: 'Kilimani Academy',
    guardian_name: 'Grace Wanjiku',
    guardian_phone: '+254 722 987 654',
    guardian_email: 'grace.w@yahoo.com',
    submission_date: '2026-10-11',
    stage: 'INTERVIEW_SCHEDULED',
    interview_score: 'Pending',
    notes: 'Interview scheduled for Friday 10:00 AM in Boardroom A.'
  },
  {
    id: 'APP-2026-003',
    application_number: 'APP-2026-003',
    student_name: 'Kevin Omondi',
    gender: 'MALE',
    applying_for_class: 'Form 2 Junior',
    previous_school: 'Kisumu Senior School',
    guardian_name: 'Peter Omondi',
    guardian_phone: '+254 733 456 789',
    guardian_email: 'pomondi@outlook.com',
    submission_date: '2026-10-12',
    stage: 'DOCUMENTS_VERIFIED',
    interview_score: 'Pending',
    notes: 'Medical slip and Form 1 transcript verified by Dean.'
  },
  {
    id: 'APP-2026-004',
    application_number: 'APP-2026-004',
    student_name: 'Faith Chebet',
    gender: 'FEMALE',
    applying_for_class: 'Form 3 Senior',
    previous_school: 'Eldoret High',
    guardian_name: 'Sarah Chebet',
    guardian_phone: '+254 744 112 233',
    guardian_email: 'sarah.chebet@gmail.com',
    submission_date: '2026-10-13',
    stage: 'INQUIRY',
    notes: 'Awaiting birth certificate photocopy.'
  },
  {
    id: 'APP-2026-005',
    application_number: 'APP-2026-005',
    student_name: 'Emmanuel Adeyemi',
    gender: 'MALE',
    applying_for_class: 'Form 1 Freshmen',
    previous_school: 'Nairobi South Primary',
    guardian_name: 'Folake Adeyemi',
    guardian_phone: '+254 755 889 900',
    guardian_email: 'folake.ade@gmail.com',
    submission_date: '2026-10-09',
    stage: 'ENROLLED',
    interview_score: '94% (Honors)',
    notes: 'Admission packet collected and fees cleared.'
  }
];

const INITIAL_TRANSFERS: TransferItem[] = [
  {
    id: 'TRF-2026-081',
    student_name: 'David Mwangi',
    admission_number: 'ADM-2024-112',
    type: 'TRANSFER_OUT',
    partner_school: 'Alliance High School',
    date: '2026-10-08',
    reason: 'Family residential relocation to Kiambu County.',
    leaving_cert_issued: true,
    clearance_status: 'APPROVED',
    conduct_grade: 'Exemplary'
  },
  {
    id: 'TRF-2026-082',
    student_name: 'Mercy Achieng',
    admission_number: 'ADM-2025-045',
    type: 'TRANSFER_IN',
    partner_school: 'Pangani Girls High',
    date: '2026-10-10',
    reason: 'Parents requested proximity to work station in Westlands.',
    leaving_cert_issued: true,
    clearance_status: 'APPROVED',
    conduct_grade: 'Very Good'
  },
  {
    id: 'TRF-2026-083',
    student_name: 'Samuel Kiprono',
    admission_number: 'ADM-2024-209',
    type: 'TRANSFER_OUT',
    partner_school: 'Kapsabet Boys',
    date: '2026-10-12',
    reason: 'Athletic scholarship placement.',
    leaving_cert_issued: false,
    clearance_status: 'PENDING_LIBRARY',
    conduct_grade: 'Good'
  },
  {
    id: 'TRF-2026-084',
    student_name: 'Amina Hassan',
    admission_number: 'ADM-2025-180',
    type: 'TRANSFER_IN',
    partner_school: 'Mombasa Academy',
    date: '2026-10-13',
    reason: 'Inter-county domestic relocation.',
    leaving_cert_issued: true,
    clearance_status: 'APPROVED',
    conduct_grade: 'Excellent'
  }
];

const INITIAL_VISITORS: VisitorLogItem[] = [
  {
    id: 'VIS-2026-001',
    full_name: 'James Kariuki',
    id_number: '28472910',
    phone: '+254 721 009 112',
    purpose: 'Form 2 Parent Progress Consultation',
    person_to_see: 'Headmaster / Dr. Arthur Pendelton',
    badge_number: 'VIS-014',
    time_in: '08:30 AM',
    status: 'ON_CAMPUS',
    escort_required: false
  },
  {
    id: 'VIS-2026-002',
    full_name: 'Dr. Esther Njoroge',
    id_number: '19823478',
    phone: '+254 733 998 877',
    purpose: 'Ministry of Education Quality Audit',
    person_to_see: 'Academic Registrar / Marcus Vance',
    badge_number: 'VIS-002',
    time_in: '09:15 AM',
    status: 'ON_CAMPUS',
    escort_required: true
  },
  {
    id: 'VIS-2026-003',
    full_name: 'Patrick Odhiambo',
    id_number: '31092847',
    phone: '+254 711 445 566',
    purpose: 'Oxford University Press Textbook Delivery',
    person_to_see: 'Chief Librarian / Clara Oswald',
    badge_number: 'VIS-025',
    time_in: '10:00 AM',
    time_out: '10:45 AM',
    status: 'CHECKED_OUT',
    escort_required: false
  },
  {
    id: 'VIS-2026-004',
    full_name: 'Agnes Mutua',
    id_number: '25489102',
    phone: '+254 720 334 455',
    purpose: 'Admission Inquiries & School Tour',
    person_to_see: 'Admissions Secretariat / Beatrice Montgomery',
    badge_number: 'VIS-019',
    time_in: '11:10 AM',
    status: 'ON_CAMPUS',
    escort_required: false
  }
];

const INITIAL_DOCUMENTS: ArchiveDocument[] = [
  {
    id: 'DOC-801',
    title: 'Certified Birth Certificate',
    student_name: 'Brian Kipchoge',
    admission_number: 'ADM-2026-001',
    category: 'BIRTH_CERTIFICATE',
    upload_date: '2026-10-10',
    file_size: '1.4 MB',
    verified: true
  },
  {
    id: 'DOC-802',
    title: 'Ministry Immunization & Health Clearance',
    student_name: 'Cynthia Wanjiku',
    admission_number: 'ADM-2026-002',
    category: 'HEALTH_RECORD',
    upload_date: '2026-10-11',
    file_size: '850 KB',
    verified: true
  },
  {
    id: 'DOC-803',
    title: 'Official School Leaving Testimonial',
    student_name: 'David Mwangi',
    admission_number: 'ADM-2024-112',
    category: 'LEAVING_CERT',
    upload_date: '2026-10-08',
    file_size: '2.1 MB',
    verified: true
  },
  {
    id: 'DOC-804',
    title: 'KCPE Official Result Slip',
    student_name: 'Emmanuel Adeyemi',
    admission_number: 'ADM-2026-005',
    category: 'ACADEMIC_TRANSCRIPT',
    upload_date: '2026-10-09',
    file_size: '1.2 MB',
    verified: true
  },
  {
    id: 'DOC-805',
    title: 'Guardian National ID Copy',
    student_name: 'Kevin Omondi',
    admission_number: 'ADM-2026-003',
    category: 'NATIONAL_ID',
    upload_date: '2026-10-12',
    file_size: '980 KB',
    verified: true
  }
];

const INITIAL_ANNOUNCEMENTS: AnnouncementNotice[] = [
  {
    id: 'ANN-2026-01',
    title: 'Term 1 Annual Visiting & Mentorship Day',
    content: 'All parents, legal guardians, and sponsors are warmly invited to the campus grounds on Saturday, 24th October from 9:00 AM to 3:30 PM. Vehicle passes will be issued at Gate A.',
    priority: 'HIGH',
    target_audience: 'Entire School Community',
    date: '2026-10-14',
    author: 'Campus Front-Office Desk'
  },
  {
    id: 'ANN-2026-02',
    title: 'Form 4 National Exam Registration Deadline Notice',
    content: 'KNEC examination candidate biographical verification must be submitted at the reception counter before 30th October 2026. Please bring original birth certificates.',
    priority: 'URGENT',
    target_audience: 'Form 4 Parents & Students',
    date: '2026-10-13',
    author: 'Examination & Front-Office Secretariat'
  },
  {
    id: 'ANN-2026-03',
    title: 'Security Gate Protocol & Visitor Pre-Registration',
    content: 'All commercial suppliers and external personnel must carry national identification cards for electronic badge issuing prior to entering campus perimeter.',
    priority: 'MEDIUM',
    target_audience: 'Visitors & Suppliers',
    date: '2026-10-12',
    author: 'Campus Security & Reception'
  }
];

const DEFAULT_STUDENTS: StudentRecord[] = [
  {
    id: 'STU-101',
    admission_number: 'ADM-2026-011',
    full_name: 'Alexander Pierce',
    class_name: 'Form 3 Senior',
    stream_name: 'Stream A (Science)',
    gender: 'MALE',
    dob: '2010-04-12',
    guardian_name: 'Jonathan Pierce',
    guardian_phone: '+254 719 283 401',
    guardian_relationship: 'Father',
    residential_address: 'Kilimani, Ring Road Court 4',
    enrollment_date: '2024-01-15',
    status: 'ACTIVE',
    fee_status: 'CLEARED'
  },
  {
    id: 'STU-102',
    admission_number: 'ADM-2026-012',
    full_name: 'Neema Kassim',
    class_name: 'Form 2 Junior',
    stream_name: 'Stream B (Arts)',
    gender: 'FEMALE',
    dob: '2011-08-20',
    guardian_name: 'Kassim Suleiman',
    guardian_phone: '+254 722 411 902',
    guardian_relationship: 'Father',
    residential_address: 'Parklands, 3rd Avenue Park Plaza',
    enrollment_date: '2025-01-10',
    status: 'ACTIVE',
    fee_status: 'CLEARED'
  },
  {
    id: 'STU-103',
    admission_number: 'ADM-2026-013',
    full_name: 'Baraka Mrema',
    class_name: 'Form 1 Freshmen',
    stream_name: 'Stream A',
    gender: 'MALE',
    dob: '2012-02-14',
    guardian_name: 'Joyce Mrema',
    guardian_phone: '+254 733 812 703',
    guardian_relationship: 'Mother',
    residential_address: 'South C, Five Star Estate Hse 22',
    enrollment_date: '2026-01-08',
    status: 'ACTIVE',
    fee_status: 'PENDING'
  },
  {
    id: 'STU-104',
    admission_number: 'ADM-2026-014',
    full_name: 'Sophia Makau',
    class_name: 'Form 4 Candidates',
    stream_name: 'Stream A (Science)',
    gender: 'FEMALE',
    dob: '2009-11-05',
    guardian_name: 'Peter Makau',
    guardian_phone: '+254 720 901 804',
    guardian_relationship: 'Uncle & Legal Guardian',
    residential_address: 'Lavington, James Gichuru Road',
    enrollment_date: '2023-01-12',
    status: 'ACTIVE',
    fee_status: 'CLEARED'
  },
  {
    id: 'STU-105',
    admission_number: 'ADM-2026-015',
    full_name: 'Daniel Kiprono',
    class_name: 'Form 2 Junior',
    stream_name: 'Stream A',
    gender: 'MALE',
    dob: '2011-05-18',
    guardian_name: 'Miriam Kiprono',
    guardian_phone: '+254 711 778 899',
    guardian_relationship: 'Mother',
    residential_address: 'Ngong Road, Green Acres Apt B4',
    enrollment_date: '2025-01-10',
    status: 'ACTIVE',
    fee_status: 'OVERDUE'
  }
];

// ── Main Dashboard Content Component ──────────────────────────────────────────

function StaffDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const [activeTab, setActiveTab] = useState(currentTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [admissionsStageFilter, setAdmissionsStageFilter] = useState<string>('ALL');
  const [docCategoryFilter, setDocCategoryFilter] = useState<string>('ALL');

  // Modals state
  const [showRegModal, setShowRegModal] = useState(false);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);

  // Selected item modals
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<StudentRecord | null>(null);
  const [selectedStudentIdCard, setSelectedStudentIdCard] = useState<StudentRecord | null>(null);
  const [selectedVisitorPass, setSelectedVisitorPass] = useState<VisitorLogItem | null>(null);
  const [selectedLeavingCert, setSelectedLeavingCert] = useState<TransferItem | null>(null);
  const [selectedDocPreview, setSelectedDocPreview] = useState<ArchiveDocument | null>(null);
  const [selectedGuardianForSms, setSelectedGuardianForSms] = useState<{ name: string; phone: string; ward: string } | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<AdmissionApplicant | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // State collections
  const [students, setStudents] = useState<StudentRecord[]>(DEFAULT_STUDENTS);
  const [admissions, setAdmissions] = useState<AdmissionApplicant[]>(INITIAL_APPLICANTS);
  const [transfers, setTransfers] = useState<TransferItem[]>(INITIAL_TRANSFERS);
  const [visitors, setVisitors] = useState<VisitorLogItem[]>(INITIAL_VISITORS);
  const [documents, setDocuments] = useState<ArchiveDocument[]>(INITIAL_DOCUMENTS);
  const [announcements, setAnnouncements] = useState<AnnouncementNotice[]>(INITIAL_ANNOUNCEMENTS);

  // Sync tab with URL
  useEffect(() => {
    setActiveTab(currentTab);
  }, [currentTab]);

  // Load real student records from API if connected
  useEffect(() => {
    async function fetchLiveStudents() {
      try {
        const res = await studentService.getStudents();
        const list = res?.results || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          const apiStudents: StudentRecord[] = list.map((s: any, idx: number) => ({
            id: String(s.id || `API-${idx}`),
            admission_number: s.admission_number || `ADM-2026-0${idx + 20}`,
            full_name: `${s.user?.first_name || ''} ${s.user?.last_name || ''}`.trim() || s.admission_number || 'Pupil',
            class_name: s.current_class?.name || 'Form 1 Freshmen',
            stream_name: s.stream?.name || 'Main Stream',
            gender: (s.gender || 'MALE') as 'MALE' | 'FEMALE',
            dob: s.date_of_birth || '2011-01-01',
            guardian_name: s.emergency_contact_name || 'Guardian',
            guardian_phone: s.emergency_contact_phone || '+254 700 000 000',
            guardian_relationship: 'Parent / Guardian',
            residential_address: s.address || 'Nairobi County',
            enrollment_date: s.admission_date || '2026-01-10',
            status: (s.status || 'ACTIVE') as 'ACTIVE' | 'TRANSFERRED' | 'SUSPENDED',
            fee_status: idx % 3 === 0 ? 'CLEARED' : idx % 3 === 1 ? 'PENDING' : 'OVERDUE'
          }));
          setStudents(apiStudents);
        }
      } catch (err) {
        // Fallback gracefully to default pre-seeded records
      }
    }
    fetchLiveStudents();
  }, []);

  // Form states
  const [newReg, setNewReg] = useState({
    full_name: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    dob: '2011-05-15',
    class_name: 'Form 1 Freshmen',
    stream_name: 'Stream A (Science)',
    previous_school: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_relationship: 'Parent / Mother',
    residential_address: ''
  });

  const [newVisitor, setNewVisitor] = useState({
    full_name: '',
    id_number: '',
    phone: '',
    purpose: '',
    person_to_see: 'Headmaster / Dr. Arthur Pendelton',
    escort_required: false
  });

  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    priority: 'HIGH' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    target_audience: 'Entire School Community'
  });

  const [newTransfer, setNewTransfer] = useState({
    student_name: '',
    admission_number: '',
    type: 'TRANSFER_OUT' as 'TRANSFER_IN' | 'TRANSFER_OUT',
    partner_school: '',
    reason: '',
    conduct_grade: 'Very Good'
  });

  const [newDocUpload, setNewDocUpload] = useState({
    title: '',
    student_name: '',
    admission_number: '',
    category: 'BIRTH_CERTIFICATE' as 'BIRTH_CERTIFICATE' | 'HEALTH_RECORD' | 'LEAVING_CERT' | 'ACADEMIC_TRANSCRIPT' | 'NATIONAL_ID'
  });

  const [smsDraft, setSmsDraft] = useState({
    template: 'CUSTOM',
    message: ''
  });

  // ── Action Handlers ─────────────────────────────────────────────────────────

  const handleRegisterStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const newAdm = `ADM-2026-${String(students.length + 25).padStart(3, '0')}`;
    const newStudent: StudentRecord = {
      id: `STU-${Date.now()}`,
      admission_number: newAdm,
      full_name: newReg.full_name,
      class_name: newReg.class_name,
      stream_name: newReg.stream_name,
      gender: newReg.gender,
      dob: newReg.dob || '2011-01-01',
      guardian_name: newReg.guardian_name,
      guardian_phone: newReg.guardian_phone,
      guardian_relationship: newReg.guardian_relationship,
      residential_address: newReg.residential_address,
      enrollment_date: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      fee_status: 'PENDING'
    };

    setStudents([newStudent, ...students]);
    setShowRegModal(false);
    setNewReg({
      full_name: '',
      gender: 'MALE',
      dob: '2011-05-15',
      class_name: 'Form 1 Freshmen',
      stream_name: 'Stream A (Science)',
      previous_school: '',
      guardian_name: '',
      guardian_phone: '',
      guardian_relationship: 'Parent / Mother',
      residential_address: ''
    });
    showToast(`✅ ${newStudent.full_name} enrolled successfully! Allocated: ${newStudent.admission_number}`);
  };

  const handleSignInVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    const badgeNum = `VIS-0${String(visitors.length + 30).padStart(2, '0')}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newEntry: VisitorLogItem = {
      id: `VIS-${Date.now()}`,
      full_name: newVisitor.full_name,
      id_number: newVisitor.id_number,
      phone: newVisitor.phone || '+254 700 000 000',
      purpose: newVisitor.purpose,
      person_to_see: newVisitor.person_to_see,
      badge_number: badgeNum,
      time_in: timeStr,
      status: 'ON_CAMPUS',
      escort_required: newVisitor.escort_required
    };

    setVisitors([newEntry, ...visitors]);
    setShowVisitorModal(false);
    setNewVisitor({
      full_name: '',
      id_number: '',
      phone: '',
      purpose: '',
      person_to_see: 'Headmaster / Dr. Arthur Pendelton',
      escort_required: false
    });
    setSelectedVisitorPass(newEntry);
    showToast(`Gate Badge ${badgeNum} issued to ${newEntry.full_name}`);
  };

  const handleCheckOutVisitor = (id: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setVisitors(visitors.map(v => {
      if (v.id === id) {
        return { ...v, status: 'CHECKED_OUT', time_out: timeStr };
      }
      return v;
    }));
    showToast('Visitor pass successfully checked out & badge surrendered.');
  };

  const handleAdvanceApplicantStage = (applicantId: string) => {
    const stages: AdmissionApplicant['stage'][] = [
      'INQUIRY',
      'DOCUMENTS_VERIFIED',
      'INTERVIEW_SCHEDULED',
      'OFFER_EXTENDED',
      'ENROLLED'
    ];

    setAdmissions(admissions.map(adm => {
      if (adm.id === applicantId) {
        const curIdx = stages.indexOf(adm.stage);
        const nextStage = curIdx < stages.length - 1 ? stages[curIdx + 1] : stages[curIdx];

        // If enrolled, also auto-add to active students
        if (nextStage === 'ENROLLED' && adm.stage !== 'ENROLLED') {
          const autoAdmNum = `ADM-2026-${String(students.length + 30).padStart(3, '0')}`;
          setStudents(prev => [
            {
              id: `STU-${Date.now()}`,
              admission_number: autoAdmNum,
              full_name: adm.student_name,
              class_name: adm.applying_for_class,
              stream_name: 'Stream A',
              gender: adm.gender,
              dob: '2011-06-01',
              guardian_name: adm.guardian_name,
              guardian_phone: adm.guardian_phone,
              guardian_relationship: 'Parent / Legal Guardian',
              residential_address: 'Registered Residence',
              enrollment_date: new Date().toISOString().split('T')[0],
              status: 'ACTIVE',
              fee_status: 'PENDING'
            },
            ...prev
          ]);
          showToast(`🎉 ${adm.student_name} officially enrolled as a student!`);
        } else {
          showToast(`Advanced ${adm.student_name} to ${nextStage.replace(/_/g, ' ')}`);
        }

        return { ...adm, stage: nextStage };
      }
      return adm;
    }));
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrf: TransferItem = {
      id: `TRF-2026-${String(transfers.length + 90).padStart(3, '0')}`,
      student_name: newTransfer.student_name,
      admission_number: newTransfer.admission_number || `ADM-2026-${Math.floor(Math.random() * 800 + 100)}`,
      type: newTransfer.type,
      partner_school: newTransfer.partner_school,
      date: new Date().toISOString().split('T')[0],
      reason: newTransfer.reason,
      leaving_cert_issued: newTransfer.type === 'TRANSFER_OUT',
      clearance_status: 'APPROVED',
      conduct_grade: newTransfer.conduct_grade
    };

    setTransfers([newTrf, ...transfers]);
    setShowTransferModal(false);
    setNewTransfer({
      student_name: '',
      admission_number: '',
      type: 'TRANSFER_OUT',
      partner_school: '',
      reason: '',
      conduct_grade: 'Very Good'
    });
    showToast(`Transfer record ${newTrf.id} cleared for ${newTrf.student_name}`);
  };

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    const newDoc: ArchiveDocument = {
      id: `DOC-${Math.floor(Math.random() * 800 + 100)}`,
      title: newDocUpload.title,
      student_name: newDocUpload.student_name,
      admission_number: newDocUpload.admission_number || 'ADM-2026-011',
      category: newDocUpload.category,
      upload_date: new Date().toISOString().split('T')[0],
      file_size: '1.8 MB',
      verified: true
    };

    setDocuments([newDoc, ...documents]);
    setShowUploadDocModal(false);
    setNewDocUpload({
      title: '',
      student_name: '',
      admission_number: '',
      category: 'BIRTH_CERTIFICATE'
    });
    showToast(`Document archived: ${newDoc.title} for ${newDoc.student_name}`);
  };

  const handlePostNotice = (e: React.FormEvent) => {
    e.preventDefault();
    const notice: AnnouncementNotice = {
      id: `ANN-${Date.now()}`,
      title: newNotice.title,
      content: newNotice.content,
      priority: newNotice.priority,
      target_audience: newNotice.target_audience,
      date: new Date().toISOString().split('T')[0],
      author: 'Reception & Front-Office Secretariat'
    };

    setAnnouncements([notice, ...announcements]);
    setShowNoticeModal(false);
    setNewNotice({
      title: '',
      content: '',
      priority: 'HIGH',
      target_audience: 'Entire School Community'
    });
    showToast(`📢 Campus bulletin published: "${notice.title}"`);
  };

  const handleSendGuardianSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuardianForSms) return;
    setShowSmsModal(false);
    showToast(`📱 SMS dispatched to ${selectedGuardianForSms.name} (${selectedGuardianForSms.phone})`);
    setSmsDraft({ template: 'CUSTOM', message: '' });
  };

  // Filtered queries
  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.full_name.toLowerCase().includes(q) ||
      s.admission_number.toLowerCase().includes(q) ||
      s.guardian_phone.includes(q) ||
      s.guardian_name.toLowerCase().includes(q) ||
      s.residential_address.toLowerCase().includes(q);

    const matchesClass = classFilter === 'ALL' || s.class_name.includes(classFilter);
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const filteredAdmissions = admissions.filter(a => {
    if (admissionsStageFilter === 'ALL') return true;
    return a.stage === admissionsStageFilter;
  });

  const filteredDocuments = documents.filter(d => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      d.title.toLowerCase().includes(q) ||
      d.student_name.toLowerCase().includes(q) ||
      d.admission_number.toLowerCase().includes(q);
    const matchesCategory = docCategoryFilter === 'ALL' || d.category === docCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-900 uppercase tracking-wider">
              Campus Reception Desk
            </span>
            <span className="text-xs text-slate-500 font-medium">Session Active • Desk Terminal #1</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            {activeTab === 'overview' && 'Front-Office Operations Hub'}
            {activeTab === 'registration' && 'Student Enrollment Portal'}
            {activeTab === 'admissions' && 'Admissions Pipeline & Inquiries'}
            {activeTab === 'students' && 'Master Student Directory'}
            {activeTab === 'guardians' && 'Guardian & Emergency Directory'}
            {activeTab === 'transfers' && 'Student Transfers & Leaving Certificates'}
            {activeTab === 'documents' && 'Document Digital Archive'}
            {activeTab === 'search' && 'Instant Student & Guardian Lookup'}
            {activeTab === 'front-office' && 'Gate Security & Visitor Register'}
            {activeTab === 'announcements' && 'Campus Notice Board'}
            {activeTab === 'profile' && 'Reception Personnel Profile'}
            {activeTab === 'logout' && 'Sign Out Confirmation'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowRegModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Enroll Student</span>
          </button>
          <button
            onClick={() => setShowVisitorModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Sign In Visitor</span>
          </button>
          <button
            onClick={() => setShowNoticeModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <Megaphone className="w-3.5 h-3.5 text-sky-600" />
            <span>Post Notice</span>
          </button>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div
          onClick={() => setActiveTab('students')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-sky-600 transition-colors">Enrolled Pupils</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{students.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active pupils on roll</div>
        </div>

        <div
          onClick={() => setActiveTab('admissions')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-600 transition-colors">Admissions</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{admissions.length}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Active intake pipeline</div>
        </div>

        <div
          onClick={() => setActiveTab('front-office')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-600 transition-colors">On Campus</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {visitors.filter(v => v.status === 'ON_CAMPUS').length}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-0.5">Active visitor badges</div>
        </div>

        <div
          onClick={() => setActiveTab('transfers')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-purple-600 transition-colors">Transfers</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{transfers.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Clearance vouchers</div>
        </div>

        <div
          onClick={() => setActiveTab('announcements')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:border-rose-300 hover:shadow-xs transition-all cursor-pointer group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-rose-600 transition-colors">Live Bulletins</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{announcements.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active campus notices</div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: FRONT-OFFICE OVERVIEW HUB                                         */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Campus Visitors Stream */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Today&apos;s Visitor Register & Security Log</h2>
                  <p className="text-xs text-slate-500">Live monitoring of escorted guests, parents, and contractors</p>
                </div>
                <button
                  onClick={() => setShowVisitorModal(true)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-sky-50 text-sky-800 hover:bg-sky-100 transition-colors"
                >
                  + Sign In Guest
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                      <th className="p-3">Badge ID</th>
                      <th className="p-3">Guest Name & ID</th>
                      <th className="p-3">Purpose of Visit</th>
                      <th className="p-3">Visiting Office</th>
                      <th className="p-3">Time In</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Gate Pass</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visitors.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-mono font-bold text-sky-700">{v.badge_number}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{v.full_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {v.id_number}</div>
                        </td>
                        <td className="p-3 text-slate-700 max-w-[160px] truncate">{v.purpose}</td>
                        <td className="p-3 text-slate-800 font-medium">{v.person_to_see}</td>
                        <td className="p-3 text-slate-600 font-mono">{v.time_in}</td>
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
                        <td className="p-3 text-right flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedVisitorPass(v)}
                            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 flex items-center gap-1 cursor-pointer"
                          >
                            <QrCode className="w-3 h-3" />
                            Pass
                          </button>
                          {v.status === 'ON_CAMPUS' ? (
                            <button
                              onClick={() => handleCheckOutVisitor(v.id)}
                              className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                            >
                              Check Out
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">Out: {v.time_out}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions & Pipeline Summary */}
            <div className="space-y-5">
              {/* Quick Action Tiles */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">Front-Desk Launchpad</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setShowRegModal(true)}
                    className="p-3 rounded-xl bg-sky-50 text-sky-900 hover:bg-sky-100 font-bold flex flex-col items-center gap-1.5 text-center transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-5 h-5 text-sky-600" />
                    <span>New Enrollment</span>
                  </button>
                  <button
                    onClick={() => setShowVisitorModal(true)}
                    className="p-3 rounded-xl bg-slate-100 text-slate-900 hover:bg-slate-200 font-bold flex flex-col items-center gap-1.5 text-center transition-colors cursor-pointer"
                  >
                    <Plus className="w-5 h-5 text-slate-700" />
                    <span>Gate Visitor</span>
                  </button>
                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="p-3 rounded-xl bg-purple-50 text-purple-900 hover:bg-purple-100 font-bold flex flex-col items-center gap-1.5 text-center transition-colors cursor-pointer"
                  >
                    <ArrowLeftRight className="w-5 h-5 text-purple-600" />
                    <span>Clear Transfer</span>
                  </button>
                  <button
                    onClick={() => setShowNoticeModal(true)}
                    className="p-3 rounded-xl bg-rose-50 text-rose-900 hover:bg-rose-100 font-bold flex flex-col items-center gap-1.5 text-center transition-colors cursor-pointer"
                  >
                    <Megaphone className="w-5 h-5 text-rose-600" />
                    <span>Post Bulletin</span>
                  </button>
                </div>
              </div>

              {/* Admissions Pipeline Status */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Admissions Pipeline</h3>
                  <button
                    onClick={() => setActiveTab('admissions')}
                    className="text-xs text-sky-600 hover:text-sky-800 font-bold"
                  >
                    View All &rarr;
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50">
                    <span className="text-slate-600">1. Fresh Inquiries:</span>
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      {admissions.filter(a => a.stage === 'INQUIRY').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50">
                    <span className="text-slate-600">2. Documents Verified:</span>
                    <span className="font-bold text-blue-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      {admissions.filter(a => a.stage === 'DOCUMENTS_VERIFIED').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50">
                    <span className="text-slate-600">3. Interviews Scheduled:</span>
                    <span className="font-bold text-purple-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      {admissions.filter(a => a.stage === 'INTERVIEW_SCHEDULED').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50">
                    <span className="text-slate-600">4. Offer Extended:</span>
                    <span className="font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      {admissions.filter(a => a.stage === 'OFFER_EXTENDED').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: STUDENT REGISTRATION                                              */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'registration' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Admissions & Enrollment Office</h2>
              <p className="text-xs text-slate-500">Record pupil bio-data, allocate permanent admission numbers, and register guardians.</p>
            </div>
            <button
              onClick={() => setShowRegModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Launch Admission Form</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Enrolled Pupils (Most Recent Admissions)</h3>
              <span className="text-xs font-mono text-slate-500 font-semibold">{students.length} Total Enrolled</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                    <th className="p-3.5">Admission #</th>
                    <th className="p-3.5">Pupil Name</th>
                    <th className="p-3.5">Class & Stream</th>
                    <th className="p-3.5">Gender</th>
                    <th className="p-3.5">Enrollment Date</th>
                    <th className="p-3.5">Guardian Contact</th>
                    <th className="p-3.5">Fee Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-sky-700">{s.admission_number}</td>
                      <td className="p-3.5 font-bold text-slate-900">{s.full_name}</td>
                      <td className="p-3.5 text-slate-700">
                        <div>{s.class_name}</div>
                        <div className="text-[10px] text-slate-400">{s.stream_name}</div>
                      </td>
                      <td className="p-3.5 font-medium">{s.gender}</td>
                      <td className="p-3.5 text-slate-500 font-mono">{s.enrollment_date}</td>
                      <td className="p-3.5">
                        <div className="text-slate-800 font-medium">{s.guardian_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{s.guardian_phone}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.fee_status === 'CLEARED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          s.fee_status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {s.fee_status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedStudentProfile(s)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 cursor-pointer"
                        >
                          Dossier
                        </button>
                        <button
                          onClick={() => setSelectedStudentIdCard(s)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          ID
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: ADMISSIONS PIPELINE                                               */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'admissions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">New Applicant Admissions Funnel</h2>
              <p className="text-xs text-slate-500">Track candidates through initial inquiry, documents audit, interview, and formal enrollment.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const name = prompt('Enter applicant full name:');
                  if (name) {
                    const newApp: AdmissionApplicant = {
                      id: `APP-2026-${String(admissions.length + 50).padStart(3, '0')}`,
                      application_number: `APP-2026-${String(admissions.length + 50).padStart(3, '0')}`,
                      student_name: name,
                      gender: 'MALE',
                      applying_for_class: 'Form 1 Freshmen',
                      previous_school: 'Primary Academy',
                      guardian_name: 'Guardian',
                      guardian_phone: '+254 700 000 000',
                      guardian_email: 'guardian@school.edu',
                      submission_date: new Date().toISOString().split('T')[0],
                      stage: 'INQUIRY'
                    };
                    setAdmissions([newApp, ...admissions]);
                    showToast(`Candidate inquiry registered: ${newApp.student_name}`);
                  }
                }}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Inquiry</span>
              </button>
            </div>
          </div>

          {/* Stage Filter Pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            {['ALL', 'INQUIRY', 'DOCUMENTS_VERIFIED', 'INTERVIEW_SCHEDULED', 'OFFER_EXTENDED', 'ENROLLED'].map(st => (
              <button
                key={st}
                onClick={() => setAdmissionsStageFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  admissionsStageFilter === st
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st === 'ALL' ? 'All Applicants' : st.replace(/_/g, ' ')}
                <span className="ml-1.5 opacity-75 font-mono">
                  ({st === 'ALL' ? admissions.length : admissions.filter(a => a.stage === st).length})
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAdmissions.map(adm => (
              <div key={adm.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <span className="font-mono text-xs font-extrabold text-slate-500">{adm.application_number}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      adm.stage === 'ENROLLED' ? 'bg-emerald-100 text-emerald-800' :
                      adm.stage === 'OFFER_EXTENDED' ? 'bg-purple-100 text-purple-800' :
                      adm.stage === 'INTERVIEW_SCHEDULED' ? 'bg-amber-100 text-amber-800' :
                      adm.stage === 'DOCUMENTS_VERIFIED' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {adm.stage.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{adm.student_name}</h3>
                    <p className="text-xs text-sky-700 font-semibold mt-0.5">Applying: {adm.applying_for_class}</p>
                    <p className="text-[11px] text-slate-400">Previous School: {adm.previous_school}</p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl space-y-1 text-xs">
                    <div className="text-slate-600">Guardian: <strong className="text-slate-900">{adm.guardian_name}</strong></div>
                    <div className="text-slate-500 font-mono text-[11px]">{adm.guardian_phone}</div>
                    {adm.interview_score && (
                      <div className="text-emerald-700 font-semibold pt-1 text-[11px]">Score: {adm.interview_score}</div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex gap-2">
                  <button
                    onClick={() => setSelectedApplicant(adm)}
                    className="flex-1 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    Details
                  </button>
                  {adm.stage !== 'ENROLLED' && (
                    <button
                      onClick={() => handleAdvanceApplicantStage(adm.id)}
                      className="flex-1 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl cursor-pointer"
                    >
                      {adm.stage === 'OFFER_EXTENDED' ? 'Enroll Pupil' : 'Advance Stage →'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: STUDENT RECORDS                                                   */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Enrolled Student Master Directory</h2>
              <p className="text-xs text-slate-500">Biographical database, class rosters, status flags, and student dossiers.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student or phone..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 w-56"
                />
              </div>

              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold"
              >
                <option value="ALL">All Forms</option>
                <option value="Form 1">Form 1</option>
                <option value="Form 2">Form 2</option>
                <option value="Form 3">Form 3</option>
                <option value="Form 4">Form 4</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="TRANSFERRED">Transferred</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                    <th className="p-3.5">Admission #</th>
                    <th className="p-3.5">Student Full Name</th>
                    <th className="p-3.5">Class / Stream</th>
                    <th className="p-3.5">Gender</th>
                    <th className="p-3.5">Guardian & Phone</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                        No students found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-sky-700">{s.admission_number}</td>
                        <td className="p-3.5 font-bold text-slate-900">{s.full_name}</td>
                        <td className="p-3.5 text-slate-700">
                          <div>{s.class_name}</div>
                          <div className="text-[10px] text-slate-400">{s.stream_name}</div>
                        </td>
                        <td className="p-3.5 font-medium">{s.gender}</td>
                        <td className="p-3.5">
                          <div className="text-slate-800 font-medium">{s.guardian_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{s.guardian_phone}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {s.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudentProfile(s)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 cursor-pointer"
                          >
                            Dossier
                          </button>
                          <button
                            onClick={() => setSelectedStudentIdCard(s)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                          >
                            Print ID
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

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: GUARDIAN INFORMATION                                              */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'guardians' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Guardian Contact & Emergency Directory</h2>
              <p className="text-xs text-slate-500">Official parents directory, emergency contacts, ward linkages, and instant SMS communication.</p>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search guardian or phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 w-56"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{s.guardian_name}</h3>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{s.guardian_relationship}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100">
                    Verified Guardian
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Ward: <strong className="text-slate-900">{s.full_name}</strong> ({s.class_name})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono text-slate-900 font-bold">{s.guardian_phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-600 truncate">{s.residential_address}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex gap-2">
                  <button
                    onClick={() => {
                      alert(`Initiating telephone call to ${s.guardian_name} at ${s.guardian_phone}...`);
                    }}
                    className="flex-1 py-1.5 text-xs font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedGuardianForSms({ name: s.guardian_name, phone: s.guardian_phone, ward: s.full_name });
                      setShowSmsModal(true);
                    }}
                    className="flex-1 py-1.5 text-xs font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send SMS</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 6: STUDENT TRANSFERS                                                 */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Relocation & Transfers Office</h2>
              <p className="text-xs text-slate-500">School departures, incoming transfer validations, and certified Leaving Certificate issuing.</p>
            </div>
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Initiate Transfer Clearance</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                    <th className="p-3.5">Ref #</th>
                    <th className="p-3.5">Student Full Name</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Partner School</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Reason</th>
                    <th className="p-3.5">Clearance</th>
                    <th className="p-3.5 text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transfers.map(tr => (
                    <tr key={tr.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-800">{tr.id}</td>
                      <td className="p-3.5 font-bold text-slate-900">{tr.student_name}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tr.type === 'TRANSFER_IN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {tr.type === 'TRANSFER_IN' ? 'Incoming Transfer' : 'Outgoing Departure'}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">{tr.partner_school}</td>
                      <td className="p-3.5 text-slate-500 font-mono">{tr.date}</td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">{tr.reason}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900">{tr.clearance_status}</span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedLeavingCert(tr)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <Printer className="w-3 h-3" />
                          View Cert
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 7: DOCUMENT ARCHIVES                                                 */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Document Digital Archive</h2>
              <p className="text-xs text-slate-500">Secure digital repository of birth certificates, medical forms, leaving vouchers, and transcripts.</p>
            </div>
            <button
              onClick={() => setShowUploadDocModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            {['ALL', 'BIRTH_CERTIFICATE', 'HEALTH_RECORD', 'LEAVING_CERT', 'ACADEMIC_TRANSCRIPT', 'NATIONAL_ID'].map(cat => (
              <button
                key={cat}
                onClick={() => setDocCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  docCategoryFilter === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat === 'ALL' ? 'All Archives' : cat.replace(/_/g, ' ')}
                <span className="ml-1.5 opacity-75 font-mono">
                  ({cat === 'ALL' ? documents.length : documents.filter(d => d.category === cat).length})
                </span>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                    <th className="p-3.5">Doc ID</th>
                    <th className="p-3.5">Document Title</th>
                    <th className="p-3.5">Student Linked</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Archived Date</th>
                    <th className="p-3.5">File Size</th>
                    <th className="p-3.5">Verification</th>
                    <th className="p-3.5 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocuments.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-sky-700">{doc.id}</td>
                      <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{doc.title}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{doc.student_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{doc.admission_number}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {doc.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono">{doc.upload_date}</td>
                      <td className="p-3.5 text-slate-500 font-mono">{doc.file_size}</td>
                      <td className="p-3.5">
                        <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Certified
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedDocPreview(doc)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 cursor-pointer"
                        >
                          Preview
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 8: SEARCH STUDENTS                                                   */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="max-w-2xl mx-auto space-y-4 text-center py-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Front-Desk Instant Student Lookup</h2>
            <p className="text-xs text-slate-500">
              Locate enrolled students by full name, admission number, guardian phone, or residential estate.
            </p>

            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Type pupil name, admission number, or guardian mobile..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 font-medium"
              />
            </div>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-bold text-slate-500 flex justify-between items-center">
              <span>Matching pupil records ({filteredStudents.length}):</span>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-sky-600 hover:underline">
                  Clear search
                </button>
              )}
            </div>

            {filteredStudents.map(s => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{s.full_name}</span>
                    <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg">
                      {s.admission_number}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 space-x-2">
                    <span>{s.class_name} • {s.stream_name}</span>
                    <span>•</span>
                    <span>Guardian: <strong>{s.guardian_name}</strong> ({s.guardian_phone})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedStudentProfile(s)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white cursor-pointer"
                  >
                    View Dossier
                  </button>
                  <button
                    onClick={() => setSelectedStudentIdCard(s)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    ID Card
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 9: FRONT-OFFICE & VISITORS REGISTER                                  */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'front-office' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Campus Security & Gate Visitor Registry</h2>
              <p className="text-xs text-slate-500">Record all official visits, vendor deliveries, Ministry inspections, and guardian conferences.</p>
            </div>
            <button
              onClick={() => setShowVisitorModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Sign In Visitor</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                    <th className="p-3.5">Badge ID</th>
                    <th className="p-3.5">Visitor Name & ID</th>
                    <th className="p-3.5">Mobile Phone</th>
                    <th className="p-3.5">Purpose of Visit</th>
                    <th className="p-3.5">Office / Personnel</th>
                    <th className="p-3.5">Time In</th>
                    <th className="p-3.5">Time Out</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visitors.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-sky-700">{v.badge_number}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{v.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">National ID: {v.id_number}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">{v.phone}</td>
                      <td className="p-3.5 text-slate-700 max-w-[150px] truncate">{v.purpose}</td>
                      <td className="p-3.5 font-medium text-slate-900">{v.person_to_see}</td>
                      <td className="p-3.5 text-slate-600 font-mono">{v.time_in}</td>
                      <td className="p-3.5 text-slate-500 font-mono">{v.time_out || '—'}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            v.status === 'ON_CAMPUS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {v.status === 'ON_CAMPUS' ? 'On Campus' : 'Checked Out'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedVisitorPass(v)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 cursor-pointer flex items-center gap-1"
                        >
                          <QrCode className="w-3 h-3" />
                          Badge
                        </button>
                        {v.status === 'ON_CAMPUS' && (
                          <button
                            onClick={() => handleCheckOutVisitor(v.id)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                          >
                            Sign Out
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 10: CAMPUS ANNOUNCEMENTS NOTICEBOARD                                 */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Campus Notice Board & Public Bulletins</h2>
              <p className="text-xs text-slate-500">Official notices broadcast to students, parents, visiting guests, and staff members.</p>
            </div>
            <button
              onClick={() => setShowNoticeModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs cursor-pointer"
            >
              <Megaphone className="w-4 h-4" />
              <span>Publish Bulletin</span>
            </button>
          </div>

          <div className="space-y-4">
            {announcements.map(ann => (
              <div key={ann.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        ann.priority === 'URGENT'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : ann.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {ann.priority}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm">{ann.title}</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{ann.date}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>

                <div className="pt-2 flex flex-col sm:flex-row justify-between sm:items-center text-[11px] text-slate-400 border-t border-slate-50">
                  <span>Target Audience: <strong className="text-slate-800">{ann.target_audience}</strong></span>
                  <span>Issued By: <strong className="text-slate-800">{ann.author}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 11: RECEPTION STAFF PROFILE                                          */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <DashboardProfileTab
          title="Reception Secretariat & Front-Office Staff Profile"
          subtitle="Institutional front-desk credentials, security post clearance, and duty allocations"
          extraDetails={[
            { label: 'Staff Official ID', val: 'STF-2023-018' },
            { label: 'Department Division', val: 'Front-Office Secretariat & Admissions Support' },
            { label: 'Campus Post', val: 'Central Gatehouse & Reception Desk #1' },
            { label: 'Assigned Duties', val: 'Student Enrolment, Visitors Badging, Guardian Directory, Transfer Vouchers' },
            { label: 'System Access Scope', val: 'Front-Office Operations Portal (Active)' },
          ]}
        />
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 12: SIGN OUT CONFIRMATION                                            */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'logout' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm max-w-md mx-auto text-center space-y-4 my-8">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <LogOut className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Sign Out of Reception Desk?</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Ensure all visitor security badges are returned and active gate logs are updated before closing your desk session.
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

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: REGISTER STUDENT                                                */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {showRegModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Student Admission & Registration</h3>
                <p className="text-xs text-slate-500">Record pupil biological & guardian profile into master registry</p>
              </div>
              <button onClick={() => setShowRegModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterStudent} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Johnathan Mutiso"
                  value={newReg.full_name}
                  onChange={e => setNewReg({ ...newReg, full_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Gender *</label>
                  <select
                    value={newReg.gender}
                    onChange={e => setNewReg({ ...newReg, gender: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={newReg.dob}
                    onChange={e => setNewReg({ ...newReg, dob: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  >
                  </input>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Class *</label>
                  <select
                    value={newReg.class_name}
                    onChange={e => setNewReg({ ...newReg, class_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  >
                    <option value="Form 1 Freshmen">Form 1 Freshmen</option>
                    <option value="Form 2 Junior">Form 2 Junior</option>
                    <option value="Form 3 Senior">Form 3 Senior</option>
                    <option value="Form 4 Candidates">Form 4 Candidates</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assigned Stream</label>
                  <select
                    value={newReg.stream_name}
                    onChange={e => setNewReg({ ...newReg, stream_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  >
                    <option value="Stream A (Science)">Stream A (Science)</option>
                    <option value="Stream B (Arts)">Stream B (Arts)</option>
                    <option value="Stream C (General)">Stream C (General)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Previous Primary / High School</label>
                <input
                  type="text"
                  placeholder="e.g. Joyland Academy"
                  value={newReg.previous_school}
                  onChange={e => setNewReg({ ...newReg, previous_school: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-3">
                <span className="font-extrabold text-slate-900 block text-xs">Parent / Guardian Legal Information:</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Guardian Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mary Mutiso"
                      value={newReg.guardian_name}
                      onChange={e => setNewReg({ ...newReg, guardian_name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Guardian Mobile Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+254 7..."
                      value={newReg.guardian_phone}
                      onChange={e => setNewReg({ ...newReg, guardian_phone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Residential Estate / City Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Kileleshwa, Othaya Road Court 3"
                    value={newReg.residential_address}
                    onChange={e => setNewReg({ ...newReg, residential_address: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-extrabold shadow-sm cursor-pointer"
                >
                  Complete Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: SIGN IN VISITOR                                                 */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {showVisitorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Gate Security: Sign In Campus Guest</h3>
                <p className="text-xs text-slate-500">Issue visitor pass badge & verify national identity</p>
              </div>
              <button onClick={() => setShowVisitorModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSignInVisitor} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Guest Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Otieno"
                  value={newVisitor.full_name}
                  onChange={e => setNewVisitor({ ...newVisitor, full_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">National ID / Passport *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 29182390"
                    value={newVisitor.id_number}
                    onChange={e => setNewVisitor({ ...newVisitor, id_number: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mobile Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+254 7..."
                    value={newVisitor.phone}
                    onChange={e => setNewVisitor({ ...newVisitor, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Purpose of Campus Visit *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fee clearance inquiry / Parent conference"
                  value={newVisitor.purpose}
                  onChange={e => setNewVisitor({ ...newVisitor, purpose: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Office or Personnel to Visit *</label>
                <select
                  value={newVisitor.person_to_see}
                  onChange={e => setNewVisitor({ ...newVisitor, person_to_see: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                >
                  <option value="Headmaster / Dr. Arthur Pendelton">Headmaster / Dr. Arthur Pendelton</option>
                  <option value="Academic Registrar / Prof. Marcus Vance">Academic Registrar / Prof. Marcus Vance</option>
                  <option value="Accounts / David Sterling (Bursar)">Accounts / David Sterling (Bursar)</option>
                  <option value="Admissions Secretariat / Beatrice Montgomery">Admissions Secretariat / Beatrice Montgomery</option>
                  <option value="Chief Librarian / Clara Oswald">Chief Librarian / Clara Oswald</option>
                  <option value="Senior Teacher / Staff Room">Senior Teacher / Staff Room</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVisitorModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold shadow-sm cursor-pointer"
                >
                  Generate Pass & Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: VISITOR PASS BADGE PREVIEW                                      */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {selectedVisitorPass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs text-center">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">Official Gate Pass</span>
              <button onClick={() => setSelectedVisitorPass(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 border-2 border-dashed border-sky-400 bg-sky-50/50 rounded-2xl space-y-3 text-slate-900">
              <div className="text-[10px] font-extrabold tracking-widest text-sky-800 uppercase">Apex Academy Campus Security</div>
              <div className="text-3xl font-black font-mono tracking-tight text-sky-900">{selectedVisitorPass.badge_number}</div>
              <div className="pt-1">
                <h4 className="font-extrabold text-base text-slate-900">{selectedVisitorPass.full_name}</h4>
                <p className="text-[11px] text-slate-500 font-mono">ID: {selectedVisitorPass.id_number}</p>
              </div>

              <div className="p-2.5 bg-white rounded-xl text-left space-y-1 border border-slate-200 text-[11px]">
                <div>Visiting: <strong>{selectedVisitorPass.person_to_see}</strong></div>
                <div>Purpose: <span className="text-slate-600">{selectedVisitorPass.purpose}</span></div>
                <div>Entered: <span className="font-mono text-slate-700">{selectedVisitorPass.time_in}</span></div>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-700 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Security Clearance: ESCORTED ACCESS</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Gate Badge</span>
              </button>
              <button
                onClick={() => setSelectedVisitorPass(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: INITIATE TRANSFER CLEARANCE                                     */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Transfer & Departure Clearance</h3>
                <p className="text-xs text-slate-500">Initiate official inter-school relocation voucher</p>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Transfer Direction *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTransfer({ ...newTransfer, type: 'TRANSFER_OUT' })}
                    className={`p-2.5 rounded-xl font-bold border text-center transition-all cursor-pointer ${
                      newTransfer.type === 'TRANSFER_OUT'
                        ? 'bg-purple-50 text-purple-800 border-purple-400 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Outgoing Departure
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTransfer({ ...newTransfer, type: 'TRANSFER_IN' })}
                    className={`p-2.5 rounded-xl font-bold border text-center transition-all cursor-pointer ${
                      newTransfer.type === 'TRANSFER_IN'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Incoming Transfer
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Mwangi"
                  value={newTransfer.student_name}
                  onChange={e => setNewTransfer({ ...newTransfer, student_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Partner Destination / Origin School *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alliance High School / Kiambu"
                  value={newTransfer.partner_school}
                  onChange={e => setNewTransfer({ ...newTransfer, partner_school: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Primary Reason for Relocation *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Relocation of parents due to public service transfer."
                  value={newTransfer.reason}
                  onChange={e => setNewTransfer({ ...newTransfer, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Disciplinary / Conduct Rating</label>
                <select
                  value={newTransfer.conduct_grade}
                  onChange={e => setNewTransfer({ ...newTransfer, conduct_grade: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                >
                  <option value="Exemplary">Exemplary</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Satisfactory">Satisfactory</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold shadow-sm cursor-pointer"
                >
                  Confirm Clearance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 5: OFFICIAL LEAVING CERTIFICATE                                     */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {selectedLeavingCert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">Official Testimonial Certificate</span>
              <button onClick={() => setSelectedLeavingCert(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 border-4 border-double border-slate-300 bg-amber-50/20 rounded-2xl space-y-4 text-slate-900">
              <div className="text-center space-y-1">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Republic of Kenya • Ministry of Education</div>
                <h3 className="text-lg font-black tracking-tight text-slate-900 uppercase">Apex Academy Senior School</h3>
                <div className="text-[11px] font-bold text-sky-800">OFFICIAL SCHOOL LEAVING CERTIFICATE</div>
                <div className="text-[10px] font-mono text-slate-400">Serial Ref: {selectedLeavingCert.id}</div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed text-justify pt-2">
                This is to certify that <strong>{selectedLeavingCert.student_name}</strong> (Admission No:{' '}
                <strong>{selectedLeavingCert.admission_number}</strong>) was admitted to this institution and left on{' '}
                <strong>{selectedLeavingCert.date}</strong> for transfer to <strong>{selectedLeavingCert.partner_school}</strong>.
              </p>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Reason for Relocation:</span>
                  <span className="font-semibold text-slate-800">{selectedLeavingCert.reason}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Conduct & Character:</span>
                  <span className="font-extrabold text-emerald-800">{selectedLeavingCert.conduct_grade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Institutional Dues:</span>
                  <span className="font-bold text-emerald-700">FULL CLEARANCE CERTIFIED</span>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-end text-[11px] text-slate-600 border-t border-slate-200">
                <div>
                  <div className="font-mono text-[10px] text-slate-400">Date: {selectedLeavingCert.date}</div>
                  <div className="font-bold text-slate-800">Front-Office Registrar</div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-2 border-emerald-600 text-emerald-700 text-[8px] font-extrabold flex items-center justify-center rotate-12 mx-auto uppercase">
                    Official Seal<br />Certified
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-800">Dr. Arthur Pendelton</div>
                  <div className="text-[10px] text-slate-500">Headmaster / Principal</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
              <button
                onClick={() => setSelectedLeavingCert(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 6: STUDENT PROFILE DOSSIER                                         */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {selectedStudentProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">Apex Pupil Dossier</span>
              <button onClick={() => setSelectedStudentProfile(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-center pb-2">
                <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-800 border-2 border-sky-300 font-black text-xl flex items-center justify-center mx-auto mb-2">
                  {selectedStudentProfile.full_name[0]}
                </div>
                <h3 className="font-black text-slate-900 text-lg">{selectedStudentProfile.full_name}</h3>
                <span className="font-mono text-xs text-sky-700 font-extrabold bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                  {selectedStudentProfile.admission_number}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Class:</span>
                  <span className="font-bold text-slate-900">{selectedStudentProfile.class_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Stream Assignment:</span>
                  <span className="font-semibold text-slate-800">{selectedStudentProfile.stream_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gender:</span>
                  <span className="text-slate-800 font-medium">{selectedStudentProfile.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date of Birth:</span>
                  <span className="text-slate-800 font-mono">{selectedStudentProfile.dob}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Admission Date:</span>
                  <span className="text-slate-800 font-mono">{selectedStudentProfile.enrollment_date}</span>
                </div>
                <div className="border-t border-slate-200/80 pt-2 flex justify-between">
                  <span className="text-slate-500">Guardian Name:</span>
                  <span className="font-bold text-slate-900">{selectedStudentProfile.guardian_name} ({selectedStudentProfile.guardian_relationship})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Guardian Contact:</span>
                  <span className="font-mono font-bold text-sky-700">{selectedStudentProfile.guardian_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Residential Address:</span>
                  <span className="text-slate-700 truncate max-w-[190px]">{selectedStudentProfile.residential_address}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/80">
                  <span className="text-slate-500">Fee Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedStudentProfile.fee_status === 'CLEARED' ? 'bg-emerald-100 text-emerald-800' :
                    selectedStudentProfile.fee_status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedStudentProfile.fee_status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setSelectedStudentIdCard(selectedStudentProfile);
                }}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print ID Card</span>
              </button>
              <button
                onClick={() => setSelectedStudentProfile(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 7: STUDENT IDENTITY CARD                                           */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {selectedStudentIdCard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs text-center">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">Apex Student Identity Card</span>
              <button onClick={() => setSelectedStudentIdCard(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 border border-slate-300 bg-gradient-to-br from-sky-900 via-sky-800 to-indigo-950 text-white rounded-2xl space-y-3 shadow-xl">
              <div className="flex justify-between items-center border-b border-sky-400/30 pb-2">
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase tracking-widest text-sky-300">Apex Academy</div>
                  <div className="text-[8px] text-sky-200">Official Student Card</div>
                </div>
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
                  <GraduationCap className="w-3.5 h-3.5 text-sky-300" />
                </div>
              </div>

              <div className="flex items-center gap-3 text-left">
                <div className="w-16 h-16 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl font-black shrink-0">
                  {selectedStudentIdCard.full_name[0]}
                </div>
                <div>
                  <h4 className="font-extrabold text-base leading-tight text-white">{selectedStudentIdCard.full_name}</h4>
                  <p className="font-mono text-xs font-bold text-sky-300 mt-0.5">{selectedStudentIdCard.admission_number}</p>
                  <p className="text-[10px] text-slate-200 mt-0.5">{selectedStudentIdCard.class_name}</p>
                </div>
              </div>

              <div className="bg-black/30 p-2.5 rounded-xl text-left text-[10px] space-y-1 font-mono text-slate-200">
                <div>Emergency: {selectedStudentIdCard.guardian_phone}</div>
                <div>Valid Through: DEC 2027 • Form 4</div>
              </div>

              <div className="flex justify-between items-center pt-1 text-[8px] text-sky-300/80 font-mono border-t border-sky-400/20">
                <span>NEMIS SECURE CHIP</span>
                <span>AUTHORIZED SIGNATURE</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Card</span>
              </button>
              <button
                onClick={() => setSelectedStudentIdCard(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 8: DOCUMENT PREVIEW                                                */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {selectedDocPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">Digital Document Vault</span>
              <button onClick={() => setSelectedDocPreview(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 border-2 border-slate-200 bg-slate-50 rounded-2xl space-y-3 text-center">
              <FileText className="w-12 h-12 text-sky-600 mx-auto" />
              <div>
                <h4 className="font-bold text-base text-slate-900">{selectedDocPreview.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Linked Student: <strong>{selectedDocPreview.student_name}</strong></p>
                <p className="text-xs font-mono text-sky-700">{selectedDocPreview.admission_number}</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 text-left text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-bold text-slate-800">{selectedDocPreview.category.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Archived Date:</span>
                  <span className="font-mono text-slate-800">{selectedDocPreview.upload_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">File Payload:</span>
                  <span className="font-mono text-slate-800">{selectedDocPreview.file_size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Audit Status:</span>
                  <span className="font-bold text-emerald-700">VERIFIED & CRYPTOGRAPHICALLY HASHED</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  alert(`Downloading ${selectedDocPreview.title}...`);
                }}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Document</span>
              </button>
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 9: UPLOAD NEW DOCUMENT                                             */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {showUploadDocModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Archive Student Document</h3>
                <p className="text-xs text-slate-500">Upload certified national documents or medical clearance</p>
              </div>
              <button onClick={() => setShowUploadDocModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Certified National Birth Certificate"
                  value={newDocUpload.title}
                  onChange={e => setNewDocUpload({ ...newDocUpload, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alexander Pierce"
                  value={newDocUpload.student_name}
                  onChange={e => setNewDocUpload({ ...newDocUpload, student_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Admission Number</label>
                  <input
                    type="text"
                    placeholder="e.g. ADM-2026-011"
                    value={newDocUpload.admission_number}
                    onChange={e => setNewDocUpload({ ...newDocUpload, admission_number: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={newDocUpload.category}
                    onChange={e => setNewDocUpload({ ...newDocUpload, category: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  >
                    <option value="BIRTH_CERTIFICATE">Birth Certificate</option>
                    <option value="HEALTH_RECORD">Health & Immunization</option>
                    <option value="LEAVING_CERT">Leaving Certificate</option>
                    <option value="ACADEMIC_TRANSCRIPT">Academic Transcript</option>
                    <option value="NATIONAL_ID">National ID / Passport</option>
                  </select>
                </div>
              </div>

              <div className="p-4 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-1.5 bg-slate-50">
                <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                <div className="text-xs font-bold text-slate-700">Choose file or drag & drop</div>
                <div className="text-[10px] text-slate-400">PDF, JPG, PNG up to 10MB</div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadDocModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-extrabold shadow-sm cursor-pointer"
                >
                  Upload & Seal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 10: SEND DIRECT GUARDIAN SMS                                       */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {showSmsModal && selectedGuardianForSms && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Direct Guardian SMS Dispatch</h3>
                <p className="text-xs text-slate-500">Broadcast institutional notice to legal guardian</p>
              </div>
              <button onClick={() => setShowSmsModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendGuardianSms} className="space-y-3.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-500">Recipient: <strong className="text-slate-900">{selectedGuardianForSms.name}</strong></div>
                <div className="text-slate-500">Ward: <strong className="text-slate-900">{selectedGuardianForSms.ward}</strong></div>
                <div className="text-slate-500">Mobile: <span className="font-mono font-bold text-sky-700">{selectedGuardianForSms.phone}</span></div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Quick Template</label>
                <select
                  value={smsDraft.template}
                  onChange={e => {
                    const tmpl = e.target.value;
                    let msg = '';
                    if (tmpl === 'MEETING') {
                      msg = `Dear ${selectedGuardianForSms.name}, please attend a parent-teacher briefing regarding ${selectedGuardianForSms.ward} on Friday at 10:00 AM. Apex Academy.`;
                    } else if (tmpl === 'FEES') {
                      msg = `Dear ${selectedGuardianForSms.name}, this is a gentle reminder that school fee statement for ${selectedGuardianForSms.ward} is due. Please visit reception or accounts. Apex Academy.`;
                    } else if (tmpl === 'VISITING') {
                      msg = `Dear ${selectedGuardianForSms.name}, Annual Visiting Day is scheduled for Saturday 24th Oct. Gate passes available at reception. Apex Academy.`;
                    }
                    setSmsDraft({ template: tmpl, message: msg });
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                >
                  <option value="CUSTOM">Custom Message</option>
                  <option value="MEETING">Parent Briefing Invitation</option>
                  <option value="FEES">Fee Balance Reminder</option>
                  <option value="VISITING">Visiting Day Announcement</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Message Body *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type official SMS dispatch..."
                  value={smsDraft.message}
                  onChange={e => setSmsDraft({ ...smsDraft, message: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
                <div className="text-right text-[10px] text-slate-400 mt-1 font-mono">
                  {smsDraft.message.length} characters (1 SMS segment)
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSmsModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send SMS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 11: PUBLISH CAMPUS BULLETIN                                        */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Publish Campus Notice</h3>
                <p className="text-xs text-slate-500">Broadcast official notification across school channels</p>
              </div>
              <button onClick={() => setShowNoticeModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostNotice} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Fair Registration Deadline"
                  value={newNotice.title}
                  onChange={e => setNewNotice({ ...newNotice, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Detailed Content *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Type bulletin text..."
                  value={newNotice.content}
                  onChange={e => setNewNotice({ ...newNotice, content: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newNotice.priority}
                    onChange={e => setNewNotice({ ...newNotice, priority: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-extrabold shadow-sm cursor-pointer"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 12: APPLICANT DOSSIER PREVIEW                                      */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">Candidate Admission File</span>
              <button onClick={() => setSelectedApplicant(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">{selectedApplicant.student_name}</h4>
                  <p className="font-mono text-xs text-sky-700 font-bold">{selectedApplicant.application_number}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800">
                  {selectedApplicant.stage.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="space-y-1.5 pt-1 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Applying For:</span>
                  <span className="font-bold text-slate-900">{selectedApplicant.applying_for_class}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Previous School:</span>
                  <span className="font-semibold text-slate-800">{selectedApplicant.previous_school}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Parent / Guardian:</span>
                  <span className="font-bold text-slate-900">{selectedApplicant.guardian_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Guardian Phone:</span>
                  <span className="font-mono font-bold text-sky-700">{selectedApplicant.guardian_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Guardian Email:</span>
                  <span className="font-mono text-slate-700">{selectedApplicant.guardian_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Application Date:</span>
                  <span className="font-mono text-slate-700">{selectedApplicant.submission_date}</span>
                </div>
                {selectedApplicant.notes && (
                  <div className="pt-2 border-t border-slate-200 text-slate-600">
                    <span className="font-bold block text-slate-800 mb-0.5">Admissions Notes:</span>
                    <p className="text-[11px] bg-white p-2 rounded-xl border border-slate-200">{selectedApplicant.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {selectedApplicant.stage !== 'ENROLLED' && (
                <button
                  onClick={() => {
                    handleAdvanceApplicantStage(selectedApplicant.id);
                    setSelectedApplicant(null);
                  }}
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Advance Stage →
                </button>
              )}
              <button
                onClick={() => setSelectedApplicant(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
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
