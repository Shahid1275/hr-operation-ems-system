import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variantClass = {
  primary:   'bg-indigo-600 hover:bg-indigo-700 text-white border border-transparent shadow-sm',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-transparent',
  outline:   'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300',
  ghost:     'bg-transparent hover:bg-slate-100 text-slate-600 border border-transparent',
  danger:    'bg-red-600 hover:bg-red-700 text-white border border-transparent shadow-sm',
  success:   'bg-emerald-600 hover:bg-emerald-700 text-white border border-transparent shadow-sm',
};

const sizeClass = {
  xs: 'h-7 px-2.5 text-xs gap-1',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          variantClass[variant],
          sizeClass[size],
          className,
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
