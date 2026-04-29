'use client';

import { Bell, Search } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import type { User } from '@/types';

type Props = {
  user: User | null;
  isAdmin: boolean;
  onAddEmployee?: () => void;
  onLogout: () => Promise<void>;
};

export function Navbar({ user, isAdmin }: Props) {
  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email?.split('@')[0] ?? 'User';

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-5 lg:px-7 flex items-center gap-4 sticky top-0 z-20">

      {/* Search */}
      <div className="relative hidden sm:flex items-center">
        <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Search..."
          className="h-8 w-52 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15 transition"
        />
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200" />

        {/* User badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold ring-2 ring-indigo-100">
            {getInitials(user?.firstName, user?.lastName, user?.email)}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{displayName}</p>
            <p className="text-[10px] text-slate-400 leading-tight">{isAdmin ? 'Administrator' : 'Employee'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
