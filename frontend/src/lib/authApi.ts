import api, { unwrapEnvelope } from './api';
import type { LoginResponse, RegisterResponse, User } from '@/types';

export const authApi = {
  register: (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    signupPortal: 'admin' | 'employee';
  }) => api.post('/auth/register', data).then((r) => unwrapEnvelope<RegisterResponse>(r.data)),

  login: (data: { email: string; password: string; portal: 'admin' | 'employee' }) =>
    api.post('/auth/login', data).then((r) => unwrapEnvelope<LoginResponse>(r.data)),

  refresh: (refreshToken: string) =>
    api
      .post('/auth/refresh', { refreshToken })
      .then((r) => unwrapEnvelope<{ accessToken: string; refreshToken: string }>(r.data)),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }).then((r) => unwrapEnvelope<{ message: string }>(r.data)),

  getProfile: () =>
    api.get('/auth/profile').then((r) => unwrapEnvelope<User>(r.data)),

  forgotPassword: (email: string) =>
    api
      .post('/auth/forgot-password', { email })
      .then((r) => unwrapEnvelope<{ message: string }>(r.data)),

  resetPassword: (token: string, newPassword: string) =>
    api
      .post('/auth/reset-password', { token, newPassword })
      .then((r) => unwrapEnvelope<{ message: string }>(r.data)),

  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }).then((r) => unwrapEnvelope<{ message: string }>(r.data)),

  resendVerification: () =>
    api.post('/auth/resend-verification').then((r) => unwrapEnvelope<{ message: string }>(r.data)),

  /** No JWT — for users who cannot log in until verified */
  requestVerificationEmail: (email: string) =>
    api
      .post('/auth/request-verification-email', { email })
      .then((r) => unwrapEnvelope<{ message: string }>(r.data)),
};
