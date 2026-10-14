'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

export default function DashboardIndexPage() {
  const { role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!role) {
        router.push('/dashboard/admin');
      } else {
        const routes: Record<string, string> = {
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
        router.push(routes[role] || '/dashboard/admin');
      }
    }
  }, [role, isLoading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      <p className="text-sm font-medium">Navigating to your role workspace...</p>
    </div>
  );
}
