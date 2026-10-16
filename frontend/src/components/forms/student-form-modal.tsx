'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog } from '@/components/ui/dialog';
import { FormInput, FormSelect, FormTextarea } from './form-controls';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { studentService, Student, academicService } from '@/services';
import { UserCheck, RefreshCw, Trash2, Camera, Shield, User, MapPin, Calendar, Phone } from 'lucide-react';

const studentSchema = z.object({
  admission_number: z.string().optional().or(z.literal('')),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().optional().or(z.literal('')),
  phone_number: z.string().optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'M', 'F']).default('MALE'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'SUSPENDED', 'ARCHIVED']).default('ACTIVE'),
  date_of_birth: z.string().optional().or(z.literal('')),
  admission_date: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  current_class: z.string().optional().or(z.literal('')),
  current_stream: z.string().optional().or(z.literal('')),
  academic_year: z.string().optional().or(z.literal('')),
  profile_photo: z.string().optional().or(z.literal('')),
  parent_name: z.string().optional().or(z.literal('')),
  parent_relationship: z.string().default('GUARDIAN'),
  parent_phone: z.string().optional().or(z.literal('')),
  medical_notes: z.string().optional().or(z.literal('')),
});

export type StudentFormData = z.infer<typeof studentSchema>;

export interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (student: Student) => void;
  initialData?: any;
}

