import React from 'react';
import { Layers, ShieldCheck, MapPin } from 'lucide-react';
import type { ChoroplethMode } from '../../types';

interface MapLegendProps {
  isModelTrained: boolean;
  hasGeoJson: boolean;
  hasPointMarkers: boolean;
  choroplethMode: ChoroplethMode;
  onModeChange: (mode: ChoroplethMode) => void;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  isModelTrained,
  hasGeoJson,
  hasPointMarkers,
  choroplethMode,
  onModeChange
}) => {
  return (
    <div className="absolute top-4 right-4 z-20 w-64 p-3.5 rounded-xl bg-[var(--bg-card)]/95 backdrop-blur-md border border-[var(--border-color)] shadow-md text-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
        <span className="font-bold text-[11px] uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[var(--primary)]" />
          Map Legend
        </span>
        <span className="text-[10px] text-[var(--text-muted)] font-mono">
          Vector Basemap
        </span>
      </div>

      {/* Layer Color Scale */}
      {hasGeoJson ? (
        <div className="space-y-2">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-[11px]">
            <button
              onClick={() => onModeChange('prediction')}
              disabled={!isModelTrained}
              className={`flex-1 py-1 px-1.5 rounded-md font-medium transition-colors text-center cursor-pointer ${
                choroplethMode === 'prediction' && isModelTrained
                  ? 'bg-[var(--primary)] text-white shadow-xs font-semibold'
                  : !isModelTrained
                  ? 'text-[var(--text-light)] cursor-not-allowed'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title={!isModelTrained ? 'Train model to activate prediction coloring' : 'Color by predicted complaint risk'}
            >
              Surge Risk
            </button>
            <button
              onClick={() => onModeChange('demand')}
              className={`flex-1 py-1 px-1.5 rounded-md font-medium transition-colors text-center cursor-pointer ${
                choroplethMode === 'demand'
                  ? 'bg-[var(--primary)] text-white shadow-xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Complaints
            </button>
            <button
              onClick={() => onModeChange('boundaries')}
              className={`flex-1 py-1 px-1.5 rounded-md font-medium transition-colors text-center cursor-pointer ${
                choroplethMode === 'boundaries'
                  ? 'bg-[var(--primary)] text-white shadow-xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Boundaries
            </button>
          </div>

          {/* Choropleth Legend Items */}
          {choroplethMode === 'prediction' && isModelTrained ? (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[var(--text-main)]">
                  <span className="w-3.5 h-3.5 rounded-sm bg-[#EF4444] border border-white dark:border-slate-800 shadow-xs" />
                  Critical Priority
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">&ge;400 complaints</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[var(--text-main)]">
                  <span className="w-3.5 h-3.5 rounded-sm bg-[#F59E0B] border border-white dark:border-slate-800 shadow-xs" />
                  Elevated Demand
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">300 - 399</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[var(--text-main)]">
                  <span className="w-3.5 h-3.5 rounded-sm bg-[#2563EB] border border-white dark:border-slate-800 shadow-xs" />
                  Moderate Demand
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">200 - 299</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[var(--text-main)]">
                  <span className="w-3.5 h-3.5 rounded-sm bg-[#14B8A6] border border-white dark:border-slate-800 shadow-xs" />
                  Stable Demand
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">&lt;200</span>
              </div>
            </div>
          ) : choroplethMode === 'demand' ? (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[var(--text-main)]">
                  <span className="w-3.5 h-3.5 rounded-sm bg-[#DC2626] border border-white dark:border-slate-800" />
                  High Volume
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">&ge;400</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[var(--text-main)]">
                  <span className="w-3.5 h-3.5 rounded-sm bg-[#EA580C] border border-white dark:border-slate-800" />
                  Elevated Volume
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">300 - 399</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[var(--text-main)]">
                  <span className="w-3.5 h-3.5 rounded-sm bg-[#0284C7] border border-white dark:border-slate-800" />
                  Normal Volume
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">200 - 299</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[var(--text-main)]">
                  <span className="w-3.5 h-3.5 rounded-sm bg-[#059669] border border-white dark:border-slate-800" />
                  Low Volume
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">&lt;200</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 pt-1 text-[11px] text-[var(--text-muted)]">
              <div className="flex items-center gap-2 text-[var(--text-main)]">
                <span className="w-3.5 h-3.5 rounded-sm bg-blue-500/20 border-2 border-blue-500" />
                <span>Municipal Ward Boundaries</span>
              </div>
              {!isModelTrained && (
                <p className="text-[10px] text-[var(--text-muted)] leading-tight bg-[var(--bg-card-subtle)] p-2 rounded-md border border-[var(--border-color)]">
                  Forecasting model untrained. Polygons are displayed with neutral administrative boundaries without fabricated risk colors.
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="py-1 text-[11px] text-[var(--text-muted)] space-y-1">
          <p>No GeoJSON boundary layer loaded.</p>
          <span className="text-[10px] block text-[var(--text-light)]">
            Vector basemap active with English labels.
          </span>
        </div>
      )}

      {/* Point Markers Legend */}
      {hasPointMarkers && (
        <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-[var(--text-main)]">
            <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Ward Facility Coordinates</span>
          </span>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">Exact GPS</span>
        </div>
      )}

      {/* Attribution Footer */}
      <div className="pt-2 border-t border-[var(--border-color)] text-[10px] text-[var(--text-light)] flex items-center justify-between">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          Genuine Geographic Data
        </span>
      </div>
    </div>
  );
};
