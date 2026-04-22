'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/lib/authApi';
import { getApiErrorMessage } from '@/lib/utils';
import { notify } from '@/lib/notify';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await authApi.forgotPassword(data.email);
      notify.success(result.message ?? 'If that email exists, a reset link has been sent.');
      setSubmitted(true);
    } catch (err) {
      notify.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="hidden md:flex md:w-1/2 flex-col justify-between bg-[#0f1b2d] px-14 py-16">
        <div />
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">EMS</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight text-white">
            Reset your<br />Password
          </h1>
          <p className="text-base text-blue-300 leading-relaxed max-w-xs">
            We&apos;ll send a secure link to your email address so you can reset your password.
          </p>
        </div>
        <p className="text-sm text-blue-400/60">
          © {new Date().getFullYear()} Employee Management System. All rights reserved.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-white px-8">
        <div className="w-full max-w-sm space-y-7">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">Forgot password?</h2>
            <p className="text-sm text-slate-500">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          {submitted ? (
            <p className="text-sm text-slate-600">
              Check your inbox (and spam) for the reset link, then return to sign in.
            </p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />
              <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                Send Reset Link
              </Button>
            </form>
          )}

          <p className="flex items-center justify-center gap-1.5 text-sm text-slate-500">
            <ArrowLeft className="h-3.5 w-3.5" />
            <Link href="/login" className="text-blue-600 hover:underline">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
