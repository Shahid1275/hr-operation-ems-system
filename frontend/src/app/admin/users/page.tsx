'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Users, UserCheck, UserX, Briefcase, Search, RefreshCw,
  LayoutGrid, List, Plus, ChevronDown, Mail, Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { notify } from '@/lib/notify';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/store/authStore';
import { formatDate, getInitials, getFullName, getApiErrorMessage } from '@/lib/utils';
import type { EmployeeRecord } from '@/types';
import { hrApi } from '@/lib/hrApi';

const DEPT_COLORS: Record<string, string> = {
  Engineering:   'bg-indigo-100 text-indigo-700',
  HR:            'bg-pink-100   text-pink-700',
  Finance:       'bg-emerald-100 text-emerald-700',
  Sales:         'bg-amber-100  text-amber-700',
  Operations:    'bg-orange-100 text-orange-700',
  'IT Support':  'bg-cyan-100   text-cyan-700',
  Marketing:     'bg-violet-100 text-violet-700',
};
const deptColor = (name?: string | null) =>
  (name && DEPT_COLORS[name]) ? DEPT_COLORS[name] : 'bg-slate-100 text-slate-600';

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-pink-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-cyan-500', 'bg-rose-500',
];
const avatarColor = (id: string) =>
  AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore();
  const [employees, setEmployees]   = useState<EmployeeRecord[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [viewMode, setViewMode]     = useState<'cards' | 'table'>('cards');

  const fetchData = useCallback(async () => {
    if (!currentUser?.companyId) return;
    setLoading(true);
    try {
      const res = await hrApi.listEmployees({
        companyId: currentUser.companyId,
        search: search || undefined,
        page: 1,
        limit: 50,
      });
      setEmployees(res.items);
    } catch (err) {
      notify.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [currentUser?.companyId, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const depts = ['All Departments', ...Array.from(new Set(employees.map((e) => e.department?.name).filter(Boolean) as string[]))];

  const filtered = deptFilter === 'All Departments'
    ? employees
    : employees.filter((e) => e.department?.name === deptFilter);

  const stats = [
    { label: 'Total',        value: employees.length,                                              icon: Users,     color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Active',       value: employees.filter((u) => u.user.isActive).length,               icon: UserCheck, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Inactive',     value: employees.filter((u) => !u.user.isActive).length,              icon: UserX,     color: 'text-red-600 bg-red-50' },
    { label: 'With Role',    value: employees.filter((u) => u.user.systemRole !== 'EMPLOYEE').length, icon: Briefcase, color: 'text-violet-600 bg-violet-50' },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your team members</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl bg-white border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color} shrink-0`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 leading-tight">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15 transition"
          />
        </div>

        <div className="relative">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15 transition cursor-pointer"
          >
            {depts.map((d) => <option key={d}>{d}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </div>

        <div className="ml-auto flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
          <button
            onClick={() => setViewMode('cards')}
            className={`flex h-7 w-8 items-center justify-center rounded-md transition-colors ${viewMode === 'cards' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex h-7 w-8 items-center justify-center rounded-md transition-colors ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner className="text-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Users className="h-10 w-10 text-slate-300" />
          <p className="text-slate-500 font-medium">No employees found</p>
          <p className="text-sm text-slate-400">Try a different search or department filter</p>
        </div>
      ) : viewMode === 'cards' ? (
        /* Card grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((emp) => {
            const fullName = getFullName(emp.user.firstName, emp.user.lastName);
            const initials = getInitials(emp.user.firstName, emp.user.lastName, emp.user.email);
            const dept     = emp.department?.name;
            return (
              <div
                key={emp.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 flex flex-col items-center text-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                {dept && (
                  <span className={`self-start rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${deptColor(dept)}`}>
                    {dept}
                  </span>
                )}
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-white text-xl font-bold ${avatarColor(emp.id)}`}>
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{fullName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{emp.jobTitle ?? emp.user.systemRole}</p>
                </div>
                <div className="flex items-center gap-1.5 w-full mt-1">
                  <Badge variant={emp.user.isActive ? 'success' : 'danger'} dot className="flex-1 justify-center">
                    {emp.user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                    <Mail className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table view */
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {['Employee', 'Email', 'Department', 'Role', 'Status', 'Code', 'Joined'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors table-row-hover">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold shrink-0 ${avatarColor(emp.id)}`}>
                          {getInitials(emp.user.firstName, emp.user.lastName, emp.user.email)}
                        </div>
                        <span className="font-semibold text-slate-900">
                          {getFullName(emp.user.firstName, emp.user.lastName)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs">{emp.user.email}</td>
                    <td className="px-4 py-3.5">
                      {emp.department?.name ? (
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${deptColor(emp.department.name)}`}>
                          {emp.department.name}
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={emp.user.systemRole === 'EMPLOYEE' ? 'default' : 'indigo'}>
                        {emp.user.systemRole}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={emp.user.isActive ? 'success' : 'danger'} dot>
                        {emp.user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs font-mono">{emp.employeeCode}</td>
                    <td className="px-4 py-3.5">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(emp.joiningDate ?? emp.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        Showing {filtered.length} of {employees.length} employees
      </p>
    </div>
  );
}
