'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/authApi';
import { getApiErrorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }
    authApi.verifyEmail(token)
      .then((res) => {
        setMessage(res.message ?? 'Email verified successfully!');
        setStatus('success');
      })
      .catch((err) => {
        setMessage(getApiErrorMessage(err));
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
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
