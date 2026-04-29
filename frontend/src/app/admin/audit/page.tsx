'use client';

import { useEffect, useState } from 'react';
import { Shield, RefreshCw, Search, ChevronDown, Activity } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { hrApi } from '@/lib/hrApi';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

type AuditLog = {
  id?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  createdAt?: string;
  userId?: string;
};

const actionColor = (action?: string): 'success' | 'danger' | 'info' | 'warning' | 'default' => {
  if (!action) return 'default';
  const a = action.toUpperCase();
  if (a.includes('CREATE') || a.includes('ADD'))    return 'success';
  if (a.includes('DELETE') || a.includes('REMOVE')) return 'danger';
  if (a.includes('UPDATE') || a.includes('EDIT'))   return 'info';
  if (a.includes('LOGIN')  || a.includes('AUTH'))   return 'warning';
  return 'default';
};

export default function AdminAuditPage() {
  const { user } = useAuthStore();
  const [logs,    setLogs]    = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('All');

  const load = async () => {
    setLoading(true);
    try {
      const data = await hrApi.listAuditLogs(user?.companyId ?? undefined);
      setLogs(data as AuditLog[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.companyId) return;
    void load();
  }, [user?.companyId]);

  const resources = ['All', ...Array.from(new Set(logs.map((l) => l.resource).filter(Boolean) as string[]))];

  const filtered = logs
    .filter((l) => filter === 'All' || l.resource === filter)
    .filter((l) => !search || String(l.action ?? '').toLowerCase().includes(search.toLowerCase()) || String(l.resource ?? '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track all system activity and changes</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events',   value: logs.length,                                                  color: 'text-indigo-600 bg-indigo-50'  },
          { label: 'Created',        value: logs.filter((l) => String(l.action ?? '').toUpperCase().includes('CREATE')).length, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Updated',        value: logs.filter((l) => String(l.action ?? '').toUpperCase().includes('UPDATE')).length, color: 'text-blue-600 bg-blue-50'       },
          { label: 'Deleted',        value: logs.filter((l) => String(l.action ?? '').toUpperCase().includes('DELETE')).length, color: 'text-red-600 bg-red-50'         },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className={`mt-1 inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 flex-wrap">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search actions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
            />
          </div>
          <div className="relative">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}
              className="h-8 appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-3 pr-7 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400 cursor-pointer">
              {resources.map((r) => <option key={r}>{r}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>
          <span className="ml-auto text-xs text-slate-400">{filtered.length} events</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="text-indigo-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Activity className="h-10 w-10 text-slate-300" />
            <p className="text-slate-500 font-medium">No audit events found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  {['Event', 'Resource', 'Resource ID', 'User', 'Timestamp'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr key={String(log.id ?? i)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 shrink-0">
                          <Shield className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        <Badge variant={actionColor(log.action)}>{String(log.action ?? '—')}</Badge>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium text-xs capitalize">{String(log.resource ?? '—')}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs font-mono">{String(log.resourceId ?? '—')}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs font-mono">{String(log.userId ?? '—')}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
