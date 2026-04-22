'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/lib/authApi';
import { useAuthStore } from '@/store/authStore';
import { getApiErrorMessage } from '@/lib/utils';
import { notify } from '@/lib/notify';

const RESEND_SECONDS = 60;

function PendingVerificationContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, accessToken, refreshProfile, logout } = useAuthStore();
  const emailFromQuery = params.get('email') ?? '';

  const [emailInput, setEmailInput] = useState(emailFromQuery || user?.email || '');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const displayEmail = user?.email || emailFromQuery || emailInput;

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const tryContinue = useCallback(async () => {
    try {
      await refreshProfile();
      const u = useAuthStore.getState().user;
      if (u?.isEmailVerified) {
        const role = u.systemRole;
        const admin = ['COMPANY_ADMIN', 'HR_MANAGER', 'TEAM_LEAD'].includes(role);
        router.replace(admin ? '/admin/dashboard' : '/employee/dashboard');
      } else {
        notify.error('Email is not verified yet. Check your inbox or resend below.');
      }
    } catch {
      notify.error('Could not refresh your profile. Try signing in again.');
    }
  }, [refreshProfile, router]);

  const handleResendAuthenticated = async () => {
    if (cooldown > 0 || !accessToken) return;
    setLoading(true);
    try {
      const r = await authApi.resendVerification();
      notify.success(r.message ?? 'Verification email sent.');
      setCooldown(RESEND_SECONDS);
    } catch (e) {
      notify.error(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setLoading(true);
    try {
      const r = await authApi.requestVerificationEmail(emailInput.trim());
      notify.success(r.message ?? 'If the account exists, a verification email was sent.');
      setCooldown(RESEND_SECONDS);
    } catch (e) {
      notify.error(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-4 py-10 text-white">
      <div className="relative mb-6">
        <div className="h-16 w-16 rounded-full bg-[#ff6b1a]/20 flex items-center justify-center ring-2 ring-[#ff6b1a]/40">
          <Mail className="h-8 w-8 text-[#ff6b1a]" />
        </div>
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
          1
        </span>
      </div>

      <h1 className="text-2xl font-bold text-center">Verify Your Email</h1>
      <p className="mt-2 max-w-md text-center text-sm text-white/60">
        We&apos;ve sent a confirmation link to your email address. Please click the link to activate your
        account for <span className="text-white/90 font-medium">Employee Management System</span>.
      </p>

      <div className="mt-8 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Sent to</p>
        <p className="mt-1 truncate text-sm font-medium text-white">{displayEmail || '—'}</p>

        {accessToken && user && !user.isEmailVerified && (
          <div className="mt-4 space-y-3">
            <Button
              type="button"
              className="w-full bg-white/10 hover:bg-white/15 text-white border border-white/10"
              disabled={loading || cooldown > 0}
              onClick={handleResendAuthenticated}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              ) : null}
              Resend Email{cooldown > 0 ? ` (${cooldown}s)` : ''}
            </Button>
            <Button type="button" variant="secondary" className="w-full" onClick={tryContinue}>
              I&apos;ve verified — continue
            </Button>
          </div>
        )}

        {!accessToken && (
          <form className="mt-4 space-y-3" onSubmit={handleRequestByEmail}>
            <Input
              label="Your account email"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Button type="submit" className="w-full bg-[#ff6b1a] hover:bg-[#ff8533]" disabled={loading || cooldown > 0}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : `Send verification link${cooldown > 0 ? ` (${cooldown}s)` : ''}`}
            </Button>
          </form>
        )}
      </div>

      <p className="mt-6 max-w-md text-center text-xs text-white/40">
        Didn&apos;t receive the email? Check your spam folder or try resending.
      </p>

      <div className="mt-8 flex flex-col gap-3 w-full max-w-md">
        <Button
          type="button"
          className="w-full bg-[#ff6b1a] hover:bg-[#ff8533] text-white font-semibold"
          onClick={() => router.push('/login')}
        >
          <ArrowLeft className="h-4 w-4 mr-2 inline" />
          Back to login
        </Button>
        {accessToken && (
          <button
            type="button"
            onClick={() => {
              void logout();
              router.push('/login');
            }}
            className="text-xs text-white/40 hover:text-white/60 underline"
          >
            Sign out and use a different account
          </button>
        )}
      </div>
    </div>
  );
}

export default function PendingVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
          <Loader2 className="h-10 w-10 animate-spin text-[#ff6b1a]" />
        </div>
      }
    >
      <PendingVerificationContent />
    </Suspense>
  );
}
