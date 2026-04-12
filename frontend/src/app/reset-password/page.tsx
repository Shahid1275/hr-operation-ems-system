'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { authApi } from '@/lib/authApi';
import { getApiErrorMessage } from '@/lib/utils';

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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!token) { setError('Invalid or missing reset token.'); return; }
    setError('');
    try {
      const result = await authApi.resetPassword(token, data.password);
      setSuccess(result.message ?? 'Password reset successfully.');
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="hidden md:relative md:flex md:w-1/2 flex-col items-center justify-center bg-[#0f1b2d] px-14 py-16">
        <div className="space-y-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">EMS</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight text-white">
            Create New<br />Password
          </h1>
          <p className="text-base text-blue-300 leading-relaxed max-w-xs mx-auto">
            Choose a strong password to secure your account.
          </p>
        </div>
        <p className="text-sm text-blue-400/60 absolute bottom-8">
          © {new Date().getFullYear()} Employee Management System. All rights reserved.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-white px-8">
        <div className="w-full max-w-sm space-y-7">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">Set new password</h2>
            <p className="text-sm text-slate-500">Enter and confirm your new password below.</p>
          </div>

          {error && <Alert variant="error" message={error} onClose={() => setError('')} />}
          {success && <Alert variant="success" title="Success!" message={`${success} Redirecting to login…`} />}

          {!success && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  error={errors.password?.message}
                  {...register('password')}
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

              <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting} disabled={!token}>
                Reset Password
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500">
            <Link href="/login" className="text-blue-600 hover:underline">← Back to Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
