'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/lib/authApi';
import { getApiErrorMessage } from '@/lib/utils';
import { getPasswordStrength } from '@/lib/passwordStrength';
import { notify } from '@/lib/notify';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [completed, setCompleted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const strength = useMemo(() => getPasswordStrength(passwordValue), [passwordValue]);

  const onSubmit = async (data: FormData) => {
    if (!token) {
      notify.error('Invalid or missing reset token.');
      return;
    }
    try {
      const result = await authApi.resetPassword(token, data.password);
      notify.success(`${result.message ?? 'Password reset successfully.'} Redirecting…`);
      setCompleted(true);
      setTimeout(() => router.push('/'), 2500);
    } catch (err) {
      notify.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <section className="relative flex min-h-[38vh] w-full flex-1 flex-col justify-center overflow-hidden bg-[#0c1929] px-8 py-10 md:min-h-screen md:w-1/2 md:px-12 lg:px-16">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-[min(420px,80vw)] w-[min(420px,80vw)] rounded-full bg-sky-500/15 blur-3xl"
          aria-hidden
        />
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            Employee Management System
          </h1>
          <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
            Streamline your workforce operations, track attendance, manage payroll, and empower your team securely.
          </p>
        </div>
      </section>

      <section className="flex min-h-[62vh] w-full flex-1 flex-col bg-white px-8 py-10 md:min-h-screen md:w-1/2 md:justify-center md:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md space-y-7">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">Set new password</h2>
            <p className="text-sm text-slate-500">Enter and confirm your new password below.</p>
          </div>

          {!completed && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="relative">
                <Input
                  label="New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  error={errors.password?.message}
                  className="pr-10"
                  {...register('password', {
                    onChange: (e) => setPasswordValue(e.target.value),
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <div className="mt-2">
                  <div className="h-2 w-full rounded bg-slate-200">
                    <div
                      className={`h-2 rounded transition-all ${strength.color}`}
                      style={{ width: passwordValue ? strength.width : '0%' }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Strength: {passwordValue ? strength.label : '—'}
                  </p>
                </div>
              </div>

              <div className="relative">
                <Input
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  error={errors.confirmPassword?.message}
                  className="pr-10"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={isSubmitting}
                disabled={!token}
                className="w-full rounded-lg border-transparent font-semibold !bg-[#0c1929] text-white shadow-md shadow-slate-900/15 hover:!bg-[#132a42] focus-visible:ring-[#0c1929]/50"
              >
                Reset Password
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500">
            <Link href="/login" className="font-medium text-slate-800 underline-offset-2 hover:underline">
              ← Back to Sign In
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
