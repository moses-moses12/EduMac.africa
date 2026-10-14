'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  academicService,
  AcademicClass,
  Subject,
  TeacherAssignment,
  AcademicCalendarEvent,
  AcademicYear,
  Term,
} from '@/services';
import { DashboardProfileTab } from '@/components/profile';
import {
  Calendar,
  Grid,
  Plus,
  BookMarked,
  Clock,
  User,
  Users,
  CalendarCheck,
  Layers,
  RefreshCw,
} from 'lucide-react';

function AcademicDashboardContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as
    | 'hierarchy'
    | 'classes'
    | 'subjects'
    | 'terms'
    | 'assignments'
    | 'calendar'
    | 'profile'
    | null;

  const [activeTab, setActiveTab] = useState<
    'hierarchy' | 'classes' | 'subjects' | 'terms' | 'assignments' | 'calendar' | 'profile'
  >('hierarchy');

  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<AcademicCalendarEvent[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (
      tabParam &&
      ['hierarchy', 'classes', 'subjects', 'terms', 'assignments', 'calendar', 'profile'].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clsRes, subRes, assignRes, calRes, yrRes, termRes] = await Promise.allSettled([
        academicService.getClasses(),
        academicService.getSubjects(),
        academicService.getTeacherAssignments(),
        academicService.getAcademicCalendar(),
        academicService.getAcademicYears(),
        academicService.getTerms(),
      ]);

      if (clsRes.status === 'fulfilled' && clsRes.value?.results) {
        setClasses(clsRes.value.results);
      } else {
        setClasses([]);
      }
      if (subRes.status === 'fulfilled' && subRes.value?.results) {
        setSubjects(subRes.value.results);
      } else {
        setSubjects([]);
      }
      if (assignRes.status === 'fulfilled' && assignRes.value?.results) {
        setAssignments(assignRes.value.results);
      } else {
        setAssignments([]);
      }
      if (calRes.status === 'fulfilled' && calRes.value?.results) {
        setCalendarEvents(calRes.value.results);
      } else {
        setCalendarEvents([]);
      }
      if (yrRes.status === 'fulfilled' && yrRes.value?.results) {
        setAcademicYears(yrRes.value.results);
      } else {
        setAcademicYears([]);
      }
      if (termRes.status === 'fulfilled' && termRes.value?.results) {
        setTerms(termRes.value.results);
      } else {
        setTerms([]);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentYear = academicYears.find((y) => y.is_current) || academicYears[0];
  const currentTerm = terms.find((t) => t.is_current) || terms[0];

  return (
    <div className="space-y-7">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-900 text-white uppercase tracking-wider">
              Dean of Academic Affairs
            </span>
            <span className="text-xs text-slate-500">Curriculum, Faculty Assignment & Calendar Governance</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1.5">Academic Module</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hierarchical structure: Academic Year → Term → Classes → Streams → Students with curriculum allocation.
          </p>
        </div>
        <button
          onClick={loadData}
          className={`p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition self-start sm:self-auto cursor-pointer ${
            loading ? 'animate-spin' : ''
          }`}
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>



      {/* ── TAB: ACADEMIC HIERARCHY TREE EXPLORER ── */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Institutional Relationship Hierarchy
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Academic Year → Term → Classes → Streams → Enrolled Students
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Schema Verified
              </span>
            </div>

            {/* Tree representation */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200">
                <div className="flex items-center gap-2 font-bold text-indigo-950 text-sm">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Academic Year: {currentYear ? `${currentYear.name} ${currentYear.is_current ? '(Active Session)' : ''}` : 'No Active Session'}
                </div>
                <div className="text-xs text-indigo-700 ml-6 mt-1">
                  {currentYear
                    ? `Valid: ${currentYear.start_date || 'N/A'} – ${currentYear.end_date || 'N/A'} • ${terms.length} Registered Term${terms.length === 1 ? '' : 's'}`
                    : 'Configure academic years to view institutional hierarchy.'}
                </div>

                <div className="mt-4 ml-6 space-y-4 border-l-2 border-indigo-200 pl-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      {currentTerm ? `${currentTerm.name} • ${currentTerm.start_date || 'N/A'} – ${currentTerm.end_date || 'N/A'}` : 'No Active Term Configured'}
                    </div>

                    <div className="ml-4 space-y-3 border-l-2 border-slate-200 pl-4">
                      {classes.length === 0 ? (
                        <div className="p-8 text-center rounded-xl bg-white border border-slate-200 text-slate-500">
                          <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-slate-700">No classes or streams registered</p>
                          <p className="text-xs text-slate-400 mt-1">Configure classes and stream allocations to view hierarchy structure.</p>
                        </div>
                      ) : (
                        classes.map((cls) => (
                          <div key={cls.id} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                <Grid className="w-3.5 h-3.5 text-indigo-600" />
                                Class: {cls.name} {cls.code ? `(${cls.code})` : ''}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-500">
                                Level {cls.order ?? 1}
                              </span>
                            </div>

                            <div className="ml-4 space-y-2 pt-2 border-t border-slate-100">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Allocated Streams:
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {cls.streams && cls.streams.length > 0 ? (
                                  cls.streams.map((stream) => (
                                    <div
                                      key={stream.id}
                                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between"
                                    >
                                      <div>
                                        <span className="font-semibold text-slate-800">{stream.name}</span>
                                        <span className="text-[10px] text-slate-400 block">Cap: {stream.capacity} seats</span>
                                      </div>
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                        {stream.student_count ?? 0} Students
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-2 rounded-lg bg-slate-50 text-slate-400 text-xs">
                                    No streams allocated
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: CLASSES & STREAMS ── */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {classes.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200/80">
              <Grid className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No classes registered</p>
              <p className="text-xs text-slate-400 mt-1">Add classes and stream structures to start managing curricula.</p>
            </div>
          ) : (
            classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:border-indigo-300 transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 font-mono px-2 py-0.5 rounded bg-indigo-50">
                    {cls.code || 'FORM'}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">Order #{cls.order ?? 1}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{cls.name}</h3>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Active Streams
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cls.streams && cls.streams.length > 0 ? (
                      cls.streams.map((s) => (
                        <span key={s.id} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                          {s.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">No streams allocated</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{cls.streams?.length || 0} stream{cls.streams?.length === 1 ? '' : 's'}</span>
                  <span className="font-bold text-indigo-600">{cls.total_students ?? 0} Students</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB: SUBJECTS CATALOG ── */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Curriculum Subject Directory</h2>
              <p className="text-xs text-slate-500">Accredited curriculum subjects, course codes, and departments</p>
            </div>
            <button
              onClick={() => alert('Add Subject')}
              className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Subject
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="p-4">Subject Name</th>
                  <th className="p-4">Course Code</th>
                  <th className="p-4">Classification</th>
                  <th className="p-4">Department</th>
                  <th className="p-4 text-right">Credit Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                      No curriculum subjects registered yet.
                    </td>
                  </tr>
                ) : (
                  subjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{sub.name}</td>
                      <td className="p-4 font-mono text-indigo-600 font-semibold">{sub.code}</td>
                      <td className="p-4">
                        {sub.is_core ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Mandatory Core
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Elective
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{sub.department || 'General Curriculum'}</td>
                      <td className="p-4 text-right font-mono text-slate-700 font-bold">
                        {sub.credit_units ?? 0} Units
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: TEACHER ASSIGNMENTS ── */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Faculty Subject & Class Allocation</h2>
              <p className="text-xs text-slate-500">Teacher assignments across classes, streams, and teaching periods</p>
            </div>
            <button
              onClick={() => alert('Assign Teacher')}
              className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Assign Teacher
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="p-4">Faculty Member</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Class & Stream</th>
                  <th className="p-4">Role</th>
                  <th className="p-4 text-center">Periods/Wk</th>
                  <th className="p-4">Term</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                      No teacher assignments recorded yet.
                    </td>
                  </tr>
                ) : (
                  assignments.map((asg) => (
                    <tr key={asg.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{asg.teacher_name || 'Faculty Member'}</div>
                        <div className="text-[11px] text-slate-400">{asg.teacher_email || '—'}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-800">{asg.subject_name || 'Subject'}</span>
                        {asg.subject_code && (
                          <span className="text-[10px] text-indigo-600 font-mono block">[{asg.subject_code}]</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-800">{asg.class_name || 'Class'}</span>
                        {asg.stream_name && <span className="text-slate-400 text-[11px]"> • {asg.stream_name}</span>}
                      </td>
                      <td className="p-4">
                        {asg.is_class_teacher ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Class Teacher
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Subject Teacher
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center font-bold text-indigo-600 font-mono">
                        {asg.periods_per_week ?? 0}
                      </td>
                      <td className="p-4 text-slate-600">{asg.term_name || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: ACADEMIC CALENDAR ── */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-indigo-600" />
                  Institutional Academic Calendar
                </h3>
                <p className="text-xs text-slate-500">Scheduled milestones, examination windows, and school holidays</p>
              </div>
              <button
                onClick={() => alert('Add Calendar Event')}
                className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Milestone
              </button>
            </div>

            {calendarEvents.length === 0 ? (
              <div className="p-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No calendar events scheduled</p>
                <p className="text-xs text-slate-400 mt-1">Institutional academic milestones and exam windows will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {calendarEvents.map((evt) => {
                  const eventColor =
                    evt.event_type === 'EXAMINATION'
                      ? 'border-rose-200 bg-rose-50/40 text-rose-800'
                      : evt.event_type === 'SPORTS'
                      ? 'border-emerald-200 bg-emerald-50/40 text-emerald-800'
                      : evt.event_type === 'HOLIDAY'
                      ? 'border-amber-200 bg-amber-50/40 text-amber-800'
                      : 'border-indigo-200 bg-indigo-50/40 text-indigo-800';

                  return (
                    <div key={evt.id} className={`p-5 rounded-2xl border shadow-2xs space-y-3 ${eventColor}`}>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/80">
                          {evt.event_type_display || evt.event_type}
                        </span>
                        <span className="text-[11px] font-semibold opacity-75">{evt.term_name || 'Term'}</span>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-sm">{evt.title}</h4>
                      {evt.description && <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>}

                      <div className="pt-3 border-t border-slate-200/60 flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <Calendar className="w-3.5 h-3.5 opacity-60" />
                        <span>
                          {evt.start_date} to {evt.end_date}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: TERMS ── */}
      {activeTab === 'terms' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {terms.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200/80">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No terms configured</p>
                <p className="text-xs text-slate-400 mt-1">Academic terms and teaching periods will be listed here once configured.</p>
              </div>
            ) : (
              terms.map((t) => (
                <div
                  key={t.id}
                  className={`bg-white rounded-2xl border p-6 relative shadow-xs ${
                    t.is_current ? 'border-2 border-indigo-600 shadow-md' : 'border-slate-200/80'
                  }`}
                >
                  {t.is_current && (
                    <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
                      Active Term
                    </span>
                  )}
                  <div className="text-xs font-semibold text-indigo-600 font-mono">
                    {t.academic_year_name || 'Academic Session'}
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">{t.name}</h3>
                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>
                        {t.start_date || 'TBD'} – {t.end_date || 'TBD'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{t.is_current ? 'Current Teaching Term' : 'Scheduled Term'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB: PROFILE ── */}
      {activeTab === 'profile' && (
        <DashboardProfileTab
          title="Dean of Academic Affairs Profile"
          subtitle="Curriculum governance, academic authority, and avatar photo"
          extraDetails={[
            { label: 'Academic Leadership', val: 'Curriculum & Faculty Oversight' },
            {
              label: 'Active Academic Year',
              val: currentYear ? `${currentYear.name} (${currentTerm?.name || 'In Session'})` : 'Not configured',
            },
          ]}
        />
      )}
    </div>
  );
}

export default function AcademicDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-400">Loading academic workspace...</div>}>
      <AcademicDashboardContent />
    </Suspense>
  );
}
