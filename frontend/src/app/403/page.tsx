'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ShieldAlert, ArrowLeft, LogOut, KeyRound } from 'lucide-react';

function ForbiddenContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuth();

  const userRole = searchParams.get('userRole') || user?.role || 'STUDENT';
  const targetPath = searchParams.get('target') || 'Protected Resource';
  const requiredRole = searchParams.get('required') || 'ADMIN';

  const roleDashboardMap: Record<string, string> = {
    ADMIN: '/dashboard/admin',
    HEADMASTER: '/dashboard/headmaster',
    ACADEMIC: '/dashboard/academic',
    TEACHER: '/dashboard/teacher',
    STUDENT: '/dashboard/student',
    PARENT: '/dashboard/parent',
    ACCOUNTANT: '/dashboard/accountant',
    LIBRARIAN: '/dashboard/librarian',
    EXAM_OFFICER: '/dashboard/exam',
    STAFF: '/dashboard/staff',
  };

  const handleReturnHome = () => {
    const destination = roleDashboardMap[userRole] || '/dashboard';
    router.push(destination);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Icon Badge */}
          <div className="h-16 w-16 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ShieldAlert className="h-8 w-8" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
              HTTP 403 Forbidden
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Access Restricted
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              You do not have permission to access this resource. Your account role lacks the required authorization privilege.
            </p>
          </div>

          {/* Diagnostic Context Card */}
          <div className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-4 text-left text-xs font-mono space-y-2.5">
            <div className="flex justify-between items-center text-slate-400">
              <span>Attempted Target:</span>
              <span className="text-slate-200 truncate max-w-[220px]" title={targetPath}>
                {targetPath}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Current Role:</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-semibold">
                {userRole}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Required Role:</span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">
                {requiredRole}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleReturnHome}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to My Dashboard
            </button>
            <button
              onClick={() => logout()}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-2">
            <KeyRound className="h-3.5 w-3.5" />
            <span>Need higher access? Contact your System Administrator.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForbiddenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <ForbiddenContent />
    </Suspense>
  );
}
