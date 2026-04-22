'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuthStore } from '@/store/authStore';

type Props = {
  isAdmin: boolean;
  children: ReactNode;
};

export function DashboardLayout({ isAdmin, children }: Props) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex-1 min-w-0">
        <Navbar
          user={user}
          isAdmin={isAdmin}
          onAddEmployee={isAdmin ? () => router.push('/admin/users') : undefined}
          onLogout={logout}
        />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
