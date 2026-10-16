'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, UserRole } from '@/lib/types';
import { UserAvatar } from './UserAvatar';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  ChevronDown,
  User as UserIcon,
  Settings,
  Shield,
  LogOut,
  Camera,
  ExternalLink,
  KeyRound,
} from 'lucide-react';

export interface AvatarDropdownProps {
  onOpenProfileModal?: (tab?: 'avatar' | 'details' | 'security') => void;
  className?: string;
}

export function AvatarDropdown({ onOpenProfileModal, className = '' }: AvatarDropdownProps) {
  const { user, role, logout } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const roleDashboardMap: Record<UserRole, string> = {
    ADMIN: '/dashboard/admin',
    HEADMASTER: '/dashboard/headmaster',
    ACADEMIC: '/dashboard/academic',
    TEACHER: '/dashboard/teacher',
    STUDENT: '/dashboard/student',
    ACCOUNTANT: '/dashboard/accountant',
    LIBRARIAN: '/dashboard/librarian',
    EXAM_OFFICER: '/dashboard/exam',
    STAFF: '/dashboard/staff',
  };

  const currentDashboard = role ? roleDashboardMap[role] : '/dashboard/admin';

  const fullName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.email || 'User'
    : 'Institutional User';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        id="user-profile-menu-button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
      >
        <UserAvatar
          user={user}
          size="sm"
          status="online"
          className="ring-1 ring-slate-200"
        />
        <div className="hidden md:flex flex-col text-left">
          <span suppressHydrationWarning className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
            {user?.first_name || fullName}
          </span>
          <span suppressHydrationWarning className="text-[10px] text-slate-500 font-mono font-medium truncate max-w-[120px]">
            {role || 'USER'}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-profile-menu-button"
          className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
            <UserAvatar user={user} size="md" bordered />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{fullName}</p>
              <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">{user?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                {role}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="py-1">
            <Link
              href={`${currentDashboard}?tab=profile`}
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>My Profile & Photo</span>
            </Link>

            {onOpenProfileModal && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenProfileModal('avatar');
                  }}
                  role="menuitem"
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer text-left"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                  <span>Upload Profile Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenProfileModal('security');
                  }}
                  role="menuitem"
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer text-left"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>Change Password</span>
                </button>
              </>
            )}

            {role === 'ADMIN' ? (
              <Link
                href="/dashboard/admin?tab=settings"
                onClick={() => setIsOpen(false)}
                role="menuitem"
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Institutional Settings</span>
              </Link>
            ) : (
              <Link
                href={`${currentDashboard}?tab=account`}
                onClick={() => setIsOpen(false)}
                role="menuitem"
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Account Settings</span>
              </Link>
            )}

            <Link
              href={`${currentDashboard}?tab=security`}
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Security & Password (Page)</span>
            </Link>
          </div>

          {/* Sign out */}
          <div className="pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              role="menuitem"
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
