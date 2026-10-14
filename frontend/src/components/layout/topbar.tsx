'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Bell,
  Search,
  ExternalLink,
  Shield,
  Calendar,
  LogOut,
  User as UserIcon,
  Settings,
  CheckCheck,
  AlertCircle,
  Info,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import Link from 'next/link';
import { AvatarDropdown, UserProfileModal } from '@/components/profile';

export function Topbar() {
  const { user, role, logout } = useAuth();
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);

  // Live unread count
  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
  const unreadCount = countData?.unread_count ?? 0;

  // Live top 5 notifications
  const { data: notifData, isLoading: isLoadingNotifs } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationService.getNotifications({ page_size: 5 }),
    enabled: showNotifications,
    staleTime: 15 * 1000,
  });
  const liveNotifications = notifData?.results || [];

  // Mark all read mutation
  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark single read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left section: Search & Term badge */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search students, staff, classes, or invoices..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
          />
        </div>

        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold shrink-0 border border-slate-200/60">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>AY 2026/2027 • Term 1</span>
        </div>
      </div>

      {/* Right section: System links, Role badge, Notifications, and Profile menu */}
      <div className="flex items-center gap-3">
        {/* Backend Swagger Documentation Link */}
        <a
          href="http://127.0.0.1:8000/api/docs/"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Swagger Docs</span>
        </a>

        {/* Current Active Role Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xs">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>{role || 'ADMIN'}</span>
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View system notifications"
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200/90 rounded-xl shadow-lg p-4 z-40">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllMutation.mutate()}
                    disabled={markAllMutation.isPending}
                    className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-2">
                {isLoadingNotifs ? (
                  <div className="p-4 text-center text-xs text-slate-400">Loading alerts...</div>
                ) : liveNotifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No recent notifications</div>
                ) : (
                  liveNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.is_read) markReadMutation.mutate(n.id);
                      }}
                      className={`p-3 text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer ${
                        !n.is_read ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          <span className={`w-1.5 h-1.5 rounded-full ${n.is_read ? 'bg-slate-300' : 'bg-indigo-600'}`} />
                          <span className="truncate">{n.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-1 line-clamp-2 leading-relaxed ml-3">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2.5 mt-2 border-t border-slate-100">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="block text-center py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 transition rounded-lg"
                >
                  Open Notification Center →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu Dropdown */}
        <AvatarDropdown onOpenProfileModal={() => setShowProfileModal(true)} />

        {/* Global User Profile & Avatar Modal */}
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      </div>
    </header>
  );
}
