'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck2,
  Wallet,
  Clock3,
  Megaphone,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Item = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const adminItems: Item[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Employees', href: '/admin/users', icon: Users },
  { label: 'Departments', href: '/admin/settings', icon: Building2 },
  { label: 'Leave Management', href: '/admin/leave', icon: CalendarCheck2 },
  { label: 'Payroll', href: '/admin/payroll', icon: Wallet },
  { label: 'Attendance', href: '/admin/dashboard', icon: Clock3 },
  { label: 'Announcements', href: '/admin/audit', icon: Megaphone },
];

const employeeItems: Item[] = [
  { label: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', href: '/employee/dashboard', icon: Clock3 },
  { label: 'Leave Status', href: '/employee/leave', icon: CalendarCheck2 },
  { label: 'Announcements', href: '/employee/dashboard', icon: Bell },
];

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? adminItems : employeeItems;

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-slate-200 bg-white">
      <div className="p-5 border-b border-slate-100">
        <p className="text-2xl font-bold leading-6 text-amber-600">Employee</p>
        <p className="text-2xl font-bold leading-6 text-amber-600">Management</p>
        <p className="text-2xl font-bold leading-6 text-amber-600">System</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        <p className="px-2 py-1 text-xs font-semibold uppercase text-slate-400">Main</p>
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={`${href}-${label}`}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-amber-50 text-amber-700 border-l-2 border-amber-500'
                  : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
