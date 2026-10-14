'use client';

import React, { useState, useRef } from 'react';
import { User } from '@/lib/types';
import { UserAvatar } from './UserAvatar';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  X,
  RefreshCw,
} from 'lucide-react';

export interface ProfileImageUploaderProps {
  user?: User | null;
  onSuccess?: (updatedUser: User) => void;
  className?: string;
  compact?: boolean;
}

const ALLOWED_EXTENSIONS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export function ProfileImageUploader({
  user: propUser,
  onSuccess,
  className = '',
  compact = false,
}: ProfileImageUploaderProps) {
  const { user: authUser, uploadAvatar, removeAvatar } = useCurrentUser();
  const currentUser = propUser || authUser;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!ALLOWED_EXTENSIONS.includes(file.type)) {
      setErrorMsg('Invalid file format. Please upload a JPG, PNG, WEBP, or GIF image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const mbSize = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMsg(`File size (${mbSize} MB) exceeds maximum allowed limit of 5 MB.`);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleCancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await uploadAvatar(selectedFile);
      setSuccessMsg('Profile photo updated successfully!');
      handleCancelPreview();
      if (onSuccess && result.user) {
        onSuccess(result.user);
      }
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      const backendErr = err?.response?.data?.message || err?.message || 'Failed to upload image. Please try again.';
      setErrorMsg(backendErr);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove your profile photo? Your initials will be displayed instead.')) {
      return;
    }

    setIsRemoving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await removeAvatar();
      setSuccessMsg('Profile photo removed.');
      handleCancelPreview();
      if (onSuccess && result.user) {
        onSuccess(result.user);
      }
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      const backendErr = err?.response?.data?.message || err?.message || 'Failed to remove image.';
      setErrorMsg(backendErr);
    } finally {
      setIsRemoving(false);
    }
  };

  // Preview user object to display in UserAvatar
  const displayUser: Partial<User> | null = previewUrl
    ? { ...(currentUser || {}), avatar_url: previewUrl }
    : currentUser;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Messages */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Avatar Display & Hover Camera Trigger */}
        <div className="relative group shrink-0">
          <UserAvatar
            user={displayUser}
            size={compact ? 'xl' : '2xl'}
            bordered
            className="ring-4 ring-slate-100 shadow-md"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isRemoving}
            title="Choose new photo"
            className="absolute bottom-0 right-0 p-2 rounded-full bg-slate-900 hover:bg-indigo-600 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Upload & Management Controls */}
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name}` : 'Profile Photo'}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              JPG, PNG, WEBP, or GIF. Maximum file size 5MB.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            {previewUrl ? (
              <>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Photo...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Confirm & Save</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancelPreview}
                  disabled={isUploading}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isRemoving}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Photo</span>
                </button>

                {(currentUser?.avatar_url || currentUser?.avatar) && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={isRemoving || isUploading}
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-rose-600 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isRemoving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Remove Photo</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Drag & Drop Area when not in compact mode */}
      {!compact && !previewUrl && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`p-4 border-2 border-dashed rounded-xl text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/50'
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
          }`}
        >
          <p className="text-xs font-semibold text-slate-700">
            Drag and drop your photo here, or <span className="text-indigo-600 underline">browse device</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Square dimensions recommended. Automatically centered & cropped to circular avatar.
          </p>
        </div>
      )}
    </div>
  );
}
