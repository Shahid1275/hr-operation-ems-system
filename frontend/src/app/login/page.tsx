'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { authApi } from '@/lib/authApi';
import { useAuthStore } from '@/store/authStore';
import { getApiErrorMessage } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const portal = (params.get('portal') ?? 'employee') as 'admin' | 'employee';
  const { setCredentials, setPortal } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = portal === 'admin';
  const portalLabel = isAdmin ? 'Admin Portal' : 'Employee Portal';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const result = await authApi.login(data);
      setCredentials(result.user, result.accessToken, result.refreshToken);
      setPortal(portal);
      // Route by role
      if (result.user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/employee/dashboard');
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left Panel */}
      <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center bg-[#0f1b2d] px-14 py-16 relative">
        <div className="space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Building2 className="h-10 w-10 text-white" />
            </div>
            <span className="text-xs font-bold tracking-widest uppercase text-blue-300">EMS</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight text-white">
            Employee<br />Management<br />System
          </h1>
          <p className="text-base text-blue-300 leading-relaxed max-w-xs mx-auto">
            Streamline your workforce operations, track attendance, manage
            payroll, and empower your team securely.
          </p>
        </div>
        <p className="text-sm text-blue-400/60 absolute bottom-8">
          © {new Date().getFullYear()} Employee Management System. All rights reserved.
        </p>
      </div>

      {/* Right Panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-8">
        <div className="w-full max-w-sm space-y-7">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">{portalLabel}</p>
            <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-500">Enter your credentials to continue</p>
          </div>

          {error && <Alert variant="error" message={error} onClose={() => setError('')} />}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link href={`/register?portal=${portal}`} className="font-medium text-blue-600 hover:underline">
              Create one
            </Link>
          </p>

          <p className="text-center text-sm text-slate-400">
            <Link href="/" className="hover:underline">← Back to portal selection</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
