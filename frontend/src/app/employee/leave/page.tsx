'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, Plus, X, ChevronDown, Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { hrApi } from '@/lib/hrApi';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { getApiErrorMessage } from '@/lib/utils';
import { notify } from '@/lib/notify';
import type { EmployeeRecord } from '@/types';

type LeaveRequest = {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: string;
  totalDays?: number;
};

type LeaveBalance = {
  id: string;
  leaveType: string;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
};

const LEAVE_TYPES = ['ANNUAL', 'CASUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'UNPAID'];

const leaveTypeBadge = (type: string) => {
  if (type === 'ANNUAL')    return <Badge variant="indigo">{type}</Badge>;
  if (type === 'SICK')      return <Badge variant="orange">{type}</Badge>;
  if (type === 'MATERNITY') return <Badge variant="info">{type}</Badge>;
  return                           <Badge variant="teal">{type}</Badge>;
};

const statusBadge = (status: string) => {
  if (status === 'APPROVED') return <Badge variant="success" dot>Approved</Badge>;
  if (status === 'REJECTED') return <Badge variant="danger"  dot>Rejected</Badge>;
  return                            <Badge variant="warning" dot>Pending</Badge>;
};

export default function EmployeeLeavePage() {
  const { user } = useAuthStore();
  const [employee,  setEmployee]  = useState<EmployeeRecord | null>(null);
  const [requests,  setRequests]  = useState<LeaveRequest[]>([]);
  const [balances,  setBalances]  = useState<LeaveBalance[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [leaveType,  setLeaveType]  = useState('ANNUAL');
  const [startDate,  setStartDate]  = useState('');
  const [endDate,    setEndDate]    = useState('');
  const [reason,     setReason]     = useState('');

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  }, [startDate, endDate]);

  const load = useCallback(async () => {
    if (!user?.companyId || !user?.email) return;
    try {
      // Auto-resolve employee record if we don't have it yet
      let emp = employee;
      if (!emp) {
        const res = await hrApi.listEmployees({ companyId: user.companyId, search: user.email, page: 1, limit: 1 });
        emp = res.items[0] ?? null;
        setEmployee(emp);
      }
      if (!emp) return;

      const [reqs, bals] = await Promise.all([
        hrApi.listLeaveRequests(user.companyId, emp.id),
        hrApi.listLeaveBalances(user.companyId, emp.id),
      ]);
      setRequests(reqs as LeaveRequest[]);
      setBalances(bals as LeaveBalance[]);
    } catch (err) {
      notify.error(getApiErrorMessage(err));
    }
  }, [user?.companyId, user?.email, employee]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [user?.companyId, user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!employee || !user?.companyId) {
      notify.error('Employee record not found. Please contact HR.');
      return;
    }
    if (!startDate || !endDate) {
      notify.error('Please select start and end dates.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      notify.error('End date must be after start date.');
      return;
    }
    setSubmitting(true);
    try {
      await hrApi.createLeaveRequest({
        employeeId: employee.id,
        companyId: user.companyId,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason: reason || undefined,
      });
      notify.success('Leave request submitted successfully');
      setShowForm(false);
      setStartDate(''); setEndDate(''); setReason(''); setLeaveType('ANNUAL');
      await load();
    } catch (err) {
      notify.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const activeBalance = balances.find((b) => b.leaveType === leaveType);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Leave</h1>
          <p className="text-sm text-slate-500 mt-0.5">View your balances and submit leave requests</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" />
          Apply for Leave
        </Button>
      </div>

      {/* Leave balances */}
      {!loading && balances.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {balances.map((b) => (
            <div key={b.id} className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                {leaveTypeBadge(b.leaveType)}
                <span className="text-xs text-slate-400">{b.year}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{b.remainingDays}</p>
              <p className="text-xs text-slate-400 mt-0.5">days remaining</p>
              <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${b.totalDays > 0 ? ((b.remainingDays / b.totalDays) * 100).toFixed(0) : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{b.usedDays} used / {b.totalDays} total</p>
            </div>
          ))}
        </div>
      )}

      {/* Apply leave modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Apply for Leave</h3>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">

              {/* Leave type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Leave Type</label>
                <div className="relative">
                  <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full h-10 appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-8 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15 cursor-pointer">
                    {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
                {activeBalance && (
                  <p className="text-xs text-slate-400">
                    Available: <span className="font-semibold text-indigo-600">{activeBalance.remainingDays} days</span>
                  </p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15" />
                </div>
              </div>
              {totalDays > 0 && (
                <p className="text-xs text-indigo-600 font-semibold">
                  <CalendarDays className="h-3.5 w-3.5 inline mr-1" />
                  {totalDays} day{totalDays !== 1 ? 's' : ''} requested
                </p>
              )}

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Reason <span className="text-slate-400 normal-case font-normal">(optional)</span></label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                  placeholder="Briefly describe the reason for your leave..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={submit} isLoading={submitting} className="gap-1.5">
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Leave history table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Leave History</h3>
          <p className="text-xs text-slate-400 mt-0.5">All your leave requests</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="text-indigo-500" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <CalendarDays className="h-10 w-10 text-slate-300" />
            <p className="text-slate-500 font-medium">No leave requests yet</p>
            <button onClick={() => setShowForm(true)} className="text-xs font-semibold text-indigo-600 hover:underline">
              Apply for your first leave →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  {['Type', 'Dates', 'Days', 'Reason', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const from = new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const to   = new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  return (
                    <tr key={req.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">{leaveTypeBadge(req.leaveType)}</td>
                      <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">{from} — {to}</td>
                      <td className="px-5 py-4 text-slate-700 font-semibold text-xs">{req.totalDays ?? '—'}</td>
                      <td className="px-5 py-4 text-slate-500 text-xs max-w-[200px] truncate">{req.reason ?? '—'}</td>
                      <td className="px-5 py-4">{statusBadge(req.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
