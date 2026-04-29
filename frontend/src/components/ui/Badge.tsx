import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'indigo' | 'teal' | 'orange';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClass: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-600 ring-slate-200/60',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
  warning: 'bg-amber-50  text-amber-700  ring-amber-200/60',
  danger:  'bg-red-50    text-red-700    ring-red-200/60',
  info:    'bg-blue-50   text-blue-700   ring-blue-200/60',
  indigo:  'bg-indigo-50 text-indigo-700 ring-indigo-200/60',
  teal:    'bg-teal-50   text-teal-700   ring-teal-200/60',
  orange:  'bg-orange-50 text-orange-700 ring-orange-200/60',
};

const dotClass: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  info:    'bg-blue-500',
  indigo:  'bg-indigo-500',
  teal:    'bg-teal-500',
  orange:  'bg-orange-500',
};

export function Badge({ variant = 'default', children, className, dot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        variantClass[variant],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotClass[variant])} />}
      {children}
    </span>
  );
}
