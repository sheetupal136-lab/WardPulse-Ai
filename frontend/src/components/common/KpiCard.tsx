import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'positive' | 'warning' | 'critical' | 'neutral';
  };
  isEmpty?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  isEmpty = false
}) => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-xs transition-all hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight ${isEmpty ? 'text-[var(--text-light)]' : 'text-[var(--text-main)]'}`}>
              {value}
            </span>
            {badge && (
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  badge.variant === 'positive'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : badge.variant === 'warning'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                    : badge.variant === 'critical'
                    ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {badge.text}
              </span>
            )}
          </div>
        </div>
        <div className="rounded-lg bg-[var(--bg-card-subtle)] p-2.5 text-[var(--primary)] border border-[var(--border-color)]">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)] truncate">
        {subtitle}
      </p>
    </div>
  );
};
