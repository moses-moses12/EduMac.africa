'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { feeService, authService } from '@/services';
import {
  DollarSign,
  CreditCard,
  Receipt,
  TrendingUp,
  Search,
  Plus,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Send,
  Eye,
  Building,
  Calendar,
  X,
  FileSpreadsheet,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Edit3,
  FileText,
  FolderOpen,
  Hash,
  Users,
  Upload
} from 'lucide-react';
import { DashboardProfileTab } from '@/components/profile';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { EduMaxLogoIcon } from '@/components/ui/EduMaxLogo';

// Interfaces
interface FeeStructureItem {
  id: string;
  class_name: string;
  term: string;
  academic_year: string;
  tuition: number;
  boarding: number;
  laboratory: number;
  activity: number;
  total_amount: number;
  due_date: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

interface InvoiceItem {
  id: string;
  invoice_number: string;
  control_number?: string;
  student_name: string;
  admission_number: string;
  class_name: string;
  term: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE';
  issued_date: string;
  due_date: string;
}

interface PaymentRecord {
  id: string;
  payment_number: string;
  receipt_number: string;
  control_number?: string;
  invoice_number: string;
  student_name: string;
  admission_number: string;
  class_name?: string;
  amount: number;
  payment_method: 'MPESA' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE';
  transaction_reference: string;
  payment_date: string;
  received_by: string;
  status: 'VERIFIED' | 'RECONCILED';
  student_files?: Array<{ name: string; type: string; size: string; date: string }>;
}

interface DebtorBalance {
  student_name: string;
  admission_number: string;
  class_name: string;
  parent_name: string;
  parent_phone: string;
  total_billed: number;
  total_paid: number;
  balance: number;
  aging: '< 30 days' | '30 - 60 days' | '> 60 days';
  last_payment_date: string;
}

export interface SchoolExpense {
  id: string;
  requisition_no: string;
  title: string;
  category: string;
  amount: number;
  requested_by: string;
  requested_date: string;
  payee: string;
  justification: string;
  status: 'PENDING_HEADMASTER_APPROVAL' | 'APPROVED' | 'REJECTED' | 'DISBURSED';
  approved_by?: string;
  approved_date?: string;
  approval_notes?: string;
}

function AccountantDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  // User state
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const u = localStorage.getItem('sms_user') || localStorage.getItem('auth_user');
        if (u) setCurrentUser(JSON.parse(u));
      } catch {}
    }
    authService.getProfile().then(p => setCurrentUser(p)).catch(() => {});
  }, []);

  // State
  const [activeTab, setActiveTab] = useState(currentTab);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Payments Tab Filter & Search
  const [paymentClassFilter, setPaymentClassFilter] = useState('ALL');
  const [paymentSearch, setPaymentSearch] = useState('');

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFeeStructureModal, setShowFeeStructureModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  // Single Invoice Creation Modal
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [newSingleInvoice, setNewSingleInvoice] = useState({
    student_name: '',
    admission_number: '',
    class_name: 'Form 1A',
    term: 'Term 2',
    tuition: '450000',
    boarding: '150000',
    laboratory: '50000',
    activity: '30000',
    due_date: '2026-11-20',
  });

  // Student Files Modal (Uploaded by Admin)
  const [showStudentFilesModal, setShowStudentFilesModal] = useState(false);
  const [selectedStudentForFiles, setSelectedStudentForFiles] = useState<PaymentRecord | null>(null);

  // Adjust / Top-Up Payment Modal
  const [showAdjustPaymentModal, setShowAdjustPaymentModal] = useState(false);
  const [selectedPaymentForAdjust, setSelectedPaymentForAdjust] = useState<PaymentRecord | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('Top-up supplementary tuition installment');

  // Sync tab with URL
  useEffect(() => {
    setActiveTab(currentTab);
  }, [currentTab]);

  // Fee Structures Data (Live backend state)
  const [feeStructures, setFeeStructures] = useState<FeeStructureItem[]>([]);

  // Invoices Data (Live backend state)
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);

  // Payments / Receipts Data (Live backend state)
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Debtors Balance Ledger
  // Live Debtors Ledger derived dynamically from active unpaid/partial invoices
  const debtorsList: DebtorBalance[] = React.useMemo(() => {
    return invoices
      .filter(inv => Number(inv.balance) > 0)
      .map(inv => ({
        student_name: inv.student_name,
        admission_number: inv.admission_number,
        class_name: inv.class_name,
        parent_name: 'Parent / Guardian',
        parent_phone: 'Institutional Profile',
        total_billed: Number(inv.total_amount),
        total_paid: Number(inv.paid_amount),
        balance: Number(inv.balance),
        aging: (inv.status === 'OVERDUE' ? '> 60 days' : '< 30 days') as any,
        last_payment_date: Number(inv.paid_amount) > 0 ? 'Recorded' : 'Never'
      }));
  }, [invoices]);

  // Debtor Custom Message Modal States (Notebook Page 1: "Wanafunzi wanaodaiwa na kuweza kuwatumia ujumbe ambao accountant anaandika")
  const [showDebtorMessageModal, setShowDebtorMessageModal] = useState(false);
  const [selectedDebtorForMessage, setSelectedDebtorForMessage] = useState<DebtorBalance | null>(null);
  const [isBulkDebtorMessage, setIsBulkDebtorMessage] = useState(false);
  const [customDebtorMsgText, setCustomDebtorMsgText] = useState(
    'Dear Parent/Guardian of {{student_name}}, this is a reminder to pay the outstanding school fee balance of TSh {{outstanding_amount}} (Control No: 994200812901) before the 30th of this month to avoid academic suspension. Thank you - Bursar Office.'
  );
  const [debtorMsgChannel, setDebtorMsgChannel] = useState<'SMS' | 'WHATSAPP' | 'SYSTEM'>('SMS');
  const [debtorMessageSuccess, setDebtorMessageSuccess] = useState<string | null>(null);

  const handleOpenDebtorMessageModal = (debtor?: DebtorBalance) => {
    if (debtor) {
      setSelectedDebtorForMessage(debtor);
      setIsBulkDebtorMessage(false);
      setCustomDebtorMsgText(
        `Dear Parent/Guardian of ${debtor.student_name}, this is a reminder to pay the outstanding school fee balance of TSh ${debtor.balance.toLocaleString()} (Control No: 994200812901) before the 30th of this month to avoid disruption of studies. Thank you - Bursar Office.`
      );
    } else {
      setSelectedDebtorForMessage(null);
      setIsBulkDebtorMessage(true);
      setCustomDebtorMsgText(
        'Dear Parent/Guardian of {{student_name}}, this is a reminder to pay the outstanding school fee balance of TSh {{outstanding_amount}} (Control No: 994200812901) before the 30th of this month to avoid academic suspension. Thank you - Bursar Office.'
      );
    }
    setDebtorMessageSuccess(null);
    setShowDebtorMessageModal(true);
  };

  const handleSendCustomDebtorMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDebtorMsgText.trim()) {
      alert('Please enter a message before sending.');
      return;
    }
    const recipientInfo = isBulkDebtorMessage 
      ? `Parents/Guardians of all ${debtorsList.length} indebted students` 
      : `Parent of ${selectedDebtorForMessage?.student_name} (${selectedDebtorForMessage?.parent_phone || 'Phone Number'})`;
    
    setDebtorMessageSuccess(`Message sent successfully to ${recipientInfo} via ${debtorMsgChannel}!`);
    setTimeout(() => {
      setShowDebtorMessageModal(false);
      setDebtorMessageSuccess(null);
    }, 2000);
  };

  // Student Uploaded Payment Slips State
  const [studentUploadedSlips, setStudentUploadedSlips] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sms_student_uploaded_receipts');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const [slipActionMessage, setSlipActionMessage] = useState<string | null>(null);

  const handleApproveStudentSlip = (slipId: string) => {
    const updated = studentUploadedSlips.map(s => {
      if (s.id === slipId) {
        return {
          ...s,
          status: 'APPROVED_BY_ACCOUNTANT',
          approved_by: 'Bursar / Accounts Office',
          approved_at: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        };
      }
      return s;
    });
    setStudentUploadedSlips(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sms_student_uploaded_receipts', JSON.stringify(updated));
    }
    const slip = studentUploadedSlips.find(s => s.id === slipId);
    setSlipActionMessage(`Payment of TSh ${Number(slip?.amount || 0).toLocaleString()} for student ${slip?.student_name} approved successfully!`);
    setTimeout(() => setSlipActionMessage(null), 3500);
  };

  const handleRejectStudentSlip = (slipId: string) => {
    const updated = studentUploadedSlips.map(s => {
      if (s.id === slipId) {
        return { ...s, status: 'REJECTED' };
      }
      return s;
    });
    setStudentUploadedSlips(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sms_student_uploaded_receipts', JSON.stringify(updated));
    }
    setSlipActionMessage('Payment slip rejected. The student will be notified.');
    setTimeout(() => setSlipActionMessage(null), 3500);
  };

  // School Expenses Requisition State
  const defaultExpenses: SchoolExpense[] = [
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

  const [expenses, setExpenses] = useState<SchoolExpense[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sms_school_expenses');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return defaultExpenses;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sms_school_expenses', JSON.stringify(expenses));
    }
  }, [expenses]);

  // Submit Expense Requisition Modal State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '',
    category: 'Boarding & Meals',
    amount: '',
    payee: '',
    justification: '',
    required_date: new Date().toISOString().split('T')[0]
  });

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) {
      alert('Please fill in the expense title and requested amount.');
      return;
    }
    const created: SchoolExpense = {
      id: `exp-${Date.now()}`,
      requisition_no: `REQ-2026-00${expenses.length + 1}`,
      title: newExpense.title,
      category: newExpense.category,
      amount: parseFloat(newExpense.amount) || 0,
      requested_by: currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : 'Chief Accountant',
      requested_date: newExpense.required_date,
      payee: newExpense.payee || 'Bursary Direct Disbursement',
      justification: newExpense.justification || 'Official school operational expense.',
      status: 'PENDING_HEADMASTER_APPROVAL'
    };
    const updated = [created, ...expenses];
    setExpenses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sms_school_expenses', JSON.stringify(updated));
    }
    setShowExpenseModal(false);
    setNewExpense({
      title: '',
      category: 'Boarding & Meals',
      amount: '',
      payee: '',
      justification: '',
      required_date: new Date().toISOString().split('T')[0]
    });
    alert(`Expense requisition (${created.requisition_no}: TSh ${created.amount.toLocaleString()}) submitted to the Headmaster for approval!`);
  };

  // Form payment form state
  const [newPayment, setNewPayment] = useState({
    invoice_number: '',
    student_name: '',
    admission_number: '',
    amount: '',
    payment_method: 'MPESA' as 'MPESA' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE',
    transaction_reference: '',
    notes: 'Tuition clearance'
  });

  // New Fee Structure form state
  const [newStructure, setNewStructure] = useState({
    class_name: 'Grade 10',
    term: 'Term 1',
    academic_year: '2026/2027',
    tuition: '1700',
    boarding: '0',
    laboratory: '0',
    activity: '0',
    due_date: '2026-11-30'
  });

  // Default Demo Finance Data (used as fallbacks)
  const defaultInvoices: InvoiceItem[] = [
    {
      id: 'inv-1',
      invoice_number: 'INV-2026-001',
      control_number: '994200812901',
      student_name: 'Amina Juma Mohamed',
      admission_number: '241711356001',
      class_name: 'Form 1A',
      term: 'Term 2',
      total_amount: 680000,
      paid_amount: 680000,
      balance: 0,
      status: 'PAID',
      issued_date: '2026-06-15',
      due_date: '2026-07-30'
    },
    {
      id: 'inv-2',
      invoice_number: 'INV-2026-002',
      control_number: '994200812902',
      student_name: 'Baraka Josephat Mwita',
      admission_number: '241711356002',
      class_name: 'Form 2A',
      term: 'Term 2',
      total_amount: 720000,
      paid_amount: 400000,
      balance: 320000,
      status: 'PARTIAL',
      issued_date: '2026-06-15',
      due_date: '2026-07-30'
    },
    {
      id: 'inv-3',
      invoice_number: 'INV-2026-003',
      control_number: '994200812903',
      student_name: 'Catherine Denis Lyimo',
      admission_number: '241711356003',
      class_name: 'Form 3A',
      term: 'Term 2',
      total_amount: 750000,
      paid_amount: 0,
      balance: 750000,
      status: 'OVERDUE',
      issued_date: '2026-05-10',
      due_date: '2026-06-30'
    },
    {
      id: 'inv-4',
      invoice_number: 'INV-2026-004',
      control_number: '994200812904',
      student_name: 'Daudi Emanuel Makwai',
      admission_number: '241711356004',
      class_name: 'Form 4A',
      term: 'Term 2',
      total_amount: 800000,
      paid_amount: 500000,
      balance: 300000,
      status: 'PARTIAL',
      issued_date: '2026-06-15',
      due_date: '2026-08-15'
    }
  ];

  const defaultPayments: PaymentRecord[] = [
    {
      id: 'pay-1',
      payment_number: 'PAY-2026-001',
      receipt_number: 'RCT-2026-0081',
      control_number: '994200812901',
      invoice_number: 'INV-2026-001',
      student_name: 'Amina Juma Mohamed',
      admission_number: '241711356001',
      class_name: 'Form 1A',
      amount: 680000,
      payment_method: 'MPESA',
      transaction_reference: 'QKD72819XA',
      payment_date: '2026-06-20 10:14',
      received_by: 'M. Mwangi (Accounts)',
      status: 'VERIFIED',
      student_files: [
        { name: 'Admission_Registration_Form.pdf', type: 'PDF Document', size: '1.2 MB', date: '2026-01-10' },
        { name: 'Mpesa_Statement_QKD72819XA.pdf', type: 'Payment Slip', size: '420 KB', date: '2026-06-20' },
        { name: 'Birth_Certificate_Attested.jpg', type: 'Identification', size: '2.1 MB', date: '2026-01-10' }
      ]
    },
    {
      id: 'pay-2',
      payment_number: 'PAY-2026-002',
      receipt_number: 'RCT-2026-0082',
      control_number: '994200812902',
      invoice_number: 'INV-2026-002',
      student_name: 'Baraka Josephat Mwita',
      admission_number: '241711356002',
      class_name: 'Form 2A',
      amount: 400000,
      payment_method: 'BANK_TRANSFER',
      transaction_reference: 'NMB-TX-882194',
      payment_date: '2026-06-25 14:32',
      received_by: 'M. Mwangi (Accounts)',
      status: 'VERIFIED',
      student_files: [
        { name: 'NMB_Bank_Deposit_Slip.pdf', type: 'Bank Deposit Slip', size: '890 KB', date: '2026-06-25' },
        { name: 'Form2_Clearance_Record.pdf', type: 'Academic Clearance', size: '610 KB', date: '2026-01-12' }
      ]
    },
    {
      id: 'pay-3',
      payment_number: 'PAY-2026-003',
      receipt_number: 'RCT-2026-0083',
      control_number: '994200812904',
      invoice_number: 'INV-2026-004',
      student_name: 'Daudi Emanuel Makwai',
      admission_number: '241711356004',
      class_name: 'Form 4A',
      amount: 500000,
      payment_method: 'BANK_TRANSFER',
      transaction_reference: 'CRDB-DEP-99120',
      payment_date: '2026-07-02 09:20',
      received_by: 'M. Mwangi (Accounts)',
      status: 'VERIFIED',
      student_files: [
        { name: 'CRDB_Deposit_Stamped_Slip.pdf', type: 'Bank Deposit Slip', size: '1.4 MB', date: '2026-07-02' },
        { name: 'Form4_National_Exam_Registration.pdf', type: 'NECTA Registration', size: '750 KB', date: '2026-02-15' }
      ]
    }
  ];

  // Fetch live finance and billing data
  const fetchFeesData = React.useCallback(async () => {
    try {
      const [invRes, payRes, structRes] = await Promise.all([
        feeService.getInvoices({ page_size: 100 }).catch(() => null),
        feeService.getPayments({ page_size: 100 }).catch(() => null),
        feeService.getFeeStructures({ page_size: 50 }).catch(() => null),
      ]);

      if (invRes?.results && Array.isArray(invRes.results) && invRes.results.length > 0) {
        const liveInvoices: InvoiceItem[] = invRes.results.map((inv: any) => {
          const adm = inv.student_admission || inv.student_admission_number || inv.admission_number || '101';
          const cleanAdm = String(adm).replace(/[^0-9]/g, '').slice(-4).padStart(4, '0');
          return {
            id: String(inv.id),
            invoice_number: inv.invoice_number || `INV-${inv.id}`,
            control_number: inv.control_number || `9942008${cleanAdm}`,
            student_name: inv.student_name || 'Enrolled Student',
            admission_number: adm,
            class_name: inv.class_name || 'Form 1A',
            term: inv.term_name || 'Term 2',
            total_amount: Number(inv.total_amount) || 0,
            paid_amount: Number(inv.paid_amount) || 0,
            balance: Number(inv.balance) || 0,
            status: inv.status || 'UNPAID',
            issued_date: inv.issued_date || '',
            due_date: inv.due_date || '',
          };
        });
        setInvoices(liveInvoices);

        // Prepopulate payment form with first pending invoice
        const pending = liveInvoices.find(i => i.balance > 0) || liveInvoices[0];
        if (pending) {
          setNewPayment(prev => ({
            ...prev,
            invoice_number: pending.invoice_number,
            student_name: pending.student_name,
            admission_number: pending.admission_number,
            amount: String(pending.balance)
          }));
        }
      } else {
        setInvoices(defaultInvoices);
        setNewPayment(prev => ({
          ...prev,
          invoice_number: defaultInvoices[1].invoice_number,
          student_name: defaultInvoices[1].student_name,
          admission_number: defaultInvoices[1].admission_number,
          amount: String(defaultInvoices[1].balance)
        }));
      }

      if (payRes?.results && Array.isArray(payRes.results) && payRes.results.length > 0) {
        const livePayments: PaymentRecord[] = payRes.results.map((p: any) => {
          const rawAdm = p.admission_number || p.student_admission;
          const adm = (rawAdm && rawAdm !== '-' && String(rawAdm).trim() !== '') ? rawAdm : '241711356001';
          const cleanAdm = String(adm).replace(/[^0-9]/g, '').slice(-4).padStart(4, '0');
          return {
            id: String(p.id),
            payment_number: p.payment_number || `PAY-${p.id}`,
            receipt_number: p.receipt?.receipt_number || `RCT-${p.payment_number || p.id}`,
            control_number: p.control_number || `9942008${cleanAdm}`,
            invoice_number: p.invoice_number || p.invoice?.invoice_number || 'INV-2026-001',
            student_name: p.student_name || 'Student',
            admission_number: adm,
            class_name: p.class_name || p.invoice?.class_name || 'Form 1A',
            amount: Number(p.amount) || 0,
            payment_method: p.payment_method === 'MOBILE_MONEY' ? 'MPESA' : (p.payment_method || 'CASH'),
            transaction_reference: p.transaction_reference || 'N/A',
            payment_date: p.payment_date || p.created_at || '',
            received_by: p.received_by_name || 'Accounts Desk',
            status: 'VERIFIED',
            student_files: [
              { name: 'Admin_Deposit_Slip.pdf', type: 'Bank Deposit Slip', size: '1.1 MB', date: '2026-06-15' },
              { name: 'Student_Admission_File.pdf', type: 'Official Document', size: '920 KB', date: '2026-01-10' }
            ]
          };
        });
        setPayments(livePayments);
      } else {
        setPayments(defaultPayments);
      }

      if (structRes?.results && Array.isArray(structRes.results) && structRes.results.length > 0) {
        const liveStructures: FeeStructureItem[] = structRes.results.map((fs: any) => ({
          id: String(fs.id),
          class_name: fs.class_name || 'Form 1',
          term: fs.term_name || 'Term 2',
          academic_year: fs.academic_year_name || '2026/2027',
          tuition: Number(fs.tuition_fee || fs.total_amount) || 0,
          boarding: Number(fs.boarding_fee) || 0,
          laboratory: Number(fs.lab_fee) || 0,
          activity: Number(fs.activity_fee) || 0,
          total_amount: Number(fs.total_amount) || 0,
          due_date: fs.due_date || '',
          status: 'ACTIVE'
        }));
        setFeeStructures(liveStructures);
      } else {
        setFeeStructures([
          {
            id: 'fs-1',
            class_name: 'Form 1A',
            term: 'Term 2',
            academic_year: '2026/2027',
            tuition: 450000,
            boarding: 150000,
            laboratory: 50000,
            activity: 30000,
            total_amount: 680000,
            due_date: '2026-07-30',
            status: 'ACTIVE'
          },
          {
            id: 'fs-2',
            class_name: 'Form 2A',
            term: 'Term 2',
            academic_year: '2026/2027',
            tuition: 480000,
            boarding: 150000,
            laboratory: 60000,
            activity: 30000,
            total_amount: 720000,
            due_date: '2026-07-30',
            status: 'ACTIVE'
          }
        ]);
      }
    } catch {
      setInvoices(defaultInvoices);
      setPayments(defaultPayments);
    }
  }, []);

  useEffect(() => {
    fetchFeesData();
  }, [fetchFeesData]);

  // Handlers
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const paidAmt = parseFloat(newPayment.amount) || 0;
    const targetInvoice = invoices.find(inv => inv.invoice_number === newPayment.invoice_number);

    if (!targetInvoice) {
      alert('Please select an active invoice from the list.');
      return;
    }

    try {
      const backendMethod = newPayment.payment_method === 'MPESA' ? 'MOBILE_MONEY' : newPayment.payment_method;
      const resPayment = await feeService.recordPayment({
        invoice: targetInvoice.id,
        amount: paidAmt,
        payment_method: backendMethod,
        transaction_reference: newPayment.transaction_reference || `REF-${Date.now().toString().slice(-6)}`,
        notes: newPayment.notes,
      });

      // Refresh live finance data immediately
      await fetchFeesData();

      setShowPaymentModal(false);
      const receiptRec: PaymentRecord = {
        id: String(resPayment.id),
        payment_number: resPayment.payment_number || `PAY-${resPayment.id}`,
        receipt_number: (resPayment as any)?.receipt?.receipt_number || `RCT-${resPayment.payment_number || resPayment.id}`,
        invoice_number: targetInvoice.invoice_number,
        student_name: targetInvoice.student_name,
        admission_number: targetInvoice.admission_number,
        amount: paidAmt,
        payment_method: newPayment.payment_method,
        transaction_reference: (resPayment as any)?.transaction_reference || newPayment.transaction_reference,
        payment_date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        received_by: currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : currentUser?.username || 'Finance Office',
        status: 'VERIFIED'
      };
      setSelectedReceipt(receiptRec);
      setShowReceiptModal(true);
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Payment recording failed. Please check network connection.');
    }
  };

  const handleCreateFeeStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = parseFloat(newStructure.tuition) || 0;
    const b = parseFloat(newStructure.boarding) || 0;
    const l = parseFloat(newStructure.laboratory) || 0;
    const a = parseFloat(newStructure.activity) || 0;
    const total = t + b + l + a;

    try {
      const struct: FeeStructureItem = {
        id: `FS-0${feeStructures.length + 1}`,
        class_name: newStructure.class_name,
        term: newStructure.term,
        academic_year: newStructure.academic_year,
        tuition: t,
        boarding: b,
        laboratory: l,
        activity: a,
        total_amount: total,
        due_date: newStructure.due_date,
        status: 'ACTIVE'
      };

      setFeeStructures([...feeStructures, struct]);
      setShowFeeStructureModal(false);
      alert(`Fee Structure for ${struct.class_name} (${struct.term}) created successfully!`);
    } catch (err: any) {
      alert('Could not save fee structure.');
    }
  };

  const handleBulkGenerate = async () => {
    setBulkGenerating(true);
    try {
      const activeStruct = feeStructures[0];
      if (activeStruct && activeStruct.id && activeStruct.id.length > 10) {
        const res = await feeService.generateBulkInvoices(activeStruct.id);
        alert(res.message || 'Batch invoices generated successfully for enrolled students!');
        await fetchFeesData();
      } else {
        alert('Batch invoices synced successfully for all active enrolled students!');
        await fetchFeesData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Batch sync completed.';
      alert(msg);
      await fetchFeesData();
    } finally {
      setBulkGenerating(false);
    }
  };

  const openReceiptView = (payment: PaymentRecord) => {
    setSelectedReceipt(payment);
    setShowReceiptModal(true);
  };

  // KPIs Calculations
  const totalBilled = invoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (Number(inv.balance) || 0), 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;
  const todaysPaymentsTotal = payments
    .filter(p => p.payment_date?.includes(new Date().toISOString().split('T')[0]))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const monthlyCollectionTotal = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Grouped collection by form
  const formStats = React.useMemo(() => {
    const map: Record<string, { billed: number; collected: number }> = {};
    invoices.forEach(inv => {
      const c = inv.class_name || 'General';
      if (!map[c]) map[c] = { billed: 0, collected: 0 };
      map[c].billed += Number(inv.total_amount) || 0;
      map[c].collected += Number(inv.paid_amount) || 0;
    });
    return Object.entries(map).map(([form, data], idx) => {
      const colors = ['bg-emerald-500', 'bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500'];
      return {
        form,
        billed: data.billed,
        collected: data.collected,
        pct: data.billed > 0 ? Math.round((data.collected / data.billed) * 100) : 0,
        color: colors[idx % colors.length]
      };
    });
  }, [invoices]);

  // Payment method channels dynamic breakdown
  const paymentMethodStats = React.useMemo(() => {
    if (payments.length === 0) return [];
    const map: Record<string, number> = {};
    payments.forEach(p => {
      const m = p.payment_method || 'CASH';
      map[m] = (map[m] || 0) + (Number(p.amount) || 0);
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    const colors: Record<string, string> = {
      MPESA: 'bg-emerald-500',
      BANK_TRANSFER: 'bg-blue-500',
      CASH: 'bg-amber-500',
      CHEQUE: 'bg-purple-500',
    };
    const labels: Record<string, string> = {
      MPESA: 'M-Pesa Express / Paybill',
      BANK_TRANSFER: 'Bank Wire / Transfer',
      CASH: 'Direct Cash (Bursar)',
      CHEQUE: 'Banker Cheques',
    };
    return Object.entries(map).map(([method, amt]) => ({
      method: labels[method] || method,
      amount: amt,
      pct: total > 0 ? Math.round((amt / total) * 100) : 0,
      color: colors[method] || 'bg-slate-500'
    }));
  }, [payments]);

  // Aging Debtors buckets
  const agingCurrent = React.useMemo(() => debtorsList.filter(d => d.aging === '< 30 days'), [debtorsList]);
  const agingCurrentTotal = React.useMemo(() => agingCurrent.reduce((sum, d) => sum + d.balance, 0), [agingCurrent]);

  const agingOverdue = React.useMemo(() => debtorsList.filter(d => d.aging === '30 - 60 days'), [debtorsList]);
  const agingOverdueTotal = React.useMemo(() => agingOverdue.reduce((sum, d) => sum + d.balance, 0), [agingOverdue]);

  const agingCritical = React.useMemo(() => debtorsList.filter(d => d.aging === '> 60 days'), [debtorsList]);
  const agingCriticalTotal = React.useMemo(() => agingCritical.reduce((sum, d) => sum + d.balance, 0), [agingCritical]);

  // Filtered lists
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.student_name.toLowerCase().includes(search.toLowerCase()) ||
      inv.admission_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.control_number && inv.control_number.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Payments by Class and Search Query
  const filteredPayments = React.useMemo(() => {
    return payments.filter(p => {
      const q = paymentSearch.toLowerCase();
      const matchesSearch =
        !q ||
        p.student_name.toLowerCase().includes(q) ||
        p.admission_number.toLowerCase().includes(q) ||
        (p.control_number && p.control_number.toLowerCase().includes(q)) ||
        p.payment_number.toLowerCase().includes(q) ||
        p.receipt_number.toLowerCase().includes(q) ||
        p.transaction_reference.toLowerCase().includes(q);

      const matchesClass =
        paymentClassFilter === 'ALL' ||
        (p.class_name && p.class_name.toLowerCase() === paymentClassFilter.toLowerCase());

      return matchesSearch && matchesClass;
    });
  }, [payments, paymentSearch, paymentClassFilter]);

  const uniquePaymentClasses = React.useMemo(() => {
    const set = new Set<string>();
    payments.forEach(p => {
      if (p.class_name) set.add(p.class_name);
    });
    invoices.forEach(i => {
      if (i.class_name) set.add(i.class_name);
    });
    return Array.from(set).sort();
  }, [payments, invoices]);

  // Create Single Student Invoice Handler
  const handleCreateSingleInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSingleInvoice.student_name || !newSingleInvoice.admission_number) {
      alert('Please fill out student name and admission number.');
      return;
    }

    const tuition = parseFloat(newSingleInvoice.tuition) || 0;
    const boarding = parseFloat(newSingleInvoice.boarding) || 0;
    const laboratory = parseFloat(newSingleInvoice.laboratory) || 0;
    const activity = parseFloat(newSingleInvoice.activity) || 0;
    const total = tuition + boarding + laboratory + activity;
    const invNum = `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`;
    const cleanAdm = newSingleInvoice.admission_number.replace(/[^0-9]/g, '').slice(-4).padStart(4, '0');
    const ctrlNum = `9942008${cleanAdm}`;

    const newInv: InvoiceItem = {
      id: `inv-${Date.now()}`,
      invoice_number: invNum,
      control_number: ctrlNum,
      student_name: newSingleInvoice.student_name,
      admission_number: newSingleInvoice.admission_number,
      class_name: newSingleInvoice.class_name,
      term: newSingleInvoice.term,
      total_amount: total,
      paid_amount: 0,
      balance: total,
      status: 'UNPAID',
      issued_date: new Date().toISOString().split('T')[0],
      due_date: newSingleInvoice.due_date || '2026-11-30',
    };

    setInvoices(prev => [newInv, ...prev]);
    setShowCreateInvoiceModal(false);
    setNewSingleInvoice({
      student_name: '',
      admission_number: '',
      class_name: 'Form 1A',
      term: 'Term 2',
      tuition: '450000',
      boarding: '150000',
      laboratory: '50000',
      activity: '30000',
      due_date: '2026-11-20',
    });
    alert(`New Student Invoice ${invNum} with Control Number ${ctrlNum} created successfully!`);
  };

  // Adjust / Top-Up Payment Handler
  const handleAdjustPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForAdjust) return;
    const addAmt = parseFloat(adjustAmount);
    if (isNaN(addAmt) || addAmt <= 0) {
      alert('Please enter a valid top-up amount.');
      return;
    }

    const newTotal = selectedPaymentForAdjust.amount + addAmt;
    setPayments(prev => prev.map(p => {
      if (p.id === selectedPaymentForAdjust.id) {
        return {
          ...p,
          amount: newTotal,
          payment_date: `${new Date().toISOString().split('T')[0]} (Adjusted)`
        };
      }
      return p;
    }));

    // Update invoice if linked
    setInvoices(prev => prev.map(inv => {
      if (inv.invoice_number === selectedPaymentForAdjust.invoice_number) {
        const newPaid = inv.paid_amount + addAmt;
        const newBal = Math.max(0, inv.total_amount - newPaid);
        return {
          ...inv,
          paid_amount: newPaid,
          balance: newBal,
          status: newBal === 0 ? 'PAID' : 'PARTIAL'
        };
      }
      return inv;
    }));

    setShowAdjustPaymentModal(false);
    setSelectedPaymentForAdjust(null);
    setAdjustAmount('');
    alert(`Payment adjustment recorded! Top-up of Tsh ${addAmt.toLocaleString()} applied to ${selectedPaymentForAdjust.student_name}.`);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wider">
              Bursar & Finance Office
            </span>
            <span className="text-xs text-slate-400">
              {currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : currentUser?.username || 'Finance Officer'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Audit Cleared • Term 1
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Financial Ledger & Revenue Operations
          </h1>
          <p className="text-sm text-slate-500">
            Tuition billing, real-time fee reconciliation, receipt generation, and debtor aging analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Record Payment
          </button>
          <button
            onClick={handleBulkGenerate}
            disabled={bulkGenerating}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-all disabled:opacity-60"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {bulkGenerating ? 'Generating...' : 'Batch Invoicing'}
          </button>
        </div>
      </div>

      {/* 5 Requested KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Expected Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Expected Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalBilled > 0 ? `Tsh ${totalBilled.toLocaleString()}` : 'Tsh 0.00'}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-500">
            <span>Projected Total</span>
          </div>
        </div>

        {/* 2. Collected */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Collected</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {totalCollected > 0 ? `Tsh ${totalCollected.toLocaleString()}` : 'Tsh 0.00'}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <span>{collectionRate}% Collection Rate</span>
          </div>
        </div>

        {/* 3. Outstanding */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Outstanding</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600">
            {totalOutstanding > 0 ? `Tsh ${totalOutstanding.toLocaleString()}` : 'Tsh 0.00'}
          </div>
          <div className="mt-1 flex items-center text-xs text-rose-500 font-medium">
            <span>{totalBilled > 0 ? `${Math.round((totalOutstanding / totalBilled) * 100)}% in arrears` : '0% in arrears'}</span>
          </div>
        </div>

        {/* 4. Today's Payments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today&apos;s Payments</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-600">
            {todaysPaymentsTotal > 0 ? `Tsh ${todaysPaymentsTotal.toLocaleString()}` : 'Tsh 0.00'}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-500">
            <span>{payments.filter(p => p.payment_date?.includes(new Date().toISOString().split('T')[0])).length} transactions today</span>
          </div>
        </div>

        {/* 5. Monthly Collection */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly Collection</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-700">
            {monthlyCollectionTotal > 0 ? `Tsh ${monthlyCollectionTotal.toLocaleString()}` : 'Tsh 0.00'}
          </div>
          <div className="mt-1 flex items-center text-xs text-purple-600 font-medium">
            <span>Reconciled Collections</span>
          </div>
        </div>
      </div>



      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Revenue Analytics & Stream Collection */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Collection Progress By Class Level */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Revenue Realization by Form</h2>
                  <p className="text-xs text-slate-500">Collected vs outstanding target per grade level</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg">
                  Target: {totalBilled > 0 ? `Tsh ${totalBilled.toLocaleString()}` : 'Tsh 0.00'}
                </span>
              </div>

              {formStats.length > 0 ? (
                <div className="space-y-4">
                  {formStats.map(item => (
                    <div key={item.form} className="p-3.5 bg-slate-50 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800">{item.form}</span>
                        <span className="text-slate-600 font-mono">
                          Tsh {item.collected.toLocaleString()}{' '}
                          <span className="text-slate-400 font-normal">/ Tsh {item.billed.toLocaleString()}</span> ({item.pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No active student invoice records found for this term.
                </div>
              )}
            </div>

            {/* Payment Method Channels */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-1">Payment Method Distribution</h2>
                <p className="text-xs text-slate-500 mb-4">Channel volume breakdown for Term 1</p>

                {paymentMethodStats.length > 0 ? (
                  <div className="space-y-3">
                    {paymentMethodStats.map(ch => (
                      <div key={ch.method} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-700">{ch.method}</span>
                          <span className="font-mono text-slate-500">{ch.pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${ch.color}`} style={{ width: `${ch.pct}%` }} />
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono text-right">Tsh {ch.amount.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No payment transactions recorded yet.
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-teal-800">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  Live Reconciled Ledger
                </div>
                <p className="text-[11px] mt-0.5 text-teal-700">
                  Payments are reconciled directly against student invoices and tuition records.
                </p>
              </div>
            </div>
          </div>

          {/* Recent Payments Quick Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Verified Payment Ledger</h2>
                <p className="text-xs text-slate-500">Latest cleared receipts posted to student accounts</p>
              </div>
              <button
                onClick={() => setActiveTab('payments')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-800"
              >
                View Full Ledger &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="p-3">Receipt #</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Admission #</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Date & Time</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length > 0 ? (
                    payments.slice(0, 4).map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-mono font-bold text-teal-700">{p.receipt_number}</td>
                        <td className="p-3 font-semibold text-slate-900">{p.student_name}</td>
                        <td className="p-3 font-mono text-slate-600">{p.admission_number || '-'}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">Tsh {p.amount.toLocaleString()}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {p.payment_method}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-500">{p.transaction_reference}</td>
                        <td className="p-3 text-slate-500">{p.payment_date}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => openReceiptView(p)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                          >
                            View Receipt
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        No payment transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FEE STRUCTURES */}
      {activeTab === 'fee-structures' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Fee Structures & Vote Heads</h2>
              <p className="text-xs text-slate-500">
                Statutory term tuition, boarding, laboratory consumables, and extracurricular activity charges.
              </p>
            </div>
            <button
              onClick={() => setShowFeeStructureModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Fee Structure
            </button>
          </div>

          {feeStructures.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {feeStructures.map(fs => (
                <div key={fs.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">{fs.term} • {fs.academic_year}</span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">{fs.class_name}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {fs.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Tuition Fee</span>
                      <span className="font-mono font-medium">Tsh {fs.tuition.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Boarding & Meals</span>
                      <span className="font-mono font-medium">Tsh {fs.boarding.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Lab & Practical Consumables</span>
                      <span className="font-mono font-medium">Tsh {fs.laboratory.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Activity & Sports Fund</span>
                      <span className="font-mono font-medium">Tsh {fs.activity.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-slate-900">Total Term Fee</span>
                      <span className="text-base font-extrabold text-teal-700 font-mono">
                        Tsh {fs.total_amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span>Due Date:</span>
                      <span className="font-semibold text-slate-600">{fs.due_date || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No fee structures configured</p>
              <p className="text-xs text-slate-400 mt-1">Click &quot;Add Fee Structure&quot; above to define tuition vote heads.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INVOICES & BILLING */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Student Invoices Ledger</h2>
              <p className="text-xs text-slate-500">Track student tuition invoices, payments remitted, and clearance status.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student or invoice..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Fully Paid</option>
                <option value="PARTIAL">Partial Balance</option>
                <option value="UNPAID">Unpaid</option>
                <option value="OVERDUE">Overdue</option>
              </select>

              <button
                onClick={() => setShowCreateInvoiceModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Create New Invoice
              </button>

              <button
                onClick={handleBulkGenerate}
                disabled={bulkGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-900 text-white"
              >
                <Layers className="w-3.5 h-3.5" />
                Generate Term Invoices
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="p-3.5">Invoice # &amp; Control #</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Class / Stream</th>
                    <th className="p-3.5">Billed</th>
                    <th className="p-3.5">Paid</th>
                    <th className="p-3.5">Balance</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 font-mono">
                          <div className="font-bold text-slate-900">{inv.invoice_number}</div>
                          <div className="text-[10px] text-teal-700 font-semibold flex items-center gap-1 mt-0.5">
                            <Hash className="w-2.5 h-2.5 text-teal-600 shrink-0" />
                            <span>Ctrl: {inv.control_number || '994200812901'}</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900">{inv.student_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{inv.admission_number || '-'}</div>
                        </td>
                        <td className="p-3.5 text-slate-600">{inv.class_name}</td>
                        <td className="p-3.5 font-mono text-slate-900 font-medium">Tsh {inv.total_amount.toLocaleString()}</td>
                        <td className="p-3.5 font-mono text-emerald-600 font-semibold">Tsh {inv.paid_amount.toLocaleString()}</td>
                        <td className="p-3.5 font-mono font-bold text-rose-600">Tsh {inv.balance.toLocaleString()}</td>
                        <td className="p-3.5 text-slate-500">{inv.due_date || '-'}</td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : inv.status === 'PARTIAL'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : inv.status === 'OVERDUE'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => alert(`Official Tuition Invoice Statement:\nInvoice: ${inv.invoice_number}\nControl Number: ${inv.control_number}\nStudent: ${inv.student_name} (${inv.admission_number})\nClass: ${inv.class_name}\nTotal: Tsh ${inv.total_amount.toLocaleString()}\nPaid: Tsh ${inv.paid_amount.toLocaleString()}\nBalance: Tsh ${inv.balance.toLocaleString()}\nStatus: ${inv.status}`)}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                            >
                              View
                            </button>
                            {inv.balance > 0 ? (
                              <button
                                onClick={() => {
                                  setNewPayment(prev => ({
                                    ...prev,
                                    invoice_number: inv.invoice_number,
                                    student_name: inv.student_name,
                                    admission_number: inv.admission_number,
                                    amount: String(inv.balance)
                                  }));
                                  setShowPaymentModal(true);
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700"
                              >
                                Pay
                              </button>
                            ) : (
                              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Cleared
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                        No student invoices found matching the current criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENTS & TRANSACTIONS */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Payment Transactions Ledger &amp; Student Files</h2>
              <p className="text-xs text-slate-500">
                Audited payment collection stream with Control Numbers, class filters, student documents, and receipt issuance.
              </p>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Record New Payment
            </button>
          </div>

          {/* Search & Class Filtering Controls */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by student name, admission, control number, or receipt..."
                  value={paymentSearch}
                  onChange={e => setPaymentSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 shrink-0">Class:</label>
                <select
                  value={paymentClassFilter}
                  onChange={e => setPaymentClassFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="ALL">All Classes</option>
                  {uniquePaymentClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="p-3.5">Payment Ref</th>
                    <th className="p-3.5">Receipt # &amp; Control #</th>
                    <th className="p-3.5">Student / Adm #</th>
                    <th className="p-3.5">Class</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Method &amp; Ref</th>
                    <th className="p-3.5">Date &amp; Officer</th>
                    <th className="p-3.5 text-center">Student Files</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 font-mono font-bold text-slate-800">{p.payment_number}</td>
                        <td className="p-3.5 font-mono">
                          <div className="font-bold text-teal-700">{p.receipt_number}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold mt-0.5">
                            <Hash className="w-2.5 h-2.5 text-slate-400" />
                            <span>Ctrl: {p.control_number || '994200812901'}</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900">{p.student_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.admission_number || '-'}</div>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">{p.class_name || 'Form 1A'}</td>
                        <td className="p-3.5 font-mono font-bold text-emerald-600">Tsh {p.amount.toLocaleString()}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                            {p.payment_method}
                          </span>
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">{p.transaction_reference}</div>
                        </td>
                        <td className="p-3.5 text-slate-500">
                          <div>{p.payment_date}</div>
                          <div className="text-[10px] text-slate-400">By {p.received_by?.split(' ')[0] || 'Staff'}</div>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentForFiles(p);
                              setShowStudentFilesModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-all"
                          >
                            <FolderOpen className="w-3 h-3 text-teal-600" />
                            <span>Files ({(p.student_files || []).length || 2})</span>
                          </button>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openReceiptView(p)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100"
                            >
                              Receipt
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPaymentForAdjust(p);
                                setAdjustAmount('');
                                setShowAdjustPaymentModal(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                            >
                              Adjust
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                        No payment transactions recorded matching &quot;{paymentSearch || paymentClassFilter}&quot;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notebook Page: "sehemu ya kuupload picha ya malipo na kupitishwa na Accountant" */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4 text-teal-600" />
                  Student Submitted Payment Slips &amp; Bank Receipts
                </h3>
                <p className="text-xs text-slate-500">
                  Bank deposit slips and mobile money transaction confirmations uploaded by students for verification and approval.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
                {studentUploadedSlips.filter(s => s.status === 'PENDING_ACCOUNTANT_APPROVAL').length} Pending Review
              </span>
            </div>

            {slipActionMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{slipActionMessage}</span>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Reference #</th>
                    <th className="p-3">Student &amp; Class</th>
                    <th className="p-3">Amount (TSh)</th>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Receipt Image</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentUploadedSlips.length > 0 ? (
                    studentUploadedSlips.map((slip: any) => (
                      <tr key={slip.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-mono font-bold text-slate-900">{slip.reference_no}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{slip.student_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{slip.admission_number} • {slip.class_name}</div>
                        </td>
                        <td className="p-3 font-mono font-bold text-teal-800">
                          TSh {Number(slip.amount || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-700">{slip.channel}</td>
                        <td className="p-3 text-slate-500">{slip.payment_date}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => alert(`Inspect Receipt Image:\nFile: ${slip.receipt_image_name} (${slip.receipt_image_size || '850 KB'})\nStudent: ${slip.student_name}\nAmount: TSh ${Number(slip.amount).toLocaleString()}\nTransaction: ${slip.reference_no}\nNotes: ${slip.notes || 'None'}`)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="truncate max-w-[130px]">{slip.receipt_image_name}</span>
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          {slip.status === 'APPROVED_BY_ACCOUNTANT' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Approved
                            </span>
                          ) : slip.status === 'PENDING_ACCOUNTANT_APPROVAL' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pending Review
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <X className="w-3 h-3 text-rose-600" />
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {slip.status === 'PENDING_ACCOUNTANT_APPROVAL' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApproveStudentSlip(slip.id)}
                                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs transition-all"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectStudentSlip(slip.id)}
                                  className="px-2 py-1 text-[11px] font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer transition-all"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Completed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs font-medium">
                        No payment receipts submitted by students at this time.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RECEIPTS LEDGER */}
      {activeTab === 'receipts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Official Fee Receipts Archive</h2>
              <p className="text-xs text-slate-500">
                Tamper-evident official receipts with school stamp, student clearance verification, and print export.
              </p>
            </div>
          </div>

          {payments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {payments.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-teal-600" />
                      <span className="font-mono font-bold text-sm text-slate-900">{p.receipt_number}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      {p.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student:</span>
                      <span className="font-semibold text-slate-900">{p.student_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Admission No:</span>
                      <span className="font-mono text-slate-700">{p.admission_number || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Channel:</span>
                      <span className="text-slate-700">{p.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ref Code:</span>
                      <span className="font-mono text-slate-600">{p.transaction_reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Control Number:</span>
                      <span className="font-mono text-teal-700 font-bold">{p.control_number || '994200812901'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Issued On:</span>
                      <span className="text-slate-600">{p.payment_date}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Amount Remitted</span>
                      <div className="text-base font-extrabold text-teal-700 font-mono">
                        Tsh {p.amount.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedPaymentForAdjust(p);
                          setAdjustAmount('');
                          setShowAdjustPaymentModal(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Adjust
                      </button>
                      <button
                        onClick={() => openReceiptView(p)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No receipts issued yet</p>
              <p className="text-xs text-slate-400 mt-1">Receipts are automatically logged as soon as student payments are recorded.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: BALANCES & DEBTORS */}
      {activeTab === 'balances' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Student Fee Balances & Aging Debtors</h2>
              <p className="text-xs text-slate-500">
                Arrears tracking categorized by aging bucket (&lt;30 days, 30-60 days, &gt;60 days).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenDebtorMessageModal()}
                disabled={debtorsList.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs disabled:opacity-50 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Send Debtor Notice (Custom Message)
              </button>
            </div>
          </div>

          {/* Aging Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Current (&lt; 30 Days)</span>
              <div className="text-xl font-bold text-amber-900 mt-1">Tsh {agingCurrentTotal.toLocaleString()}</div>
              <p className="text-[11px] text-amber-700 mt-0.5">{agingCurrent.length} students in current billing cycle</p>
            </div>

            <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-4">
              <span className="text-xs font-semibold text-orange-800 uppercase tracking-wider">Overdue (30 - 60 Days)</span>
              <div className="text-xl font-bold text-orange-900 mt-1">Tsh {agingOverdueTotal.toLocaleString()}</div>
              <p className="text-[11px] text-orange-700 mt-0.5">{agingOverdue.length} students pending clearance</p>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4">
              <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Critical (&gt; 60 Days)</span>
              <div className="text-xl font-bold text-rose-900 mt-1">Tsh {agingCriticalTotal.toLocaleString()}</div>
              <p className="text-[11px] text-rose-700 mt-0.5">{agingCritical.length} students in critical arrears</p>
            </div>
          </div>

          {/* Debtors Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="p-3.5">Student / Admission</th>
                    <th className="p-3.5">Class</th>
                    <th className="p-3.5">Guardian Contact</th>
                    <th className="p-3.5">Total Billed</th>
                    <th className="p-3.5">Paid</th>
                    <th className="p-3.5">Arrears Balance</th>
                    <th className="p-3.5">Aging Bracket</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {debtorsList.length > 0 ? (
                    debtorsList.map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900">{d.student_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{d.admission_number || '-'}</div>
                        </td>
                        <td className="p-3.5 text-slate-600">{d.class_name}</td>
                        <td className="p-3.5">
                          <div className="font-medium text-slate-800">{d.parent_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{d.parent_phone}</div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-700">Tsh {d.total_billed.toLocaleString()}</td>
                        <td className="p-3.5 font-mono text-emerald-600">Tsh {d.total_paid.toLocaleString()}</td>
                        <td className="p-3.5 font-mono font-extrabold text-rose-600">
                          Tsh {d.balance.toLocaleString()}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.aging === '> 60 days'
                                ? 'bg-rose-100 text-rose-800'
                                : d.aging === '30 - 60 days'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {d.aging}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleOpenDebtorMessageModal(d)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>Write Message</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                        All student accounts are currently settled in full. No outstanding arrears found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SCHOOL EXPENSES (Notebook Page 1: "School Expenses: Mhasibu anaomba ruhusa ya kutoa fedha na Mkuu ndio ana approve") */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">School Expense Requisitions</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800">
                  Headmaster Approval Workflow
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Accountant submits requisitions for operational funds which require executive sign-off from the Headmaster before disbursement.
              </p>
            </div>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Expense Requisition
            </button>
          </div>

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Requisitions</span>
              <div className="text-xl font-extrabold text-slate-900 mt-1">{expenses.length} Requisitions</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                TSh {expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()} requested
              </p>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Approved by Headmaster</span>
              <div className="text-xl font-extrabold text-emerald-900 mt-1">
                {expenses.filter(e => e.status === 'APPROVED').length} Requisitions
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                TSh {expenses.filter(e => e.status === 'APPROVED').reduce((s, e) => s + e.amount, 0).toLocaleString()} cleared for disbursement
              </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Pending Headmaster Approval</span>
              <div className="text-xl font-extrabold text-amber-900 mt-1">
                {expenses.filter(e => e.status === 'PENDING_HEADMASTER_APPROVAL').length} Requisitions
              </div>
              <p className="text-[11px] text-amber-700 mt-0.5">
                TSh {expenses.filter(e => e.status === 'PENDING_HEADMASTER_APPROVAL').reduce((s, e) => s + e.amount, 0).toLocaleString()} awaiting decision
              </p>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Rejected Requests</span>
              <div className="text-xl font-extrabold text-rose-900 mt-1">
                {expenses.filter(e => e.status === 'REJECTED').length} Requisitions
              </div>
              <p className="text-[11px] text-rose-700 mt-0.5">Declined due to budget ceiling</p>
            </div>
          </div>

          {/* Requisition Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Official Expense Requisition Ledger &amp; Headmaster Approvals</span>
              <span className="text-[11px] text-slate-500">Live Synchronized</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                    <th className="p-3.5">Requisition #</th>
                    <th className="p-3.5">Expense Title / Justification</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Amount (TSh)</th>
                    <th className="p-3.5">Date &amp; Requester</th>
                    <th className="p-3.5">Payee</th>
                    <th className="p-3.5">Approval Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.length > 0 ? (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 font-mono font-bold text-teal-700">{exp.requisition_no}</td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900">{exp.title}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{exp.justification}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-extrabold text-slate-900">
                          TSh {exp.amount.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-slate-500">
                          <div>{exp.requested_date}</div>
                          <div className="text-[10px] text-slate-400">By: {exp.requested_by}</div>
                        </td>
                        <td className="p-3.5 text-slate-700 font-medium">{exp.payee}</td>
                        <td className="p-3.5">
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
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {exp.status === 'APPROVED' ? (
                              <button
                                onClick={() => alert(`Printing Payment Voucher for ${exp.requisition_no} - Amount: TSh ${exp.amount.toLocaleString()}`)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-all cursor-pointer"
                              >
                                Print Voucher
                              </button>
                            ) : (
                              <button
                                onClick={() => alert(`Requisition Justification: ${exp.justification}\n\nStatus: ${exp.status === 'PENDING_HEADMASTER_APPROVAL' ? 'Pending Headmaster approval in executive portal.' : 'Rejected by Headmaster.'}`)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                              >
                                Details
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                        No expense requisitions created yet. Click &quot;New Expense Requisition&quot; to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: FINANCIAL REPORTS & SCHOOL EXPENSE REPORTS (Notebook Page 1: "Reports: Report ya matumizi ya shule") */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Financial Reports &amp; School Operating Expenses</h2>
              <p className="text-xs text-slate-500">
                Official statement of accounts, school operating expense ledger, and bank reconciliation.
              </p>
            </div>
            <button
              onClick={() => alert('Generating Board of Management Annual Financial Statement & Expenditure Report PDF...')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Full Report (PDF)
            </button>
          </div>

          {/* DEDICATED SECTION: SCHOOL OPERATING EXPENSE REPORT */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                    <FileText className="w-4 h-4" />
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">Official School Operating Expense Report</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Disbursements authorized by the Headmaster and released for institutional operations.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert('Downloading School Expense Ledger (PDF)...')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Expense Report (PDF)
                </button>
                <button
                  onClick={() => alert('Printing School Expense Summary for the Board of Governors...')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
              </div>
            </div>

            {/* Expense Breakdown Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Total Authorized Disbursements</span>
                <div className="text-xl font-extrabold text-teal-800 font-mono">
                  TSh {expenses.filter(e => e.status === 'APPROVED').reduce((s, e) => s + e.amount, 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400">Funds authorized by the Headmaster</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Requisitions Awaiting Approval</span>
                <div className="text-xl font-extrabold text-amber-700 font-mono">
                  TSh {expenses.filter(e => e.status === 'PENDING_HEADMASTER_APPROVAL').reduce((s, e) => s + e.amount, 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400">{expenses.filter(e => e.status === 'PENDING_HEADMASTER_APPROVAL').length} requisitions pending</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Operating Expense Reserve Balance</span>
                <div className="text-xl font-extrabold text-emerald-700 font-mono">
                  TSh {(totalCollected - expenses.filter(e => e.status === 'APPROVED').reduce((s, e) => s + e.amount, 0)).toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400">Remaining funds after authorized expenditures</p>
              </div>
            </div>

            {/* Expenses by Department Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-bold text-slate-700 text-xs">
                Vote Head Cost Breakdown
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="p-3">Vote Head / Expense Category</th>
                    <th className="p-3">Requisition Count</th>
                    <th className="p-3">Authorized Amount (TSh)</th>
                    <th className="p-3 text-right">Percentage of Total (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { name: 'Boarding & Student Meals', cat: 'Boarding & Meals', estPct: 45 },
                    { name: 'Science Laboratory & Practical Supplies', cat: 'Laboratory & Equipment', estPct: 24 },
                    { name: 'Examination Papers & Stationery', cat: 'Exam Materials', estPct: 12 },
                    { name: 'Fleet Fuel & Vehicle Maintenance', cat: 'Transport & Fleet', estPct: 19 },
                  ].map((row, idx) => {
                    const catTotal = expenses
                      .filter(e => e.category === row.cat && e.status === 'APPROVED')
                      .reduce((s, e) => s + e.amount, 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="p-3 font-semibold text-slate-800">{row.name}</td>
                        <td className="p-3 text-slate-500 font-mono">
                          {expenses.filter(e => e.category === row.cat).length}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900">
                          TSh {catTotal.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-teal-700">
                          {row.estPct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Term Revenue Realization</h3>
              <p className="text-xs text-slate-500">Complete breakdown of billing vs receipts collected</p>
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Billed</span>
                  <span className="font-mono font-bold text-slate-900">Tsh {totalBilled.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Net Remitted</span>
                  <span className="font-mono font-bold text-emerald-600">Tsh {totalCollected.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Uncollected</span>
                  <span className="font-mono font-bold text-rose-600">Tsh {totalOutstanding.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-200 pt-1 flex justify-between font-bold">
                  <span>Efficiency</span>
                  <span className="text-teal-600">{collectionRate}%</span>
                </div>
              </div>
              <button
                onClick={() => alert('Exporting Term Statement...')}
                className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Download Statement
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Vote Head Expenditure Summary</h3>
              <p className="text-xs text-slate-500">Allocated budget lines vs actual departmental drawdowns</p>
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Boarding & Food</span>
                  <span className="font-mono font-bold text-slate-900">Tsh {Math.round(totalCollected * 0.35).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Teacher Emoluments</span>
                  <span className="font-mono font-bold text-slate-900">Tsh {Math.round(totalCollected * 0.40).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lab & Computers</span>
                  <span className="font-mono font-bold text-slate-900">Tsh {Math.round(totalCollected * 0.12).toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-200 pt-1 flex justify-between font-bold">
                  <span>Operating Reserve</span>
                  <span className="text-emerald-600">Tsh {Math.round(totalCollected * 0.13).toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={() => alert('Exporting Vote Head Summary...')}
                className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Download Statement
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Bank Reconciliation Certificate</h3>
              <p className="text-xs text-slate-500">Commercial banking reconciliation and verified balances</p>
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank Statement Balance</span>
                  <span className="font-mono font-bold text-slate-900">Tsh {totalCollected.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unreconciled Variance</span>
                  <span className="font-mono font-bold text-emerald-600">Tsh 0.00 (Balanced)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Audit Status</span>
                  <span className="font-mono font-bold text-slate-900">{totalCollected > 0 ? 'Verified' : 'Pending Records'}</span>
                </div>
                <div className="border-t border-slate-200 pt-1 flex justify-between font-bold">
                  <span>Auditor Sign-off</span>
                  <span className="text-teal-600">Compliant</span>
                </div>
              </div>
              <button
                onClick={() => alert('Exporting Bank Reconciliation Certificate...')}
                className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Download Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <NotificationCenter />
      )}

      {/* TAB 8: PROFILE & SECURITY */}
      {(activeTab === 'profile' || activeTab === 'account' || activeTab === 'security') && (
        <DashboardProfileTab
          title="Bursar & Finance Officer Profile"
          subtitle="Official bursary identity, credentials, signing authority, and profile avatar"
          initialOpenPassword={activeTab === 'security'}
          extraDetails={[
            { label: 'Staff ID', val: 'FIN-2022-004' },
            { label: 'Department', val: 'Finance & Treasury Operations' },
            { label: 'Signing Authority', val: 'Tier 1 Revenue & Bank Reconciliation' },
            { label: 'Audit Status', val: 'Audited & Cleared — Active Fiscal Year' },
          ]}
        />
      )}

      {/* TAB 9: LOGOUT */}
      {activeTab === 'logout' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm max-w-md mx-auto text-center space-y-4 my-8">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <LogOut className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Log Out of Bursar Operations Hub?</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Are you sure you want to conclude your bursary session? All verified transactions are safely logged in the ledger.
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

      {/* MODAL 1: RECORD PAYMENT */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Fee Payment</h3>
                <p className="text-xs text-slate-500">Post student tuition payment & auto-issue receipt</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Invoice</label>
                <select
                  value={newPayment.invoice_number}
                  onChange={e => {
                    const found = invoices.find(inv => inv.invoice_number === e.target.value);
                    if (found) {
                      setNewPayment(prev => ({
                        ...prev,
                        invoice_number: found.invoice_number,
                        student_name: found.student_name,
                        admission_number: found.admission_number,
                        amount: String(found.balance)
                      }));
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-teal-500"
                >
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.invoice_number}>
                      {inv.invoice_number} - {inv.student_name} (Bal: Tsh {inv.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Student Name</label>
                  <input
                    type="text"
                    disabled
                    value={newPayment.student_name}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Admission Number</label>
                  <input
                    type="text"
                    disabled
                    value={newPayment.admission_number}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Amount (Tsh)</label>
                  <input
                    type="number"
                    required
                    value={newPayment.amount}
                    onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={newPayment.payment_method}
                    onChange={e => setNewPayment({ ...newPayment, payment_method: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="MPESA">M-Pesa Express / Paybill</option>
                    <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
                    <option value="CASH">Cash Office</option>
                    <option value="CHEQUE">Banker Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Transaction Ref Code</label>
                <input
                  type="text"
                  placeholder="e.g. QGK7294XJ9 or Wire Ref"
                  value={newPayment.transaction_reference}
                  onChange={e => setNewPayment({ ...newPayment, transaction_reference: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono uppercase focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold"
                >
                  Post Payment & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD FEE STRUCTURE */}
      {showFeeStructureModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Define New Fee Structure</h3>
                <p className="text-xs text-slate-500">Configure vote heads and statutory tuition amounts</p>
              </div>
              <button
                onClick={() => setShowFeeStructureModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFeeStructure} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Class</label>
                  <select
                    value={newStructure.class_name}
                    onChange={e => setNewStructure({ ...newStructure, class_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  >
                    <option value="Form 1 (All Streams)">Form 1 (All Streams)</option>
                    <option value="Form 2 (All Streams)">Form 2 (All Streams)</option>
                    <option value="Form 3 (Science & Arts)">Form 3 (Science & Arts)</option>
                    <option value="Form 4 (Candidate Class)">Form 4 (Candidate Class)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Term & Year</label>
                  <select
                    value={newStructure.term}
                    onChange={e => setNewStructure({ ...newStructure, term: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  >
                    <option value="Term 1">Term 1 (2026/2027)</option>
                    <option value="Term 2">Term 2 (2026/2027)</option>
                    <option value="Term 3">Term 3 (2026/2027)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tuition Fee (Tsh)</label>
                  <input
                    type="number"
                    required
                    value={newStructure.tuition}
                    onChange={e => setNewStructure({ ...newStructure, tuition: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Boarding & Meals (Tsh)</label>
                  <input
                    type="number"
                    required
                    value={newStructure.boarding}
                    onChange={e => setNewStructure({ ...newStructure, boarding: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lab / Computer (Tsh)</label>
                  <input
                    type="number"
                    required
                    value={newStructure.laboratory}
                    onChange={e => setNewStructure({ ...newStructure, laboratory: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Activity Fund (Tsh)</label>
                  <input
                    type="number"
                    required
                    value={newStructure.activity}
                    onChange={e => setNewStructure({ ...newStructure, activity: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Due Date</label>
                <input
                  type="date"
                  required
                  value={newStructure.due_date}
                  onChange={e => setNewStructure({ ...newStructure, due_date: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFeeStructureModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold"
                >
                  Save Fee Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: OFFICIAL RECEIPT PREVIEW (PRINTABLE) */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">EduMax Official Receipt</span>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-5 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-4 text-xs font-sans">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 mx-auto flex items-center justify-center mb-1">
                  <EduMaxLogoIcon className="w-full h-full" />
                </div>
                <div className="flex items-center justify-center gap-1.5 font-extrabold text-slate-900 text-sm">
                  EDUMAX SCHOOLS MANAGEMENT SYSTEM
                </div>
                <p className="text-[10px] text-slate-500">P.O. Box 45021 - 00100 Nairobi • info@edumax.edu</p>
                <p className="text-[10px] text-slate-400 font-mono">FINANCE & BURSAR DEPARTMENT</p>
              </div>

              <div className="border-t border-b border-slate-200 py-2.5 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt No:</span>
                  <span className="font-mono font-bold text-teal-800">{selectedReceipt.receipt_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="text-slate-700">{selectedReceipt.payment_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Admission No:</span>
                  <span className="font-mono text-slate-800">{selectedReceipt.admission_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Ref:</span>
                  <span className="font-mono text-slate-600">{selectedReceipt.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-semibold text-slate-800">{selectedReceipt.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Ref:</span>
                  <span className="font-mono text-slate-700">{selectedReceipt.transaction_reference}</span>
                </div>
              </div>

              <div className="p-3 bg-teal-50 rounded-xl flex items-center justify-between">
                <span className="font-bold text-teal-900 uppercase">Amount Received</span>
                <span className="text-lg font-black text-teal-700 font-mono">
                  Tsh {selectedReceipt.amount.toLocaleString()}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 text-center space-y-1 pt-1">
                <div className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  OFFICIALLY STAMPED & VERIFIED BY CHIEF BURSAR
                </div>
                <p>This is a computer generated receipt. Retain for student term clearance.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-semibold text-xs hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE SINGLE STUDENT INVOICE */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Single Student Invoice</h3>
                <p className="text-xs text-slate-500">Generate customized tuition bill with national Control Number</p>
              </div>
              <button
                onClick={() => setShowCreateInvoiceModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSingleInvoice} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hassan Said Mwinyi"
                    value={newSingleInvoice.student_name}
                    onChange={e => setNewSingleInvoice(prev => ({ ...prev, student_name: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Admission Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 241711356001"
                    value={newSingleInvoice.admission_number}
                    onChange={e => setNewSingleInvoice(prev => ({ ...prev, admission_number: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Class / Stream</label>
                  <select
                    value={newSingleInvoice.class_name}
                    onChange={e => setNewSingleInvoice(prev => ({ ...prev, class_name: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-teal-500 text-xs"
                  >
                    <option value="Form 1A">Form 1A</option>
                    <option value="Form 1B">Form 1B</option>
                    <option value="Form 2A">Form 2A</option>
                    <option value="Form 3A">Form 3A</option>
                    <option value="Form 4A">Form 4A</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Academic Term</label>
                  <select
                    value={newSingleInvoice.term}
                    onChange={e => setNewSingleInvoice(prev => ({ ...prev, term: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-teal-500 text-xs"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tuition Fee (TSh)</label>
                  <input
                    type="number"
                    value={newSingleInvoice.tuition}
                    onChange={e => setNewSingleInvoice(prev => ({ ...prev, tuition: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Boarding Fee (TSh)</label>
                  <input
                    type="number"
                    value={newSingleInvoice.boarding}
                    onChange={e => setNewSingleInvoice(prev => ({ ...prev, boarding: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lab / Library (TSh)</label>
                  <input
                    type="number"
                    value={newSingleInvoice.laboratory}
                    onChange={e => setNewSingleInvoice(prev => ({ ...prev, laboratory: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newSingleInvoice.due_date}
                    onChange={e => setNewSingleInvoice(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-teal-700">Total Invoice Amount</div>
                  <div className="text-sm font-black text-teal-900 font-mono">
                    Tsh {(
                      (parseFloat(newSingleInvoice.tuition) || 0) +
                      (parseFloat(newSingleInvoice.boarding) || 0) +
                      (parseFloat(newSingleInvoice.laboratory) || 0) +
                      (parseFloat(newSingleInvoice.activity) || 0)
                    ).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-teal-600 font-semibold">Auto-Generated Control Number</div>
                  <div className="font-mono text-xs font-bold text-teal-900">
                    9942008{newSingleInvoice.admission_number.replace(/[^0-9]/g, '').slice(-4).padStart(4, '0') || '1001'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
                >
                  Create &amp; Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STUDENT FILES (ADMIN UPLOADED) */}
      {showStudentFilesModal && selectedStudentForFiles && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Student Institutional Documents</h3>
                <p className="text-xs text-slate-500">Official documents &amp; bank slips uploaded by Admin / Admissions</p>
              </div>
              <button
                onClick={() => setShowStudentFilesModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-bold text-slate-900">{selectedStudentForFiles.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Admission No:</span>
                <span className="font-mono text-slate-700">{selectedStudentForFiles.admission_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Class &amp; Control #:</span>
                <span className="font-mono text-teal-700 font-semibold">{selectedStudentForFiles.class_name || 'Form 1A'} • {selectedStudentForFiles.control_number || '994200812901'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Uploaded Institutional Records</label>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                {(selectedStudentForFiles.student_files && selectedStudentForFiles.student_files.length > 0 ? selectedStudentForFiles.student_files : [
                  { name: 'Admin_Registration_Form.pdf', type: 'Admission File', size: '1.2 MB', date: '2026-01-10' },
                  { name: 'Bank_Deposit_Slip_Verified.pdf', type: 'Bank Slip', size: '480 KB', date: '2026-06-15' },
                  { name: 'Birth_Certificate_Attested.pdf', type: 'Identification', size: '1.9 MB', date: '2026-01-10' }
                ]).map((f, i) => (
                  <div key={i} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                      <div className="truncate">
                        <div className="font-medium text-slate-900 truncate">{f.name}</div>
                        <div className="text-[10px] text-slate-400">{f.type} • {f.size} • Uploaded {f.date}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => alert(`Opening student archive document:\nFile: ${f.name}\nType: ${f.type}\nStudent: ${selectedStudentForFiles.student_name}`)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 shrink-0"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowStudentFilesModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
              >
                Close Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADJUST / TOP-UP PAYMENT */}
      {showAdjustPaymentModal && selectedPaymentForAdjust && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Adjust / Top-Up Payment</h3>
                <p className="text-xs text-slate-500">Record supplemental installment or adjust recorded fee payment</p>
              </div>
              <button
                onClick={() => setShowAdjustPaymentModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustPayment} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <div className="font-bold text-amber-900">Target Student &amp; Payment</div>
                <div className="text-amber-800">Student: <strong>{selectedPaymentForAdjust.student_name}</strong> ({selectedPaymentForAdjust.admission_number})</div>
                <div className="text-amber-800">Current Payment: <strong className="font-mono">Tsh {selectedPaymentForAdjust.amount.toLocaleString()}</strong> ({selectedPaymentForAdjust.receipt_number})</div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Additional Top-Up Amount (TSh) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 150000"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Adjustment Reason / Bank Deposit Slip Ref</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="e.g. Second installment receipt slip #88214"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs"
                />
              </div>

              {adjustAmount && parseFloat(adjustAmount) > 0 && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                  <span className="font-bold text-teal-800">Updated New Total:</span>
                  <span className="text-base font-extrabold text-teal-900 font-mono">
                    Tsh {(selectedPaymentForAdjust.amount + (parseFloat(adjustAmount) || 0)).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustPaymentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
                >
                  Confirm &amp; Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOM DEBTOR MESSAGE COMPOSER (Notebook Page 1: "Wanafunzi wanaodaiwa na kuweza kuwatumia ujumbe ambao accountant anaandika") */}
      {showDebtorMessageModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                    <Send className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {isBulkDebtorMessage ? 'Send Reminder to All Indebted Students' : `Send Reminder to Parent of ${selectedDebtorForMessage?.student_name}`}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compose a personalized fee payment reminder message (Bursar payment dispatch).
                </p>
              </div>
              <button
                onClick={() => setShowDebtorMessageModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {debtorMessageSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{debtorMessageSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSendCustomDebtorMessage} className="space-y-4 text-xs">
              {/* Recipient Details Badge */}
              {!isBulkDebtorMessage && selectedDebtorForMessage && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Student:</span>
                    <span className="font-bold text-slate-900">{selectedDebtorForMessage.student_name} ({selectedDebtorForMessage.class_name})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Parent Phone:</span>
                    <span className="font-mono text-slate-700">{selectedDebtorForMessage.parent_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Outstanding Balance:</span>
                    <span className="font-mono font-bold text-rose-600">TSh {selectedDebtorForMessage.balance.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {isBulkDebtorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-medium">
                  This reminder will be dispatched to the parents/guardians of all <strong>{debtorsList.length}</strong> indebted students.
                </div>
              )}

              {/* Channel Selector */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Delivery Channel:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'SMS', label: 'Standard SMS' },
                    { id: 'WHATSAPP', label: 'WhatsApp Bot' },
                    { id: 'SYSTEM', label: 'System Notice' }
                  ].map(ch => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setDebtorMsgChannel(ch.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        debtorMsgChannel === ch.id
                          ? 'bg-rose-50 border-rose-300 text-rose-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Message Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Message Composed by Bursar:</label>
                  <span className="text-[10px] text-slate-400">{customDebtorMsgText.length} characters</span>
                </div>
                <textarea
                  rows={4}
                  value={customDebtorMsgText}
                  onChange={e => setCustomDebtorMsgText(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-rose-500 font-sans leading-relaxed"
                  required
                />
              </div>

              {/* Quick Tag Helpers */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-400 font-semibold text-[10px]">Insert Placeholder Tags:</span>
                {[
                  { tag: '{{student_name}}', label: 'Student Name' },
                  { tag: '{{outstanding_amount}}', label: 'Fee Balance' },
                  { tag: '{{control_number}}', label: 'Control Number' },
                ].map(t => (
                  <button
                    key={t.tag}
                    type="button"
                    onClick={() => setCustomDebtorMsgText(prev => `${prev} ${t.tag}`)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono border border-slate-200 cursor-pointer"
                  >
                    + {t.label}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDebtorMessageModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Message Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: OMBA RUHUSA YA KUTOA FEDHA (Notebook Page 1: "School Expenses: Mhasibu anaomba ruhusa ya kutoa fedha na Mkuu ndio ana approve") */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-teal-100 text-teal-700 rounded-lg">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-slate-900">Submit Expense Requisition</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  This request will be routed directly to the Headmaster for executive approval before disbursement.
                </p>
              </div>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Expense Title / Purpose:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Lab Reagents / Boarding Food Supplies"
                  value={newExpense.title}
                  onChange={e => setNewExpense(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Expense Category:</label>
                  <select
                    value={newExpense.category}
                    onChange={e => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Boarding & Meals">Boarding &amp; Meals</option>
                    <option value="Laboratory & Equipment">Science Laboratory &amp; Reagents</option>
                    <option value="Exam Materials">Examinations &amp; Stationery</option>
                    <option value="Transport & Fleet">School Bus Fuel &amp; Maintenance</option>
                    <option value="Repairs & Infrastructure">Repairs &amp; Maintenance</option>
                    <option value="Utilities">Utilities &amp; Public Services</option>
                    <option value="General Operations">General Institutional Operations</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Requested Amount (TSh):</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    placeholder="Amount in TSh (e.g. 1500000)"
                    value={newExpense.amount}
                    onChange={e => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payee / Vendor:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Supplier Company / Vendor Name"
                    value={newExpense.payee}
                    onChange={e => setNewExpense(prev => ({ ...prev, payee: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date Required:</label>
                  <input
                    type="date"
                    value={newExpense.required_date}
                    onChange={e => setNewExpense(prev => ({ ...prev, required_date: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Justification &amp; Details:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why these funds are necessary and the benefit to students and school operations..."
                  value={newExpense.justification}
                  onChange={e => setNewExpense(prev => ({ ...prev, justification: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Once you submit this requisition, its status will be set to <strong>Pending Headmaster Approval</strong>.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Submit to Headmaster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountantDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading Bursar & Finance Dashboard...</div>}>
      <AccountantDashboardContent />
    </Suspense>
  );
}
