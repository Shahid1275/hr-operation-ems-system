import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AxiosError } from 'axios';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: unknown; error?: string }
      | undefined;
    const msg = data?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.join(', ');
    if (msg && typeof msg === 'object') {
      const nested = msg as { message?: unknown; error?: string };
      if (typeof nested.message === 'string') return nested.message;
      if (Array.isArray(nested.message)) return nested.message.join(', ');
      if (typeof nested.error === 'string') return nested.error;
    }
    if (typeof data?.error === 'string') return data.error;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Never';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export function getInitials(firstName?: string | null, lastName?: string | null, email?: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return 'U';
}

export function getFullName(firstName?: string | null, lastName?: string | null, email?: string): string {
  const name = [firstName, lastName].filter(Boolean).join(' ');
  return name || email || 'Unknown';
}
