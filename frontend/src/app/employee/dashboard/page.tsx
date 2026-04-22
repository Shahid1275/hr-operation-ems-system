'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck2, CheckCircle2, Clock3, Timer } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuthStore } from '@/store/authStore';
import { hrApi } from '@/lib/hrApi';

export default function EmployeeDashboardPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState({
    attendance: 0,
    leaves: 0,
    payroll: 0,
    unreadNotifications: 0,
  });

  useEffect(() => {
    if (!user?.companyId) return;
    void hrApi
      .listEmployees({ companyId: user.companyId, search: user.email, page: 1, limit: 1 })
      .then(async (res) => {
        const employee = res.items[0];
        if (!employee) return;
        const data = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/dashboard/employee-summary?employeeId=${employee.id}&companyId=${user.companyId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
            },
          },
        ).then((r) => r.json());
        setSummary(data.data ?? data);
      });
  }, [user?.companyId, user?.email]);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-3xl font-bold text-slate-800">Welcome, Employee</h1>
        <p className="text-sm text-slate-500">Your personal work summary for today.</p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Attendance" value={summary.attendance} subtitle="View Details" icon={Clock3} colorClass="bg-[#3742a4]" />
        <StatCard title="Leave Requests" value={summary.leaves} subtitle="View Status" icon={CalendarCheck2} colorClass="bg-[#17a6a8]" />
        <StatCard title="Payslips" value={summary.payroll} subtitle="View Payslip" icon={CheckCircle2} colorClass="bg-[#1f9ee8]" />
        <StatCard title="Hours Today" value={8} subtitle="View Timesheet" icon={Timer} colorClass="bg-[#f89a34]" />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Pending Leaves</p>
          <p className="mt-1 text-4xl font-bold text-slate-900">{summary.leaves}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Unread Notifications</p>
          <p className="mt-1 text-4xl font-bold text-slate-900">{summary.unreadNotifications}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Profile Status</p>
          <p className="mt-1 text-4xl font-bold text-slate-900">{user?.isEmailVerified ? 'Verified' : 'Pending'}</p>
        </div>
      </section>
    </div>
  );
}
