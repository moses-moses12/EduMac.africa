'use client';

import React, { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { UserAvatar } from './UserAvatar';
import { ProfileImageUploader } from './ProfileImageUploader';
import { profileService } from '@/services/profile.service';
import { authService } from '@/services/auth.service';
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Phone,
  MapPin,
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  KeyRound,
} from 'lucide-react';

export interface DashboardProfileTabProps {
  title?: string;
  subtitle?: string;
  extraDetails?: Array<{ label: string; val: string }>;
}

export function DashboardProfileTab({
  title,
  subtitle,
  extraDetails = [],
}: DashboardProfileTabProps) {
  const { user, role, updateCurrentUser } = useCurrentUser();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [address, setAddress] = useState(user?.address || '');

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const displayTitle = title || `${role || 'User'} Profile`;
  const displaySubtitle = subtitle || 'Institutional account credentials, contact information, and avatar photo';

  const fullName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.email || 'User'
    : 'User';

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const updated = await profileService.updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        address: address,
      });
      updateCurrentUser(updated);
      setIsEditing(false);
      setStatusMsg({ type: 'success', text: 'Personal details updated successfully.' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update personal details.';
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setSaving(false);
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

    setSaving(true);
    setStatusMsg(null);

    try {
      await authService.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      setShowPasswordChange(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatusMsg({ type: 'success', text: 'Password successfully changed.' });
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to change password. Verify your current password.';
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">{displayTitle}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{displaySubtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(!isEditing);
                  setFirstName(user?.first_name || '');
                  setLastName(user?.last_name || '');
                  setPhoneNumber(user?.phone_number || '');
                  setAddress(user?.address || '');
                }}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Information'}
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status notification */}
        {statusMsg && (
          <div className="mb-6">
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

        {/* Avatar Uploader Section */}
        <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 mb-6">
          <ProfileImageUploader
            user={user}
            onSuccess={(u) => {
              updateCurrentUser(u);
              setStatusMsg({ type: 'success', text: 'Avatar photo synchronized across all dashboards!' });
              setTimeout(() => setStatusMsg(null), 3000);
            }}
          />
        </div>

        {/* Password change form if open */}
        {showPasswordChange && (
          <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-200/60 mb-6">
            <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>Update Institutional Password</span>
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-3 max-w-md text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Save New Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Details View or Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSaveDetails} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1-555-019-2834"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Address / Office</label>
                <input
                  type="text"
                  placeholder="Block / Room / Street Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs cursor-pointer hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Legal Name</div>
              <div className="font-bold text-slate-900 mt-1">{fullName}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username & ID</div>
              <div className="font-bold text-indigo-700 font-mono mt-1">{user?.username || user?.email?.split('@')[0]}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Institutional Role</div>
              <div className="font-bold text-slate-900 mt-1 uppercase">{role}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</div>
              <div className="font-mono text-slate-700 mt-1 truncate">{user?.email}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Phone</div>
              <div className="font-mono text-slate-700 mt-1">{user?.phone_number || 'Not provided'}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Office / Campus Location</div>
              <div className="font-medium text-slate-700 mt-1">{user?.address || 'Main Campus'}</div>
            </div>

            {/* Extra details passed from specific dashboard */}
            {extraDetails.map((detail, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{detail.label}</div>
                <div className="font-bold text-slate-900 mt-1">{detail.val}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
