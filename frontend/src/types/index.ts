export type Role = 'USER' | 'ADMIN';
export type SystemRole =
  | 'COMPANY_ADMIN'
  | 'HR_MANAGER'
  | 'TEAM_LEAD'
  | 'EMPLOYEE';

/** Matches backend Prisma `SignupPortal` — which portal the account was created for. */
export type SignupPortal = 'ADMIN_PORTAL' | 'EMPLOYEE_PORTAL';

export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  systemRole: SystemRole;
  /** Present after login/register; may be absent in older persisted sessions until next refresh. */
  signupPortal?: SignupPortal;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  companyId?: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface RegisterResponse extends AuthTokens {
  user: User;
  message: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export type Portal = 'admin' | 'employee';

export interface OrganizationUnit {
  id: string;
  companyId: string;
  name: string;
  code?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeRecord {
  id: string;
  employeeCode: string;
  jobTitle?: string | null;
  joiningDate?: string | null;
  user: User;
  department?: OrganizationUnit | null;
  team?: OrganizationUnit | null;
  branch?: OrganizationUnit | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedEmployees {
  items: EmployeeRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
