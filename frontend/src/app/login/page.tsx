'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const DEMO_PRESETS = [
  { role: 'Admin (Moses)', email: 'moses', name: 'Moses', password: 'moses' },
  { role: 'Admin (Sarah)', email: 'admin@school.edu', name: 'Sarah Connor', password: 'Password123!' },
  { role: 'Headmaster', email: 'headmaster@school.edu', name: 'Arthur Pendelton', password: 'Password123!' },
  { role: 'Academic', email: 'academic@school.edu', name: 'Marcus Vance', password: 'Password123!' },
  { role: 'Teacher', email: 'teacher@school.edu', name: 'Elizabeth Bennett', password: 'Password123!' },
  { role: 'Student', email: 'student@school.edu', name: 'Alexander Pierce', password: 'Password123!' },
  { role: 'Parent', email: 'parent@school.edu', name: 'Jonathan Pierce', password: 'Password123!' },
  { role: 'Accountant', email: 'accountant@school.edu', name: 'David Sterling', password: 'Password123!' },
  { role: 'Librarian', email: 'librarian@school.edu', name: 'Clara Oswald', password: 'Password123!' },
  { role: 'Exam Officer', email: 'exam@school.edu', name: 'Gregory House', password: 'Password123!' },
  { role: 'Staff', email: 'staff@school.edu', name: 'Beatrice Montgomery', password: 'Password123!' },
];

/**
 * Custom High-Fidelity School Emblem SVG:
 * Graduation cap perched gracefully on top of an open book with dual blue-gradient wings.
 */
