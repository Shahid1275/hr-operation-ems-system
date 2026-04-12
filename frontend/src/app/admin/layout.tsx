'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="ADMIN">
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="ADMIN" />
        <main className="flex-1 lg:ml-64 min-h-screen">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
