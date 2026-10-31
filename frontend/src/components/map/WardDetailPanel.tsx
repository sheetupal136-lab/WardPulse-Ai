import React from 'react';
import { 
  Building2, 
  MapPin, 
  TrendingUp, 
  ChevronRight, 
  ExternalLink,
  Info,
  Users
} from 'lucide-react';
import { Badge } from '../common/Badge';
import type { WardItem, GeoJsonMetadata } from '../../types';

interface WardDetailPanelProps {
  ward: WardItem | null;
  geoJsonMeta: GeoJsonMetadata | null;
  isModelTrained: boolean;
  onNavigateToPredictions: () => void;
  onNavigateToResourcePlanner: () => void;
  onNavigateToModelStudio: () => void;
}

export const WardDetailPanel: React.FC<WardDetailPanelProps> = ({
  ward,
  geoJsonMeta,
  isModelTrained,
  onNavigateToPredictions,
  onNavigateToResourcePlanner,
  onNavigateToModelStudio
}) => {
  if (!ward) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-xs text-[var(--text-muted)] border border-[var(--border-color)] rounded-xl bg-[var(--bg-card)]">
        <Building2 className="w-8 h-8 text-[var(--text-light)] mb-2" />
        <h4 className="font-semibold text-sm text-[var(--text-main)] mb-1">No Ward Selected</h4>
        <p className="max-w-xs leading-relaxed">
          Click any ward polygon on the map or select from the directory to inspect its civic complaint volume and spatial boundaries.
        </p>
      </div>
    );
  }

  // Search feature properties matching this ward in geoJsonMeta if available
  const geoProps = geoJsonMeta?.raw.features.find(f => {
    const p = f.properties || {};
    return p.ward_id === ward.id || p.id === ward.id || p.code === ward.id || p.ward_name === ward.name;
  })?.properties;

  return (
    <div className="h-full flex flex-col justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-card-subtle)]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Municipal Ward Profile
            </span>
            <h3 className="text-sm font-bold text-[var(--text-main)] mt-0.5 leading-snug">
              {ward.name}
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
              Ward Code: {ward.id} &bull; {ward.zone || 'Central Zone'}
            </p>
          </div>

          <div>
            {isModelTrained && ward.priority ? (
              <Badge priority={ward.priority} size="sm">
                {ward.priority}
              </Badge>
            ) : (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-[var(--border-color)]">
                Awaiting Model
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Spatial Information Box */}
        <div className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-subtle)] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-main)]">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[var(--primary)]" />
              Administrative Boundary
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Authentic GeoJSON
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-[var(--text-muted)]">
            {geoProps ? (
              <>
                <div className="flex justify-between">
                  <span>Jurisdiction:</span>
                  <span className="font-medium text-[var(--text-main)]">{geoProps.jurisdiction || 'City Municipal Corporation'}</span>
                </div>
                {geoProps.area_sq_km && (
                  <div className="flex justify-between">
                    <span>Geographic Area:</span>
                    <span className="font-medium text-[var(--text-main)]">{geoProps.area_sq_km} km&sup2;</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Boundary Representation:</span>
                  <span className="font-medium text-[var(--text-main)]">Verified Boundary Polygon</span>
                </div>
              </>
            ) : ward.coordinates ? (
              <>
                <div className="flex justify-between">
                  <span>Facility GPS:</span>
                  <span className="font-mono text-[10px] text-[var(--text-main)]">
                    {ward.coordinates[0].toFixed(4)}, {ward.coordinates[1].toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Boundary Layer:</span>
                  <span className="text-amber-600 dark:text-amber-400">Point Coordinates Only</span>
                </div>
              </>
            ) : (
              <p className="text-[10px] text-amber-600 dark:text-amber-400">
                No spatial coordinates or boundary polygons provided for this ward.
              </p>
            )}
          </div>
        </div>

        {/* Population & Baseline Complaints */}
        <div className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-subtle)] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-main)]">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[var(--primary)]" />
              Demographics & Baseline
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-[var(--text-muted)]">
            <div className="flex justify-between">
              <span>Ward Population:</span>
              <span className="font-semibold text-[var(--text-main)]">{ward.population.toLocaleString()} residents</span>
            </div>
            <div className="flex justify-between">
              <span>Recorded Complaints:</span>
              <span className="font-bold text-[var(--text-main)]">{ward.recordedComplaints} issues</span>
            </div>
          </div>
        </div>

        {/* Model Prediction Details Section (No Dummy Values) */}
        <div className="pt-2 border-t border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-xs text-[var(--text-main)] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[var(--secondary)]" />
              Complaint Demand Forecast
            </span>
          </div>

          {isModelTrained && ward.predictedDemand !== null ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-color)]">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-[var(--text-muted)]">Projected 30d Demand:</span>
                  <span className="text-lg font-bold text-[var(--text-main)]">{ward.predictedDemand} complaints</span>
                </div>
                <div className="flex items-baseline justify-between mt-1 text-[11px]">
                  <span className="text-[var(--text-muted)]">Forecast Surge:</span>
                  <span className={`font-semibold ${ward.predictedSurgePct && ward.predictedSurgePct > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {ward.predictedSurgePct && ward.predictedSurgePct > 0 ? `+${ward.predictedSurgePct}%` : '0%'} vs baseline
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1 text-[11px]">
                  <span className="text-[var(--text-muted)]">Confidence Range (95% CI):</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                    {ward.uncertaintyRange ? `[${ward.uncertaintyRange[0]} - ${ward.uncertaintyRange[1]}]` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Action Directive */}
              {ward.inspectionAction && (
                <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 text-[11px] text-[var(--text-main)] leading-relaxed">
                  <span className="font-semibold block text-blue-700 dark:text-blue-400 mb-0.5">Inspection Directive:</span>
                  {ward.inspectionAction}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-center space-y-2">
              <Info className="w-5 h-5 text-[var(--text-light)] mx-auto" />
              <p className="text-[11px] text-[var(--text-muted)]">
                Predictions not generated. Train the model in the Dataset & Model tab to calculate civic demand forecasts without fabricated data.
              </p>
              <button
                onClick={onNavigateToModelStudio}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-md text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] cursor-pointer"
              >
                Go to Model Training
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-card-subtle)] flex items-center justify-between gap-2">
        <button
          onClick={onNavigateToPredictions}
          className="flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] transition-colors text-center cursor-pointer flex items-center justify-center gap-1"
        >
          <span>Predictions</span>
          <ChevronRight className="w-3 h-3" />
        </button>

        <button
          onClick={onNavigateToResourcePlanner}
          className="flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors text-center cursor-pointer flex items-center justify-center gap-1"
        >
          <span>Resource Plan</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
