import type { FeatureCollection } from 'geojson';

export type Theme = 'light' | 'dark';

export type NavigationTab = 
  | 'overview' 
  | 'ward-map' 
  | 'predictions' 
  | 'dataset-model' 
  | 'resource-planner';

export type ColumnType = 'number' | 'string' | 'date' | 'boolean';

export type ChoroplethMode = 'prediction' | 'demand' | 'boundaries';

export interface DatasetColumn {
  name: string;
  type: ColumnType;
  nonNullCount: number;
  nullCount: number;
  uniqueCount: number;
  sampleValues: (string | number)[];
}

export interface DatasetInfo {
  name: string;
  size: number;
  rowCount: number;
  columnCount: number;
  columns: DatasetColumn[];
  uploadedAt: string;
  rows: Record<string, any>[];
  mode?: 'ward_analysis' | 'complaint_prediction' | 'grievance_logs';
  source?: string;
  datasetId?: string;
  canJoinComplaints?: boolean;
  missingDataExplanation?: string;
}

export interface DatasetRegistryItem {
  id: string;
  name: string;
  description: string;
  source: string;
  fileName: string;
  rowCount: number;
  columnCount: number;
  hasComplaintTarget: boolean;
  mode: 'ward_analysis' | 'complaint_prediction' | 'grievance_logs' | 'spatial_geometry';
  availableFeatures: string[];
  missingDataExplanation?: string;
  isAvailable?: boolean;
}

export interface FeatureImportance {
  feature: string;
  importance: number; // 0 to 1
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  r2: number;
  accuracy: number;
  trainedAt: string;
  targetVariable: string;
  featuresUsed: string[];
  featureImportances: FeatureImportance[];
  epochsTrained?: number;
  baselineMae?: number;
  baselineRmse?: number;
  validationStrategy?: string;
  testWardCount?: number;
  sampleCount?: number;
  modelName?: string;
}

export interface CurrentPrediction {
  wardId: string;
  wardName: string;
  zone: string;
  population: number;
  predictedDemand: number;
  baselineDemand: number | null;
  diff: number | null;
  pctChange: number | null;
  confidenceInterval: [number, number];
  modelName: string;
  targetColumn: string;
  featuresUsed: string[];
  topDrivingFeatures: { feature: string; value: number; impact: string }[];
  predictedAt: string;
}

export type ModelTrainingStatus = 'idle' | 'training' | 'completed' | 'error';

export type WardPriority = 'Critical' | 'Elevated' | 'Moderate' | 'Low';

export interface WardItem {
  id: string;
  name: string;
  zone?: string;
  population: number;
  recordedComplaints: number;
  predictedDemand: number | null;
  predictedSurgePct: number | null;
  uncertaintyRange: [number, number] | null;
  confidenceScore: number | null;
  priority: WardPriority | null;
  riskFactors: string[];
  inspectionAction: string | null;
  coordinates: [number, number] | null; // [lat, lng] - only genuine coordinates, never invented
}

export interface ResourcePlanItem {
  rank: number;
  wardId: string;
  wardName: string;
  zone: string;
  priority: WardPriority;
  recordedComplaints: number;
  population: number;
  predictedDemand: number;
  uncertainty: string;
  inspectionAction: string;
  actionSummary: string;
}

export interface GeoJsonMetadata {
  fileName: string;
  featureCount: number;
  polygonCount: number;
  propertiesList: string[];
  bounds: [[number, number], [number, number]] | null;
  raw: FeatureCollection;
}

export interface CategoryPredictionItem {
  category: string;
  displayName: string;
  department: string;
  probability: number;
  probabilityPct: number;
  expectedCount: number;
  baselineCount: number;
  diff: number;
  pctChange: number | null;
  recommendedAction: string;
  requiredResources: string;
  approvalStatus: string;
  priority: 'Critical' | 'Elevated' | 'Moderate' | 'Normal';
}

export interface WardCategoryPrediction {
  wardId: string;
  wardName: string;
  zone: string;
  horizonDays: number;
  horizonMonths: number;
  totalPredictedDemand: number;
  totalBaselineDemand: number;
  categories: CategoryPredictionItem[];
  status: 'available' | 'unavailable';
  missingDataReason?: string;
  predictedAt: string;
}

export interface PerClassMetrics {
  category: string;
  displayName: string;
  precision: number;
  recall: number;
  f1Score: number;
  support: number;
}

export interface CategoryClassificationMetrics {
  accuracy: number;
  macroF1: number;
  weightedF1: number;
  macroPrecision: number;
  macroRecall: number;
  perClass: PerClassMetrics[];
  sampleCount: number;
  testStrategy: string;
}

export interface CategoryForecastMetrics {
  mae: number;
  rmse: number;
  r2: number;
  baselineMae: number;
  baselineRmse: number;
  baselineR2: number;
  evaluationWindow: string;
}

export interface CategoryModelEvaluation {
  isTrained: boolean;
  modelName: string;
  datasetVersion: string;
  classificationMetrics?: CategoryClassificationMetrics;
  forecastMetrics?: CategoryForecastMetrics;
  evaluatedAt?: string;
  status: 'available' | 'unavailable';
  missingDataReason?: string;
}
