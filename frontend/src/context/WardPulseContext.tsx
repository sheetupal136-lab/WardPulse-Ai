import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { FeatureCollection } from 'geojson';
import type { 
  Theme, 
  NavigationTab, 
  DatasetInfo, 
  DatasetColumn, 
  ModelMetrics, 
  ModelTrainingStatus, 
  WardItem, 
  ResourcePlanItem,
  ChoroplethMode,
  GeoJsonMetadata,
  CurrentPrediction,
  DatasetRegistryItem
} from '../types';
import { SAMPLE_DISTRICT_GEOJSON } from '../data/sampleGeoJson';
import { validateGeoJson } from '../utils/geoJsonValidator';
import {
  uploadDatasetFile,
  getDatasetInfo as getDatasetInfoApi,
  trainModelApi,
  getTrainingStatusApi,
  predictWardApi,
  getResourceRankingApi,
  getDatasetRegistryApi,
  loadHackathonDatasetApi,
  joinComplaintsApi,
  getGeoJsonApi
} from '../api/ml';
import type { WardCoordinateBackend } from '../api/ml';

interface WardPulseContextType {
  theme: Theme;
  toggleTheme: () => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  dataset: DatasetInfo | null;
  datasetRegistry: DatasetRegistryItem[];
  selectedDatasetId: string;
  setSelectedDatasetId: (id: string) => void;
  datasetMode: 'ward_analysis' | 'complaint_prediction';
  candidateTargets: string[];
  hasValidComplaintTarget: boolean;
  targetValidationMessage: string | null;
  selectedTarget: string;
  setSelectedTarget: (target: string) => void;
  selectedAlgorithm: 'ridge' | 'random_forest' | 'gradient_boosting';
  setSelectedAlgorithm: (algo: 'ridge' | 'random_forest' | 'gradient_boosting') => void;
  loadSampleDataset: () => Promise<void>;
  loadHackathonDataset: (datasetId?: string) => Promise<{ success: boolean; message: string }>;
  joinComplaintHistory: () => Promise<{ success: boolean; message: string }>;
  loadOfficialGeoJson: () => Promise<void>;
  clearDataset: () => void;
  uploadFile: (file: File) => Promise<{ success: boolean; message: string }>;
  modelStatus: ModelTrainingStatus;
  trainingProgress: number;
  trainingError: string | null;
  modelMetrics: ModelMetrics | null;
  trainModel: (targetCol?: string, featureCols?: string[], algo?: 'ridge' | 'random_forest' | 'gradient_boosting') => Promise<{ success: boolean; message: string }>;
  currentPrediction: CurrentPrediction | null;
  isPredicting: boolean;
  predictionError: string | null;
  generatePrediction: (wardId: string, horizonMonths?: number) => Promise<{ success: boolean; message?: string }>;
  wards: WardItem[];
  selectedWardId: string | null;
  setSelectedWardId: (id: string | null) => void;
  selectedWard: WardItem | null;
  geoJsonData: FeatureCollection | null;
  geoJsonMeta: GeoJsonMetadata | null;
  uploadGeoJson: (file: File) => Promise<{ success: boolean; message: string }>;
  loadSampleGeoJson: () => void;
  clearGeoJson: () => void;
  choroplethMode: ChoroplethMode;
  setChoroplethMode: (mode: ChoroplethMode) => void;
  resourcePlans: ResourcePlanItem[];
  resourceRankingMethodology: string;
}

const WardPulseContext = createContext<WardPulseContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'wardpulse_theme_pref';

