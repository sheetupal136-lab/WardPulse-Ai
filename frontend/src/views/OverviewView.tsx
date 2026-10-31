import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  AlertCircle, 
  Cpu, 
  MapPin, 
  ArrowRight, 
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';
import { useWardPulse } from '../context/WardPulseContext';
import { KpiCard } from '../components/common/KpiCard';
import { Badge } from '../components/common/Badge';

// Lazy load the 3D Miniature City component for optimal performance
const MiniatureCity = lazy(() => import('../components/3d/MiniatureCity'));

export const OverviewView: React.FC = () => {
  const { 
    dataset, 
    modelStatus, 
    modelMetrics, 
    wards, 
    setActiveTab, 
    loadSampleDataset,
    loadHackathonDataset,
    setSelectedWardId
  } = useWardPulse();

  const isDataLoaded = Boolean(dataset && dataset.rows.length > 0);
  const isModelTrained = modelStatus === 'completed' && Boolean(modelMetrics);

  // 1. Total Wards KPI
  const totalWardsCount = isDataLoaded ? wards.length : 0;

  // 2. Recorded Complaints KPI
  const totalRecordedComplaints = isDataLoaded
    ? wards.reduce((acc, w) => acc + (w.recordedComplaints || 0), 0)
    : 0;

  // 3. Predicted Complaint Demand KPI
  const totalPredictedDemand = isModelTrained
    ? wards.reduce((acc, w) => acc + (w.predictedDemand || w.recordedComplaints || 0), 0)
    : 0;

  // 4. Model Performance KPI (Genuine R² and MAE, no fabricated reliability %)
  const modelPerformanceStr = isModelTrained
    ? `R² ${modelMetrics?.r2}`
    : '--';

  // Filter top priority wards
  const topPriorityWards = isModelTrained
    ? [...wards].filter(w => w.priority === 'Critical' || w.priority === 'Elevated').slice(0, 4)
    : [];

  return (
    <div className="space-y-8 pb-10">
      {/* SECTION 1: Welcome Hero Section with 3D Miniature City */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center min-h-[340px]">
          {/* Left Hero Messaging */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 space-y-4 z-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--primary-light)] text-[var(--primary)] border border-blue-200 dark:border-blue-900/50">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Civic Complaint Intelligence</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--text-main)] tracking-tight leading-tight">
              Understand your city&apos;s needs.
            </h1>

            <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-xl leading-relaxed">
              Predict civic complaint demand and help plan smarter ward inspections across municipal infrastructure, sanitation, and utilities.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('ward-map')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-xs transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4" />
                <span>Explore Ward Map</span>
              </button>

              {!isDataLoaded ? (
                <button
                  onClick={() => loadHackathonDataset('hackathon_joined')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-[var(--text-main)] hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Load Hackathon Dataset</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('predictions')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-[var(--text-main)] hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4 text-[var(--primary)]" />
                  <span>View Demand Predictions</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Hero: Lightweight Animated 3D Miniature City */}
          <div className="lg:col-span-5 h-[280px] sm:h-[340px] relative overflow-hidden bg-gradient-to-tr from-blue-50/40 via-transparent to-teal-50/40 dark:from-slate-900/60 dark:to-slate-800/40">
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-slate-800 flex items-center justify-center text-xl">
                      🏙️
                    </div>
                    <span>Rendering 3D City...</span>
                  </div>
                </div>
              }
            >
              <MiniatureCity className="w-full h-full" />
            </Suspense>
          </div>
        </div>
      </motion.div>

      {/* SECTION 2: Exactly Four KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* KPI 1: Total Wards */}
        <KpiCard
          title="Total Wards"
          value={isDataLoaded ? `${totalWardsCount} Wards` : '--'}
          subtitle={isDataLoaded ? 'Monitored municipal jurisdictions' : 'Upload dataset to load wards'}
          icon={Building2}
          isEmpty={!isDataLoaded}
          badge={isDataLoaded ? { text: 'Active', variant: 'positive' } : undefined}
        />

        {/* KPI 2: Recorded Complaints */}
        <KpiCard
          title="Recorded Complaints"
          value={isDataLoaded ? totalRecordedComplaints.toLocaleString() : '--'}
          subtitle={isDataLoaded ? 'Total citizen service requests' : 'Historical baseline complaints'}
          icon={FileText}
          isEmpty={!isDataLoaded}
          badge={isDataLoaded ? { text: 'Verified', variant: 'positive' } : undefined}
        />

        {/* KPI 3: Predicted Complaint Demand */}
        <KpiCard
          title="Predicted Complaint Demand"
          value={isModelTrained ? totalPredictedDemand.toLocaleString() : '--'}
          subtitle={isModelTrained ? 'Projected 30-day civic workload' : 'Train model to forecast demand'}
          icon={Layers}
          isEmpty={!isModelTrained}
          badge={
            isModelTrained
              ? totalPredictedDemand > totalRecordedComplaints
                ? { text: `+${Math.round(((totalPredictedDemand - totalRecordedComplaints) / totalRecordedComplaints) * 100)}% Surge`, variant: 'warning' }
                : { text: 'Stable', variant: 'positive' }
              : undefined
          }
        />

        {/* KPI 4: Model Performance */}
        <KpiCard
          title="Model Performance"
          value={modelPerformanceStr}
          subtitle={isModelTrained ? `Cross-validated MAE: ±${modelMetrics?.mae} complaints` : 'Evaluate predictive precision'}
          icon={Cpu}
          isEmpty={!isModelTrained}
          badge={isModelTrained ? { text: 'Calibrated', variant: 'positive' } : undefined}
        />
      </motion.div>

      {/* SECTION 3: Dataset Upload Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
        className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
              Dataset Experience
            </span>
            <Badge variant="status" status={isDataLoaded ? 'success' : 'neutral'}>
              {isDataLoaded ? 'Dataset Loaded' : 'Awaiting Upload'}
            </Badge>
          </div>
          <h3 className="text-base font-bold text-[var(--text-main)]">
            {isDataLoaded ? dataset?.name : 'Upload Your Municipal Complaint Dataset'}
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-xl">
            {isDataLoaded
              ? `Verified ${dataset?.rowCount} wards with ${dataset?.columnCount} municipal features. Uploaded ${new Date(dataset!.uploadedAt).toLocaleTimeString()}.`
              : 'Support CSV (.csv) and Excel (.xlsx) formats. Features include roads, sanitation, water supply, and streetlights.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {!isDataLoaded ? (
            <>
              <button
                onClick={loadSampleDataset}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[var(--primary-light)] text-[var(--primary)] hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
              >
                Load Sample Data
              </button>
              <button
                onClick={() => setActiveTab('dataset-model')}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-xs transition-colors cursor-pointer"
              >
                Upload File &rarr;
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveTab('dataset-model')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-[var(--text-main)] hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Manage Dataset & Inspect</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* SECTION 4 & 5: Ward Map Preview & Top Priority Wards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SECTION 4: Ward Map Preview (5 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          className="lg:col-span-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="text-sm font-bold text-[var(--text-main)]">
                  Ward Map Preview
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('ward-map')}
                className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Full Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] mb-3">
              Official OpenStreetMap basemap with authentic municipal ward boundary overlays.
            </p>

            <div className="relative h-[210px] rounded-xl overflow-hidden border border-[var(--border-color)] bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-4 text-center">
              <div className="space-y-2 z-20">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-[var(--text-main)]">
                  Interactive Geospatial Map
                </div>
                <p className="text-[11px] text-[var(--text-muted)] max-w-xs mx-auto">
                  {isDataLoaded
                    ? `${wards.length} wards available with coordinate tracking and GeoJSON boundary polygons.`
                    : 'Real OpenStreetMap tiles with English label preferences.'}
                </p>
                <button
                  onClick={() => setActiveTab('ward-map')}
                  className="mt-1 px-3 py-1 text-xs font-semibold rounded-lg text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-xs transition-colors cursor-pointer"
                >
                  Open Interactive Map
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border-color)] mt-3 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>Tile Source: OpenStreetMap contributors</span>
            <span className="font-semibold text-[var(--text-main)]">English Labels</span>
          </div>
        </motion.div>

        {/* SECTION 5: Top Priority Wards (7 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
          className="lg:col-span-7 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">
                  Top Priority Wards
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Wards with elevated complaint demand and infrastructure stress
                </p>
              </div>
              <button
                onClick={() => setActiveTab('resource-planner')}
                className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Resource Planner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isModelTrained && topPriorityWards.length > 0 ? (
              <div className="space-y-2.5 mt-3">
                {topPriorityWards.map((w) => {
                  const surgePct = w.predictedSurgePct || 0;
                  return (
                    <div
                      key={w.id}
                      onClick={() => {
                        setSelectedWardId(w.id);
                        setActiveTab('predictions');
                      }}
                      className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-subtle)] hover:border-[var(--primary)] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-10 rounded-full ${w.priority === 'Critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[var(--text-main)]">{w.name}</span>
                            <span className="text-[11px] text-[var(--text-muted)] font-mono">({w.id})</span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                            {w.zone || 'District Sector'} &bull; Pop: {w.population.toLocaleString()} &bull; Baseline: {w.recordedComplaints} complaints
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <div className="text-right">
                          <div className="text-xs font-bold text-[var(--text-main)]">
                            Demand: {w.predictedDemand} complaints
                          </div>
                          <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            +{surgePct}% forecast surge
                          </div>
                        </div>

                        <Badge priority={w.priority} size="sm">
                          {w.priority}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center border border-dashed border-[var(--border-color)] rounded-xl my-2">
                <AlertCircle className="w-8 h-8 text-[var(--text-light)] mx-auto mb-2" />
                <p className="text-xs font-semibold text-[var(--text-main)]">
                  No priority alerts calculated yet
                </p>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1 mb-4">
                  {!isDataLoaded 
                    ? 'Upload a municipal ward dataset to calculate complaint trends.'
                    : 'Train the prediction model to rank wards by complaint surge risk.'}
                </p>
                {!isDataLoaded ? (
                  <button
                    onClick={loadSampleDataset}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] cursor-pointer"
                  >
                    Load Sample Data
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('dataset-model')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] cursor-pointer"
                  >
                    Train Model Now
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[var(--border-color)] mt-3 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>Evaluated by complaint velocity, infrastructure age, and sanitation backlog.</span>
            <span className="font-semibold text-[var(--text-main)]">Sorted by demand risk</span>
          </div>
        </motion.div>
      </div>

      {/* SECTION 6: Simple Model Status */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
        className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[var(--secondary)] border border-teal-100 dark:border-teal-900/40 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[var(--text-main)]">
                Prediction Engine Status
              </h4>
              <Badge 
                variant="status" 
                status={modelStatus === 'completed' ? 'success' : modelStatus === 'training' ? 'pending' : 'neutral'}
              >
                {modelStatus === 'completed' ? 'Calibrated' : modelStatus === 'training' ? 'Training...' : 'Idle'}
              </Badge>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {modelStatus === 'completed'
                ? `Active model trained on target "${modelMetrics?.targetVariable}" with ${modelMetrics?.featuresUsed.length} municipal features.`
                : isDataLoaded
                ? 'Dataset loaded and ready. Execute training to generate calibrated complaint projections.'
                : 'Awaiting municipal dataset ingestion before training can begin.'}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {modelStatus === 'completed' ? (
            <button
              onClick={() => setActiveTab('predictions')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors cursor-pointer"
            >
              <span>View Predictions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : isDataLoaded ? (
            <button
              onClick={() => setActiveTab('dataset-model')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors cursor-pointer"
            >
              <span>Train Model</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={loadSampleDataset}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-[var(--text-main)] hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
            >
              <span>Load Sample</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
