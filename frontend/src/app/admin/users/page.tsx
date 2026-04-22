'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users, UserCheck, UserX, RefreshCw, Search, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { notify } from '@/lib/notify';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/store/authStore';
import { formatDate, getInitials, getFullName, getApiErrorMessage } from '@/lib/utils';
import type { EmployeeRecord } from '@/types';
import { hrApi } from '@/lib/hrApi';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = employees;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage employees and access context
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: employees.length, icon: Users, color: 'text-blue-600 bg-blue-100' },
          { label: 'Active', value: employees.filter((u) => u.user.isActive).length, icon: UserCheck, color: 'text-green-600 bg-green-100' },
          { label: 'Inactive', value: employees.filter((u) => !u.user.isActive).length, icon: UserX, color: 'text-red-600 bg-red-100' },
          { label: 'Assigned Role', value: employees.filter((u) => u.user.systemRole !== 'EMPLOYEE').length, icon: Briefcase, color: 'text-purple-600 bg-purple-100' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl bg-white border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="search"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="text-[#1a3a5c]" />
          </div>
        ) : !currentUser?.companyId ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Current user has no company assigned.
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-medium text-slate-600">User</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">System Role</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Employee Code</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Department</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f1b2d] text-white text-xs font-semibold shrink-0">
                          {getInitials(u.user.firstName, u.user.lastName, u.user.email)}
                        </div>
                        <span className="font-medium text-slate-900">
                          {getFullName(u.user.firstName, u.user.lastName)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.user.systemRole === 'EMPLOYEE' ? 'default' : 'info'}>
                        {u.user.systemRole}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.user.isActive ? 'success' : 'danger'}>
                        {u.user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{u.employeeCode}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{u.department?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(u.joiningDate ?? u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center">Employee directory is now live via the HR module.</p>
    </div>
  );
}
