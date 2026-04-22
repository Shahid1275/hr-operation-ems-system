'use client';

import { useEffect, useState } from 'react';
import { BriefcaseBusiness, CheckCheck, ClipboardCheck, Clock3, Megaphone, Users } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { hrApi } from '@/lib/hrApi';
import { useAuthStore } from '@/store/authStore';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState({
    employees: 0,
    activeUsers: 0,
    pendingLeaves: 0,
    payrollProcessed: 0,
  });

  useEffect(() => {
    if (!user?.companyId) return;
    void hrApi.adminSummary(user.companyId).then(setSummary);
  }, [user?.companyId]);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-3xl font-bold text-slate-800">Welcome, Admin</h1>
        <p className="text-sm text-slate-500">Here&apos;s what&apos;s happening with your team today.</p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={summary.employees} subtitle="View List" icon={Users} colorClass="bg-[#f89a34]" />
        <StatCard title="On Leave Today" value={summary.pendingLeaves} subtitle="View List" icon={Clock3} colorClass="bg-[#3742a4]" />
        <StatCard title="Total Departments" value={6} subtitle="View List" icon={BriefcaseBusiness} colorClass="bg-[#17a6a8]" />
        <StatCard title="Pending Approvals" value={summary.pendingLeaves} subtitle="View List" icon={ClipboardCheck} colorClass="bg-[#1f9ee8]" />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Present Today</p>
          <p className="mt-1 text-4xl font-bold text-slate-900">{summary.activeUsers}</p>
          <button className="mt-4 text-sm font-semibold text-sky-600 hover:underline">View All</button>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total Announcements</p>
          <p className="mt-1 text-4xl font-bold text-slate-900">1</p>
          <button className="mt-4 text-sm font-semibold text-sky-600 hover:underline">View All</button>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Approved Leave</p>
          <p className="mt-1 text-4xl font-bold text-slate-900">{Math.max(0, summary.payrollProcessed - summary.pendingLeaves)}</p>
          <button className="mt-4 text-sm font-semibold text-sky-600 hover:underline">View All</button>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Pending Payrolls</p>
          <p className="mt-1 text-4xl font-bold text-slate-900">{summary.payrollProcessed}</p>
          <button className="mt-4 text-sm font-semibold text-sky-600 hover:underline">View All</button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3 text-slate-600">
        <Megaphone className="h-4 w-4" />
        <span className="text-sm">System notice: Payroll review cycle closes at end of day.</span>
        <CheckCheck className="h-4 w-4 text-green-600 ml-auto" />
      </section>
    </div>
  );
}
