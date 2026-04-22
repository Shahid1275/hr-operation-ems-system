import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/core/config/env';

const API_BASE = env.apiUrl;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export interface ApiEnvelope<T> {
  success: boolean;
  path: string;
  timestamp: string;
  data: T;
}

export function unwrapEnvelope<T>(payload: T | ApiEnvelope<T>): T {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'data' in payload &&
    'success' in payload
  ) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
}

// ── Request interceptor: attach access token ──────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response interceptor: auto-refresh on 401 ────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for auth endpoints themselves
      const url = originalRequest.url ?? '';
      if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        const refreshed = unwrapEnvelope<{ accessToken: string; refreshToken: string }>(data);
        localStorage.setItem('accessToken', refreshed.accessToken);
        localStorage.setItem('refreshToken', refreshed.refreshToken);

        refreshQueue.forEach((cb) => cb(refreshed.accessToken));
        refreshQueue = [];

        originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        refreshQueue = [];
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
