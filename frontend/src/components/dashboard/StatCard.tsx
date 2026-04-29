'use client';

import type { ComponentType } from 'react';
import { TrendingUp } from 'lucide-react';

type StatCardProps = {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: ComponentType<{ className?: string }>;
  colorClass: string;
  trend?: { value: number; label: string };
  compact?: boolean;
  onClick?: () => void;
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  trend,
  compact = false,
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`stat-card-shine rounded-2xl border border-white/10 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${colorClass} ${
        compact ? 'p-4' : 'p-5'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`font-medium leading-tight text-white/80 ${compact ? 'text-xs' : 'text-[13px]'}`}>
            {title}
          </p>
          <p className={`mt-1.5 font-bold text-white tracking-tight ${compact ? 'text-2xl' : 'text-3xl'}`}>
            {value}
          </p>
        </div>
        <div className="rounded-xl bg-white/15 p-2.5 shrink-0">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {trend ? (
          <div className="flex items-center gap-1 text-white/70 text-xs">
            <TrendingUp className="h-3 w-3" />
            <span>{trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}</span>
          </div>
        ) : (
          <span className="text-xs text-white/50">{subtitle ?? ' '}</span>
        )}
        <button className="rounded-lg bg-white/15 hover:bg-white/25 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors">
          View
        </button>
      </div>
    </div>
  );
}
