'use client';

import { useState } from 'react';
import { Eye, EyeOff, User, Mail, Shield, Clock, MailCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { notify } from '@/lib/notify';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/authApi';
import { getApiErrorMessage, formatDate, getInitials, getFullName } from '@/lib/utils';

const schema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

export default function EmployeeProfilePage() {
  const { user } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async () => {
    try {
      await authApi.forgotPassword(user?.email ?? '');
      notify.success('A password reset link has been sent to your email address.');
      reset();
    } catch (err) {
      notify.error(getApiErrorMessage(err));
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const res = await authApi.resendVerification();
      notify.success(res.message ?? 'Verification email sent!');
    } catch (err) {
      notify.error(getApiErrorMessage(err));
    } finally {
      setResendLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your account details</p>
      </div>

      {/* Profile card */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-[#0f1b2d] to-[#1a3a5c]" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-7 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white border-4 border-white shadow text-[#0f1b2d] font-bold text-lg">
              {getInitials(user.firstName, user.lastName, user.email)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              {getFullName(user.firstName, user.lastName, user.email)}
            </h2>
            <Badge variant="default"><Shield className="h-3 w-3 mr-1 inline" />{user.role}</Badge>
            <Badge variant={user.isActive ? 'success' : 'danger'}>
              {user.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Full Name</p>
              <p className="text-sm text-slate-900 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" />
                {getFullName(user.firstName, user.lastName) || '—'}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Email</p>
              <p className="text-sm text-slate-900 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                {user.email}
                {user.isEmailVerified
                  ? <MailCheck className="h-4 w-4 text-green-500" />
                  : <span className="text-xs text-amber-600">(unverified)</span>
                }
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Last Login</p>
              <p className="text-sm text-slate-900 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {formatDate(user.lastLoginAt)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Member Since</p>
              <p className="text-sm text-slate-900 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {formatDate(user.createdAt)}
              </p>
            </div>
          </div>

          {!user.isEmailVerified && (
            <div className="mt-4 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResend}
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
          <p className="text-xs text-slate-500 mt-0.5">A reset link will be sent to your email.</p>
        </div>
        <div className="p-6 max-w-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
