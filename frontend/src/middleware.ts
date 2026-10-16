import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RouteRule {
  pattern: RegExp;
  allowedRoles: string[];
  canonicalDashboard: string;
}

const ROUTE_RULES: RouteRule[] = [
  {
    pattern: /^\/(?:dashboard\/)?admin(?:\/.*)?$/,
    allowedRoles: ['ADMIN'],
    canonicalDashboard: '/dashboard/admin',
  },
  {
    pattern: /^\/(?:dashboard\/)?headmaster(?:\/.*)?$/,
    allowedRoles: ['HEADMASTER'],
    canonicalDashboard: '/dashboard/headmaster',
  },
  {
    pattern: /^\/(?:dashboard\/)?academic(?:\/.*)?$/,
    allowedRoles: ['ACADEMIC'],
    canonicalDashboard: '/dashboard/academic',
  },
  {
    pattern: /^\/(?:dashboard\/)?teacher(?:\/.*)?$/,
    allowedRoles: ['TEACHER'],
    canonicalDashboard: '/dashboard/teacher',
  },
  {
    pattern: /^\/(?:dashboard\/)?student(?:\/.*)?$/,
    allowedRoles: ['STUDENT'],
    canonicalDashboard: '/dashboard/student',
  },
  {
    pattern: /^\/(?:dashboard\/)?accountant(?:\/.*)?$/,
    allowedRoles: ['ACCOUNTANT'],
    canonicalDashboard: '/dashboard/accountant',
  },
  {
    pattern: /^\/(?:dashboard\/)?librarian(?:\/.*)?$/,
    allowedRoles: ['LIBRARIAN'],
    canonicalDashboard: '/dashboard/librarian',
  },
  {
    pattern: /^\/(?:dashboard\/)?(?:exam|examination)(?:\/.*)?$/,
    allowedRoles: ['EXAM_OFFICER'],
    canonicalDashboard: '/dashboard/exam',
  },
  {
    pattern: /^\/(?:dashboard\/)?staff(?:\/.*)?$/,
    allowedRoles: ['STAFF'],
    canonicalDashboard: '/dashboard/staff',
  },
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets, api routes, and public auth endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/login' ||
    pathname === '/403' ||
    pathname === '/unauthorized' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Find matching protection rule
  const matchedRule = ROUTE_RULES.find((rule) => rule.pattern.test(pathname));

  if (!matchedRule) {
    // If it's the root /dashboard, allow or let AuthContext handle redirection
    return NextResponse.next();
  }

  const userRole = request.cookies.get('sms_user_role')?.value;
  const token = request.cookies.get('sms_access_token')?.value;

  // 1. Unauthenticated Check (Strictly reject missing or legacy mock tokens)
  if (!userRole || !token || token.startsWith('demo_token_')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Role Authorization Check
  if (userRole && !matchedRule.allowedRoles.includes(userRole)) {
    const forbiddenUrl = new URL('/403', request.url);
    forbiddenUrl.searchParams.set('userRole', userRole);
    forbiddenUrl.searchParams.set('target', pathname);
    forbiddenUrl.searchParams.set('required', matchedRule.allowedRoles.join(', '));
    return NextResponse.redirect(forbiddenUrl);
  }

  // 3. Short URL Aliases Rewrite (e.g. /admin -> /dashboard/admin)
  if (!pathname.startsWith('/dashboard/') && matchedRule) {
    const canonicalUrl = new URL(matchedRule.canonicalDashboard, request.url);
    return NextResponse.redirect(canonicalUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/headmaster/:path*',
    '/academic/:path*',
    '/teacher/:path*',
    '/student/:path*',
    '/accountant/:path*',
    '/librarian/:path*',
    '/examination/:path*',
    '/exam/:path*',
    '/staff/:path*',
    '/dashboard/:path*',
  ],
};
