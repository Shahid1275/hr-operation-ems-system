'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  LogOut,
  UserCircle,
  ShieldCheck,
  Menu,
  X,
  CalendarCheck2,
  Wallet,
  FileText,
  Settings,
  ScrollText,
} from 'lucide-react';
import { useState, type ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { getInitials, getFullName } from '@/lib/utils';
import type { SystemRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

interface SidebarContentProps {
  portalLabel: string;
  nav: NavItem[];
  pathname: string;
  user: ReturnType<typeof useAuthStore.getState>['user'];
  loggingOut: boolean;
  onNavigate: () => void;
  onLogout: () => Promise<void>;
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Leave', href: '/admin/leave', icon: CalendarCheck2 },
  { label: 'Payroll', href: '/admin/payroll', icon: Wallet },
  { label: 'Documents', href: '/admin/documents', icon: FileText },
  { label: 'Audit Logs', href: '/admin/audit', icon: ScrollText },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Profile', href: '/admin/profile', icon: UserCircle },
];

const employeeNav: NavItem[] = [
  { label: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
  { label: 'Leave', href: '/employee/leave', icon: CalendarCheck2 },
  { label: 'Profile', href: '/employee/profile', icon: UserCircle },
];

function SidebarContent({
  portalLabel,
  nav,
  pathname,
  user,
  loggingOut,
  onNavigate,
  onLogout,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">EMS</p>
          <p className="text-xs text-blue-300">{portalLabel}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-white/20 text-white'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white text-xs font-semibold">
            {getInitials(user?.firstName, user?.lastName, user?.email)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {getFullName(user?.firstName, user?.lastName, user?.email)}
            </p>
            <p className="text-xs text-blue-300 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ role }: { role: SystemRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isAdminPortal = role !== 'EMPLOYEE';
  const nav = isAdminPortal ? adminNav : employeeNav;
  const portalLabel = isAdminPortal ? 'Admin Portal' : 'Employee Portal';

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.replace('/');
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 rounded-lg bg-[#0f1b2d] p-2 text-white shadow-lg lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-[#0f1b2d] transition-transform lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarContent
          portalLabel={portalLabel}
          nav={nav}
          pathname={pathname}
          user={user}
          loggingOut={loggingOut}
          onNavigate={() => setMobileOpen(false)}
          onLogout={handleLogout}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex-col bg-[#0f1b2d]">
        <SidebarContent
          portalLabel={portalLabel}
          nav={nav}
          pathname={pathname}
          user={user}
          loggingOut={loggingOut}
          onNavigate={() => setMobileOpen(false)}
          onLogout={handleLogout}
        />
      </aside>
    </>
  );
}
