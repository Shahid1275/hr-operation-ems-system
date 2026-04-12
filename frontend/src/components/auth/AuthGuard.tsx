'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { PageLoader } from '@/components/ui/Spinner';
import type { Role } from '@/types';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: Role;
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken || !user) {
      router.replace('/login');
      return;
    }
    if (requiredRole && user.role !== requiredRole) {
      // Redirect to the correct dashboard
      router.replace(user.role === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard');
    }
  }, [accessToken, user, requiredRole, router]);

  if (!accessToken || !user) return <PageLoader />;
  if (requiredRole && user.role !== requiredRole) return <PageLoader />;

  return <>{children}</>;
}