export const WardPulseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state persisted in localStorage
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Navigation state
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');

  // Dataset state
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [datasetRegistry, setDatasetRegistry] = useState<DatasetRegistryItem[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('hackathon_joined');
  const [datasetMode, setDatasetMode] = useState<'ward_analysis' | 'complaint_prediction'>('complaint_prediction');
  const [wardCoordinates, setWardCoordinates] = useState<WardCoordinateBackend[]>([]);
  const [candidateTargets, setCandidateTargets] = useState<string[]>([]);
  const [hasValidComplaintTarget, setHasValidComplaintTarget] = useState<boolean>(true);
  const [targetValidationMessage, setTargetValidationMessage] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<'ridge' | 'random_forest' | 'gradient_boosting'>('ridge');

  // Model training state
  const [modelStatus, setModelStatus] = useState<ModelTrainingStatus>('idle');
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);

  // Predictions state
  const [currentPrediction, setCurrentPrediction] = useState<CurrentPrediction | null>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // Selected ward
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);

  // GeoJSON state
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection | null>(null);
  const [geoJsonMeta, setGeoJsonMeta] = useState<GeoJsonMetadata | null>(null);
  const [choroplethMode, setChoroplethMode] = useState<ChoroplethMode>('prediction');

  // Resource planning state
  const [resourcePlans, setResourcePlans] = useState<ResourcePlanItem[]>([]);
  const [resourceRankingMethodology, setResourceRankingMethodology] = useState<string>('');

  // Helper to load official GeoJSON directly from backend
  const loadOfficialGeoJson = useCallback(async () => {
    try {
      const geo = await getGeoJsonApi();
      const validation = validateGeoJson(geo);
      if (validation.isValid && validation.data) {
        setGeoJsonData(validation.data);
        setGeoJsonMeta({
          fileName: 'wards.geojson',
          featureCount: validation.featureCount,
          polygonCount: validation.polygonCount,
          propertiesList: validation.propertiesList,
          bounds: validation.bounds,
          raw: validation.data
        });
      }
    } catch (err) {
      console.warn('Could not load official GeoJSON:', err);
    }
  }, []);

  // Initial backend check on mount
  const checkBackendState = useCallback(async () => {
    try {
      // 1. Fetch available datasets catalog from registry
      try {
        const regRes = await getDatasetRegistryApi();
        if (regRes && regRes.datasets) {
          setDatasetRegistry(regRes.datasets.map(d => ({
            id: d.id,
            name: d.name,
            description: d.description,
            source: d.source,
            fileName: d.file_name,
            rowCount: d.row_count,
            columnCount: d.column_count,
            hasComplaintTarget: d.has_complaint_target,
            mode: d.mode,
            availableFeatures: d.available_features,
            missingDataExplanation: d.missing_data_explanation
          })));
        }
      } catch (rErr) {
        console.warn('Initial registry sync:', rErr);
      }

      // 2. Fetch current dataset info if active
      try {
        const dsInfo = await getDatasetInfoApi();
        if (dsInfo && dsInfo.row_count > 0) {
          const mappedColumns: DatasetColumn[] = dsInfo.columns.map(c => ({
            name: c.name,
            type: c.type === 'number' ? 'number' : 'string',
            nonNullCount: c.non_null_count,
            nullCount: c.null_count,
            uniqueCount: c.unique_count,
            sampleValues: c.sample_values
          }));

          setDataset({
            name: dsInfo.filename,
            size: dsInfo.row_count * dsInfo.column_count * 8,
            rowCount: dsInfo.row_count,
            columnCount: dsInfo.column_count,
            columns: mappedColumns,
            uploadedAt: new Date().toISOString(),
            rows: dsInfo.preview_rows,
            mode: dsInfo.mode,
            source: dsInfo.source,
            datasetId: dsInfo.dataset_id,
            canJoinComplaints: dsInfo.can_join_complaints,
            missingDataExplanation: dsInfo.missing_data_explanation
          });

          if (dsInfo.ward_coordinates && dsInfo.ward_coordinates.length > 0) {
            setWardCoordinates(dsInfo.ward_coordinates);
          }

          setCandidateTargets(dsInfo.candidate_targets);
          setHasValidComplaintTarget(dsInfo.has_valid_complaint_target);
          setTargetValidationMessage(dsInfo.target_validation_message || null);
          setDatasetMode(dsInfo.mode === 'ward_analysis' ? 'ward_analysis' : 'complaint_prediction');

          if (dsInfo.candidate_targets.length > 0) {
            setSelectedTarget(dsInfo.candidate_targets[0]);
          }
        }
      } catch {
        // No dataset on backend yet, acceptable initial state
      }

      // 3. Automatically fetch official GeoJSON
      loadOfficialGeoJson();

      // 4. Check training status
      const statusRes = await getTrainingStatusApi();
      if (statusRes.is_trained && statusRes.metrics) {
        setModelStatus('completed');
        setModelMetrics({
          mae: statusRes.metrics.mae,
          rmse: statusRes.metrics.rmse,
          r2: statusRes.metrics.r2,
          accuracy: Math.round(statusRes.metrics.r2 * 100),
          trainedAt: statusRes.trained_at || new Date().toISOString(),
          targetVariable: statusRes.target_column || 'monthly_complaint_demand',
          featuresUsed: statusRes.features_used || [],
          featureImportances: statusRes.feature_importances || [],
          baselineMae: statusRes.metrics.baseline_mae,
          baselineRmse: statusRes.metrics.baseline_rmse,
          validationStrategy: statusRes.metrics.validation_strategy,
          testWardCount: statusRes.metrics.test_ward_count,
          sampleCount: statusRes.metrics.sample_count,
          modelName: statusRes.model_name
        });

        // Load genuine resource ranking
        try {
          const rankRes = await getResourceRankingApi();
          setResourcePlans(rankRes.items.map(it => ({
            rank: it.rank,
            wardId: it.ward_id,
            wardName: it.ward_name,
            zone: it.zone,
            priority: it.priority,
            population: it.population,
            recordedComplaints: it.recorded_complaints,
            predictedDemand: it.predicted_demand,
            uncertainty: it.uncertainty_bounds,
            inspectionAction: it.inspection_directive,
            actionSummary: it.priority === 'Critical' ? 'Immediate inter-agency dispatch' : 'Scheduled patrol'
          })));
          setResourceRankingMethodology(rankRes.ranking_methodology);
        } catch {
          // Ranking not loaded yet
        }
      }
    } catch (err) {
      console.warn('Initial backend sync:', err);
    }
  }, [loadOfficialGeoJson]);

  useEffect(() => {
    checkBackendState();
  }, [checkBackendState]);

  // Upload file via backend
  const uploadFile = async (file: File): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await uploadDatasetFile(file);
      const mappedColumns: DatasetColumn[] = res.columns.map(c => ({
        name: c.name,
        type: c.type === 'number' ? 'number' : 'string',
        nonNullCount: c.non_null_count,
        nullCount: c.null_count,
        uniqueCount: c.unique_count,
        sampleValues: c.sample_values
      }));

      setDataset({
        name: res.filename,
        size: file.size,
        rowCount: res.row_count,
        columnCount: res.column_count,
        columns: mappedColumns,
        uploadedAt: new Date().toISOString(),
        rows: res.preview_rows
      });

      setCandidateTargets(res.candidate_targets);
      setHasValidComplaintTarget(res.has_valid_complaint_target);
      setTargetValidationMessage(res.target_validation_message || null);
      if (res.candidate_targets.length > 0) {
        setSelectedTarget(res.candidate_targets[0]);
      } else {
        setSelectedTarget('');
      }

      setModelStatus('idle');
      setModelMetrics(null);
      setCurrentPrediction(null);
      setResourcePlans([]);

      if (!res.has_valid_complaint_target) {
        return {
          success: false,
          message: res.target_validation_message || 'Uploaded file contains no legitimate complaint demand target column.'
        };
      }

      return {
        success: true,
        message: `Successfully uploaded ${res.row_count} records. Detected target: ${res.candidate_targets.join(', ')}.`
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to upload dataset.'
      };
    }
  };

  // Load Hackathon Dataset directly without file upload
  const loadHackathonDataset = async (datasetId: string = 'hackathon_joined'): Promise<{ success: boolean; message: string }> => {
    try {
      setSelectedDatasetId(datasetId);
      const res = await loadHackathonDatasetApi(datasetId);
      const mappedColumns: DatasetColumn[] = res.columns.map(c => ({
        name: c.name,
        type: c.type === 'number' ? 'number' : 'string',
        nonNullCount: c.non_null_count,
        nullCount: c.null_count,
        uniqueCount: c.unique_count,
        sampleValues: c.sample_values
      }));

      setDataset({
        name: res.filename,
        size: res.row_count * res.column_count * 8,
        rowCount: res.row_count,
        columnCount: res.column_count,
        columns: mappedColumns,
        uploadedAt: new Date().toISOString(),
        rows: res.preview_rows,
        mode: res.mode,
        source: res.source,
        datasetId: res.dataset_id,
        canJoinComplaints: res.can_join_complaints,
        missingDataExplanation: res.missing_data_explanation
      });

      if (res.ward_coordinates && res.ward_coordinates.length > 0) {
        setWardCoordinates(res.ward_coordinates);
      }

      setCandidateTargets(res.candidate_targets);
      setHasValidComplaintTarget(res.has_valid_complaint_target);
      setTargetValidationMessage(res.target_validation_message || null);

      const newMode = res.mode === 'ward_analysis' ? 'ward_analysis' : 'complaint_prediction';
      setDatasetMode(newMode);

      if (newMode === 'complaint_prediction') {
        setSelectedTarget(res.candidate_targets[0] || 'monthly_complaint_demand');
      } else {
        setSelectedTarget('');
        setModelStatus('idle');
        setModelMetrics(null);
        setCurrentPrediction(null);
        setResourcePlans([]);
      }

      // Automatically load official GeoJSON boundaries onto the map
      loadOfficialGeoJson();

      const successMsg = newMode === 'ward_analysis'
        ? `Loaded ${res.filename} (${res.row_count} wards). Ward Analysis Mode is active.`
        : `Loaded ${res.filename} (${res.row_count} wards with verified complaints). Ready for training.`;

      return { success: true, message: successMsg };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to load hackathon dataset.' };
    }
  };

  // Join complaint history with ward features on ward_id
  const joinComplaintHistory = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await joinComplaintsApi();
      const mappedColumns: DatasetColumn[] = res.columns.map(c => ({
        name: c.name,
        type: c.type === 'number' ? 'number' : 'string',
        nonNullCount: c.non_null_count,
        nullCount: c.null_count,
        uniqueCount: c.unique_count,
        sampleValues: c.sample_values
      }));

      setDataset({
        name: res.filename,
        size: res.row_count * res.column_count * 8,
        rowCount: res.row_count,
        columnCount: res.column_count,
        columns: mappedColumns,
        uploadedAt: new Date().toISOString(),
        rows: res.preview_rows,
        mode: res.mode,
        source: res.source,
        datasetId: res.dataset_id,
        canJoinComplaints: false,
        missingDataExplanation: undefined
      });

      if (res.ward_coordinates && res.ward_coordinates.length > 0) {
        setWardCoordinates(res.ward_coordinates);
      }

      setCandidateTargets(res.candidate_targets);
      setHasValidComplaintTarget(true);
      setTargetValidationMessage(null);
      setDatasetMode('complaint_prediction');
      setSelectedDatasetId('hackathon_joined');
      setSelectedTarget(res.candidate_targets[0] || 'monthly_complaint_demand');
      setModelStatus('idle');
      setModelMetrics(null);
      setCurrentPrediction(null);

      loadOfficialGeoJson();

      return {
        success: true,
        message: `Successfully joined ${res.row_count} wards with 556,561 complaint records on ward_id. Complaint Prediction Mode is enabled!`
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to join complaint history.' };
    }
  };

  // Load benchmark dataset (backward compatibility)
  const loadSampleDataset = async () => {
    await loadHackathonDataset('hackathon_joined');
  };

  const clearDataset = () => {
    setDataset(null);
    setCandidateTargets([]);
    setHasValidComplaintTarget(true);
    setTargetValidationMessage(null);
    setSelectedTarget('');
    setModelStatus('idle');
    setModelMetrics(null);
    setSelectedWardId(null);
    setCurrentPrediction(null);
    setResourcePlans([]);
  };

  // GeoJSON Handling with Validation
  const uploadGeoJson = async (file: File): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const validation = validateGeoJson(content);
          if (validation.isValid && validation.data) {
            setGeoJsonData(validation.data);
            setGeoJsonMeta({
              fileName: file.name,
              featureCount: validation.featureCount,
              polygonCount: validation.polygonCount,
              propertiesList: validation.propertiesList,
              bounds: validation.bounds,
              raw: validation.data
            });
            resolve({ 
              success: true, 
              message: `Valid GeoJSON: Verified ${validation.featureCount} ward boundary polygons.` 
            });
          } else {
            resolve({ success: false, message: validation.error || 'Failed GeoJSON validation.' });
          }
        } catch (err: any) {
          resolve({ success: false, message: `Invalid JSON syntax: ${err.message}` });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, message: 'Could not read GeoJSON file.' });
      };
      reader.readAsText(file);
    });
  };

  const loadSampleGeoJson = () => {
    const validation = validateGeoJson(SAMPLE_DISTRICT_GEOJSON);
    if (validation.isValid && validation.data) {
      setGeoJsonData(validation.data);
      setGeoJsonMeta({
        fileName: 'city_municipal_wards.geojson',
        featureCount: validation.featureCount,
        polygonCount: validation.polygonCount,
        propertiesList: validation.propertiesList,
        bounds: validation.bounds,
        raw: validation.data
      });
    }
  };

  const clearGeoJson = () => {
    setGeoJsonData(null);
    setGeoJsonMeta(null);
  };

  // Real Backend Model Training
  const trainModel = async (
    targetCol?: string, 
    featureCols?: string[], 
    algo?: 'ridge' | 'random_forest' | 'gradient_boosting'
  ): Promise<{ success: boolean; message: string }> => {
    const target = targetCol || selectedTarget;
    if (!target) {
      return { success: false, message: 'No target column selected. Please select a valid civic complaint target.' };
    }

    if (!hasValidComplaintTarget) {
      return { success: false, message: targetValidationMessage || 'Cannot train model: No valid complaint demand target exists.' };
    }

    setModelStatus('training');
    setTrainingProgress(20);
    setTrainingError(null);

    try {
      setTrainingProgress(45);
      const res = await trainModelApi({
        target_column: target,
        feature_columns: featureCols,
        algorithm: algo || selectedAlgorithm,
        test_size: 0.2
      });

      setTrainingProgress(85);

      if (res.success && res.metrics) {
        setModelMetrics({
          mae: res.metrics.mae,
          rmse: res.metrics.rmse,
          r2: res.metrics.r2,
          accuracy: Math.round(res.metrics.r2 * 100),
          trainedAt: res.trained_at,
          targetVariable: res.target_column,
          featuresUsed: res.features_used,
          featureImportances: res.feature_importances,
          baselineMae: res.metrics.baseline_mae,
          baselineRmse: res.metrics.baseline_rmse,
          validationStrategy: res.metrics.validation_strategy,
          testWardCount: res.metrics.test_ward_count,
          sampleCount: res.metrics.sample_count,
          modelName: res.model_name
        });

        // Fetch refreshed genuine resource ranking
        try {
          const rankRes = await getResourceRankingApi();
          setResourcePlans(rankRes.items.map(it => ({
            rank: it.rank,
            wardId: it.ward_id,
            wardName: it.ward_name,
            zone: it.zone,
            priority: it.priority,
            population: it.population,
            recordedComplaints: it.recorded_complaints,
            predictedDemand: it.predicted_demand,
            uncertainty: it.uncertainty_bounds,
            inspectionAction: it.inspection_directive,
            actionSummary: it.priority === 'Critical' ? 'Immediate inter-agency dispatch' : 'Scheduled patrol'
          })));
          setResourceRankingMethodology(rankRes.ranking_methodology);
        } catch (rErr) {
          console.warn('Ranking refresh error:', rErr);
        }

        setTrainingProgress(100);
        setModelStatus('completed');
        return { success: true, message: res.message };
      } else {
        throw new Error(res.message || 'Training returned without validation metrics.');
      }
    } catch (err: any) {
      setModelStatus('error');
      setTrainingError(err.message || 'Model training failed.');
      return { success: false, message: err.message || 'Model training failed.' };
    }
  };

  // Real Backend Prediction Inference
  const generatePrediction = async (wardId: string, horizonMonths: number = 1): Promise<{ success: boolean; message?: string }> => {
    if (modelStatus !== 'completed') {
      const msg = 'Train a model before generating predictions.';
      setPredictionError(msg);
      return { success: false, message: msg };
    }

    setIsPredicting(true);
    setPredictionError(null);

    try {
      const res = await predictWardApi({
        ward_id: wardId,
        horizon_months: horizonMonths
      });

      setCurrentPrediction({
        wardId: res.ward_id,
        wardName: res.ward_name,
        zone: res.zone,
        population: res.population,
        predictedDemand: res.predicted_demand,
        baselineDemand: res.baseline_demand ?? null,
        diff: res.diff ?? null,
        pctChange: res.pct_change ?? null,
        confidenceInterval: res.confidence_interval,
        modelName: res.model_name,
        targetColumn: res.target_column,
        featuresUsed: res.features_used,
        topDrivingFeatures: res.top_driving_features,
        predictedAt: res.predicted_at
      });

      setSelectedWardId(res.ward_id);
      setIsPredicting(false);
      return { success: true };
    } catch (err: any) {
      setIsPredicting(false);
      const errMsg = err.message || 'Inference failed on backend.';
      setPredictionError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  // Derive Wards List from Dataset and Predictions
  const wards = useMemo<WardItem[]>(() => {
    // If wardCoordinates are available, use all 198 authentic wards
    if (wardCoordinates.length > 0) {
      return wardCoordinates.map((wc, index) => {
        const id = String(wc.ward_id || index + 1);
        const name = wc.ward_name || `Ward ${id}`;
        const zone = wc.zone || 'BBMP Ward';
        const population = wc.population || 50000;

        const matchedRow = dataset?.rows.find(r => String(r.ward_id ?? r.id) === id);
        const recorded = matchedRow 
          ? Number(matchedRow.recorded_complaints ?? matchedRow.monthly_complaint_demand ?? matchedRow.total_complaints ?? 0)
          : 0;

        const matchingPlan = resourcePlans.find(p => p.wardId === id);

        return {
          id,
          name,
          zone,
          population,
          recordedComplaints: recorded,
          predictedDemand: matchingPlan ? matchingPlan.predictedDemand : null,
          predictedSurgePct: (matchingPlan && recorded > 0) 
            ? Math.round(((matchingPlan.predictedDemand - recorded) / recorded) * 100) 
            : null,
          uncertaintyRange: null,
          confidenceScore: modelMetrics ? Math.round(modelMetrics.r2 * 100) : null,
          priority: matchingPlan ? matchingPlan.priority : null,
          riskFactors: matchingPlan ? [matchingPlan.actionSummary] : [],
          inspectionAction: matchingPlan ? matchingPlan.inspectionAction : null,
          coordinates: [wc.lat, wc.lon] as [number, number]
        };
      });
    }

    if (!dataset || dataset.rows.length === 0) return [];

    return dataset.rows.map((row, index) => {
      const id = String(row.ward_id ?? row.id ?? row.ward_code ?? (index + 1));
      const name = String(row.ward_name ?? row.name ?? row.ward ?? `Ward ${id}`);
      const zone = row.zone || row.bbmp_zone_name || row.district || undefined;
      const population = Number(row.population || row.population_2011 || 50000);
      const recorded = Number(row.recorded_complaints ?? row.monthly_complaint_demand ?? row.total_complaints ?? 0);

      // Extract real coordinates if present
      let coordinates: [number, number] | null = null;
      const lat = row.latitude ?? row.centroid_lat ?? row.lat;
      const lng = row.longitude ?? row.centroid_lon ?? row.lng ?? row.lon;
      if (lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
        coordinates = [Number(lat), Number(lng)];
      }

      // Match with resource plan if model is completed
      const matchingPlan = resourcePlans.find(p => p.wardId === id);

      return {
        id,
        name,
        zone,
        population,
        recordedComplaints: recorded,
        predictedDemand: matchingPlan ? matchingPlan.predictedDemand : null,
        predictedSurgePct: (matchingPlan && recorded > 0) 
          ? Math.round(((matchingPlan.predictedDemand - recorded) / recorded) * 100) 
          : null,
        uncertaintyRange: null,
        confidenceScore: modelMetrics ? Math.round(modelMetrics.r2 * 100) : null,
        priority: matchingPlan ? matchingPlan.priority : null,
        riskFactors: matchingPlan ? [matchingPlan.actionSummary] : [],
        inspectionAction: matchingPlan ? matchingPlan.inspectionAction : null,
        coordinates
      };
    });
  }, [dataset, wardCoordinates, modelMetrics, resourcePlans]);

  const selectedWard = useMemo(() => {
    if (!selectedWardId) return wards[0] || null;
    return wards.find(w => w.id === selectedWardId) || wards[0] || null;
  }, [wards, selectedWardId]);

  return (
    <WardPulseContext.Provider
      value={{
        theme,
        toggleTheme,
        activeTab,
        setActiveTab,
        dataset,
        datasetRegistry,
        selectedDatasetId,
        setSelectedDatasetId,
        datasetMode,
        candidateTargets,
        hasValidComplaintTarget,
        targetValidationMessage,
        selectedTarget,
        setSelectedTarget,
        selectedAlgorithm,
        setSelectedAlgorithm,
        loadSampleDataset,
        loadHackathonDataset,
        joinComplaintHistory,
        loadOfficialGeoJson,
        clearDataset,
        uploadFile,
        modelStatus,
        trainingProgress,
        trainingError,
        modelMetrics,
        trainModel,
        currentPrediction,
        isPredicting,
        predictionError,
        generatePrediction,
        wards,
        selectedWardId,
        setSelectedWardId,
        selectedWard,
        geoJsonData,
        geoJsonMeta,
        uploadGeoJson,
        loadSampleGeoJson,
        clearGeoJson,
        choroplethMode,
        setChoroplethMode,
        resourcePlans,
        resourceRankingMethodology
      }}
    >
      {children}
    </WardPulseContext.Provider>
  );
};

export const useWardPulse = (): WardPulseContextType => {
  const context = useContext(WardPulseContext);
  if (!context) {
    throw new Error('useWardPulse must be used within a WardPulseProvider');
  }
  return context;
};
