'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { PageLoader } from '@/components/ui/Spinner';
import type { SystemRole } from '@/types';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: SystemRole[];
}

const adminRoles: SystemRole[] = ['COMPANY_ADMIN', 'HR_MANAGER', 'TEAM_LEAD'];

function homeByRole(role: SystemRole) {
  return adminRoles.includes(role) ? '/admin/dashboard' : '/employee/dashboard';
}

export function AuthGuard({ children, requiredRoles }: AuthGuardProps) {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken || !user) {
      router.replace('/login');
      return;
    }
    if (!user.isEmailVerified) {
      router.replace(
        `/pending-verification?email=${encodeURIComponent(user.email)}`,
      );
      return;
    }
    if (requiredRoles && !requiredRoles.includes(user.systemRole)) {
      router.replace(homeByRole(user.systemRole));
    }
  }, [accessToken, user, requiredRoles, router]);

  if (!accessToken || !user) return <PageLoader />;
  if (!user.isEmailVerified) return <PageLoader />;
  if (requiredRoles && !requiredRoles.includes(user.systemRole)) return <PageLoader />;

  return <>{children}</>;
}
