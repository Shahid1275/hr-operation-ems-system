'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { hrApi } from '@/lib/hrApi';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/lib/utils';
import { notify } from '@/lib/notify';

type Item = Record<string, unknown>;

export default function AdminPayrollPage() {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<Item[]>([]);
  const [cycles, setCycles] = useState<Item[]>([]);
  const [revisions, setRevisions] = useState<Item[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<Record<string, unknown> | null>(null);
  const load = async () => {
    if (!user?.companyId) return;
    try {
      const [r, c, v] = await Promise.all([
        hrApi.listPayrollRecords(user.companyId),
        hrApi.listPayrollCycles(user.companyId),
        hrApi.listPayrollRevisions(user.companyId),
      ]);
      setRecords(r);
      setCycles(c);
      setRevisions(v);
    } catch (e) {
      notify.error(getApiErrorMessage(e));
    }
  };

  useEffect(() => {
    if (!user?.companyId) return;
    void Promise.all([
      hrApi.listPayrollRecords(user.companyId),
      hrApi.listPayrollCycles(user.companyId),
      hrApi.listPayrollRevisions(user.companyId),
    ]).then(([r, c, v]) => {
      setRecords(r as Item[]);
      setCycles(c as Item[]);
      setRevisions(v as Item[]);
    });
  }, [user?.companyId]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payroll Cycles, Revisions and Payslips</h1>
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold mb-2">Cycles</h2>
          {cycles.map((c, idx) => (
            <div key={String(c.id ?? idx)} className="text-sm border rounded-lg p-2 mb-2">{String(c.name ?? '-')} | {String(c.month ?? '-')} | {String(c.status ?? '-')}</div>
          ))}
        </section>
        <section className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold mb-2">Records</h2>
          {records.map((r, idx) => (
            <div key={String(r.id ?? idx)} className="text-sm border rounded-lg p-2 mb-2 flex items-center justify-between">
              <span>{String((r.employee as { employeeCode?: string } | undefined)?.employeeCode ?? '-')} | {String(r.payrollMonth ?? '-')} | Net {String(r.netPay ?? '-')}</span>
              <Button size="sm" onClick={async () => setSelectedPayslip(await hrApi.getPayslip(String(r.id)))}>Payslip</Button>
            </div>
          ))}
        </section>
        <section className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold mb-2">Revisions</h2>
          {revisions.map((r, idx) => (
            <div key={String(r.id ?? idx)} className="text-sm border rounded-lg p-2 mb-2">{String(r.reason ?? '-')} | {String(r.amountDelta ?? '-')}</div>
          ))}
        </section>
      </div>
      {selectedPayslip && (
        <div className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold">Payslip Preview</h2>
          <pre className="mt-2 text-xs bg-slate-50 p-3 rounded overflow-auto">{JSON.stringify(selectedPayslip, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