export function StudentFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: StudentFormModalProps) {
  const { success, error: toastError } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [classOptions, setClassOptions] = useState<{ label: string; value: string }[]>([
    { label: 'Form 1 Freshmen', value: 'Form 1' },
    { label: 'Form 2 Junior', value: 'Form 2' },
    { label: 'Form 3 Senior', value: 'Form 3' },
    { label: 'Form 4 Candidates', value: 'Form 4' },
    { label: 'Grade 9', value: 'Grade 9' },
    { label: 'Grade 10', value: 'Grade 10' },
    { label: 'Grade 11', value: 'Grade 11' },
  ]);
  const [streamOptions, setStreamOptions] = useState<{ label: string; value: string }[]>([
    { label: 'Stream A (Science)', value: 'Stream A' },
    { label: 'Stream B (Arts)', value: 'Stream B' },
    { label: 'Stream C (General)', value: 'Stream C' },
  ]);
  const [yearOptions, setYearOptions] = useState<{ label: string; value: string }[]>([
    { label: '2026/2027 (Current)', value: '2026/2027' },
  ]);

  const isEditing = Boolean(initialData?.id);

  // Fetch live institutional classes, streams, and academic years
  useEffect(() => {
    async function loadAcademicData() {
      try {
        const [clsRes, streamRes, yearRes] = await Promise.allSettled([
          academicService.getClasses({ page_size: 100 }),
          academicService.getStreams({ page_size: 100 }),
          academicService.getAcademicYears({ page_size: 20 }),
        ]);

        if (clsRes.status === 'fulfilled' && clsRes.value?.results) {
          setClassOptions(
            clsRes.value.results.map((c: any) => ({
              label: `${c.name} (${c.code || 'Stage'})`,
              value: c.id,
            }))
          );
        }

        if (streamRes.status === 'fulfilled' && streamRes.value?.results) {
          setStreamOptions(
            streamRes.value.results.map((s: any) => ({
              label: `${s.class_name ? s.class_name + ' - ' : ''}${s.name}`,
              value: s.id,
            }))
          );
        }

        if (yearRes.status === 'fulfilled' && yearRes.value?.results) {
          setYearOptions(
            yearRes.value.results.map((y: any) => ({
              label: `${y.name}${y.is_current ? ' (Current)' : ''}`,
              value: y.id,
            }))
          );
        }
      } catch {
        // Fallbacks
      }
    }
    if (isOpen) {
      loadAcademicData();
    }
  }, [isOpen]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    watch,
  } = useForm<any>({
    resolver: zodResolver(studentSchema) as any,
    defaultValues: {
      admission_number: initialData?.admission_number || '',
      first_name: initialData?.first_name || initialData?.user?.first_name || '',
      last_name: initialData?.last_name || initialData?.user?.last_name || '',
      email: initialData?.email || initialData?.user?.email || '',
      phone_number: initialData?.phone_number || '',
      gender: (initialData?.gender as any) || 'MALE',
      status: (initialData?.status as any) || 'ACTIVE',
      current_class: typeof initialData?.current_class === 'object' ? initialData?.current_class?.id : (initialData?.current_class || ''),
      current_stream: typeof initialData?.current_stream === 'object' ? initialData?.current_stream?.id : (initialData?.current_stream || ''),
      academic_year: initialData?.academic_year || '',
      date_of_birth: initialData?.date_of_birth || '2010-05-15',
      admission_date: initialData?.admission_date || new Date().toISOString().split('T')[0],
      address: initialData?.address || '',
      profile_photo: initialData?.profile_photo || '',
      parent_name: initialData?.parent_name || (initialData?.parent?.user ? `${initialData.parent.user.first_name} ${initialData.parent.user.last_name}` : ''),
      parent_relationship: initialData?.parent_relationship || initialData?.parent?.relationship_type || 'GUARDIAN',
      parent_phone: initialData?.parent_phone || initialData?.parent?.user?.phone_number || '',
      medical_notes: initialData?.medical_notes || '',
    },
  });


  const getError = (field: string): string | undefined => {
    const err = errors[field];
    return typeof err?.message === 'string' ? err.message : undefined;
  };

  const onSubmit = async (data: any) => {
    setServerError(null);
    const cleanData: any = { ...data };
    delete cleanData.profile_photo;

    // 1. Sanitize admission_number
    if (cleanData.admission_number && String(cleanData.admission_number).trim() !== '') {
      cleanData.admission_number = String(cleanData.admission_number).trim();
    } else {
      delete cleanData.admission_number;
    }

    // 2. Sanitize names
    cleanData.first_name = String(cleanData.first_name || 'Pupil').trim();
    cleanData.last_name = String(cleanData.last_name || 'Student').trim();

    // 3. Sanitize email (leave empty for backend auto-generation)
    if (cleanData.email && String(cleanData.email).trim() !== '' && String(cleanData.email).includes('@')) {
      cleanData.email = String(cleanData.email).trim().toLowerCase();
    } else {
      delete cleanData.email;
    }

    // 4. Sanitize phone numbers (strip spaces, hyphens, parentheses)
    if (cleanData.phone_number) {
      cleanData.phone_number = String(cleanData.phone_number).replace(/[\s\-\(\)]/g, '');
    }
    if (cleanData.parent_phone) {
      cleanData.parent_phone = String(cleanData.parent_phone).replace(/[\s\-\(\)]/g, '');
    }

    // 5. Fallback parent details
    if (!cleanData.parent_name || String(cleanData.parent_name).trim() === '') {
      cleanData.parent_name = 'Parent / Guardian';
    }

    // 6. Fallback class
    if (!cleanData.current_class || String(cleanData.current_class).trim() === '') {
      cleanData.current_class = classOptions[0]?.value || 'Form 1';
    }

    try {
      let resultStudent: Student;
      if (isEditing && initialData?.id) {
        resultStudent = await studentService.updateStudent(initialData.id, cleanData);
        success('Student Profile Updated', `${cleanData.first_name} ${cleanData.last_name} record saved successfully.`);
      } else {
        resultStudent = await studentService.createStudent(cleanData);
        success(
          'Student Enrolled & Billed',
          `${cleanData.first_name} ${cleanData.last_name} admitted. Tuition invoice and ledger automatically created!`
        );
      }

      onSuccess?.(resultStudent);
      reset();
      onClose();
    } catch (err: any) {
      let message = 'Operation failed. Please check the entered data.';
      if (err.response?.data) {
        const d = err.response.data;
        if (typeof d === 'string') {
          message = d;
        } else if (d.message) {
          message = d.message;
        } else if (d.errors) {
          const fieldErrors = d.errors;
          const msgs: string[] = [];
          Object.keys(fieldErrors).forEach((field) => {
            const m = Array.isArray(fieldErrors[field]) ? fieldErrors[field][0] : fieldErrors[field];
            setError(field as any, { message: m });
            msgs.push(`${field}: ${m}`);
          });
          message = msgs.join(' | ');
        } else if (typeof d === 'object') {
          const msgs: string[] = [];
          Object.entries(d).forEach(([k, v]) => {
            const val = Array.isArray(v) ? v[0] : v;
            msgs.push(`${k}: ${val}`);
            setError(k as any, { message: String(val) });
          });
          if (msgs.length > 0) message = msgs.join(' | ');
        }
      } else if (err.message) {
        message = err.message;
      }
      setServerError(message);
      toastError('Enrollment Notice', message);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    setIsDeleting(true);
    try {
      await studentService.deleteStudent(initialData.id);
      success('Record Removed', 'Student profile has been permanently removed.');
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: any) {
      toastError('Delete Failed', err.message || 'Could not delete student record.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? 'Edit Student Profile' : 'Student Admission & Enrollment'}
        description="Complete institutional profile registration. Tuition invoice will automatically generate for current term upon admission."
        maxWidth="2xl"
        footer={
          <div className="w-full flex items-center justify-between">
            {isEditing ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Profile
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserCheck className="h-3.5 w-3.5" />
                )}
                {isEditing ? 'Save Profile' : 'Admit & Generate Invoice'}
              </button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
          {serverError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {serverError}
            </div>
          )}

          {/* Section: Basic Identity */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
              <User className="w-3.5 h-3.5" />
              1. Student Identity & Status
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormInput
                label="Admission Number"
                error={getError('admission_number')}
                placeholder="Auto-generated (e.g. 241711356001)"
                {...register('admission_number')}
              />

              <FormSelect
                label="Status *"
                required
                error={getError('status')}
                options={[
                  { label: 'Active', value: 'ACTIVE' },
                  { label: 'Inactive', value: 'INACTIVE' },
                  { label: 'Graduated', value: 'GRADUATED' },
                  { label: 'Transferred', value: 'TRANSFERRED' },
                  { label: 'Suspended', value: 'SUSPENDED' },
                  { label: 'Archived', value: 'ARCHIVED' },
                ]}
                {...register('status')}
              />

              <FormSelect
                label="Gender *"
                required
                error={getError('gender')}
                options={[
                  { label: 'Male', value: 'MALE' },
                  { label: 'Female', value: 'FEMALE' },
                  { label: 'Other', value: 'OTHER' },
                ]}
                {...register('gender')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput
                label="First Name *"
                required
                error={getError('first_name')}
                placeholder="e.g. Neema"
                {...register('first_name')}
              />

              <FormInput
                label="Last Name *"
                required
                error={getError('last_name')}
                placeholder="e.g. Juma"
                {...register('last_name')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput
                label="Date of Birth"
                type="date"
                error={getError('date_of_birth')}
                {...register('date_of_birth')}
              />

              <FormInput
                label="Admission Date"
                type="date"
                error={getError('admission_date')}
                {...register('admission_date')}
              />
            </div>
          </div>

          {/* Section: Academic Allocation */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Shield className="w-3.5 h-3.5" />
              2. Academic Placement & Hierarchy
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormSelect
                label="Academic Year"
                error={getError('academic_year')}
                options={[
                  { label: 'Default Current Year', value: '' },
                  ...yearOptions,
                ]}
                {...register('academic_year')}
              />

              <FormSelect
                label="Class Level *"
                required
                error={getError('current_class')}
                options={[
                  { label: 'Select Class...', value: '' },
                  ...classOptions,
                ]}
                {...register('current_class')}
              />

              <FormSelect
                label="Stream / Section"
                error={getError('current_stream')}
                options={[
                  { label: 'Select Stream (Optional)...', value: '' },
                  ...streamOptions,
                ]}
                {...register('current_stream')}
              />
            </div>
          </div>

          {/* Section: Contact & Location */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
              <Phone className="w-3.5 h-3.5" />
              3. Contact & Residential Location
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput
                label="Student Email"
                type="email"
                error={getError('email')}
                placeholder="Optional (auto-generated if empty)"
                {...register('email')}
              />

              <FormInput
                label="Student Phone Number"
                error={getError('phone_number')}
                placeholder="+255 712 345 678 (Optional)"
                {...register('phone_number')}
              />
            </div>

            <FormInput
              label="Residential Address"
              error={getError('address')}
              placeholder="e.g. 123 Uhuru Street, Dar es Salaam"
              {...register('address')}
            />
          </div>

          {/* Section: Parent / Guardian */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <UserCheck className="w-3.5 h-3.5" />
              4. Guardian & Emergency Contact
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <FormInput
                  label="Parent / Guardian Name"
                  error={getError('parent_name')}
                  placeholder="e.g. Juma Omari (Optional)"
                  {...register('parent_name')}
                />
              </div>

              <FormSelect
                label="Relationship"
                options={[
                  { label: 'Mother', value: 'MOTHER' },
                  { label: 'Father', value: 'FATHER' },
                  { label: 'Guardian', value: 'GUARDIAN' },
                ]}
                {...register('parent_relationship')}
              />
            </div>

            <FormInput
              label="Guardian Phone Number"
              error={getError('parent_phone')}
              placeholder="e.g. 0712 345 678 or +255 789 012 345"
              {...register('parent_phone')}
            />
          </div>

          {/* Medical Notes */}
          <FormTextarea
            label="Medical & Special Needs Notes"
            error={getError('medical_notes')}
            placeholder="Allergies, chronic conditions, dietary restrictions..."
            {...register('medical_notes')}
          />
        </form>
      </Dialog>

      {/* Confirmation Dialog for Destructive Delete Action */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Permanently Expel & Delete Student Record?"
        message={`Are you sure you want to permanently delete student record for ${initialData?.first_name || 'this student'}? All associated grades, attendance history, and fee invoices will be archived.`}
        confirmLabel="Yes, Delete Record"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </>
  );
}
