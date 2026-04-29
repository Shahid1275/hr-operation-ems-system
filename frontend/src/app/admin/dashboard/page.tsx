'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  Clock3,
  ClipboardCheck,
  ArrowRight,
  CalendarDays,
  Wallet,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/Badge';
import { hrApi } from '@/lib/hrApi';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

type Summary = {
  employees: number;
  activeUsers: number;
  pendingLeaves: number;
  payrollProcessed: number;
};

type LeaveRequest = {
  id: string;
  leaveType: string;
  status: string;
  startDate: string;
  endDate: string;
  employee?: { user?: { firstName?: string; lastName?: string; email?: string } };
};

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<Summary>({
    employees: 0,
    activeUsers: 0,
    pendingLeaves: 0,
    payrollProcessed: 0,
  });
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);

  const today = new Date();
  const greeting =
    today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    if (!user?.companyId) return;
    void hrApi.adminSummary(user.companyId).then(setSummary);

    setLoadingLeaves(true);
    void hrApi
      .listLeaveRequests(user.companyId)
      .then((r) => setRecentLeaves((r as LeaveRequest[]).slice(0, 5)))
      .finally(() => setLoadingLeaves(false));
  }, [user?.companyId]);

  const statusBadge = (status: string) => {
    if (status === 'APPROVED') return <Badge variant="success" dot>Approved</Badge>;
    if (status === 'REJECTED') return <Badge variant="danger" dot>Rejected</Badge>;
    return <Badge variant="warning" dot>Pending</Badge>;
  };

  const displayName =
    user?.firstName && user?.lastName ? user.firstName : user?.email?.split('@')[0] ?? 'Admin';

  return (
    <div className="space-y-6">

      {/* Hero welcome */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0c1929] via-[#1a3a5c] to-[#1e4a72] p-6 shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm font-medium text-white/60">{dateStr}</p>
            <h1 className="mt-1 text-2xl font-bold text-white tracking-tight">
              {greeting}, {displayName} 👋
            </h1>
            <p className="mt-1 text-sm text-white/55">
              Here&apos;s your workforce overview for today.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-semibold text-white transition-colors"
            >
              <Users className="h-3.5 w-3.5" />
              Employees
            </Link>
            <Link
              href="/admin/leave"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 px-4 py-2 text-xs font-semibold text-white transition-colors"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Leave Queue
            </Link>
          </div>
        </div>
      </div>

      {/* Primary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={summary.employees}
          icon={Users}
          colorClass="bg-gradient-to-br from-indigo-500 to-indigo-700"
          trend={{ value: 12, label: 'this month' }}
        />
        <StatCard
          title="Present Today"
          value={summary.activeUsers}
          icon={UserCheck}
          colorClass="bg-gradient-to-br from-emerald-500 to-emerald-700"
          subtitle="Attendance"
        />
        <StatCard
          title="Pending Leaves"
          value={summary.pendingLeaves}
          icon={ClipboardCheck}
          colorClass="bg-gradient-to-br from-amber-500 to-orange-600"
          subtitle="Awaiting approval"
        />
        <StatCard
          title="Payroll Processed"
          value={summary.payrollProcessed}
          icon={Wallet}
          colorClass="bg-gradient-to-br from-violet-500 to-purple-700"
          subtitle="This cycle"
        />
      </div>

      {/* Secondary metrics + Recent leaves */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Quick metrics */}
        <div className="xl:col-span-1 space-y-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Department Overview</h3>
            <div className="space-y-3">
              {[
                { label: 'Engineering',   value: 38, color: 'bg-indigo-500' },
                { label: 'HR & Admin',    value: 22, color: 'bg-emerald-500' },
                { label: 'Sales',         value: 18, color: 'bg-amber-500' },
                { label: 'Operations',    value: 14, color: 'bg-violet-500' },
                { label: 'Finance',       value: 8,  color: 'bg-rose-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-24 shrink-0">{label}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-7 text-right">{value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Departments', value: 6, icon: Building2, color: 'text-blue-600 bg-blue-50' },
              { label: 'Announcements',     value: 3, icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
              { label: 'Approved Leaves',   value: Math.max(0, summary.payrollProcessed - summary.pendingLeaves), icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Growth Rate',       value: '8%', icon: TrendingUp, color: 'text-violet-600 bg-violet-50' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-2 shadow-sm">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent leave requests */}
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Recent Leave Requests</h3>
              <p className="text-xs text-slate-400 mt-0.5">Latest submissions from employees</p>
            </div>
            <Link
              href="/admin/leave"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loadingLeaves ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          ) : recentLeaves.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarDays className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No leave requests yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentLeaves.map((req) => {
                const emp = req.employee?.user;
                const name =
                  emp?.firstName && emp?.lastName
                    ? `${emp.firstName} ${emp.lastName}`
                    : emp?.email?.split('@')[0] ?? 'Unknown';
                const initials = ((emp?.firstName?.[0] ?? '') + (emp?.lastName?.[0] ?? '')).toUpperCase() || name[0].toUpperCase();
                const from = new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const to   = new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <div key={req.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
                      <p className="text-xs text-slate-400">{from} — {to}</p>
                    </div>
                    <Badge variant={req.leaveType === 'SICK' ? 'orange' : req.leaveType === 'ANNUAL' ? 'indigo' : 'teal'}>
                      {req.leaveType}
                    </Badge>
                    {statusBadge(req.status)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* System notice */}
      <div className="flex items-center gap-3 rounded-xl bg-indigo-50 border border-indigo-100 px-5 py-3.5 text-sm">
        <AlertCircle className="h-4 w-4 text-indigo-500 shrink-0" />
        <span className="text-indigo-700 font-medium">System notice:</span>
        <span className="text-indigo-600">Payroll review cycle closes at end of day. Please finalise all pending approvals.</span>
        <CheckCircle2 className="h-4 w-4 text-indigo-400 ml-auto shrink-0" />
      </div>
    </div>
  );
}
