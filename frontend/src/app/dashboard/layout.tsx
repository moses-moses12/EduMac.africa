'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !role) return;

    const rolePathMap: Record<string, string> = {
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

    // If on a specific role dashboard, ensure it matches current user's role
    const matchedEntry = Object.entries(rolePathMap).find(([_, path]) =>
      pathname.startsWith(path)
    );

    if (matchedEntry && matchedEntry[0] !== role) {
      const myDashboard = rolePathMap[role] || '/dashboard/admin';
      router.replace(myDashboard);
    }
  }, [role, pathname, isLoading, router]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Fixed Sticky Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
