'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { EduMaxLogoIcon } from '@/components/ui/EduMaxLogo';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Globe,
  ChevronDown,
} from 'lucide-react';

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
  const [selectedLang, setSelectedLang] = useState<'English' | 'Kiswahili'>('English');
  const [showLangMenu, setShowLangMenu] = useState(false);

  const { login } = useAuth();

  // Restore remembered username/email or recover from URL search params if form was previously GET-submitted
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const queryUser = params.get('username') || params.get('sms_login_user_field') || params.get('email');
        const queryPass = params.get('password') || params.get('sms_login_pass_field');
        if (queryUser) setEmail(queryUser);
        if (queryPass) setPassword(queryPass);
        window.history.replaceState({}, '', window.location.pathname);
      }

      const savedId = localStorage.getItem('sms_remember_identifier');
      const savedRemember = localStorage.getItem('sms_remember_me') === 'true';
      if (savedId && savedRemember && !email) {
        setEmail(savedId);
        setRememberMe(true);
      }
    } catch {
      // Local storage unavailable or restricted
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMsg('');

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Please enter your email/username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await login(cleanEmail, cleanPassword, rememberMe);
      if (success) {
        if (!rememberMe) {
          setEmail('');
        }
        setPassword('');
      } else {
        setErrorMsg('Invalid credentials. Please verify your email/username and password.');
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
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#f5f8fc] overflow-hidden font-sans select-none">
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* CRISP VECTOR BACKGROUND WAVES (Exact match to the reference image)       */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
        {/* Soft Background Layer Curves */}
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle light blue flow from top left to bottom center */}
          <path
            d="M -100 -50 C 400 120 750 300 850 950 L -100 950 Z"
            fill="#eaf1fa"
            opacity="0.6"
          />
          <path
            d="M 200 -50 C 650 180 920 420 1020 950 L -50 950 Z"
            fill="#e2ecf9"
            opacity="0.45"
          />

          {/* Top-Right Warm Amber / Orange Wave */}
          <path
            d="M 1150 0 C 1220 160 1340 220 1440 250 L 1440 0 Z"
            fill="url(#topAmberGrad)"
          />

          {/* Bottom-Right Deep Royal Blue Sweeping Wave */}
          <path
            d="M 1020 900 C 1040 760 1140 680 1440 640 L 1440 900 Z"
            fill="url(#bottomBlueGrad)"
          />

          {/* Bottom-Left Amber Accent Corner */}
          <path
            d="M 0 830 C 50 850 70 880 80 900 L 0 900 Z"
            fill="url(#bottomAmberGrad)"
          />

          <defs>
            <linearGradient id="topAmberGrad" x1="1150" y1="0" x2="1440" y2="250" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>

            <linearGradient id="bottomBlueGrad" x1="1020" y1="900" x2="1440" y2="640" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="60%" stopColor="#1e40af" />
              <stop offset="100%" stopColor="#0f265c" />
            </linearGradient>

            <linearGradient id="bottomAmberGrad" x1="0" y1="830" x2="80" y2="900" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
        </svg>

        {/* Top-right vibrant overlay glow for depth */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-amber-400/40 via-amber-500/10 to-transparent blur-3xl" />
        {/* Bottom-right deep blue atmospheric glow */}
        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-gradient-to-tl from-blue-700/30 via-blue-900/10 to-transparent blur-3xl" />
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* FLOATING MAIN LOGIN CARD (Exact 1:1 match to reference image)           */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[430px] sm:max-w-[440px] bg-white rounded-3xl sm:rounded-[32px] px-7 py-8 sm:px-8 sm:py-9 shadow-[0_20px_60px_-15px_rgba(15,35,80,0.14),0_2px_8px_rgba(0,0,0,0.03)] border border-slate-100 transition-all">
        {/* Top Header Row with Language Selector */}
        <div className="flex justify-end relative">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs bg-white"
            >
              <Globe className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>{selectedLang}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => { setSelectedLang('English'); setShowLangMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition cursor-pointer"
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedLang('Kiswahili'); setShowLangMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition cursor-pointer"
                >
                  Kiswahili
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center EduMax Academic Emblem */}
        <div className="flex flex-col items-center justify-center -mt-1 mb-5">
          <div className="w-24 h-24 sm:w-26 sm:h-26 drop-shadow-sm flex items-center justify-center hover:scale-105 transition-transform duration-200">
            <EduMaxLogoIcon className="w-full h-full" />
          </div>

          <p className="text-xs sm:text-sm text-slate-500 font-medium text-center mt-2">
            Sign in to your school account
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} method="POST" className="space-y-4" autoComplete="on">
          {/* Email Address Input */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Email Address
            </label>
            <div className="relative flex items-center border border-slate-200 rounded-2xl bg-white px-3.5 py-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-2xs">
              <Mail className="w-4 h-4 text-slate-500 mr-2.5 shrink-0" />
              <input
                id="sms-login-email"
                name="username"
                type="text"
                required
                autoComplete="username"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Password
            </label>
            <div className="relative flex items-center border border-slate-200 rounded-2xl bg-white px-3.5 py-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-2xs">
              <Lock className="w-4 h-4 text-slate-500 mr-2.5 shrink-0" />
              <input
                id="sms-login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none font-sans"
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer ml-2 shrink-0 p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div className="flex items-center justify-between pt-0.5 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 accent-blue-600 cursor-pointer"
              />
              <span className="font-semibold text-slate-700">Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Primary CTA Sign In Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 hover:from-blue-800 hover:to-blue-700 active:scale-[0.99] transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <span className="text-base leading-none">→</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
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
