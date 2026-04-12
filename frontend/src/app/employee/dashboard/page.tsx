'use client';

import { useEffect, useState } from 'react';
import {
  UserCircle,
  Mail,
  Clock,
  MailCheck,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/authApi';
import { formatDate, getInitials, getFullName, getApiErrorMessage } from '@/lib/utils';

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</p>
        <div className="text-sm text-slate-900 mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export default function EmployeeDashboardPage() {
  const { user, refreshProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [error, setError] = useState('');

  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    try {
      await refreshProfile();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMsg('');
    try {
      const result = await authApi.resendVerification();
      setResendMsg(result.message ?? 'Verification email sent!');
    } catch (err) {
      setResendMsg(getApiErrorMessage(err));
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  if (!user) return null;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {user.firstName ?? 'Employee'} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Your employee dashboard</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} isLoading={loading} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {error && <Alert variant="error" message={error} onClose={() => setError('')} />}

      {/* Unverified email banner */}
      {!user.isEmailVerified && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 p-4">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Email not verified</p>
            <p className="text-xs text-amber-700 mt-0.5">Please verify your email to unlock all features.</p>
          </div>
          <div className="shrink-0 space-y-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendVerification}
              isLoading={resendLoading}
              className="border-amber-400 text-amber-700 hover:bg-amber-100"
            >
              Resend Email
            </Button>
            {resendMsg && <p className="text-xs text-green-600 text-right">{resendMsg}</p>}
          </div>
        </div>
      )}

      {/* Profile card */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-[#0f1b2d] to-[#1a3a5c]" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-7 mb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white border-4 border-white shadow text-[#0f1b2d] font-bold text-lg">
              {getInitials(user.firstName, user.lastName, user.email)}
            </div>
            <div className="pb-1 flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {getFullName(user.firstName, user.lastName, user.email)}
              </h2>
              <Badge variant={user.isActive ? 'success' : 'danger'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          <InfoRow
            icon={Mail}
            label="Email"
            value={
              <span className="flex items-center gap-1.5">
                {user.email}
                {user.isEmailVerified
                  ? <MailCheck className="h-3.5 w-3.5 text-green-500" />
                  : <span className="text-xs text-amber-600 font-medium">(unverified)</span>
                }
              </span>
            }
          />
          <InfoRow icon={UserCircle} label="Full Name" value={getFullName(user.firstName, user.lastName) || '—'} />
          <InfoRow
            icon={ShieldCheck}
            label="Role"
            value={<Badge variant="default">{user.role}</Badge>}
          />
          <InfoRow
            icon={Clock}
            label="Last Login"
            value={formatDate(user.lastLoginAt)}
          />
          <InfoRow
            icon={Clock}
            label="Member Since"
            value={formatDate(user.createdAt)}
          />
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 mb-1">Update Password</h3>
          <p className="text-sm text-slate-500 mb-3">
            Request a password reset link via email.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await authApi.forgotPassword(user.email);
                setResendMsg('Password reset email sent! Check your inbox.');
              } catch (err) {
                setError(getApiErrorMessage(err));
              }
            }}
          >
            Send Reset Email
          </Button>
          {resendMsg && <p className="text-xs text-green-600 mt-2">{resendMsg}</p>}
        </div>
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 mb-1">Account Status</h3>
          <p className="text-sm text-slate-500 mb-3">Your current account information at a glance.</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={user.isActive ? 'success' : 'danger'}>
              {user.isActive ? '● Active' : '● Inactive'}
            </Badge>
            <Badge variant={user.isEmailVerified ? 'success' : 'warning'}>
              {user.isEmailVerified ? '● Verified' : '● Unverified'}
            </Badge>
            <Badge variant="info">User #{user.id}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
