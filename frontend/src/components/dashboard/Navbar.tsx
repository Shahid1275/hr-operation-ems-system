'use client';

import { Bell, Plus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getInitials } from '@/lib/utils';
import type { User } from '@/types';

type Props = {
  user: User | null;
  isAdmin: boolean;
  onAddEmployee?: () => void;
  onLogout: () => Promise<void>;
};

export function Navbar({ user, isAdmin, onAddEmployee, onLogout }: Props) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white px-4 lg:px-6 flex items-center justify-between">
      <div className="text-slate-500 text-sm">Welcome, {isAdmin ? 'Admin' : 'Employee'}</div>
      <div className="flex items-center gap-2">
        {isAdmin && (
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={onAddEmployee}>
            <Plus className="h-4 w-4" />
            Add New Employee
          </Button>
        )}
        <Button size="sm" variant="danger" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
        <button className="rounded-md border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
          {getInitials(user?.firstName, user?.lastName, user?.email)}
        </div>
      </div>
    </header>
  );
}
