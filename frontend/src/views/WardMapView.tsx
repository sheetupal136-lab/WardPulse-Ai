import React, { useState } from 'react';
import { 
  MapPin, 
  Search, 
  Info
} from 'lucide-react';
import { useWardPulse } from '../context/WardPulseContext';
import { WardGeoMap } from '../components/map/WardGeoMap';
import { WardDetailPanel } from '../components/map/WardDetailPanel';
import { GeoJsonUploadCard } from '../components/map/GeoJsonUploadCard';
import { Badge } from '../components/common/Badge';

export const WardMapView: React.FC = () => {
  const { 
    wards, 
    selectedWardId, 
    setSelectedWardId, 
    selectedWard, 
    geoJsonMeta, 
    modelStatus, 
    setActiveTab 
  } = useWardPulse();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [activeSideTab, setActiveSideTab] = useState<'details' | 'directory'>('details');

  const isModelTrained = modelStatus === 'completed';

  // Filtered wards
  const filteredWards = wards.filter(w => {
    const matchesSearch = 
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.zone && w.zone.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = 
      filterPriority === 'all' || 
      (w.priority && w.priority.toLowerCase() === filterPriority.toLowerCase());

    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Top GeoJSON Layer Upload & Validation Card */}
      <GeoJsonUploadCard />

      {/* Main Geospatial Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Area (2 Columns on Large Screens) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="h-[620px]">
            <WardGeoMap />
          </div>

          {/* Quick Notice Banner below map */}
          <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <span>
                Click any ward boundary polygon or location pin on the map to inspect complaint volume and calibrated demand projections.
              </span>
            </span>
            <button
              onClick={() => setActiveTab('predictions')}
              className="text-[var(--primary)] font-semibold hover:underline shrink-0 ml-2 cursor-pointer"
            >
              Predictions View &rarr;
            </button>
          </div>
        </div>

        {/* Side Panel (1 Column on Large Screens) */}
        <div className="flex flex-col gap-3 h-[685px]">
          {/* Side Panel Tab Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
            <button
              onClick={() => setActiveSideTab('details')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeSideTab === 'details'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Ward Profile
            </button>
            <button
              onClick={() => setActiveSideTab('directory')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeSideTab === 'directory'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Ward Directory ({filteredWards.length})
            </button>
          </div>

          {/* Active Tab: Ward Details Panel */}
          {activeSideTab === 'details' ? (
            <div className="flex-1 min-h-0">
              <WardDetailPanel
                ward={selectedWard}
                geoJsonMeta={geoJsonMeta}
                isModelTrained={isModelTrained}
                onNavigateToPredictions={() => setActiveTab('predictions')}
                onNavigateToResourcePlanner={() => setActiveTab('resource-planner')}
                onNavigateToModelStudio={() => setActiveTab('dataset-model')}
              />
            </div>
          ) : (
            /* Active Tab: Ward Directory with Search and Filter */
            <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-xs">
              <div className="pb-3 border-b border-[var(--border-color)] space-y-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search by ward name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                  {['all', 'critical', 'elevated', 'moderate', 'low'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setFilterPriority(p)}
                      className={`px-2 py-0.5 rounded-md capitalize font-medium text-[11px] transition-colors cursor-pointer shrink-0 ${
                        filterPriority === p
                          ? 'bg-[var(--primary)] text-white'
                          : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto py-2 space-y-2">
                {filteredWards.length > 0 ? (
                  filteredWards.map((w) => {
                    const isSelected = selectedWardId === w.id;
                    const hasCoords = w.coordinates !== null;

                    return (
                      <div
                        key={w.id}
                        onClick={() => {
                          setSelectedWardId(w.id);
                          setActiveSideTab('details');
                        }}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                            : 'border-[var(--border-color)] bg-[var(--bg-card-subtle)] hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-xs text-[var(--text-main)]">
                              {w.name}
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                              {w.id} &bull; {w.zone || 'Metropolitan Ward'}
                            </p>
                          </div>
                          {w.priority ? (
                            <Badge priority={w.priority} size="sm">
                              {w.priority}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-[var(--text-muted)]">Untrained</span>
                          )}
                        </div>

                        <div className="mt-2 pt-2 border-t border-[var(--border-color)]/60 flex items-center justify-between text-[11px]">
                          <span className="text-[var(--text-muted)]">
                            Complaints: <strong>{w.recordedComplaints}</strong> (Pop: {w.population.toLocaleString()})
                          </span>
                          <span className={`flex items-center gap-1 font-mono text-[10px] ${hasCoords ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}`}>
                            <MapPin className="w-3 h-3" />
                            {hasCoords ? 'GPS Pin' : 'Boundary'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                    No wards match search criteria.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
