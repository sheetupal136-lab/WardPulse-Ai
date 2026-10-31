import React, { useState } from 'react';
import { 
  Cpu, 
  ArrowRight, 
  Building2, 
  Sparkles, 
  RotateCw, 
  AlertCircle, 
  MapPin, 
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useWardPulse } from '../context/WardPulseContext';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { PredictedComplaintCategories } from '../components/predictions/PredictedComplaintCategories';

export const PredictionsView: React.FC = () => {
  const { 
    wards, 
    selectedWardId, 
    setSelectedWardId, 
    selectedWard, 
    dataset, 
    modelStatus, 
    modelMetrics, 
    currentPrediction,
    isPredicting,
    predictionError,
    generatePrediction,
    setActiveTab,
    loadHackathonDataset
  } = useWardPulse();

  const [horizonMonths, setHorizonMonths] = useState<number>(1);

  const isDataLoaded = Boolean(dataset && dataset.rowCount > 0);
  const isModelTrained = modelStatus === 'completed' && Boolean(modelMetrics);

  if (!isDataLoaded) {
    return (
      <EmptyState
        icon={Cpu}
        title="No Municipal Dataset Loaded"
        description="To generate civic complaint demand predictions, load the pre-bundled hackathon dataset or upload custom municipal records."
        primaryAction={{
          label: 'Load Hackathon Dataset',
          onClick: () => loadHackathonDataset('hackathon_joined')
        }}
        secondaryAction={{
          label: 'Go to Dataset & Model',
          onClick: () => setActiveTab('dataset-model')
        }}
      />
    );
  }


  if (!isModelTrained) {
    return (
      <EmptyState
        icon={Cpu}
        title="Train a model before generating predictions."
        description="A machine learning regression model must be trained on a legitimate complaint target before generating ward demand forecasts. Please complete Stage 2 in Dataset & Model."
        primaryAction={{
          label: 'Train Model in Dataset Studio',
          onClick: () => setActiveTab('dataset-model')
        }}
      />
    );
  }

  const activeWardId = selectedWardId || (wards[0] ? wards[0].id : '');
  const activeWard = selectedWard || wards[0];

  const handleGenerate = async () => {
    if (!activeWardId) return;
    await generatePrediction(activeWardId, horizonMonths);
  };

  return (
    <div className="space-y-6">
      {/* Interactive Prediction Controls Card */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                INFERENCE WORKFLOW
              </span>
              <h2 className="text-base font-bold text-[var(--text-main)]">
                Civic Complaint Demand Prediction
              </h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Active Model: <span className="font-semibold text-[var(--text-main)]">{modelMetrics?.modelName || 'Calibrated Regressor'}</span> &bull; Target: <span className="font-mono text-[var(--primary)] font-semibold">{modelMetrics?.targetVariable}</span>
            </p>
          </div>

          <Badge variant="status" status="success">Model Trained & Active</Badge>
        </div>

        {/* Selection Form */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          {/* Ward Selector */}
          <div className="sm:col-span-6">
            <label className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5 mb-1">
              <Building2 className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Select Municipal Target Ward</span>
            </label>
            <select
              value={activeWardId}
              onChange={(e) => setSelectedWardId(e.target.value)}
              disabled={isPredicting}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
            >
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} (ID: {w.id}) - {w.zone || 'Metropolitan'}
                </option>
              ))}
            </select>
          </div>

          {/* Horizon Selector */}
          <div className="sm:col-span-3">
            <label className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Forecast Horizon</span>
            </label>
            <select
              value={horizonMonths}
              onChange={(e) => setHorizonMonths(Number(e.target.value))}
              disabled={isPredicting}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
            >
              <option value={1}>1 Month (30 Days)</option>
              <option value={2}>2 Months (60 Days)</option>
              <option value={3}>3 Months (Quarterly)</option>
            </select>
          </div>

          {/* Generate Button */}
          <div className="sm:col-span-3">
            <button
              onClick={handleGenerate}
              disabled={isPredicting || !activeWardId}
              className="w-full px-4 py-2 text-xs font-bold rounded-lg text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              {isPredicting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Running Inference...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Prediction</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real Backend Error display */}
        {predictionError && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{predictionError}</span>
          </div>
        )}
      </motion.div>

      {/* Inference Results Display: Shown only after successful inference */}
      {currentPrediction ? (
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Core Metric Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary Demand Forecast Card */}
            <div className="lg:col-span-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
                  <div>
                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                      {horizonMonths}-Month Forecasted Complaint Demand
                    </span>
                    <div className="flex items-baseline gap-3 mt-1">
                      <span className="text-4xl font-extrabold text-[var(--text-main)] tracking-tight">
                        {currentPrediction.predictedDemand}
                      </span>
                      <span className="text-sm font-medium text-[var(--text-muted)]">
                        predicted complaints
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-[var(--text-muted)] block">Selected Ward</span>
                    <span className="font-bold text-xs text-[var(--text-main)]">
                      {currentPrediction.wardName} ({currentPrediction.wardId})
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] block font-mono">
                      Zone: {currentPrediction.zone}
                    </span>
                  </div>
                </div>

                {/* Demand Comparison with Baseline */}
                <div className="py-5 space-y-4">
                  {currentPrediction.baselineDemand !== null && currentPrediction.diff !== null ? (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-[var(--text-main)]">Comparison vs Historical Baseline</span>
                        <span className={`font-bold ${
                          (currentPrediction.pctChange ?? 0) > 10 
                            ? 'text-amber-600 dark:text-amber-400' 
                            : (currentPrediction.pctChange ?? 0) < -10
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-[var(--text-main)]'
                        }`}>
                          {currentPrediction.diff > 0 ? `+${currentPrediction.diff}` : `${currentPrediction.diff}`} complaints ({currentPrediction.pctChange ?? 0}%)
                        </span>
                      </div>
                      
                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, Math.round((currentPrediction.predictedDemand / Math.max(1, (currentPrediction.baselineDemand || 1) * 1.5)) * 100))}%` }}
                          className="h-full bg-[var(--primary)] transition-all duration-500"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mt-1.5">
                        <span>Historical Recorded Average: {currentPrediction.baselineDemand} complaints</span>
                        <span>Model Projection: {currentPrediction.predictedDemand} complaints</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-muted)]">
                      No prior historical baseline complaints recorded for this ward (Spatial Cold-Start Ward). Prediction is generated entirely from infrastructure and demographic attributes.
                    </div>
                  )}

                  {/* Uncertainty & Model Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-subtle)]">
                      <span className="text-[11px] text-[var(--text-muted)] font-medium">95% Confidence Interval</span>
                      <div className="text-base font-bold text-[var(--text-main)] mt-0.5">
                        [{currentPrediction.confidenceInterval[0]} - {currentPrediction.confidenceInterval[1]}]
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">
                        Computed via validation residual standard error (±1.96 &sigma;)
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-subtle)]">
                      <span className="text-[11px] text-[var(--text-muted)] font-medium">Model Pipeline</span>
                      <div className="text-base font-bold text-[var(--primary)] mt-0.5 truncate">
                        {currentPrediction.modelName}
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1 truncate">
                        Trained on {modelMetrics?.testWardCount ?? 32} test wards &bull; R²: {modelMetrics?.r2}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between text-xs gap-2">
                <span className="text-[var(--text-muted)]">
                  Citizen Population: <strong>{currentPrediction.population.toLocaleString()}</strong> &bull; Generated: {new Date(currentPrediction.predictedAt).toLocaleTimeString()}
                </span>
                <button
                  onClick={() => setActiveTab('ward-map')}
                  className="text-[var(--primary)] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Highlight on Geospatial Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Feature Impact & Driving Factors Card */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-main)]">
                      Feature Explanations
                    </h3>
                    <span className="text-[10px] text-[var(--text-muted)]">Top features driving this forecast</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {currentPrediction.topDrivingFeatures.map((df, i) => (
                    <div key={i} className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-semibold text-[var(--text-main)]">{df.feature}</span>
                        <span className="text-[var(--primary)] font-bold">{df.value.toLocaleString()}</span>
                      </div>
                      <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
                        {df.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-color)] mt-4">
                <button
                  onClick={() => setActiveTab('resource-planner')}
                  className="w-full py-2 text-xs font-semibold rounded-lg text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>View in Resource Planner</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* SECTION: Predicted Complaint Categories */}
          <div className="pt-4">
            <PredictedComplaintCategories />
          </div>
        </motion.div>
      ) : (
        /* Empty State before prediction is generated */
        <div className="p-10 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[var(--primary)] flex items-center justify-center mx-auto mb-3 border border-blue-100 dark:border-blue-900/40">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-main)]">
            Ready to Generate Inference for {activeWard?.name || 'Selected Ward'}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-md mx-auto">
            Click <strong>Generate Prediction</strong> above to dispatch this ward's attributes to the backend machine learning pipeline and compute actual complaint demand.
          </p>
        </div>
      )}
    </div>
  );
};
