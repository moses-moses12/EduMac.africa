'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, NotificationItem, NotificationCategory } from '@/services/notification.service';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth-context';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  CreditCard,
  CalendarCheck,
  Clock,
  Megaphone,
  ShieldAlert,
  Search,
  RefreshCw,
  Inbox,
  Send,
  X,
  Filter,
  User,
  ExternalLink
} from 'lucide-react';

export function NotificationCenter() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const { user } = useAuth();
  
  const [activeFilter, setActiveFilter] = useState<
    | 'ALL'
    | 'UNREAD'
    | 'RESULT_PUBLISHED'
    | 'NEW_ASSIGNMENT'
    | 'FEE_REMINDER'
    | 'ATTENDANCE_WARNING'
    | 'EXAM_SCHEDULE'
    | 'SCHOOL_ANNOUNCEMENT'
    | 'SECURITY_EVENT'
  >('ALL');
  const [search, setSearch] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    type: 'SCHOOL_ANNOUNCEMENT' as NotificationCategory,
    target_role: 'ALL',
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications-center'],
    queryFn: () => notificationService.getNotifications({ page_size: 50 }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-center'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-center'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      success('Notifications Updated', 'All messages marked as read.');
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: (payload: { title: string; message: string; type: string; target_role: string }) =>
      notificationService.broadcastNotification(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['notifications-center'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setShowBroadcastModal(false);
      setBroadcastForm({
        title: '',
        message: '',
        type: 'SCHOOL_ANNOUNCEMENT',
        target_role: 'ALL',
      });
      success('Broadcast Sent', res.message || 'Notification broadcast delivered.');
    },
    onError: (err: any) => {
      toastError('Dispatch Failed', err?.response?.data?.error || 'Could not send broadcast notification.');
    },
  });

  const allNotifications = data?.results || [];

  const filteredNotifications = allNotifications.filter((n) => {
    // 1. Tab filter
    if (activeFilter === 'UNREAD' && n.is_read) return false;
    if (activeFilter !== 'ALL' && activeFilter !== 'UNREAD') {
      const currentType = n.notification_type || n.type;
      if (currentType !== activeFilter) return false;
    }

    // 2. Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const titleMatch = n.title?.toLowerCase().includes(q);
      const messageMatch = n.message?.toLowerCase().includes(q);
      const recipientMatch = n.recipient_name?.toLowerCase().includes(q) || n.recipient_email?.toLowerCase().includes(q);
      return titleMatch || messageMatch || recipientMatch;
    }
    return true;
  });

  const unreadCount = allNotifications.filter((n) => !n.is_read).length;

  const getCategoryConfig = (type: NotificationCategory | string) => {
    switch (type) {
      case 'RESULT_PUBLISHED':
        return {
          icon: Award,
          color: 'text-purple-700 bg-purple-50 border-purple-200',
          badge: 'Result published',
        };
      case 'NEW_ASSIGNMENT':
        return {
          icon: BookOpen,
          color: 'text-blue-700 bg-blue-50 border-blue-200',
          badge: 'New assignment',
        };
      case 'FEE_REMINDER':
      case 'FEE':
        return {
          icon: CreditCard,
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          badge: 'Fee reminder',
        };
      case 'ATTENDANCE_WARNING':
        return {
          icon: AlertTriangle,
          color: 'text-orange-700 bg-orange-50 border-orange-200',
          badge: 'Attendance warning',
        };
      case 'EXAM_SCHEDULE':
      case 'EXAM':
        return {
          icon: Clock,
          color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
          badge: 'Exam schedule',
        };
      case 'SCHOOL_ANNOUNCEMENT':
      case 'GENERAL':
        return {
          icon: Megaphone,
          color: 'text-teal-700 bg-teal-50 border-teal-200',
          badge: 'School announcement',
        };
      case 'SECURITY_EVENT':
      case 'SYSTEM':
        return {
          icon: ShieldAlert,
          color: 'text-rose-700 bg-rose-50 border-rose-200',
          badge: 'Account security event',
        };
      default:
        return {
          icon: Bell,
          color: 'text-slate-700 bg-slate-100 border-slate-200',
          badge: 'System Notice',
        };
    }
  };

  const isPrivileged = ['ADMIN', 'HEADMASTER', 'STAFF', 'TEACHER'].includes(user?.role || '');

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Header Toolbar */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-700" />
              Notification Center
            </h2>
            {unreadCount > 0 ? (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {unreadCount} unread
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600">
                All caught up
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Personalized inbox alerts: Result publications, coursework assignments, fee reminders, attendance warnings, exam schedules, and security events.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isPrivileged && (
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
              Broadcast Alert
            </button>
          )}

          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <CheckCheck className="h-3.5 w-3.5 text-slate-500" />
              Mark All Read
            </button>
          )}

          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition cursor-pointer"
            title="Refresh notifications"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-slate-900' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {[
            { id: 'ALL', label: 'All Notices' },
            { id: 'UNREAD', label: `Unread (${unreadCount})` },
            { id: 'RESULT_PUBLISHED', label: 'Results' },
            { id: 'NEW_ASSIGNMENT', label: 'Assignments' },
            { id: 'FEE_REMINDER', label: 'Fee Reminders' },
            { id: 'ATTENDANCE_WARNING', label: 'Attendance' },
            { id: 'EXAM_SCHEDULE', label: 'Exam Schedules' },
            { id: 'SCHOOL_ANNOUNCEMENT', label: 'Announcements' },
            { id: 'SECURITY_EVENT', label: 'Security' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, message, recipient..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
          />
        </div>
      </div>

      {/* Notifications Feed */}
      <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="h-5 w-5 animate-spin text-slate-600" />
            <p className="text-xs">Loading notification alerts...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
              <Inbox className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-slate-900">No notifications found</p>
            <p className="text-xs text-slate-500 max-w-sm">
              You are all caught up! No notifications match your currently applied search or category filter.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const config = getCategoryConfig(notif.notification_type || notif.type || 'GENERAL');
            const Icon = config.icon;

            return (
              <div
                key={notif.id}
                className={`p-4 sm:p-5 transition flex items-start gap-4 hover:bg-slate-50/70 ${
                  !notif.is_read ? 'bg-indigo-50/20' : ''
                }`}
              >
                {/* Category Icon Badge */}
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>

                {/* Main Notification Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${config.color}`}>
                        {config.badge}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {notif.title}
                      </h4>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" title="Unread Notice" />
                      )}
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {new Date(notif.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      at{' '}
                      {new Date(notif.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mt-1 whitespace-pre-line">
                    {notif.message}
                  </p>

                  {/* Metadata Footer: Recipient, Read Status & Quick Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                      <span>
                        Recipient:{' '}
                        <strong className="text-slate-700 font-medium">
                          {notif.recipient_name || notif.recipient_email || 'Direct Account Inbox'}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Status:{' '}
                        <span className={`font-semibold ${notif.is_read ? 'text-slate-500' : 'text-indigo-600'}`}>
                          {notif.is_read ? 'Read' : 'Unread'}
                        </span>
                      </span>
                    </div>

                    {!notif.is_read && (
                      <button
                        onClick={() => markReadMutation.mutate(notif.id)}
                        disabled={markReadMutation.isPending}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-700 hover:text-slate-900 font-semibold cursor-pointer transition self-start sm:self-auto"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Broadcast Alert Modal Dialog */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Send className="h-4 w-4 text-slate-700" />
                  Dispatch Broadcast Notification
                </h3>
                <p className="text-xs text-slate-500">Deliver multi-user alert to institutional inboxes</p>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                broadcastMutation.mutate(broadcastForm);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notification Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End of Term Results Published"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notification Type *</label>
                  <select
                    value={broadcastForm.type}
                    onChange={(e) =>
                      setBroadcastForm((prev) => ({ ...prev, type: e.target.value as NotificationCategory }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                  >
                    <option value="RESULT_PUBLISHED">Result published</option>
                    <option value="NEW_ASSIGNMENT">New assignment</option>
                    <option value="FEE_REMINDER">Fee reminder</option>
                    <option value="ATTENDANCE_WARNING">Attendance warning</option>
                    <option value="EXAM_SCHEDULE">Exam schedule</option>
                    <option value="SCHOOL_ANNOUNCEMENT">School announcement</option>
                    <option value="SECURITY_EVENT">Account security event</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Audience *</label>
                  <select
                    value={broadcastForm.target_role}
                    onChange={(e) => setBroadcastForm((prev) => ({ ...prev, target_role: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                  >
                    <option value="ALL">Entire Campus (Everyone)</option>
                    <option value="STUDENT">Students Only</option>
                    <option value="TEACHER">Faculty & Teachers Only</option>
                    <option value="PARENT">Parents Only</option>
                    <option value="STAFF">Administrative Staff Only</option>
                    <option value="ACCOUNTANT">Bursary & Accounts Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message Body *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter detailed notification content..."
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm((prev) => ({ ...prev, message: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcastMutation.isPending}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {broadcastMutation.isPending ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Deliver Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
