'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { hrApi } from '@/lib/hrApi';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/lib/utils';
import { notify } from '@/lib/notify';

export default function EmployeeLeavePage() {
  const { user } = useAuthStore();
  const [employeeId, setEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState('Annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [requests, setRequests] = useState<Array<Record<string, unknown>>>([]);
  const [balances, setBalances] = useState<Array<Record<string, unknown>>>([]);
  const totalDays = useMemo(() => 1, []);

  const load = async () => {
    if (!user?.companyId || !employeeId) return;
    setRequests(await hrApi.listLeaveRequests(user.companyId, employeeId));
    setBalances(await hrApi.listLeaveBalances(user.companyId, employeeId));
  };

  useEffect(() => {
    if (!user?.companyId || !employeeId) return;
    void Promise.all([
      hrApi.listLeaveRequests(user.companyId, employeeId),
      hrApi.listLeaveBalances(user.companyId, employeeId),
    ]).then(([r, b]) => {
      setRequests(r as Array<Record<string, unknown>>);
      setBalances(b as Array<Record<string, unknown>>);
    });
  }, [user?.companyId, employeeId]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold">My Leave</h1>
      <div className="rounded-xl border bg-white p-4 space-y-2">
        <input className="w-full rounded border px-3 py-2 text-sm" placeholder="My Employee ID" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
        <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Leave Type" value={leaveType} onChange={(e) => setLeaveType(e.target.value)} />
        <input className="w-full rounded border px-3 py-2 text-sm" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input className="w-full rounded border px-3 py-2 text-sm" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <Button onClick={async () => {
          if (!user?.companyId || !employeeId) return;
          try {
            await hrApi.createLeaveRequest({
              employeeId,
              companyId: user.companyId,
              leaveType,
              startDate,
              endDate,
              totalDays,
            });
            notify.success('Leave request submitted');
            await load();
          } catch (e) {
            notify.error(getApiErrorMessage(e));
          }
        }}>Submit Request</Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold mb-2">Balances</h2>
          {balances.map((b, idx) => <div key={String(b.id ?? idx)} className="text-sm border rounded p-2 mb-2">{String(b.leaveType ?? '-')}: {String(b.remainingDays ?? '-')}</div>)}
        </div>
        <div className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold mb-2">Requests</h2>
          {requests.map((r, idx) => <div key={String(r.id ?? idx)} className="text-sm border rounded p-2 mb-2">{String(r.leaveType ?? '-')} | {String(r.status ?? '-')}</div>)}
        </div>
      </div>
    </div>
  );
}
