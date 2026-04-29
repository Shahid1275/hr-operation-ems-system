'use client';

import { useCallback, useEffect, useState } from 'react';
import { Wallet, Download, Eye, X, Banknote, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { hrApi } from '@/lib/hrApi';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { getApiErrorMessage } from '@/lib/utils';
import { notify } from '@/lib/notify';
import type { EmployeeRecord } from '@/types';

type PayrollRecord = {
  id: string;
  payrollMonth?: string;
  basicSalary?: number;
  netPay?: number;
  status?: string;
};

const fmtCurrency = (v?: number | unknown) =>
  typeof v === 'number' ? `$${v.toLocaleString()}` : `$${String(v ?? 0)}`;

const fmtMonth = (iso?: string) => {
  if (!iso) return '—';
  const [year, month] = iso.split('-');
  return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export default function EmployeePayslipsPage() {
  const { user } = useAuthStore();
  const [employee,    setEmployee]    = useState<EmployeeRecord | null>(null);
  const [records,     setRecords]     = useState<PayrollRecord[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [preview,     setPreview]     = useState<Record<string, unknown> | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.companyId || !user?.email) return;
    try {
      let emp = employee;
      if (!emp) {
        const res = await hrApi.listEmployees({ companyId: user.companyId, search: user.email, page: 1, limit: 1 });
        emp = res.items[0] ?? null;
        setEmployee(emp);
      }
      if (!emp) return;
      const recs = await hrApi.listPayrollRecords(user.companyId, emp.id);
      setRecords(recs as PayrollRecord[]);
    } catch (err) {
      notify.error(getApiErrorMessage(err));
    }
  }, [user?.companyId, user?.email, employee]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [user?.companyId, user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = async (id: string) => {
    setDownloading(id);
    try {
      const data = await hrApi.getPayslip(id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `payslip-${fmtMonth(records.find((r) => r.id === id)?.payrollMonth ?? '')}.json`;
      a.click(); URL.revokeObjectURL(url);
    } catch (err) {
      notify.error(getApiErrorMessage(err));
    } finally {
      setDownloading(null);
    }
  };

  const totalEarned = records.reduce((s, r) => s + (Number(r.netPay) || 0), 0);
  const latest      = records[0];

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-xl font-bold text-slate-900">My Payslips</h1>
        <p className="text-sm text-slate-500 mt-0.5">View and download your salary slips</p>
      </div>

      {/* Summary cards */}
      {!loading && records.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-5 text-white shadow-sm">
            <p className="text-xs font-medium text-indigo-200">Total Payslips</p>
            <p className="mt-1 text-3xl font-bold">{records.length}</p>
            <p className="mt-2 text-xs text-indigo-300">All time</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5" /> Latest Basic Salary
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{fmtCurrency(latest?.basicSalary)}</p>
            <p className="mt-2 text-xs text-slate-400">{fmtMonth(latest?.payrollMonth)}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Total Earned
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{fmtCurrency(totalEarned)}</p>
            <p className="mt-2 text-xs text-slate-400">Net pay across all records</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Payslip History</h3>
          <p className="text-xs text-slate-400 mt-0.5">{records.length} records found</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner className="text-indigo-500" /></div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Wallet className="h-10 w-10 text-slate-300" />
            <p className="text-slate-500 font-medium">No payslips available yet</p>
            <p className="text-xs text-slate-400">Your payslips will appear here once payroll is processed</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  {['Period', 'Basic Salary', 'Net Salary', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 font-semibold text-indigo-600 text-sm">{fmtMonth(rec.payrollMonth)}</td>
                    <td className="px-5 py-4 text-slate-700 font-semibold">{fmtCurrency(rec.basicSalary)}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">{fmtCurrency(rec.netPay)}</td>
                    <td className="px-5 py-4">
                      <Badge variant="success" dot>Processed</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => void (async () => {
                            try { setPreview(await hrApi.getPayslip(rec.id)); }
                            catch (e) { notify.error(getApiErrorMessage(e)); }
                          })()}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Payslip Details</h3>
              <button onClick={() => setPreview(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              <pre className="text-xs bg-slate-50 rounded-xl p-4 text-slate-700 overflow-auto border border-slate-100">
                {JSON.stringify(preview, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
              <button onClick={() => setPreview(null)} className="h-8 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
