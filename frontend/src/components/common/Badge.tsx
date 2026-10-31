import React from 'react';
import type { WardPriority } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'priority' | 'status' | 'outline' | 'neutral';
  priority?: WardPriority | null;
  status?: 'active' | 'pending' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'priority',
  priority,
  status = 'active',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (variant === 'priority') {
    switch (priority) {
      case 'Critical':
        return (
          <span className={`inline-flex items-center font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/60 ${sizeClasses} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse" />
            {children || 'Critical'}
          </span>
        );
      case 'Elevated':
        return (
          <span className={`inline-flex items-center font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 ${sizeClasses} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
            {children || 'Elevated'}
          </span>
        );
      case 'Moderate':
        return (
          <span className={`inline-flex items-center font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 ${sizeClasses} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
            {children || 'Moderate'}
          </span>
        );
      case 'Low':
      default:
        return (
          <span className={`inline-flex items-center font-medium rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 border border-teal-200 dark:border-teal-900/60 ${sizeClasses} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1.5" />
            {children || 'Low'}
          </span>
        );
    }
  }

  if (variant === 'status') {
    switch (status) {
      case 'success':
        return (
          <span className={`inline-flex items-center font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 ${sizeClasses} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            {children}
          </span>
        );
      case 'warning':
        return (
          <span className={`inline-flex items-center font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 ${sizeClasses} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
            {children}
          </span>
        );
      case 'error':
        return (
          <span className={`inline-flex items-center font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/60 ${sizeClasses} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
            {children}
          </span>
        );
      case 'pending':
        return (
          <span className={`inline-flex items-center font-medium rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200 dark:border-sky-900/60 ${sizeClasses} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5 animate-spin" />
            {children}
          </span>
        );
      case 'neutral':
      default:
        return (
          <span className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 ${sizeClasses} ${className}`}>
            {children}
          </span>
        );
    }
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-md border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-[var(--text-muted)] ${sizeClasses} ${className}`}>
      {children}
    </span>
  );
};
