'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole } from '@/lib/types';
import { User as UserIcon } from 'lucide-react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface UserAvatarProps {
  user?: Partial<User> | null;
  size?: AvatarSize;
  className?: string;
  showFallback?: boolean;
  alt?: string;
  bordered?: boolean;
  status?: 'online' | 'busy' | 'offline' | null;
}

const SIZE_CONFIGS: Record<AvatarSize, { container: string; text: string; icon: string; px: number }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', icon: 'w-3 h-3', px: 24 },
  sm: { container: 'w-8 h-8', text: 'text-xs', icon: 'w-4 h-4', px: 32 },
  md: { container: 'w-10 h-10', text: 'text-sm font-semibold', icon: 'w-5 h-5', px: 40 },
  lg: { container: 'w-12 h-12', text: 'text-base font-bold', icon: 'w-6 h-6', px: 48 },
  xl: { container: 'w-16 h-16', text: 'text-xl font-bold', icon: 'w-8 h-8', px: 64 },
  '2xl': { container: 'w-24 h-24', text: 'text-3xl font-extrabold', icon: 'w-12 h-12', px: 96 },
};

const ROLE_COLOR_PALETTE: Record<string, { bg: string; text: string; border: string }> = {
  ADMIN: { bg: 'bg-rose-900/90 text-rose-100', text: 'text-rose-100', border: 'border-rose-700/60' },
  HEADMASTER: { bg: 'bg-amber-900/90 text-amber-100', text: 'text-amber-100', border: 'border-amber-700/60' },
  ACADEMIC: { bg: 'bg-cyan-900/90 text-cyan-100', text: 'text-cyan-100', border: 'border-cyan-700/60' },
  TEACHER: { bg: 'bg-emerald-900/90 text-emerald-100', text: 'text-emerald-100', border: 'border-emerald-700/60' },
  STUDENT: { bg: 'bg-indigo-900/90 text-indigo-100', text: 'text-indigo-100', border: 'border-indigo-700/60' },
  ACCOUNTANT: { bg: 'bg-teal-900/90 text-teal-100', text: 'text-teal-100', border: 'border-teal-700/60' },
  LIBRARIAN: { bg: 'bg-orange-900/90 text-orange-100', text: 'text-orange-100', border: 'border-orange-700/60' },
  EXAM_OFFICER: { bg: 'bg-pink-900/90 text-pink-100', text: 'text-pink-100', border: 'border-pink-700/60' },
  STAFF: { bg: 'bg-slate-800 text-slate-100', text: 'text-slate-100', border: 'border-slate-700' },
};

function getInitials(user?: Partial<User> | null): string {
  if (!user) return '';

  const firstName = user.first_name?.trim() || '';
  const lastName = user.last_name?.trim() || '';

  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }
  if (user.username) {
    return user.username.slice(0, 2).toUpperCase();
  }
  if (user.email) {
    return user.email.slice(0, 2).toUpperCase();
  }
  return '';
}

export function UserAvatar({
  user,
  size = 'md',
  className = '',
  showFallback = true,
  alt,
  bordered = true,
  status = null,
}: UserAvatarProps) {
  const [mounted, setMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Normalize image source URL
  const rawImageUrl = user?.avatar_url || user?.avatar || null;
  const imageUrl = useMemo(() => {
    if (!rawImageUrl) return null;
    // If relative path like /media/avatars/..., prefix with backend host in dev if needed
    if (rawImageUrl.startsWith('/media/')) {
      const apiHost = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://127.0.0.1:8000';
      return `${apiHost}${rawImageUrl}`;
    }
    return rawImageUrl;
  }, [rawImageUrl]);

  // Reset error & loading state whenever image URL updates
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [imageUrl]);

  const initials = useMemo(() => getInitials(user), [user]);
  const sizeConfig = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;

  const role = user?.role || 'STAFF';
  const colorTheme = ROLE_COLOR_PALETTE[role] || ROLE_COLOR_PALETTE.STAFF;

  const fullName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.email || 'User'
    : 'User';

  const accessibleAlt = alt || `${fullName}'s Profile Avatar`;

  if (!mounted) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 select-none rounded-full ${sizeConfig.container} ${className}`}
        aria-hidden="true"
        suppressHydrationWarning
      >
        <div
          className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-slate-800 text-slate-300 ${
            bordered ? 'border border-slate-700 shadow-xs' : ''
          }`}
          suppressHydrationWarning
        >
          <UserIcon className={sizeConfig.icon} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none rounded-full ${sizeConfig.container} ${className}`}
      aria-label={accessibleAlt}
      suppressHydrationWarning
    >
      <div
        className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center transition-all ${
          bordered ? `border ${colorTheme.border} shadow-xs` : ''
        }`}
        suppressHydrationWarning
      >
        {imageUrl && !hasError ? (
          <>
            {/* Native img with graceful error fallback and zero layout shift */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={accessibleAlt}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
            />
            {isLoading && (
              <div
                className={`absolute inset-0 flex items-center justify-center ${colorTheme.bg} animate-pulse`}
              >
                <span className={`font-mono font-bold tracking-wider ${sizeConfig.text}`}>
                  {initials || <UserIcon className={sizeConfig.icon} />}
                </span>
              </div>
            )}
          </>
        ) : initials && showFallback ? (
          <div
            className={`w-full h-full flex items-center justify-center ${colorTheme.bg} font-bold tracking-wider`}
            title={fullName}
            suppressHydrationWarning
          >
            <span className={sizeConfig.text} suppressHydrationWarning>{initials}</span>
          </div>
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center bg-slate-800 text-slate-300`}
            title={fullName}
            suppressHydrationWarning
          >
            <UserIcon className={sizeConfig.icon} />
          </div>
        )}
      </div>

      {/* Online / Status indicator dot */}
      {status && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white ${
            size === 'xs' ? 'w-1.5 h-1.5' : size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'
          } ${
            status === 'online'
              ? 'bg-emerald-500'
              : status === 'busy'
              ? 'bg-amber-500'
              : 'bg-slate-400'
          }`}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
