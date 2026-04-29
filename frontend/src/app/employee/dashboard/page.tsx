'use client';

import { useEffect, useState } from 'react';
import {
  Clock3, CalendarCheck2, FileText, Bell, ArrowRight,
  CheckCircle2, AlertCircle, TrendingUp, UserCircle,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { hrApi } from '@/lib/hrApi';
import { getApiErrorMessage } from '@/lib/utils';
import { notify } from '@/lib/notify';
import type { EmployeeRecord } from '@/types';
import Link from 'next/link';

type Summary = { attendance: number; leaves: number; payroll: number; unreadNotifications: number };
type LeaveReq = { id: string; leaveType: string; status: string; startDate: string; endDate: string; reason?: string };

export default function EmployeeDashboardPage() {
  const { user } = useAuthStore();
  const [employee,  setEmployee]  = useState<EmployeeRecord | null>(null);
  const [summary,   setSummary]   = useState<Summary>({ attendance: 0, leaves: 0, payroll: 0, unreadNotifications: 0 });
  const [myLeaves,  setMyLeaves]  = useState<LeaveReq[]>([]);
  const [loading,   setLoading]   = useState(true);

  const today   = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr  = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    if (!user?.companyId || !user?.email) return;

    const init = async () => {
      setLoading(true);
      try {
        // Resolve my employee record first
        const res = await hrApi.listEmployees({ companyId: user.companyId!, search: user.email, page: 1, limit: 1 });
        const emp = res.items[0] ?? null;
        setEmployee(emp);

        if (emp) {
          const [sum, leaves] = await Promise.all([
            hrApi.employeeSummary(emp.id, user.companyId!),
            hrApi.listLeaveRequests(user.companyId!, emp.id),
          ]);
          setSummary(sum);
          setMyLeaves((leaves as LeaveReq[]).slice(0, 4));
        }
      } catch (err) {
        notify.error(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [user?.companyId, user?.email]);

  const displayName = user?.firstName ?? user?.email?.split('@')[0] ?? 'Employee';

  const leaveStatusBadge = (status: string) => {
    if (status === 'APPROVED') return <Badge variant="success" dot>Approved</Badge>;
    if (status === 'REJECTED') return <Badge variant="danger"  dot>Rejected</Badge>;
    return                            <Badge variant="warning" dot>Pending</Badge>;
  };

  return (
    <div className="space-y-6">

      {/* Hero welcome */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0c1929] via-[#1a3a5c] to-[#0e4870] p-6 shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm font-medium text-white/60">{dateStr}</p>
            <h1 className="mt-1 text-2xl font-bold text-white tracking-tight">
              {greeting}, {displayName} 👋
            </h1>
            {employee && (
              <p className="mt-1 text-sm text-white/55">
                {employee.jobTitle ?? employee.department?.name ?? 'Welcome to your workspace'}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/employee/attendance"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-semibold text-white transition-colors">
              <Clock3 className="h-3.5 w-3.5" />
              Attendance
            </Link>
            <Link href="/employee/leave"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 px-4 py-2 text-xs font-semibold text-white transition-colors">
              <CalendarCheck2 className="h-3.5 w-3.5" />
              Apply Leave
            </Link>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Attendance Days"
          value={loading ? '—' : summary.attendance}
          icon={Clock3}
          colorClass="bg-gradient-to-br from-indigo-500 to-indigo-700"
          subtitle="This month"
        />
        <StatCard
          title="Leave Requests"
          value={loading ? '—' : summary.leaves}
          icon={CalendarCheck2}
          colorClass="bg-gradient-to-br from-emerald-500 to-emerald-700"
          subtitle="Total submitted"
        />
        <StatCard
          title="Payslips"
          value={loading ? '—' : summary.payroll}
          icon={FileText}
          colorClass="bg-gradient-to-br from-violet-500 to-purple-700"
          subtitle="Available"
        />
        <StatCard
          title="Notifications"
          value={loading ? '—' : summary.unreadNotifications}
          icon={Bell}
          colorClass="bg-gradient-to-br from-amber-500 to-orange-600"
          subtitle="Unread"
        />
      </div>

      {/* My profile + recent leaves */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Profile card */}
        <div className="xl:col-span-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-[#0c1929] to-[#1a3a5c]" />
            <div className="px-5 pb-5">
              <div className="flex items-end gap-3 -mt-6 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-base ring-4 ring-white shadow">
                  {(user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')}
                </div>
              </div>
              <p className="text-base font-bold text-slate-900">
                {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{employee?.jobTitle ?? 'Employee'}</p>

              <div className="mt-4 space-y-2.5">
                {[
                  { label: 'Department',    value: employee?.department?.name ?? '—'      },
                  { label: 'Employee Code', value: employee?.employeeCode ?? '—'          },
                  { label: 'Email',         value: user?.email ?? '—'                      },
                  { label: 'Status',        value: user?.isActive ? 'Active' : 'Inactive' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-medium text-slate-700 text-right truncate max-w-[140px]">{value}</span>
                  </div>
                ))}
              </div>

              <Link href="/employee/profile"
                className="mt-4 flex items-center justify-center gap-1.5 w-full h-8 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                <UserCircle className="h-3.5 w-3.5" />
                View Full Profile
              </Link>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Approved',  value: myLeaves.filter((l) => l.status === 'APPROVED').length, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Pending',   value: myLeaves.filter((l) => l.status === 'PENDING').length,  icon: AlertCircle,  color: 'text-amber-600 bg-amber-50'   },
              { label: 'Rejected',  value: myLeaves.filter((l) => l.status === 'REJECTED').length, icon: AlertCircle,  color: 'text-red-600 bg-red-50'       },
              { label: 'Payslips',  value: summary.payroll,                                         icon: TrendingUp,   color: 'text-indigo-600 bg-indigo-50' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-2 shadow-sm">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* My leave requests */}
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">My Leave Requests</h3>
              <p className="text-xs text-slate-400 mt-0.5">Recent leave applications</p>
            </div>
            <Link href="/employee/leave"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Apply new <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          ) : myLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CalendarCheck2 className="h-9 w-9 text-slate-300" />
              <p className="text-sm text-slate-400">No leave requests yet</p>
              <Link href="/employee/leave"
                className="text-xs font-semibold text-indigo-600 hover:underline">
                Apply for leave →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myLeaves.map((req) => {
                const from = new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const to   = new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <div key={req.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold shrink-0 ${
                      req.leaveType === 'ANNUAL' ? 'bg-indigo-100 text-indigo-700' :
                      req.leaveType === 'SICK'   ? 'bg-orange-100 text-orange-700' :
                                                   'bg-teal-100 text-teal-700'
                    }`}>
                      {req.leaveType.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{req.leaveType} Leave</p>
                      <p className="text-xs text-slate-400">{from} — {to}</p>
                    </div>
                    {leaveStatusBadge(req.status)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* System notice */}
      <div className="flex items-center gap-3 rounded-xl bg-indigo-50 border border-indigo-100 px-5 py-3.5 text-sm">
        <Bell className="h-4 w-4 text-indigo-500 shrink-0" />
        <span className="text-indigo-700 font-medium">Reminder:</span>
        <span className="text-indigo-600">Ensure your attendance is marked daily before 10:00 AM.</span>
      </div>
    </div>
  );
}
