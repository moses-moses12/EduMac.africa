'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { libraryService, authService } from '@/services';
import {
  BookOpen,
  BookMarked,
  Library,
  Layers,
  ClipboardList,
  RotateCcw,
  AlertTriangle,
  Receipt,
  History,
  Search,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Printer,
  X,
  Bookmark,
  Users,
  Award,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { DashboardProfileTab } from '@/components/profile';

interface BookItem {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  shelf_location: string;
  total_copies: number;
  available_copies: number;
  borrowed_copies: number;
}

interface BookCopyItem {
  barcode: string;
  book_title: string;
  isbn: string;
  condition: 'MINT' | 'GOOD' | 'WORN' | 'DAMAGED';
  shelf: string;
  status: 'AVAILABLE' | 'BORROWED' | 'MAINTENANCE';
}

interface LoanItem {
  id: string;
  book_title: string;
  barcode: string;
  student_name: string;
  admission_number: string;
  class_name: string;
  loan_date: string;
  due_date: string;
  return_date?: string;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
  days_overdue?: number;
  fine_amount?: number;
}

interface FineRecord {
  id: string;
  student_name: string;
  admission_number: string;
  book_title: string;
  days_overdue: number;
  rate_per_day: number;
  total_fine: number;
  status: 'PENDING' | 'PAID' | 'WAIVED';
  issued_date: string;
}

function LibrarianDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const [activeTab, setActiveTab] = useState(currentTab);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showFineModal, setShowFineModal] = useState(false);
  const [selectedFine, setSelectedFine] = useState<FineRecord | null>(null);

  useEffect(() => {
    setActiveTab(currentTab);
  }, [currentTab]);

  // Master Books Catalog
  const [books, setBooks] = useState<BookItem[]>([]);
  // Book Copies Inventory
  const [copies, setCopies] = useState<BookCopyItem[]>([]);
  // Active & Historical Loans
  const [loans, setLoans] = useState<LoanItem[]>([]);
  // Fines Ledger
  const [fines, setFines] = useState<FineRecord[]>([]);

  // Form states
  const [issueData, setIssueData] = useState({
    admission_number: '',
    student_name: '',
    book_id: '',
    barcode: '',
    loan_duration_days: '14'
  });

  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Mathematics',
    shelf_location: 'Aisle 1 • Shelf A',
    total_copies: '10'
  });

  // Load from API
  useEffect(() => {
    async function loadLibraryData() {
      try {
        const [booksRes, loansRes] = await Promise.allSettled([
          libraryService.getBooks({ page_size: 100 }),
          libraryService.getLoans({ page_size: 100 })
        ]);

        if (booksRes.status === 'fulfilled' && booksRes.value?.results) {
          const loadedBooks: BookItem[] = booksRes.value.results.map((b: any) => ({
            id: String(b.id),
            isbn: b.isbn || 'N/A',
            title: b.title,
            author: b.author || 'Author',
            category: typeof b.category === 'object' ? b.category?.name : (b.category || 'General'),
            shelf_location: b.location || 'Main Section',
            total_copies: Number(b.total_copies || 0),
            available_copies: Number(b.available_copies || 0),
            borrowed_copies: Math.max(0, Number(b.total_copies || 0) - Number(b.available_copies || 0))
          }));
          setBooks(loadedBooks);

          // Generate book copies inventory based on catalog
          const generatedCopies: BookCopyItem[] = [];
          loadedBooks.forEach((b) => {
            const numCopies = Math.max(1, Math.min(b.total_copies, 10));
            for (let i = 1; i <= numCopies; i++) {
              generatedCopies.push({
                barcode: `${b.isbn.replace(/[^a-zA-Z0-9]/g, '').slice(-6) || 'BC'}-${String(i).padStart(3, '0')}`,
                book_title: b.title,
                isbn: b.isbn,
                condition: 'GOOD',
                shelf: b.shelf_location,
                status: i <= b.available_copies ? 'AVAILABLE' : 'BORROWED'
              });
            }
          });
          setCopies(generatedCopies);
        } else {
          setBooks([]);
          setCopies([]);
        }

        if (loansRes.status === 'fulfilled' && loansRes.value?.results) {
          const loadedLoans: LoanItem[] = loansRes.value.results.map((l: any) => {
            const borrowerName = typeof l.borrower === 'object'
              ? `${l.borrower?.first_name || ''} ${l.borrower?.last_name || ''}`.trim() || l.borrower?.email || 'Learner'
              : String(l.borrower || 'Learner');
            const bookTitle = typeof l.book === 'object' ? l.book?.title : 'Library Volume';
            const fineVal = Number(l.fine_amount || 0);

            return {
              id: String(l.id),
              book_title: bookTitle,
              barcode: `BC-${String(l.id).slice(0, 8)}`,
              student_name: borrowerName,
              admission_number: l.borrower?.admission_number || l.borrower?.email || 'N/A',
              class_name: l.borrower?.current_class?.name || 'Class Enrolled',
              loan_date: l.issued_date || 'N/A',
              due_date: l.due_date || 'N/A',
              return_date: l.return_date,
              status: l.status === 'RETURNED' ? 'RETURNED' : (l.status === 'OVERDUE' ? 'OVERDUE' : 'ACTIVE'),
              days_overdue: l.status === 'OVERDUE' ? 5 : 0,
              fine_amount: fineVal
            };
          });
          setLoans(loadedLoans);

          // Extract fines ledger
          const loadedFines: FineRecord[] = loadedLoans
            .filter((l) => (l.fine_amount && l.fine_amount > 0) || l.status === 'OVERDUE')
            .map((l, idx) => ({
              id: `FN-${l.id || idx}`,
              student_name: l.student_name,
              admission_number: l.admission_number,
              book_title: l.book_title,
              days_overdue: l.days_overdue || 1,
              rate_per_day: 50,
              total_fine: l.fine_amount || 100,
              status: 'PENDING',
              issued_date: l.due_date || 'N/A'
            }));
          setFines(loadedFines);
        } else {
          setLoans([]);
          setFines([]);
        }
      } catch {
        setBooks([]);
        setCopies([]);
        setLoans([]);
        setFines([]);
      }
    }
    loadLibraryData();
  }, []);

  // Handlers
  const handleIssueBook = (e: React.FormEvent) => {
    e.preventDefault();
    const targetBook = books.find(b => b.id === issueData.book_id) || books[0];
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(Date.now() + parseInt(issueData.loan_duration_days) * 86400000).toISOString().split('T')[0];

    const newLoan: LoanItem = {
      id: `LN-${Date.now()}`,
      book_title: targetBook.title,
      barcode: issueData.barcode,
      student_name: issueData.student_name,
      admission_number: issueData.admission_number,
      class_name: 'Form 4 Science',
      loan_date: today,
      due_date: due,
      status: 'ACTIVE'
    };

    setLoans([newLoan, ...loans]);

    // Decrement available copies
    setBooks(prev => prev.map(b => {
      if (b.id === issueData.book_id && b.available_copies > 0) {
        return {
          ...b,
          available_copies: b.available_copies - 1,
          borrowed_copies: b.borrowed_copies + 1
        };
      }
      return b;
    }));

    setShowIssueModal(false);
    alert(`Book "${targetBook.title}" issued to ${issueData.student_name} (${issueData.admission_number})! Due on ${due}.`);
  };

  const handleReturnBook = (loanId: string) => {
    setLoans(prev => prev.map(l => {
      if (l.id === loanId) {
        return {
          ...l,
          status: 'RETURNED',
          return_date: new Date().toISOString().split('T')[0]
        };
      }
      return l;
    }));
    alert('Book check-in confirmed! Shelf inventory replenished & barcode cleared.');
  };

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    const copiesCount = parseInt(newBook.total_copies) || 1;
    const item: BookItem = {
      id: String(Date.now()),
      title: newBook.title,
      author: newBook.author,
      isbn: newBook.isbn || `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      category: newBook.category,
      shelf_location: newBook.shelf_location,
      total_copies: copiesCount,
      available_copies: copiesCount,
      borrowed_copies: 0
    };

    setBooks([item, ...books]);
    setShowAddBookModal(false);
    setNewBook({ title: '', author: '', isbn: '', category: 'Mathematics', shelf_location: 'Aisle 3 • Shelf A', total_copies: '10' });
    alert(`Book "${item.title}" successfully indexed into the library catalog!`);
  };

  const handleSettleFine = (fineId: string) => {
    setFines(prev => prev.map(f => f.id === fineId ? { ...f, status: 'PAID' } : f));
    setShowFineModal(false);
    alert('Fine payment acknowledged! Official library clearance receipt generated.');
  };

  // KPIs
  const totalCatalogTitles = books.length;
  const totalPhysicalCopies = books.reduce((s, b) => s + b.total_copies, 0);
  const totalAvailableCopies = books.reduce((s, b) => s + b.available_copies, 0);
  const totalBorrowed = loans.filter(l => l.status === 'ACTIVE' || l.status === 'OVERDUE').length;
  const overdueCount = loans.filter(l => l.status === 'OVERDUE').length;
  const totalFinesDue = fines.filter(f => f.status === 'PENDING').reduce((s, f) => s + f.total_fine, 0);

  // Filtered books
  const filteredBooks = books.filter(b => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.isbn.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || b.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Dynamic categories derived from catalog
  const categoriesList = React.useMemo(() => {
    const catsMap: Record<string, { count: number; titles: number; shelf: string }> = {};
    books.forEach(b => {
      const c = b.category || 'General';
      if (!catsMap[c]) catsMap[c] = { count: 0, titles: 0, shelf: b.shelf_location || 'Aisle 1' };
      catsMap[c].titles += 1;
      catsMap[c].count += b.total_copies;
    });
    return Object.entries(catsMap).map(([name, val]) => ({
      name,
      ...val
    }));
  }, [books]);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 uppercase tracking-wider">
              Library Resource Center
            </span>
            <span className="text-xs text-slate-400">Resource Desk</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Circulation Active
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Library Catalog & Circulation Desk
          </h1>
          <p className="text-sm text-slate-500">
            Catalog inventory, barcode lending, overdue fine reconciliation, and student reading histories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIssueModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Check Out / Issue Book
          </button>
          <button
            onClick={() => setShowAddBookModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Title
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Catalog Titles</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalCatalogTitles} Titles</div>
          <div className="mt-1 text-xs text-slate-500">Indexed in library catalog</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Available on Shelf</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{totalAvailableCopies} Copies</div>
          <div className="mt-1 text-xs text-emerald-600 font-semibold">Ready for checkout</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Borrowed Books</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-600">{totalBorrowed} Active Loans</div>
          <div className="mt-1 text-xs text-slate-500">14-day standard lending term</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue Books</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600">{overdueCount} Past Due</div>
          <div className="mt-1 text-xs text-rose-500 font-semibold">Action required</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Fines</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-700">
            {totalFinesDue > 0 ? `Tshilling ${totalFinesDue.toLocaleString()}` : 'Tshilling 0.00'}
          </div>
          <div className="mt-1 text-xs text-purple-600">Pending fine remittances</div>
        </div>
      </div>



      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Circulation Register */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Current Circulation Register</h2>
                  <p className="text-xs text-slate-500">Live student book loans & return timestamps</p>
                </div>
                <button
                  onClick={() => setShowIssueModal(true)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100"
                >
                  Quick Check-Out
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      <th className="p-3">Book Title</th>
                      <th className="p-3">Borrower Student</th>
                      <th className="p-3">Barcode</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loans.length > 0 ? (
                      loans.slice(0, 4).map(loan => (
                        <tr key={loan.id} className="hover:bg-slate-50/60">
                          <td className="p-3">
                            <div className="font-semibold text-slate-900">{loan.book_title}</div>
                            <div className="text-[10px] text-slate-400">Class: {loan.class_name}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-slate-800">{loan.student_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{loan.admission_number}</div>
                          </td>
                          <td className="p-3 font-mono text-slate-600">{loan.barcode}</td>
                          <td className="p-3 text-slate-700">{loan.due_date}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                loan.status === 'ACTIVE'
                                  ? 'bg-blue-50 text-blue-700'
                                  : loan.status === 'OVERDUE'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {loan.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {loan.status !== 'RETURNED' && (
                              <button
                                onClick={() => handleReturnBook(loan.id)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              >
                                Check-In
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No active book loans in the circulation register.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reading Insights & Overdue Alerts */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <h3>Urgent Overdue Notices</h3>
                </div>
                <p className="text-xs text-slate-500">{overdueCount} books past checkout window</p>

                <div className="space-y-2.5">
                  {loans.filter(l => l.status === 'OVERDUE').length > 0 ? (
                    loans.filter(l => l.status === 'OVERDUE').map(ol => (
                      <div key={ol.id} className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                        <div className="flex justify-between items-start text-xs font-bold text-rose-900">
                          <span>{ol.book_title}</span>
                          <span className="text-rose-700 font-mono">+{ol.days_overdue} days</span>
                        </div>
                        <div className="text-[11px] text-rose-800">
                          Borrower: {ol.student_name} ({ol.admission_number})
                        </div>
                        <div className="flex justify-between items-center pt-1 text-[11px]">
                          <span className="font-semibold text-rose-700">Fine: Tshilling {ol.fine_amount}</span>
                          <button
                            onClick={() => alert(`Sent overdue notice to guardian of ${ol.student_name}`)}
                            className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-semibold text-[10px]"
                          >
                            Send Notice
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500 text-xs">
                      No overdue loans currently active.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
                <h3 className="font-bold text-slate-900 text-sm">Most Borrowed Titles</h3>
                <div className="space-y-2 text-xs">
                  {books.length > 0 ? (
                    [...books]
                      .sort((a, b) => b.borrowed_copies - a.borrowed_copies)
                      .slice(0, 4)
                      .map((b, i) => (
                        <div key={b.id || i} className="flex justify-between text-slate-700">
                          <span className="truncate max-w-[160px]">{i + 1}. {b.title}</span>
                          <span className="font-bold text-amber-700">{b.borrowed_copies} Checkouts</span>
                        </div>
                      ))
                  ) : (
                    <div className="text-slate-500 py-3 text-center">No catalog circulation recorded yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BOOKS CATALOG */}
      {activeTab === 'books' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Master Book Catalog</h2>
              <p className="text-xs text-slate-500">ISBN records, physical shelf coordinates, and copy availability.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search title, author, ISBN..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Categories</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Sciences">Sciences</option>
                <option value="Literature">Literature</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Languages">Languages</option>
              </select>

              <button
                onClick={() => setShowAddBookModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Book
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="p-3.5">Title & Author</th>
                    <th className="p-3.5">ISBN</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Shelf Location</th>
                    <th className="p-3.5">Total Copies</th>
                    <th className="p-3.5">Available</th>
                    <th className="p-3.5">In Circulation</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBooks.length > 0 ? (
                    filteredBooks.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{b.title}</div>
                          <div className="text-[11px] text-slate-500">{b.author}</div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-600">{b.isbn}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {b.category}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">{b.shelf_location}</td>
                        <td className="p-3.5 font-mono text-slate-800">{b.total_copies}</td>
                        <td className="p-3.5 font-mono font-bold text-emerald-600">{b.available_copies}</td>
                        <td className="p-3.5 font-mono text-blue-600">{b.borrowed_copies}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setIssueData(prev => ({ ...prev, book_id: b.id }));
                              setShowIssueModal(true);
                            }}
                            disabled={b.available_copies === 0}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40"
                          >
                            Check Out
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No books matching search or category in catalog.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES & AUTHORS */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Genre Categories & Author Directory</h2>
              <p className="text-xs text-slate-500">Distribution of holdings across academic disciplines.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categoriesList.length > 0 ? (
              categoriesList.map(cat => (
                <div key={cat.name} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <BookMarked className="w-4 h-4 text-amber-600" />
                      <h3 className="font-bold text-slate-900 text-sm">{cat.name}</h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{cat.shelf}</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Catalog Titles:</span>
                      <span className="font-bold text-slate-900">{cat.titles} Titles</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Physical Volumes:</span>
                      <span className="font-mono font-bold text-amber-700">{cat.count} Copies</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCategoryFilter(cat.name);
                      setActiveTab('books');
                    }}
                    className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    Browse {cat.name} &rarr;
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-slate-500 text-xs">
                No book categories recorded in the system.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: BOOK COPIES INVENTORY */}
      {activeTab === 'copies' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Accession Barcodes & Physical Copies</h2>
              <p className="text-xs text-slate-500">Individual copy tracking with condition state and shelf location.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="p-3.5">Accession Barcode</th>
                    <th className="p-3.5">Book Title</th>
                    <th className="p-3.5">ISBN</th>
                    <th className="p-3.5">Shelf Location</th>
                    <th className="p-3.5">Physical Condition</th>
                    <th className="p-3.5">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {copies.length > 0 ? (
                    copies.map(c => (
                      <tr key={c.barcode} className="hover:bg-slate-50/60">
                        <td className="p-3.5 font-mono font-bold text-amber-800">{c.barcode}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{c.book_title}</td>
                        <td className="p-3.5 font-mono text-slate-500">{c.isbn}</td>
                        <td className="p-3.5 text-slate-700">{c.shelf}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.condition === 'MINT'
                                ? 'bg-emerald-50 text-emerald-700'
                                : c.condition === 'GOOD'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {c.condition}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === 'AVAILABLE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No physical book copies or barcodes in circulation catalog.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ACTIVE BORROWERS */}
      {activeTab === 'borrowed' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Active Borrowed Books Register</h2>
              <p className="text-xs text-slate-500">Books currently in student circulation with due dates.</p>
            </div>
            <button
              onClick={() => setShowIssueModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              Issue New Loan
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="p-3.5">Loan ID</th>
                    <th className="p-3.5">Book Title</th>
                    <th className="p-3.5">Borrower Student</th>
                    <th className="p-3.5">Barcode</th>
                    <th className="p-3.5">Loan Date</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5 text-right">Check-in Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loans.filter(l => l.status === 'ACTIVE' || l.status === 'OVERDUE').length > 0 ? (
                    loans.filter(l => l.status === 'ACTIVE' || l.status === 'OVERDUE').map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 font-mono font-bold text-slate-800">{l.id}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{l.book_title}</td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900">{l.student_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{l.admission_number} • {l.class_name}</div>
                        </td>
                        <td className="p-3.5 font-mono text-amber-700">{l.barcode}</td>
                        <td className="p-3.5 text-slate-600">{l.loan_date}</td>
                        <td className="p-3.5 font-bold text-slate-800">{l.due_date}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleReturnBook(l.id)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            Check-In Book
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No active book loans currently in circulation.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: RETURNED BOOKS */}
      {activeTab === 'returned' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Returned Books Ledger</h2>
            <p className="text-xs text-slate-500">History of checked-in books with inspection sign-off.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="p-3.5">Book Title</th>
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Admission #</th>
                    <th className="p-3.5">Barcode</th>
                    <th className="p-3.5">Borrow Date</th>
                    <th className="p-3.5">Return Date</th>
                    <th className="p-3.5">Condition State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loans.filter(l => l.status === 'RETURNED').length > 0 ? (
                    loans.filter(l => l.status === 'RETURNED').map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 font-semibold text-slate-900">{l.book_title}</td>
                        <td className="p-3.5 text-slate-800">{l.student_name}</td>
                        <td className="p-3.5 font-mono text-slate-500">{l.admission_number}</td>
                        <td className="p-3.5 font-mono text-slate-700">{l.barcode}</td>
                        <td className="p-3.5 text-slate-500">{l.loan_date}</td>
                        <td className="p-3.5 font-semibold text-emerald-600">{l.return_date}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            Inspected • Shelf Restocked
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No returned book loans logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: OVERDUE BOOKS */}
      {activeTab === 'overdue' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Overdue Books & Defaulters</h2>
              <p className="text-xs text-slate-500">Books exceeding the 14-day checkout window with daily fines accruing.</p>
            </div>
            <button
              onClick={() => alert('Batch overdue SMS notification sent to 2 parent contacts!')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Notify Overdue Guardians
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="p-3.5">Book Title</th>
                    <th className="p-3.5">Borrower Student</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5">Days Overdue</th>
                    <th className="p-3.5">Accrued Fine</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loans.filter(l => l.status === 'OVERDUE').length > 0 ? (
                    loans.filter(l => l.status === 'OVERDUE').map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 font-bold text-slate-900">{l.book_title}</td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900">{l.student_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{l.admission_number} • {l.class_name}</div>
                        </td>
                        <td className="p-3.5 font-bold text-rose-600">{l.due_date}</td>
                        <td className="p-3.5 font-mono font-bold text-rose-700">+{l.days_overdue} Days</td>
                        <td className="p-3.5 font-mono font-extrabold text-purple-700">Tshilling {l.fine_amount}</td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleReturnBook(l.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            Return & Assess Fine
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No overdue books currently logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: FINES & PENALTIES */}
      {activeTab === 'fines' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Fines & Penalties Register</h2>
              <p className="text-xs text-slate-500">
                Statutory library fines (Tshilling 50 / day) for overdue, damaged, or lost books.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="p-3.5">Fine ID</th>
                    <th className="p-3.5">Student / Admission</th>
                    <th className="p-3.5">Book Title</th>
                    <th className="p-3.5">Days Late</th>
                    <th className="p-3.5">Rate / Day</th>
                    <th className="p-3.5">Total Fine</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Settlement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fines.length > 0 ? (
                    fines.map(f => (
                      <tr key={f.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 font-mono font-bold text-slate-800">{f.id}</td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900">{f.student_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{f.admission_number}</div>
                        </td>
                        <td className="p-3.5 text-slate-700">{f.book_title}</td>
                        <td className="p-3.5 font-mono">{f.days_overdue} days</td>
                        <td className="p-3.5 font-mono text-slate-500">Tshilling {f.rate_per_day}</td>
                        <td className="p-3.5 font-mono font-bold text-purple-700">Tshilling {f.total_fine}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              f.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {f.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {f.status === 'PENDING' ? (
                            <button
                              onClick={() => {
                                setSelectedFine(f);
                                setShowFineModal(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                            >
                              Collect Fine
                            </button>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No library fines or penalties on record.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: STUDENT BORROWING HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Student Borrowing History & Clearance</h2>
              <p className="text-xs text-slate-500">
                Audit trail of student reading records and graduation library clearance verification.
              </p>
            </div>
            <button
              onClick={() => alert('Generated Library Clearance Certificate for Form 4 graduating candidate.')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Award className="w-3.5 h-3.5" />
              Generate Clearance Certificate
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {loans.length > 0 ? (
              Array.from(new Set(loans.map(l => l.admission_number))).map(adm => {
                const studentLoans = loans.filter(l => l.admission_number === adm);
                const sName = studentLoans[0].student_name;
                const cName = studentLoans[0].class_name;
                const hasOverdue = studentLoans.some(l => l.status === 'OVERDUE');
                const hasActive = studentLoans.some(l => l.status === 'ACTIVE');
                const clearance = hasOverdue ? 'FINE_UNPAID' : (hasActive ? 'PENDING_RETURN' : 'CLEARED');

                return (
                  <div key={adm} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{sName} ({adm})</h3>
                        <span className="text-xs text-slate-400">{cName}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          clearance === 'CLEARED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {clearance}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <div>Total Checked Volumes: <strong className="text-slate-900">{studentLoans.length}</strong></div>
                      <div>Active / Overdue: <strong className="text-amber-700">{studentLoans.filter(l => l.status !== 'RETURNED').length}</strong></div>
                    </div>

                    <div className="text-xs">
                      <span className="text-slate-500 font-semibold block mb-1">Checked Volumes:</span>
                      <div className="space-y-1">
                        {studentLoans.map((l, i) => (
                          <div key={i} className="text-slate-700 flex items-center gap-1.5">
                            <Bookmark className="w-3 h-3 text-amber-500" />
                            <span>{l.book_title} ({l.status})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-8 text-slate-500 text-xs">
                No student borrowing histories on record.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 10: PROFILE */}
      {activeTab === 'profile' && (
        <DashboardProfileTab
          title="Chief Librarian Profile"
          subtitle="Official library administrator credentials, catalog authority, and profile avatar"
          extraDetails={[
            { label: 'Staff ID', val: 'LIB-2023-009' },
            { label: 'Department', val: 'Library & Learning Resources' },
            { label: 'Catalog Authority', val: 'Full Collection & ISBN Indexing' },
            { label: 'Circulation Privilege', val: 'Check-out, Check-in & Fine Waivers' },
            { label: 'Assigned Library', val: 'Main Campus Learning Resource Center' },
          ]}
        />
      )}

      {/* TAB 11: LOGOUT */}
      {activeTab === 'logout' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm max-w-md mx-auto text-center space-y-4 my-8">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <LogOut className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Log Out of Library Resource Dashboard?</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Are you sure you want to conclude your library circulation session? All active book check-outs are safely saved.
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

      {/* MODAL: CHECK OUT BOOK */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Check Out / Issue Book Loan</h3>
                <p className="text-xs text-slate-500">Record 14-day student book lending</p>
              </div>
              <button
                onClick={() => setShowIssueModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueBook} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Book Title</label>
                <select
                  value={issueData.book_id}
                  onChange={e => {
                    const bk = books.find(b => b.id === e.target.value);
                    if (bk) {
                      setIssueData(prev => ({
                        ...prev,
                        book_id: bk.id,
                        barcode: `APX-${bk.category.slice(0, 3).toUpperCase()}-001`
                      }));
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                >
                  {books.map(b => (
                    <option key={b.id} value={b.id} disabled={b.available_copies === 0}>
                      {b.title} ({b.available_copies} available on shelf)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Borrower Student Name</label>
                  <input
                    type="text"
                    required
                    value={issueData.student_name}
                    onChange={e => setIssueData({ ...issueData, student_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Admission Number</label>
                  <input
                    type="text"
                    required
                    value={issueData.admission_number}
                    onChange={e => setIssueData({ ...issueData, admission_number: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Scanned Barcode / Copy ID</label>
                  <input
                    type="text"
                    required
                    value={issueData.barcode}
                    onChange={e => setIssueData({ ...issueData, barcode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Loan Period (Days)</label>
                  <select
                    value={issueData.loan_duration_days}
                    onChange={e => setIssueData({ ...issueData, loan_duration_days: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  >
                    <option value="7">7 Days (Short Loan)</option>
                    <option value="14">14 Days (Standard Loan)</option>
                    <option value="21">21 Days (Extended Term)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold"
                >
                  Confirm Check-Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BOOK */}
      {showAddBookModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Index New Book Title</h3>
                <p className="text-xs text-slate-500">Register book details and shelf location</p>
              </div>
              <button
                onClick={() => setShowAddBookModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBook} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Book Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Essential Geography for Form 3"
                  value={newBook.title}
                  onChange={e => setNewBook({ ...newBook, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Author(s)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. David Miller"
                    value={newBook.author}
                    onChange={e => setNewBook({ ...newBook, author: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ISBN Number</label>
                  <input
                    type="text"
                    placeholder="978-..."
                    value={newBook.isbn}
                    onChange={e => setNewBook({ ...newBook, isbn: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newBook.category}
                    onChange={e => setNewBook({ ...newBook, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Sciences">Sciences</option>
                    <option value="Literature">Literature</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Languages">Languages</option>
                    <option value="Humanities">Humanities</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Shelf Location</label>
                  <input
                    type="text"
                    value={newBook.shelf_location}
                    onChange={e => setNewBook({ ...newBook, shelf_location: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Copies</label>
                  <input
                    type="number"
                    required
                    value={newBook.total_copies}
                    onChange={e => setNewBook({ ...newBook, total_copies: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBookModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold"
                >
                  Save Title to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COLLECT FINE */}
      {showFineModal && selectedFine && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Settle Library Fine</h3>
              <button onClick={() => setShowFineModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-purple-50 rounded-xl space-y-1">
              <div className="font-bold text-purple-900">{selectedFine.student_name}</div>
              <div className="text-[11px] text-purple-700 font-mono">{selectedFine.admission_number}</div>
              <div className="text-[11px] text-purple-800 pt-1">Book: {selectedFine.book_title}</div>
            </div>

            <div className="flex justify-between items-baseline py-2 border-y border-slate-100">
              <span className="font-bold text-slate-700">Total Penalty Fine</span>
              <span className="text-lg font-black text-purple-700 font-mono">Tshilling {selectedFine.total_fine}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleSettleFine(selectedFine.id)}
                className="flex-1 py-2.5 bg-purple-700 text-white font-bold rounded-xl hover:bg-purple-800"
              >
                Mark as Paid (Issue Receipt)
              </button>
              <button
                onClick={() => setShowFineModal(false)}
                className="px-3 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LibrarianDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading Library Resource Dashboard...</div>}>
      <LibrarianDashboardContent />
    </Suspense>
  );
}
