'use client';

import type { ComponentType } from 'react';

type StatCardProps = {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: ComponentType<{ className?: string }>;
  colorClass: string;
  compact?: boolean;
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  compact = false,
}: StatCardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-0.5 ${colorClass} ${
        compact ? 'p-4' : 'p-5'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`font-medium ${compact ? 'text-xs' : 'text-sm'} text-slate-100/90`}>
            {title}
          </p>
          <p className={`mt-1 font-bold text-white ${compact ? 'text-2xl' : 'text-3xl'}`}>
            {value}
          </p>
        </div>
        <div className="rounded-lg bg-white/20 p-2">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      {subtitle && (
        <button className="mt-3 rounded-md bg-white/20 px-3 py-1 text-xs font-medium text-white hover:bg-white/30">
          {subtitle}
        </button>
      )}
    </div>
  );
}
