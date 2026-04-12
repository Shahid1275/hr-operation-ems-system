export type Role = 'USER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
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
