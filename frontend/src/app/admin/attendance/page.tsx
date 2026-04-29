'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Clock3, RefreshCw, Search, Users, CheckCircle2,
  XCircle, ChevronDown, CalendarDays,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { hrApi } from '@/lib/hrApi';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { getApiErrorMessage, getFullName } from '@/lib/utils';
import { notify } from '@/lib/notify';

type AttendanceRecord = {
  id: string;
  date: string;
  clockInAt?: string | null;
  clockOutAt?: string | null;
  workedMins?: number | null;
  remarks?: string | null;
  employee?: {
    id: string;
    employeeCode?: string;
    user?: { firstName?: string; lastName?: string; email?: string };
    department?: { name?: string };
  };
};

const fmtTime = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const fmtMins = (mins?: number | null) => {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

export default function AdminAttendancePage() {
  const { user } = useAuthStore();
  const [records,   setRecords]   = useState<AttendanceRecord[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [dateFilter, setDate]     = useState('');

  const load = useCallback(async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const data = await hrApi.attendanceHistory(user.companyId);
      setRecords(data as AttendanceRecord[]);
    } catch (err) {
      notify.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => { void load(); }, [load]);

  const filtered = records.filter((r) => {
    const name = getFullName(r.employee?.user?.firstName, r.employee?.user?.lastName);
    const matchSearch = !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      (r.employee?.employeeCode ?? '').toLowerCase().includes(search.toLowerCase());
    const matchDate = !dateFilter || r.date.startsWith(dateFilter);
    return matchSearch && matchDate;
  });

  const presentToday  = records.filter((r) => r.date.startsWith(new Date().toISOString().slice(0, 10)) && r.clockInAt).length;
  const absentToday   = records.filter((r) => r.date.startsWith(new Date().toISOString().slice(0, 10)) && !r.clockInAt).length;
  const avgWorked     = records.filter((r) => r.workedMins).reduce((s, r) => s + (r.workedMins ?? 0), 0) / Math.max(1, records.filter((r) => r.workedMins).length);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitor employee clock-in and clock-out records</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Records',  value: records.length,                                       color: 'text-indigo-600 bg-indigo-50'  },
          { label: 'Present Today',  value: presentToday,                                          color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Absent Today',   value: absentToday,                                           color: 'text-red-600 bg-red-50'        },
          { label: 'Avg Hours/Day',  value: fmtMins(Math.round(avgWorked)),                       color: 'text-violet-600 bg-violet-50'  },
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
            <input type="search" placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400" />
          </div>
          <div className="relative">
            <input type="date" value={dateFilter} onChange={(e) => setDate(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none focus:border-indigo-400 cursor-pointer" />
          </div>
          {dateFilter && (
            <button onClick={() => setDate('')} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
              Clear date
            </button>
          )}
          <span className="ml-auto text-xs text-slate-400">{filtered.length} records</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner className="text-indigo-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <CalendarDays className="h-10 w-10 text-slate-300" />
            <p className="text-slate-500 font-medium">No attendance records</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  {['Employee', 'Department', 'Date', 'Clock In', 'Clock Out', 'Hours', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((rec) => {
                  const name     = getFullName(rec.employee?.user?.firstName, rec.employee?.user?.lastName);
                  const initials = ((rec.employee?.user?.firstName?.[0] ?? '') + (rec.employee?.user?.lastName?.[0] ?? '')).toUpperCase() || '?';
                  const isPresent = !!rec.clockInAt;
                  const dateDisplay = new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  return (
                    <tr key={rec.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{name}</p>
                            <p className="text-[10px] text-slate-400">{rec.employee?.employeeCode ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{rec.employee?.department?.name ?? '—'}</td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs">{dateDisplay}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold ${rec.clockInAt ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {fmtTime(rec.clockInAt)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold ${rec.clockOutAt ? 'text-slate-700' : 'text-slate-400'}`}>
                          {fmtTime(rec.clockOutAt)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs font-medium">{fmtMins(rec.workedMins)}</td>
                      <td className="px-5 py-3.5">
                        {isPresent
                          ? <Badge variant="success" dot>Present</Badge>
                          : <Badge variant="danger"  dot>Absent</Badge>
                        }
                      </td>
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
