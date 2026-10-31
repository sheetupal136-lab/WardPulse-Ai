import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  TrendingUp, 
  Database, 
  Layers, 
  Sun, 
  Moon, 
  Building2,
  X
} from 'lucide-react';
import { useWardPulse } from '../../context/WardPulseContext';
import type { NavigationTab } from '../../types';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, theme, toggleTheme, dataset, modelStatus } = useWardPulse();

  const navItems: { id: NavigationTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'ward-map', label: 'Ward Map', icon: Map },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp },
    { id: 'dataset-model', label: 'Dataset & Model', icon: Database },
    { id: 'resource-planner', label: 'Resource Planning', icon: Layers },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 border-r border-[var(--border-color)] bg-[var(--bg-card)] transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-[var(--text-main)] block leading-none">
                WardPulse AI
              </span>
              <span className="text-[11px] font-medium text-[var(--secondary)] block mt-1 leading-none">
                Civic Complaint Intelligence
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-light)]">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-[var(--primary)] text-white shadow-xs font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[var(--text-muted)]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Telemetry Footer */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-card-subtle)] space-y-3">
          <div className="rounded-lg p-3 bg-[var(--bg-card)] border border-[var(--border-color)] text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Municipal Data:</span>
              <span className={`font-semibold ${dataset ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-light)]'}`}>
                {dataset ? `${dataset.rowCount} Wards` : 'None'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Forecast Engine:</span>
              <span className={`font-semibold ${modelStatus === 'completed' ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-light)]'}`}>
                {modelStatus === 'completed' ? 'Calibrated' : modelStatus === 'training' ? 'Training...' : 'Idle'}
              </span>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              {theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-sky-400" />
              )}
              <span>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
            </span>
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[var(--bg-card-subtle)] text-[var(--text-muted)] border border-[var(--border-color)]">
              Toggle
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
