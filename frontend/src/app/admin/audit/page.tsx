'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { hrApi } from '@/lib/hrApi';
import { Button } from '@/components/ui/Button';

export default function AdminAuditPage() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);

  const load = async () => {
    setLogs(await hrApi.listAuditLogs(user?.companyId ?? undefined));
  };

  useEffect(() => {
    if (!user?.companyId) return;
    void hrApi.listAuditLogs(user.companyId).then((data) => setLogs(data as Array<Record<string, unknown>>));
  }, [user?.companyId]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>
      <div className="rounded-xl border bg-white p-4">
        {logs.map((l, idx) => (
          <div key={String(l.id ?? idx)} className="border rounded p-2 text-sm mb-2">
            <div className="font-medium">{String(l.action ?? '-')}</div>
            <div className="text-slate-500">{String(l.resource ?? '-')} #{String(l.resourceId ?? '-')}</div>
            <div className="text-xs text-slate-400">{new Date(String(l.createdAt)).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
