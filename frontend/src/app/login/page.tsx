'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/lib/authApi';
import { useAuthStore } from '@/store/authStore';
import { getApiErrorMessage } from '@/lib/utils';
import { notify } from '@/lib/notify';
import type { SystemRole } from '@/types';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;
const ADMIN_ROLES: SystemRole[] = ['COMPANY_ADMIN', 'HR_MANAGER', 'TEAM_LEAD'];

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const portal = (params.get('portal') ?? 'employee') as 'admin' | 'employee';
  const { setCredentials, setPortal } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const isAdmin = portal === 'admin';
  const portalTitle = isAdmin ? 'Admin Portal' : 'Employee Portal';
  const portalSubtitle = isAdmin
    ? 'Sign in to manage the organization'
    : 'Sign in to access your account';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await authApi.login({ ...data, portal });
      setCredentials(result.user, result.accessToken, result.refreshToken);
      setPortal(portal);
      if (ADMIN_ROLES.includes(result.user.systemRole)) {
        router.push('/admin/dashboard');
      } else {
        router.push('/employee/dashboard');
      }
    } catch (err) {
      const msg = getApiErrorMessage(err);
      if (msg.toLowerCase().includes('verify')) {
        router.replace(`/pending-verification?email=${encodeURIComponent(data.email)}`);
        return;
      }
      notify.error(msg);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      {/* Left: EMS brand — matches home page */}
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

      {/* Right: sign-in */}
      <section className="flex min-h-[62vh] w-full flex-1 flex-col bg-white px-8 py-10 md:min-h-screen md:w-1/2 md:justify-center md:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
          >
            ← Back to portals
          </Link>

          <div className="mt-8 space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{portalTitle}</h2>
            <p className="text-sm text-slate-500 sm:text-base">{portalSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
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
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                className="pr-11"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-[34px] rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-slate-500 hover:text-slate-800 hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              className="w-full rounded-lg border-transparent font-semibold !bg-[#0c1929] text-white shadow-md shadow-slate-900/15 hover:!bg-[#132a42] focus-visible:ring-[#0c1929]/50"
            >
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link href={`/register?portal=${portal}`} className="font-medium text-slate-800 underline-offset-2 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginForm />
    </Suspense>
  );
}
