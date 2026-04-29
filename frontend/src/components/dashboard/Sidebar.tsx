'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ComponentType } from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  Wallet,
  Clock3,
  Settings,
  LogOut,
  ChevronRight,
  FileText,
  Shield,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const adminItems: NavItem[] = [
  { label: 'Dashboard',  href: '/admin/dashboard',  icon: LayoutDashboard },
  { label: 'Employees',  href: '/admin/users',       icon: Users           },
  { label: 'Attendance', href: '/admin/attendance',  icon: Clock3          },
  { label: 'Leave',      href: '/admin/leave',       icon: CalendarCheck2  },
  { label: 'Payroll',    href: '/admin/payroll',     icon: Wallet          },
  { label: 'Audit Logs', href: '/admin/audit',       icon: Shield          },
  { label: 'Settings',   href: '/admin/settings',    icon: Settings        },
];

const employeeItems: NavItem[] = [
  { label: 'Dashboard',  href: '/employee/dashboard',  icon: LayoutDashboard },
  { label: 'Attendance', href: '/employee/attendance',  icon: Clock3          },
  { label: 'Leave',      href: '/employee/leave',       icon: CalendarCheck2  },
  { label: 'Payslips',   href: '/employee/payslips',    icon: FileText        },
  { label: 'Notices',    href: '/employee/dashboard',   icon: Bell            },
  { label: 'Settings',   href: '/employee/profile',     icon: Settings        },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === '/admin/dashboard' || href === '/employee/dashboard') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(href + '/');
}

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();
  const items = isAdmin ? adminItems : employeeItems;

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email?.split('@')[0] ?? 'User';

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside
      className="hidden lg:flex lg:flex-col bg-[#0c1929] sidebar-scroll overflow-y-auto shrink-0"
      style={{ width: '256px', minHeight: '100vh' }}
    >
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10 shrink-0">
        <p className="text-base font-bold text-white tracking-tight">Employee MS</p>
        <p className="text-[11px] text-white/40 mt-0.5 font-medium tracking-wide">Management System</p>
      </div>

      {/* User profile card */}
      <div className="px-4 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-bold shrink-0 ring-2 ring-white/10">
            {getInitials(user?.firstName, user?.lastName, user?.email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate leading-tight">{displayName}</p>
            <p className="text-[11px] text-white/45 mt-0.5">{isAdmin ? 'Administrator' : 'Employee'}</p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-white/25 shrink-0" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">
          Navigation
        </p>

        {items.map(({ label, href, icon: Icon }) => {
          const active = isNavActive(pathname, href);
          return (
            <Link
              key={`${href}-${label}`}
              href={href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-white/12 text-white'
                  : 'text-white/55 hover:text-white/90 hover:bg-white/7',
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  active ? 'text-indigo-400' : 'text-white/40 group-hover:text-white/70',
                )}
              />
              <span className="flex-1 truncate">{label}</span>
              {active && <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10 shrink-0">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/50 hover:text-white hover:bg-white/7 transition-all duration-150"
        >
          <LogOut className="h-4 w-4 shrink-0 group-hover:text-red-400 transition-colors" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
