'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/lib/auth-context';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackUrl?: string;
}

export function RoleGuard({ children, allowedRoles, fallbackUrl }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isAuthorized = user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <RefreshCw className="h-7 w-7 animate-spin text-indigo-500" />
          <p className="text-sm font-medium">Verifying institutional authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Access Denied (403)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Your role <span className="font-semibold text-amber-400">({user?.role || 'Guest'})</span> is not authorized to view this section. Allowed: {allowedRoles.join(', ')}.
            </p>
          </div>
          <button
            onClick={() => router.push(fallbackUrl || '/dashboard')}
            className="w-full px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition cursor-pointer"
          >
            Go to My Authorized Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
