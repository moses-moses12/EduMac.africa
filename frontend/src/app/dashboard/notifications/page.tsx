'use client';

import React from 'react';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { useAuth } from '@/lib/auth-context';
import { Bell, ShieldCheck, MailCheck, AlertCircle } from 'lucide-react';

export default function NotificationsPage() {
  const { user, role } = useAuth();

  return (
    <div className="space-y-6">
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: `/dashboard/${(role || 'admin').toLowerCase().replace('_officer', '')}` },
          { label: 'Notification Center' },
        ]}
      />

      {/* Top Banner / Description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-900 text-white uppercase tracking-wider">
              Institutional Communications
            </span>
            <span className="text-xs text-slate-500">
              Personalized Inbox Alerts & Verified Directives
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1.5">
            Institutional Notification Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lifecycle alerts including published results, assignments, fee reminders, attendance warnings, exam timetables, campus announcements, and security events.
          </p>
        </div>
      </div>

      {/* Core Notification Center Surface */}
      <NotificationCenter />
    </div>
  );
}
