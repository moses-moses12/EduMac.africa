'use client';

import React, { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { UserAvatar } from './UserAvatar';
import { ProfileImageUploader } from './ProfileImageUploader';
import { profileService } from '@/services/profile.service';
import { authService } from '@/services/auth.service';
import {
  X,
  User as UserIcon,
  Shield,
  Phone,
  MapPin,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

export interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, role, updateCurrentUser } = useCurrentUser();

  const [activeTab, setActiveTab] = useState<'avatar' | 'details' | 'security'>('avatar');
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [address, setAddress] = useState(user?.address || '');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);

    try {
      const updated = await profileService.updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        address: address,
      });
      updateCurrentUser(updated);
      setStatusMsg({ type: 'success', text: 'Personal profile details updated successfully.' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update profile details.';
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setStatusMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    setIsSaving(true);
    setStatusMsg(null);

    try {
      await authService.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      setStatusMsg({ type: 'success', text: 'Security credentials updated successfully.' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update password. Verify your current password.';
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const fullName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.email || 'User'
    : 'User';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <UserAvatar user={user} size="sm" bordered />
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">{fullName}</h3>
              <p className="text-[11px] text-slate-500 font-mono">{user?.email} &bull; {role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-100 px-5 bg-white">
          <button
            type="button"
            onClick={() => { setActiveTab('avatar'); setStatusMsg(null); }}
            className={`py-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'avatar'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Profile Photo & Avatar
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('details'); setStatusMsg(null); }}
            className={`py-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Account Information
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('security'); setStatusMsg(null); }}
            className={`py-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Security & Password
          </button>
        </div>

        {/* Status Alerts */}
        {statusMsg && (
          <div className="px-5 pt-4">
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'avatar' && (
            <div className="space-y-4">
              <ProfileImageUploader
                user={user}
                onSuccess={(u) => {
                  updateCurrentUser(u);
                  setStatusMsg({ type: 'success', text: 'Profile photo updated across all interfaces.' });
                }}
              />
            </div>
          )}

          {activeTab === 'details' && (
            <form onSubmit={handleUpdateDetails} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email (Institutional)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+1-555-019-2834"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Address / Office</label>
                <textarea
                  rows={2}
                  placeholder="Campus block, office room, or residential address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Details'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Updating Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
