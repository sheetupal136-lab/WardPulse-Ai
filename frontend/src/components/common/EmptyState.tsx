import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  compact = false
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card)]/40 ${
        compact ? 'py-8 px-4' : 'py-12 px-6'
      }`}
    >
      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 border border-blue-100 dark:border-blue-900/40">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[var(--text-main)] mb-1.5">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-xs transition-colors cursor-pointer"
            >
              {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-[var(--text-main)] border border-[var(--border-color)] hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
