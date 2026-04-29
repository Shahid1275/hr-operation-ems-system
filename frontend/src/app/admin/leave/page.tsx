'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, RefreshCw, CheckCircle2, XCircle,
  Filter, ChevronDown, ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { hrApi } from '@/lib/hrApi';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { getApiErrorMessage, getFullName } from '@/lib/utils';
import { notify } from '@/lib/notify';

type LeaveRequest = {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: string;
  employee?: {
    user?: { firstName?: string; lastName?: string; email?: string };
  };
};

type LeavePolicy = Record<string, unknown>;
type LeaveBalance = Record<string, unknown>;

const leaveTypeBadge = (type: string) => {
  if (type === 'ANNUAL') return <Badge variant="indigo">{type}</Badge>;
  if (type === 'SICK')   return <Badge variant="orange">{type}</Badge>;
  return                        <Badge variant="teal">{type}</Badge>;
};

const statusBadge = (status: string) => {
  if (status === 'APPROVED') return <Badge variant="success" dot>Approved</Badge>;
  if (status === 'REJECTED') return <Badge variant="danger"  dot>Rejected</Badge>;
  return                            <Badge variant="warning" dot>Pending</Badge>;
};

const formatRange = (start: string, end: string) => {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const s = new Date(start).toLocaleDateString('en-US', opts);
  const e = new Date(end).toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  return `${s} — ${e}`;
};

export default function AdminLeavePage() {
  const { user } = useAuthStore();
  const [requests,  setRequests]  = useState<LeaveRequest[]>([]);
  const [policies,  setPolicies]  = useState<LeavePolicy[]>([]);
  const [balances,  setBalances]  = useState<LeaveBalance[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<'requests' | 'policies' | 'balances'>('requests');
  const [statusFilter, setStatus] = useState('All');
  const [typeFilter,   setType]   = useState('All');
  const [approving, setApproving] = useState<string | null>(null);

  const month = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const load = useCallback(async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const [r, p, b] = await Promise.all([
        hrApi.listLeaveRequests(user.companyId),
        hrApi.listLeavePolicies(user.companyId),
        hrApi.listLeaveBalances(user.companyId),
      ]);
      setRequests(r as LeaveRequest[]);
      setPolicies(p as LeavePolicy[]);
      setBalances(b as LeaveBalance[]);
    } catch (e) {
      notify.error(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => { void load(); }, [load]);

  const filtered = requests
    .filter((r) => statusFilter === 'All' || r.status === statusFilter)
    .filter((r) => typeFilter   === 'All' || r.leaveType === typeFilter);

  const leaveTypes  = ['All', ...Array.from(new Set(requests.map((r) => r.leaveType)))];
  const statuses    = ['All', 'PENDING', 'APPROVED', 'REJECTED'];
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  const handleDecision = async (id: string, decision: 'approve' | 'reject') => {
    setApproving(id);
    try {
      await hrApi.hrDecision(id, decision);
      notify.success(`Leave ${decision}d successfully`);
      await load();
    } catch (e) {
      notify.error(getApiErrorMessage(e));
    } finally {
      setApproving(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leave Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage leave applications and policies</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Requests',  value: requests.length,                               color: 'text-indigo-600 bg-indigo-50'  },
          { label: 'Pending',         value: pendingCount,                                   color: 'text-amber-600  bg-amber-50'   },
          { label: 'Approved',        value: requests.filter((r) => r.status === 'APPROVED').length, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Rejected',        value: requests.filter((r) => r.status === 'REJECTED').length, color: 'text-red-600    bg-red-50'     },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className={`mt-1 inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {(['requests', 'policies', 'balances'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition-all ${
              tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
            {t === 'requests' && pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] text-white">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Requests Tab */}
      {tab === 'requests' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">

          {/* Filters */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 flex-wrap">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="relative">
              <select value={statusFilter} onChange={(e) => setStatus(e.target.value)}
                className="h-8 appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-3 pr-7 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400 cursor-pointer">
                {statuses.map((s) => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={typeFilter} onChange={(e) => setType(e.target.value)}
                className="h-8 appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-3 pr-7 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400 cursor-pointer">
                {leaveTypes.map((t) => <option key={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>
            <span className="ml-auto text-xs text-slate-400">{filtered.length} records</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner className="text-indigo-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <CalendarDays className="h-10 w-10 text-slate-300" />
              <p className="text-slate-500 font-medium">No leave requests</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    {['Employee', 'Type', 'Dates', 'Reason', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((req) => {
                    const emp  = req.employee?.user;
                    const name = emp?.firstName && emp?.lastName
                      ? getFullName(emp.firstName, emp.lastName)
                      : emp?.email?.split('@')[0] ?? 'Unknown';
                    const initials = ((emp?.firstName?.[0] ?? '') + (emp?.lastName?.[0] ?? '')).toUpperCase() || name[0]?.toUpperCase() || '?';
                    const isPending = req.status === 'PENDING';
                    return (
                      <tr key={req.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-xs font-bold shrink-0">
                              {initials}
                            </div>
                            <span className="font-semibold text-slate-800">{name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">{leaveTypeBadge(req.leaveType)}</td>
                        <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                          {formatRange(req.startDate, req.endDate)}
                        </td>
                        <td className="px-5 py-4 text-slate-600 text-xs max-w-[180px] truncate">
                          {String(req.reason ?? '—')}
                        </td>
                        <td className="px-5 py-4">{statusBadge(req.status)}</td>
                        <td className="px-5 py-4">
                          {isPending ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                disabled={approving === req.id}
                                onClick={() => handleDecision(req.id, 'approve')}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                                title="Approve"
                              >
                                {approving === req.id ? (
                                  <div className="h-3.5 w-3.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                disabled={approving === req.id}
                                onClick={() => handleDecision(req.id, 'reject')}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Policies Tab */}
      {tab === 'policies' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          {policies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <ClipboardList className="h-10 w-10 text-slate-300" />
              <p className="text-slate-500 font-medium">No policies configured</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  {['Leave Type', 'Annual Allocation', 'Carry Forward', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {policies.map((p, i) => (
                  <tr key={String(p.id ?? i)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-4 font-semibold text-slate-800">{String(p.leaveType ?? '—')}</td>
                    <td className="px-5 py-4 text-slate-600">{String(p.annualAllocation ?? '—')} days</td>
                    <td className="px-5 py-4 text-slate-500">{String(p.carryForward ?? '—')}</td>
                    <td className="px-5 py-4"><Badge variant="success" dot>Active</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Balances Tab */}
      {tab === 'balances' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          {balances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <CalendarDays className="h-10 w-10 text-slate-300" />
              <p className="text-slate-500 font-medium">No balance records</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  {['Employee', 'Leave Type', 'Year', 'Allocated', 'Used', 'Remaining'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {balances.map((b, i) => (
                  <tr key={String(b.id ?? i)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {String((b.employee as { user?: { email?: string } } | undefined)?.user?.email ?? '—')}
                    </td>
                    <td className="px-5 py-4">{leaveTypeBadge(String(b.leaveType ?? 'CASUAL'))}</td>
                    <td className="px-5 py-4 text-slate-500">{String(b.year ?? '—')}</td>
                    <td className="px-5 py-4 text-slate-600">{String(b.totalDays ?? '—')}</td>
                    <td className="px-5 py-4 text-slate-600">{String(b.usedDays ?? '—')}</td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-emerald-600">{String(b.remainingDays ?? '—')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
