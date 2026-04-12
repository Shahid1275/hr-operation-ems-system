'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="USER">
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="USER" />
        <main className="flex-1 lg:ml-64 min-h-screen">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
