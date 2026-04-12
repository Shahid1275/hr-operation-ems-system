'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, User, Mail, Shield, Clock, MailCheck } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/authApi';
import { getApiErrorMessage, formatDate, getInitials, getFullName } from '@/lib/utils';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type PasswordData = z.infer<typeof passwordSchema>;

export default function AdminProfilePage() {
  const { user, refreshProfile } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });

  const onPasswordSubmit = async (data: PasswordData) => {
    setError('');
    setSuccess('');
    try {
      // The reset-password flow requires a token from email,
      // so we use forgot-password to trigger the flow
      await authApi.forgotPassword(user?.email ?? '');
      setSuccess('A password reset email has been sent. Please check your inbox to complete the change.');
      reset();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMsg('');
    try {
      const result = await authApi.resendVerification();
      setResendMsg(result.message ?? 'Verification email sent!');
    } catch (err) {
      setResendMsg(getApiErrorMessage(err));
    } finally {
      setResendLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#0f1b2d] to-[#1a3a5c]" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-8 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white border-4 border-white shadow text-[#0f1b2d] font-bold text-xl">
              {getInitials(user.firstName, user.lastName, user.email)}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              {getFullName(user.firstName, user.lastName, user.email)}
            </h2>
            <Badge variant="info"><Shield className="h-3 w-3 mr-1 inline" />{user.role}</Badge>
            <Badge variant={user.isActive ? 'success' : 'danger'}>
              {user.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <User className="h-4 w-4 text-slate-400" />
              <span>{user.firstName ?? '—'} {user.lastName ?? ''}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail className="h-4 w-4 text-slate-400" />
              <span>{user.email}</span>
              {user.isEmailVerified
                ? <MailCheck className="h-4 w-4 text-green-500" />
                : <span className="text-xs text-amber-600 font-medium">(unverified)</span>
              }
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>Last login: {formatDate(user.lastLoginAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>Member since: {formatDate(user.createdAt)}</span>
            </div>
          </div>

          {!user.isEmailVerified && (
            <div className="mt-4 flex items-center gap-3">
              {resendMsg && <p className="text-sm text-green-600">{resendMsg}</p>}
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendVerification}
                isLoading={resendLoading}
              >
                Resend Verification Email
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Change Password</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            A reset link will be sent to your email address.
          </p>
        </div>
        <div className="p-6 max-w-sm">
          {error && <Alert variant="error" message={error} onClose={() => setError('')} className="mb-4" />}
          {success && <Alert variant="success" message={success} onClose={() => setSuccess('')} className="mb-4" />}

          <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="relative">
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                error={errors.newPassword?.message}
                {...register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input
              label="Confirm New Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Re-enter password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
              Send Reset Email
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
