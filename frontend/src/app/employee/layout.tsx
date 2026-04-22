'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRoles={['EMPLOYEE']}>
      <DashboardLayout isAdmin={false}>{children}</DashboardLayout>
    </AuthGuard>
  );
}
