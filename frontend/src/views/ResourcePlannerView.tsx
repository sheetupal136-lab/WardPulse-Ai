import React, { useState } from 'react';
import { 
  Layers, 
  AlertTriangle, 
  Download, 
  Search, 
  ChevronRight,
  Info,
  CheckCircle2,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useWardPulse } from '../context/WardPulseContext';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

export const ResourcePlannerView: React.FC = () => {
  const { 
    resourcePlans, 
    dataset, 
    modelStatus, 
    resourceRankingMethodology,
    setSelectedWardId, 
    setActiveTab, 
    loadSampleDataset 
  } = useWardPulse();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const isDataLoaded = Boolean(dataset && dataset.rows.length > 0);
  const isModelTrained = modelStatus === 'completed';

  if (!isDataLoaded) {
    return (
      <EmptyState
        icon={Layers}
        title="Municipal Resource Planning Awaiting Dataset"
        description="To generate prioritized ward inspection schedules, please upload a municipal complaint dataset or explore with the benchmark civic sample."
        primaryAction={{
          label: 'Load Municipal Sample Dataset',
          onClick: loadSampleDataset
        }}
        secondaryAction={{
          label: 'Go to Dataset Upload',
          onClick: () => setActiveTab('dataset-model')
        }}
      />
    );
  }

  if (!isModelTrained) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Resource Planning Requires Model Training"
        description="Priority rankings, predicted complaint demand, and uncertainty margins are computed dynamically from model forecasts. Please train the model in the Dataset & Model tab."
        primaryAction={{
          label: 'Train Prediction Model Now',
          onClick: () => setActiveTab('dataset-model')
        }}
      />
    );
  }

  // Filtered resource plans
  const filteredPlans = resourcePlans.filter(p => {
    const matchesSearch = 
      p.wardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.wardId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.zone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = 
      selectedPriority === 'all' || 
      p.priority.toLowerCase() === selectedPriority.toLowerCase();

    return matchesSearch && matchesPriority;
  });

  // Calculate summary stats
  const criticalCount = resourcePlans.filter(p => p.priority === 'Critical').length;
  const elevatedCount = resourcePlans.filter(p => p.priority === 'Elevated').length;
  const totalDemand = resourcePlans.reduce((acc, p) => acc + p.predictedDemand, 0);
  const totalRecorded = resourcePlans.reduce((acc, p) => acc + p.recordedComplaints, 0);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Rank', 
      'Ward_ID', 
      'Ward_Name', 
      'Zone', 
      'Priority', 
      'Population', 
      'Recorded_Complaints', 
      'Predicted_Demand', 
      'Uncertainty_Bounds', 
      'Inspection_Action'
    ];
    
    const rows = resourcePlans.map(p => [
      p.rank,
      p.wardId,
      `"${p.wardName}"`,
      `"${p.zone}"`,
      p.priority,
      p.population,
      p.recordedComplaints,
      p.predictedDemand,
      `"${p.uncertainty}"`,
      `"${p.inspectionAction}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wardpulse_inspection_plan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Simple User Guidance */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-xs"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
              Municipal Inspection Allocation
            </span>
            <h2 className="text-lg font-bold text-[var(--text-main)] mt-0.5">
              Ward Priority & Resource Planning
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Ranks municipal wards by forecast complaint demand and schedules targeted inspection operations.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-[var(--bg-card-subtle)] px-3 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)]">
            <Info className="w-4 h-4 text-[var(--primary)] shrink-0" />
            <span>Rankings update dynamically based on model predictions and complaint velocity.</span>
          </div>
        </div>

        {/* 4 Explanatory Points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--border-color)] text-xs">
          <div>
            <span className="font-semibold text-[var(--text-main)] block">What this page does:</span>
            <span className="text-[var(--text-muted)]">Translates statistical predictions into actionable inspection tasks.</span>
          </div>
          <div>
            <span className="font-semibold text-[var(--text-main)] block">Required information:</span>
            <span className="text-[var(--text-muted)]">Completed model training from the Dataset & Model tab.</span>
          </div>
          <div>
            <span className="font-semibold text-[var(--text-main)] block">Next recommended step:</span>
            <span className="text-[var(--text-muted)]">Export the inspection CSV and dispatch field teams to Critical wards.</span>
          </div>
          <div>
            <span className="font-semibold text-[var(--text-main)] block">What results mean:</span>
            <span className="text-[var(--text-muted)]">Higher ranks signal imminent infrastructure strain needing prompt repairs.</span>
          </div>
        </div>
      </motion.div>

      {/* Summary Allocation Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">
              Critical Priority Wards
            </span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {criticalCount} Wards
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Require immediate inter-agency dispatch</p>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">
              Elevated Attention
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {elevatedCount} Wards
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Scheduled for 48h priority inspection</p>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">
              Total Projected Demand
            </span>
            <Layers className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-main)] mt-1">
            {totalDemand.toLocaleString()}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">vs {totalRecorded.toLocaleString()} currently recorded</p>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">
              Directive Status
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            Ready to Deploy
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">All action directives calibrated</p>
        </div>
      </motion.div>

      {/* Main Table Card */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-xs"
      >
        {/* Controls Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)] mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-main)]">
              Prioritized Municipal Inspection Roster
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Ranked by predicted complaint demand, surge probability, and localized infrastructure risk factors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search ward or zone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="elevated">Elevated</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Ranking Methodology Explanation */}
        {resourceRankingMethodology && (
          <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-main)] flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-[var(--primary)] shrink-0" />
            <span><strong>Ranking Methodology:</strong> {resourceRankingMethodology}</span>
          </div>
        )}

        {/* Priority Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[11px] bg-[var(--bg-card-subtle)]">
                <th className="py-2.5 px-3 text-center w-12">Rank</th>
                <th className="py-2.5 px-3">Ward Details</th>
                <th className="py-2.5 px-3">Priority Level</th>
                <th className="py-2.5 px-3">Citizen Population</th>
                <th className="py-2.5 px-3">Recorded Complaints</th>
                <th className="py-2.5 px-3">Predicted Demand</th>
                <th className="py-2.5 px-3">Uncertainty Bounds</th>
                <th className="py-2.5 px-3 min-w-[280px]">Municipal Inspection Directive</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredPlans.length > 0 ? (
                filteredPlans.map((plan) => {
                  const surgeDelta = plan.predictedDemand - plan.recordedComplaints;
                  const surgePct = Math.round((surgeDelta / Math.max(1, plan.recordedComplaints)) * 100);

                  return (
                    <tr key={plan.wardId} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-xs text-[var(--text-main)]">
                        #{plan.rank}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-xs text-[var(--text-main)]">{plan.wardName}</div>
                        <div className="text-[11px] text-[var(--text-muted)] font-mono">
                          {plan.wardId} · {plan.zone}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge priority={plan.priority} size="sm">
                          {plan.priority}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-medium text-[var(--text-main)]">
                        {plan.population.toLocaleString()}
                        <div className="text-[10px] text-[var(--text-muted)]">citizens</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-[var(--text-main)]">
                          {plan.recordedComplaints}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">logged tickets</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-xs text-[var(--text-main)]">
                          {plan.predictedDemand}
                        </div>
                        <div className={`text-[10px] font-semibold ${
                          surgePct > 15 
                            ? 'text-red-600 dark:text-red-400' 
                            : surgePct > 0 
                              ? 'text-amber-600 dark:text-amber-400' 
                              : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {surgeDelta > 0 ? `+${surgeDelta} (+${surgePct}%)` : `${surgeDelta} (${surgePct}%)`}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[var(--text-muted)]">
                        {plan.uncertainty}
                      </td>
                      <td className="py-3 px-3">
                        <div className="p-2 rounded-md bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-[11px] text-[var(--text-main)] leading-relaxed">
                          {plan.inspectionAction}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedWardId(plan.wardId);
                            setActiveTab('predictions');
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors cursor-pointer"
                          title="Open detailed prediction for this ward"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-[var(--text-muted)]">
                    No municipal wards match your search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-[var(--border-color)] mt-4 flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] gap-2">
          <span>Uncertainty margins calculated from validated Mean Absolute Error (MAE) confidence intervals.</span>
          <div className="flex items-center gap-3">
            <span>Showing {filteredPlans.length} of {resourcePlans.length} wards</span>
            <button
              onClick={() => setActiveTab('ward-map')}
              className="inline-flex items-center gap-1 font-semibold text-[var(--primary)] hover:underline cursor-pointer"
            >
              <span>View On Geospatial Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};