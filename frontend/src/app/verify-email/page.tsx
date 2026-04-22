'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/authApi';
import { useAuthStore } from '@/store/authStore';
import { getApiErrorMessage } from '@/lib/utils';
import { notify } from '@/lib/notify';
import { Button } from '@/components/ui/Button';

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error',
  );
  const [message, setMessage] = useState(token ? '' : 'No verification token provided.');

  useEffect(() => {
    if (!token) return;
    authApi.verifyEmail(token)
      .then(async (res) => {
        const msg = res.message ?? 'Email verified successfully!';
        setMessage(msg);
        notify.success(msg);
        setStatus('success');
        try {
          await useAuthStore.getState().refreshProfile();
        } catch {
          /* ignore */
        }
      })
      .catch((err) => {
        const msg = getApiErrorMessage(err);
        setMessage(msg);
        notify.error(msg);
        setStatus('error');
      });
  }, [token]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-white px-8">
      <div className="w-full max-w-sm text-center space-y-6">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-[#1a3a5c] mx-auto" />
            <h2 className="text-xl font-semibold text-slate-900">Verifying your email…</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold text-slate-900">Email Verified!</h2>
            <p className="text-sm text-slate-500">{message}</p>
            <Button className="w-full" onClick={() => router.push('/login')}>Go to Sign In</Button>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-slate-900">Verification Failed</h2>
            <p className="text-sm text-slate-500">{message}</p>
            <Link href="/login" className="text-sm text-blue-600 hover:underline block">
              Back to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
