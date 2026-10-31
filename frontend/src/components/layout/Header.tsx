import React from 'react';
import { Menu, Sun, Moon, Database, Cpu, PlusCircle } from 'lucide-react';
import { useWardPulse } from '../../context/WardPulseContext';

interface HeaderProps {
  onOpenMobile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobile }) => {
  const { activeTab, theme, toggleTheme, dataset, modelStatus, loadSampleDataset, setActiveTab } = useWardPulse();

  const getPageInfo = () => {
    switch (activeTab) {
      case 'overview':
        return {
          title: 'Civic Complaint Overview',
          subtitle: 'Predict complaint demand and plan smarter municipal ward inspections.'
        };
      case 'ward-map':
        return {
          title: 'Municipal Ward Map',
          subtitle: 'Interactive geospatial map with official ward boundaries and complaint density.'
        };
      case 'predictions':
        return {
          title: 'Complaint Demand Predictions',
          subtitle: 'Forecast complaint volume, surge probabilities, and model evaluation metrics.'
        };
      case 'dataset-model':
        return {
          title: 'Municipal Dataset & Model',
          subtitle: 'Ingest civic complaint datasets, select features, and train the prediction engine.'
        };
      case 'resource-planner':
        return {
          title: 'Inspection Resource Planning',
          subtitle: 'Prioritize ward inspections based on predicted complaint surge and infrastructure age.'
        };
      default:
        return {
          title: 'Dashboard',
          subtitle: 'WardPulse AI Civic Intelligence'
        };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] lg:hidden cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-[var(--text-main)] leading-tight">
            {title}
          </h1>
          <p className="text-xs text-[var(--text-muted)] hidden sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dataset Status Pill */}
        <button 
          onClick={() => setActiveTab('dataset-model')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
          title="Manage Municipal Dataset"
        >
          <Database className="w-3.5 h-3.5 text-[var(--primary)]" />
          <span>{dataset ? `${dataset.rowCount} Records` : 'No Dataset'}</span>
        </button>

        {/* Model Status Pill */}
        <button 
          onClick={() => setActiveTab('dataset-model')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:border-[var(--secondary)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
          title="View Model Status"
        >
          <Cpu className="w-3.5 h-3.5 text-[var(--secondary)]" />
          <span>
            {modelStatus === 'completed'
              ? 'Model Calibrated'
              : modelStatus === 'training'
              ? 'Training...'
              : 'Model Idle'}
          </span>
        </button>

        {/* Quick Sample Data loader if empty */}
        {!dataset && (
          <button
            onClick={loadSampleDataset}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--primary-light)] text-[var(--primary)] border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Load Sample Data</span>
          </button>
        )}

        {/* Simple Functional Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle light/dark theme"
          className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-slate-700" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>
      </div>
    </header>
  );
};
