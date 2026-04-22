'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { hrApi } from '@/lib/hrApi';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/lib/utils';
import { notify } from '@/lib/notify';

type Item = Record<string, unknown>;

export default function AdminLeavePage() {
  const { user } = useAuthStore();
  const [policies, setPolicies] = useState<Item[]>([]);
  const [balances, setBalances] = useState<Item[]>([]);
  const [requests, setRequests] = useState<Item[]>([]);
  const [calendar, setCalendar] = useState<Item[]>([]);
  const month = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const load = async () => {
    if (!user?.companyId) return;
    try {
      const [p, b, r, c] = await Promise.all([
        hrApi.listLeavePolicies(user.companyId),
        hrApi.listLeaveBalances(user.companyId),
        hrApi.listLeaveRequests(user.companyId),
        hrApi.leaveCalendar(user.companyId, month),
      ]);
      setPolicies(p);
      setBalances(b);
      setRequests(r);
      setCalendar(c);
    } catch (e) {
      notify.error(getApiErrorMessage(e));
    }
  };

  useEffect(() => {
    if (!user?.companyId) return;
    void Promise.all([
      hrApi.listLeavePolicies(user.companyId),
      hrApi.listLeaveBalances(user.companyId),
      hrApi.listLeaveRequests(user.companyId),
      hrApi.leaveCalendar(user.companyId, month),
    ]).then(([p, b, r, c]) => {
      setPolicies(p as Item[]);
      setBalances(b as Item[]);
      setRequests(r as Item[]);
      setCalendar(c as Item[]);
    });
  }, [user?.companyId, month]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Leave Policy and Calendar</h1>
        <Button onClick={load} variant="outline">Refresh</Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold mb-3">Policies</h2>
          <div className="space-y-2 text-sm">
            {policies.map((p, idx) => (
              <div key={String(p.id ?? idx)} className="rounded-lg border p-2">
                <div className="font-medium">{String(p.leaveType ?? '-')}</div>
                <div className="text-slate-500">Allocation: {String(p.annualAllocation ?? '-')}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold mb-3">Balances</h2>
          <div className="space-y-2 text-sm">
            {balances.map((b, idx) => (
              <div key={String(b.id ?? idx)} className="rounded-lg border p-2">
                <div className="font-medium">{String(b.leaveType ?? '-')} ({String(b.year ?? '-')})</div>
                <div className="text-slate-500">Remaining: {String(b.remainingDays ?? '-')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold mb-3">Approval Queue</h2>
        <div className="space-y-2">
          {requests.map((r, idx) => (
            <div key={String(r.id ?? idx)} className="flex items-center justify-between border rounded-lg p-3 text-sm">
              <div>
                <div className="font-medium">{String((r.employee as { user?: { email?: string } } | undefined)?.user?.email ?? '-')}</div>
                <div className="text-slate-500">{String(r.leaveType ?? '-')} | {String(r.status ?? '-')}</div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await hrApi.teamLeadDecision(String(r.id), 'approve');
                      notify.success('Team lead decision saved');
                      await load();
                    } catch (e) {
                      notify.error(getApiErrorMessage(e));
                    }
                  }}
                >
                  TL Approve
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await hrApi.hrDecision(String(r.id), 'approve');
                      notify.success('HR decision saved');
                      await load();
                    } catch (e) {
                      notify.error(getApiErrorMessage(e));
                    }
                  }}
                >
                  HR Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold mb-3">Monthly Calendar Feed</h2>
        <div className="space-y-2 text-sm">
          {calendar.map((c, idx) => (
            <div key={String(c.id ?? idx)} className="border rounded-lg p-2">
              {String((c.employee as { user?: { email?: string } } | undefined)?.user?.email ?? '-')} | {String(c.leaveType ?? '-')} | {new Date(String(c.startDate)).toLocaleDateString()} - {new Date(String(c.endDate)).toLocaleDateString()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
