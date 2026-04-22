'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/lib/authApi';
import { notify } from '@/lib/notify';
import { useAuthStore } from '@/store/authStore';
import { getApiErrorMessage } from '@/lib/utils';
import { getPasswordStrength } from '@/lib/passwordStrength';
import type { SystemRole } from '@/types';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;
const ADMIN_ROLES: SystemRole[] = ['COMPANY_ADMIN', 'HR_MANAGER', 'TEAM_LEAD'];

function RegisterForm() {
  const params = useSearchParams();
  const router = useRouter();
  const portal = (params.get('portal') ?? 'employee') as 'admin' | 'employee';
  const { setCredentials, setPortal } = useAuthStore();
  const [signupPortal, setSignupPortal] = useState<'admin' | 'employee'>(portal);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  useEffect(() => {
    setSignupPortal(portal);
  }, [portal]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const strength = useMemo(() => getPasswordStrength(passwordValue), [passwordValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const result = await authApi.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        signupPortal,
      });
      setCredentials(result.user, result.accessToken, result.refreshToken);
      setPortal(signupPortal);
      notify.success(result.message);
      if (!result.user.isEmailVerified) {
        router.replace(
          `/pending-verification?email=${encodeURIComponent(result.user.email)}`,
        );
        return;
      }
      setTimeout(() => {
        router.push(
          ADMIN_ROLES.includes(result.user.systemRole)
            ? '/admin/dashboard'
            : '/employee/dashboard',
        );
      }, 2000);
    } catch (err) {
      notify.error(getApiErrorMessage(err));
    }
  };

  const portalLabel =
    signupPortal === 'admin' ? 'Admin account (organization)' : 'Employee account (personal)';

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
        <div className="mx-auto w-full max-w-md overflow-y-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
          >
            ← Back to portals
          </Link>

          <div className="mt-8 space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Create account</h2>
            <p className="text-sm text-slate-500 sm:text-base">
              Choose how you will use EMS — you must sign in later from the same portal.
            </p>
          </div>

          <div className="mt-6" role="group" aria-label="Account type">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Register as</p>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setSignupPortal('admin')}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  signupPortal === 'admin'
                    ? 'bg-[#0c1929] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white/80'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setSignupPortal('employee')}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  signupPortal === 'employee'
                    ? 'bg-[#0c1929] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white/80'
                }`}
              >
                Employee
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{portalLabel}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                placeholder="John"
                autoComplete="given-name"
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Last name"
                placeholder="Doe"
                autoComplete="family-name"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
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
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
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
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                className="pr-10"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              className="w-full rounded-lg border-transparent font-semibold !bg-[#0c1929] text-white shadow-md shadow-slate-900/15 hover:!bg-[#132a42] focus-visible:ring-[#0c1929]/50"
            >
              Create Account
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href={`/login?portal=${signupPortal}`} className="font-medium text-slate-800 underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <RegisterForm />
    </Suspense>
  );
}
