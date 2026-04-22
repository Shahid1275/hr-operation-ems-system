import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role, SignupPortal, SystemRole, UserStatus } from '@prisma/client';

export interface AuthUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  systemRole: SystemRole;
  signupPortal: SignupPortal;
  status: UserStatus;
  companyId: string | null;
  permissions?: string[];
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser;
  },
);
