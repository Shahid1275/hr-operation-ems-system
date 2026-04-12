import api from './api';
import type { LoginResponse, RegisterResponse, User } from '@/types';

export const authApi = {
  register: (data: { email: string; password: string; firstName?: string; lastName?: string }) =>
    api.post<RegisterResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post<{ message: string }>('/auth/logout', { refreshToken }).then((r) => r.data),

  logoutAll: () =>
    api.post<{ message: string }>('/auth/logout-all').then((r) => r.data),

  getProfile: () =>
    api.get<User>('/auth/profile').then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, password }).then((r) => r.data),

  verifyEmail: (token: string) =>
    api.post<{ message: string }>('/auth/verify-email', { token }).then((r) => r.data),

  resendVerification: () =>
    api.post<{ message: string }>('/auth/resend-verification').then((r) => r.data),
};
