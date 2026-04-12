'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Mail,
  MailCheck,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/authApi';
import { formatDate, getFullName, getInitials, getApiErrorMessage } from '@/lib/utils';
import type { User } from '@/types';

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-6 flex items-center gap-4 shadow-sm">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user, refreshProfile } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // The backend returns the current user profile; for admin user list
      // we use the profile endpoint plus demonstrate all users via the admin view.
      // Since the backend only has auth endpoints (no dedicated /users list for admin),
      // we show the current user profile and stats derived from it.
      await refreshProfile();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleResendVerification = async () => {
    setResendingVerification(true);
    setResendMsg('');
    try {
      const result = await authApi.resendVerification();
      setResendMsg(result.message ?? 'Verification email sent.');
    } catch (err) {
      setResendMsg(getApiErrorMessage(err));
    } finally {
      setResendingVerification(false);
    }
  };

  const currentUser = user;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Welcome back, {getFullName(user?.firstName, user?.lastName, user?.email)}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {error && <Alert variant="error" message={error} onClose={() => setError('')} />}
      {resendMsg && <Alert variant="info" message={resendMsg} onClose={() => setResendMsg('')} />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={1} icon={Users} color="bg-blue-100 text-blue-600" />
        <StatCard label="Active Users" value={currentUser?.isActive ? 1 : 0} icon={UserCheck} color="bg-green-100 text-green-600" />
        <StatCard label="Inactive Users" value={currentUser?.isActive ? 0 : 1} icon={UserX} color="bg-red-100 text-red-600" />
        <StatCard label="Verified Emails" value={currentUser?.isEmailVerified ? 1 : 0} icon={MailCheck} color="bg-purple-100 text-purple-600" />
      </div>

      {/* Current User Profile */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Your Account</h2>
          {loading && <Spinner className="h-4 w-4 text-slate-400" />}
        </div>

        {currentUser && (
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0f1b2d] text-white font-semibold text-lg shrink-0">
                {getInitials(currentUser.firstName, currentUser.lastName, currentUser.email)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900">
                    {getFullName(currentUser.firstName, currentUser.lastName, currentUser.email)}
                  </h3>
                  <Badge variant={currentUser.role === 'ADMIN' ? 'info' : 'default'}>
                    {currentUser.role === 'ADMIN' ? (
                      <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Admin</span>
                    ) : 'User'}
                  </Badge>
                  <Badge variant={currentUser.isActive ? 'success' : 'danger'}>
                    {currentUser.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {currentUser.email}
                  {currentUser.isEmailVerified ? (
                    <MailCheck className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <span className="text-xs text-amber-600 font-medium">(unverified)</span>
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Last login: {formatDate(currentUser.lastLoginAt)}
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Joined: {formatDate(currentUser.createdAt)}
                </p>
              </div>
            </div>

            {!currentUser.isEmailVerified && (
              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center justify-between gap-3">
                <p className="text-sm text-amber-800">Your email is not verified. Some features may be limited.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  isLoading={resendingVerification}
                  className="shrink-0 border-amber-400 text-amber-700 hover:bg-amber-100"
                >
                  Resend Email
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* System Info */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">System Information</h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Backend API</p>
            <p className="text-sm font-medium text-slate-900">
              {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">API Docs</p>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3000'}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              View Swagger Docs ↗
            </a>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">User ID</p>
            <p className="text-sm font-medium text-slate-900">#{currentUser?.id}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Role</p>
            <p className="text-sm font-medium text-slate-900">{currentUser?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
