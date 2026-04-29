'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Wallet, RefreshCw, Plus, Download, Eye,
  ChevronDown, X, Banknote,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { hrApi } from '@/lib/hrApi';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { getApiErrorMessage, getFullName } from '@/lib/utils';
import { notify } from '@/lib/notify';

type PayrollRecord = {
  id: string;
  payrollMonth?: string;
  basicSalary?: number;
  netPay?: number;
  status?: string;
  employee?: {
    employeeCode?: string;
    user?: { firstName?: string; lastName?: string; email?: string };
  };
};

type PayrollCycle = {
  id: string;
  name?: string;
  month?: string;
  status?: string;
};

const fmtCurrency = (v?: number | unknown) =>
  typeof v === 'number' ? `$${v.toLocaleString()}` : `$${String(v ?? 0)}`;

const fmtMonth = (iso?: string) => {
  if (!iso) return '—';
  const [year, month] = iso.split('-');
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export default function AdminPayrollPage() {
  const { user } = useAuthStore();
  const [records,   setRecords]   = useState<PayrollRecord[]>([]);
  const [cycles,    setCycles]    = useState<PayrollCycle[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<'payslips' | 'cycles'>('payslips');
  const [monthFilter, setMonth]   = useState('All');
  const [preview,   setPreview]   = useState<Record<string, unknown> | null>(null);
  const [downloading, setDL]      = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const [r, c] = await Promise.all([
        hrApi.listPayrollRecords(user.companyId),
        hrApi.listPayrollCycles(user.companyId),
      ]);
      setRecords(r as PayrollRecord[]);
      setCycles(c as PayrollCycle[]);
    } catch (e) {
      notify.error(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => { void load(); }, [load]);

  const months = ['All', ...Array.from(new Set(records.map((r) => r.payrollMonth).filter(Boolean) as string[]))];

  const filtered = monthFilter === 'All'
    ? records
    : records.filter((r) => r.payrollMonth === monthFilter);

  const totalBasic = filtered.reduce((s, r) => s + (Number(r.basicSalary) || 0), 0);
  const totalNet   = filtered.reduce((s, r) => s + (Number(r.netPay) || 0), 0);

  const handleDownload = async (id: string) => {
    setDL(id);
    try {
      const data = await hrApi.getPayslip(id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `payslip-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      notify.error(getApiErrorMessage(e));
    } finally {
      setDL(null);
    }
  };

  const cycleStatusBadge = (status?: string) => {
    if (status === 'COMPLETED') return <Badge variant="success" dot>Completed</Badge>;
    if (status === 'PROCESSING') return <Badge variant="indigo" dot>Processing</Badge>;
    return <Badge variant="warning" dot>Draft</Badge>;
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payroll</h1>
          <p className="text-sm text-slate-500 mt-0.5">Generate and manage employee payslips</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Generate Payslip
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-5 text-white shadow-sm">
          <p className="text-xs font-medium text-indigo-200">Total Records</p>
          <p className="mt-1 text-3xl font-bold">{records.length}</p>
          <p className="mt-2 text-xs text-indigo-300">Across all cycles</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Banknote className="h-3.5 w-3.5" /> Total Basic Salary
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{fmtCurrency(totalBasic)}</p>
          <p className="mt-2 text-xs text-slate-400">Filtered records</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" /> Total Net Pay
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{fmtCurrency(totalNet)}</p>
          <p className="mt-2 text-xs text-slate-400">After deductions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {(['payslips', 'cycles'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition-all ${
              tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Payslips table */}
      {tab === 'payslips' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          {/* Filter bar */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Period</span>
            <div className="relative">
              <select value={monthFilter} onChange={(e) => setMonth(e.target.value)}
                className="h-8 appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-3 pr-7 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400 cursor-pointer">
                {months.map((m) => <option key={m}>{m === 'All' ? 'All Periods' : fmtMonth(m)}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>
            <span className="ml-auto text-xs text-slate-400">{filtered.length} records</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Spinner className="text-indigo-500" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Wallet className="h-10 w-10 text-slate-300" />
              <p className="text-slate-500 font-medium">No payroll records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    {['Employee', 'Period', 'Basic Salary', 'Net Salary', 'Status', 'Action'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rec) => {
                    const emp  = rec.employee?.user;
                    const name = emp?.firstName && emp?.lastName
                      ? getFullName(emp.firstName, emp.lastName)
                      : emp?.email?.split('@')[0] ?? rec.employee?.employeeCode ?? '—';
                    const initials = ((emp?.firstName?.[0] ?? '') + (emp?.lastName?.[0] ?? '')).toUpperCase() || name[0]?.toUpperCase() || '?';
                    return (
                      <tr key={rec.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0">
                              {initials}
                            </div>
                            <span className="font-semibold text-slate-800">{name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-indigo-600 font-medium text-xs">
                          {fmtMonth(rec.payrollMonth)}
                        </td>
                        <td className="px-5 py-4 text-slate-700 font-semibold">
                          {fmtCurrency(rec.basicSalary)}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-900">
                          {fmtCurrency(rec.netPay)}
                        </td>
                        <td className="px-5 py-4">
                          {cycleStatusBadge(rec.status ?? 'COMPLETED')}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => void (async () => { try { setPreview(await hrApi.getPayslip(rec.id)); } catch (e) { notify.error(getApiErrorMessage(e)); } })()}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                              title="Preview"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDownload(rec.id)}
                              disabled={downloading === rec.id}
                              className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 transition-colors"
                            >
                              {downloading === rec.id
                                ? <div className="h-3 w-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                                : <Download className="h-3.5 w-3.5" />
                              }
                              Download
                            </button>
                          </div>
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

      {/* Cycles tab */}
      {tab === 'cycles' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          {cycles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Wallet className="h-10 w-10 text-slate-300" />
              <p className="text-slate-500 font-medium">No payroll cycles yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  {['Cycle Name', 'Period', 'Records', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cycles.map((c, i) => (
                  <tr key={String(c.id ?? i)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-4 font-semibold text-slate-800">{String(c.name ?? '—')}</td>
                    <td className="px-5 py-4 text-indigo-600 font-medium text-xs">{fmtMonth(String(c.month ?? ''))}</td>
                    <td className="px-5 py-4 text-slate-500">
                      {records.filter((r) => r.payrollMonth === String(c.month ?? '')).length}
                    </td>
                    <td className="px-5 py-4">{cycleStatusBadge(String(c.status ?? 'DRAFT'))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Payslip preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Payslip Preview</h3>
              <button onClick={() => setPreview(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              <pre className="text-xs bg-slate-50 rounded-xl p-4 text-slate-700 overflow-auto border border-slate-100">
                {JSON.stringify(preview, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setPreview(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