function SchoolLogoIcon({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 85"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top Graduation Cap Diamond */}
      <path
        d="M50 8L86 23L50 38L14 23L50 8Z"
        fill="url(#capGradient)"
      />
      {/* Cap Underneath Shadow / Skullcap */}
      <path
        d="M28 29V42C28 48 37.8 53 50 53C62.2 53 72 48 72 42V29L50 38L28 29Z"
        fill="#0369a1"
      />
      {/* Cap Tassel */}
      <path
        d="M76 26V43C76 45.2 78 46 79 46C80 46 82 45.2 82 43V26"
        stroke="#38bdf8"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="79" cy="47" r="3" fill="#38bdf8" />

      {/* Open Book Wings - Left Page */}
      <path
        d="M47 57C36 53 23 54 12 57.5C10.5 58 10 59.5 10 61V70C10 71.2 11 72 12.2 71.7C23 68.8 35 68.2 46.5 71.8C47.3 72.1 48 71.4 48 70.5V58.5C48 57.7 47.6 57.2 47 57Z"
        fill="url(#bookLeftGrad)"
      />
      {/* Open Book Wings - Right Page */}
      <path
        d="M53 57C64 53 77 54 88 57.5C89.5 58 90 59.5 90 61V70C90 71.2 89 72 87.8 71.7C77 68.8 65 68.2 53.5 71.8C52.7 72.1 52 71.4 52 70.5V58.5C52 57.7 52.4 57.2 53 57Z"
        fill="url(#bookRightGrad)"
      />
      {/* Bottom Book 3D Spine & Page Rim */}
      <path
        d="M12 72C23 69.2 35 68.8 46.5 72.2V76C35 72.8 23 73.2 12 76C10.5 76.4 9.5 75.3 9.5 74C9.5 73 10.5 72.4 12 72Z"
        fill="#0284c7"
      />
      <path
        d="M88 72C77 69.2 65 68.8 53.5 72.2V76C65 72.8 77 73.2 88 76C89.5 76.4 90.5 75.3 90.5 74C90.5 73 89.5 72.4 88 72Z"
        fill="#0284c7"
      />

      <defs>
        <linearGradient id="capGradient" x1="14" y1="8" x2="86" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0284c7" />
          <stop offset="1" stopColor="#0f5ec7" />
        </linearGradient>
        <linearGradient id="bookLeftGrad" x1="10" y1="55" x2="48" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0284c7" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="bookRightGrad" x1="52" y1="55" x2="90" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const { login } = useAuth();

  // Clear username and password immediately whenever the login page is opened or accessed
  useEffect(() => {
    setEmail('');
    setPassword('');
    setErrorMsg('');

    // Ensure any background autofill attempt right after initial DOM render is also cleared
    const clearTimer = setTimeout(() => {
      const uField = document.getElementById('sms-login-username') as HTMLInputElement | null;
      const pField = document.getElementById('sms-login-password') as HTMLInputElement | null;
      if (uField && !email) uField.value = '';
      if (pField && !password) pField.value = '';
    }, 100);

    return () => clearTimeout(clearTimer);
  }, []);

  const handleSelectPreset = (presetEmail: string, presetPassword = 'Password123!') => {
    setEmail(presetEmail);
    setPassword(presetPassword);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const success = await login(email, password);
      if (success) {
        setEmail('');
        setPassword('');
      } else {
        setErrorMsg('Invalid username or password. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetEmail) {
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        setShowForgotPassword(false);
        setResetEmail('');
      }, 2500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white text-slate-900 selection:bg-blue-600 selection:text-white relative">
      {/* ========================================================================= */}
      {/* LEFT PANE: CENTERED LOGIN CARD                                            */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-screen bg-white flex flex-col justify-between items-center py-10 px-4 sm:px-8 xl:px-12 relative overflow-y-auto">
        <div className="my-auto w-full max-w-md flex flex-col items-center">
          {/* Emblem: Graduation Cap + Open Book Icon */}
          <div className="flex flex-col items-center text-center">
            <SchoolLogoIcon className="w-20 h-16 sm:w-24 sm:h-20 drop-shadow-sm transition-transform hover:scale-105 duration-300" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-3">
              School Management System
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Please login to your account
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-xl sm:shadow-2xl border border-slate-100 p-6 sm:p-8 w-full mt-6 text-slate-900">
            {/* Error Message Alert */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              {/* Field 1: Username or Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="sms-login-username"
                    name="sms_login_user_field"
                    type="text"
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="Enter your username or email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="sms-login-password"
                    name="sms_login_pass_field"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                  <span className="text-xs text-slate-600 font-medium">Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Primary Login Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Fill Demo Roles Selector */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Authorized Test Accounts (10 Roles)</span>
                </span>
                {showPresets ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showPresets && (
                <div className="mt-3 grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                  {DEMO_PRESETS.map((preset) => (
                    <button
                      key={preset.role}
                      type="button"
                      onClick={() => handleSelectPreset(preset.email, preset.password)}
                      className="text-left px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer group"
                    >
                      <div className="text-[11px] font-bold text-slate-800 group-hover:text-blue-700">
                        {preset.role}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {preset.email}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cryptographic Protection Badge */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Protected by PBKDF2-SHA256 & JWT Authentication</span>
            </div>
          </div>
        </div>

        {/* Footer Copyright */}
        <p className="text-xs text-slate-400 text-center mt-6">
          © 2025 School Management System. All rights reserved.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT PANE: PHOTOGRAPH OF STUDENTS IN CLASSROOM                           */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[44%] xl:w-[42%] p-4 sm:p-6 lg:p-6 xl:p-8 flex items-center justify-center">
        <div className="relative w-full max-w-[460px] h-[300px] sm:h-[360px] lg:h-[82vh] max-h-[650px] rounded-t-full rounded-b-3xl sm:rounded-b-[2.5rem] overflow-hidden shadow-2xl bg-slate-100">
          <Image
            src="/images/school_students.jpg"
            alt="Students in classroom"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 42vw"
            priority
            className="object-cover object-center"
          />
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Reset Institutional Password</h3>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm">Reset Link Sent</h4>
                <p className="text-xs">
                  Check your inbox at <strong>{resetEmail}</strong> for instructions to reset your password.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
                <p className="text-slate-500 text-xs">
                  Enter your registered username or school email address to receive password recovery instructions.
                </p>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@school.edu"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
