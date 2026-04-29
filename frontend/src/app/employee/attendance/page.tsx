'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Clock3, LogIn, LogOut, CalendarDays, CheckCircle2, TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { hrApi } from '@/lib/hrApi';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { getApiErrorMessage } from '@/lib/utils';
import { notify } from '@/lib/notify';
import type { EmployeeRecord } from '@/types';

type AttendanceRecord = {
  id: string;
  date: string;
  clockInAt?: string | null;
  clockOutAt?: string | null;
  workedMins?: number | null;
  remarks?: string | null;
};

const fmtTime = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const fmtMins = (mins?: number | null) => {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
};

export default function EmployeeAttendancePage() {
  const { user } = useAuthStore();
  const [employee,   setEmployee]   = useState<EmployeeRecord | null>(null);
  const [records,    setRecords]    = useState<AttendanceRecord[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [clocking,   setClocking]   = useState<'in' | 'out' | null>(null);
  const [todayRecord, setToday]     = useState<AttendanceRecord | null>(null);

  const todayKey = new Date().toISOString().slice(0, 10);

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
      const data = await hrApi.attendanceHistory(user.companyId, emp.id);
      const recs  = data as AttendanceRecord[];
      setRecords(recs);
      setToday(recs.find((r) => r.date.startsWith(todayKey)) ?? null);
    } catch (err) {
      notify.error(getApiErrorMessage(err));
    }
  }, [user?.companyId, user?.email, employee, todayKey]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [user?.companyId, user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClock = async (type: 'in' | 'out') => {
    if (!employee || !user?.companyId) return;
    setClocking(type);
    try {
      if (type === 'in') {
        await hrApi.clockIn({ employeeId: employee.id, companyId: user.companyId });
        notify.success('Clocked in successfully!');
      } else {
        await hrApi.clockOut({ employeeId: employee.id, companyId: user.companyId });
        notify.success('Clocked out successfully!');
      }
      await load();
    } catch (err) {
      notify.error(getApiErrorMessage(err));
    } finally {
      setClocking(null);
    }
  };

  const totalDays    = records.filter((r) => r.clockInAt).length;
  const totalMinutes = records.reduce((s, r) => s + (r.workedMins ?? 0), 0);
  const avgMinutes   = totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0;

  const isClockedIn  = !!todayRecord?.clockInAt;
  const isClockedOut = !!todayRecord?.clockOutAt;
  const now          = new Date();
  const nowStr       = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-xl font-bold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track your daily clock-in and clock-out</p>
      </div>

      {/* Live clock + clock-in/out card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0c1929] to-[#1a3a5c] p-6 shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-white/50 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-3xl font-bold text-white mt-1 tracking-tight font-mono">{nowStr}</p>
            <div className="flex items-center gap-2 mt-2">
              {isClockedIn && !isClockedOut && (
                <Badge variant="success" dot>Clocked In — {fmtTime(todayRecord?.clockInAt)}</Badge>
              )}
              {isClockedOut && (
                <Badge variant="indigo" dot>Completed — {fmtMins(todayRecord?.workedMins)}</Badge>
              )}
              {!isClockedIn && (
                <span className="text-xs text-white/50">Not clocked in yet</span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => handleClock('in')}
              isLoading={clocking === 'in'}
              disabled={isClockedIn || isClockedOut || loading}
              className="gap-1.5 bg-emerald-500 hover:bg-emerald-400 border-0 disabled:opacity-40"
              size="sm"
            >
              <LogIn className="h-4 w-4" />
              Clock In
            </Button>
            <Button
              onClick={() => handleClock('out')}
              isLoading={clocking === 'out'}
              disabled={!isClockedIn || isClockedOut || loading}
              variant="danger"
              className="gap-1.5 disabled:opacity-40"
              size="sm"
            >
              <LogOut className="h-4 w-4" />
              Clock Out
            </Button>
          </div>
        </div>

        {/* Today's timing */}
        {todayRecord && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Clock In',   value: fmtTime(todayRecord.clockInAt)  },
              { label: 'Clock Out',  value: fmtTime(todayRecord.clockOutAt) },
              { label: 'Worked',     value: fmtMins(todayRecord.workedMins) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-white/8 px-3 py-2.5">
                <p className="text-[10px] text-white/45">{label}</p>
                <p className="text-sm font-bold text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm text-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-2">
            <CalendarDays className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalDays}</p>
          <p className="text-xs text-slate-500 mt-0.5">Days Present</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
            <Clock3 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{fmtMins(totalMinutes)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Worked</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm text-center">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="h-5 w-5 text-violet-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{fmtMins(avgMinutes)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Daily Average</p>
        </div>
      </div>

      {/* History */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Attendance History</h3>
          <p className="text-xs text-slate-400 mt-0.5">Last {records.length} records</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner className="text-indigo-500" /></div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Clock3 className="h-10 w-10 text-slate-300" />
            <p className="text-slate-500 font-medium">No attendance records yet</p>
            <p className="text-xs text-slate-400">Click &ldquo;Clock In&rdquo; to start tracking</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  {['Date', 'Clock In', 'Clock Out', 'Hours Worked', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => {
                  const isToday   = rec.date.startsWith(todayKey);
                  const dateDisp  = new Date(rec.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  const isPresent = !!rec.clockInAt;
                  return (
                    <tr key={rec.id} className={`border-b border-slate-100 last:border-0 transition-colors ${isToday ? 'bg-indigo-50/40' : 'hover:bg-slate-50/60'}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-800">{dateDisp}</span>
                          {isToday && <Badge variant="indigo">Today</Badge>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-sm font-semibold ${rec.clockInAt ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {fmtTime(rec.clockInAt)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-sm font-semibold ${rec.clockOutAt ? 'text-slate-700' : 'text-slate-400'}`}>
                          {fmtTime(rec.clockOutAt)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-700">{fmtMins(rec.workedMins)}</td>
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
