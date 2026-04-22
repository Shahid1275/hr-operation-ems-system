'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRoles={['COMPANY_ADMIN', 'HR_MANAGER', 'TEAM_LEAD']}>
      <DashboardLayout isAdmin>{children}</DashboardLayout>
    </AuthGuard>
  );
}
