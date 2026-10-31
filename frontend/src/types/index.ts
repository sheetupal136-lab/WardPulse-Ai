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
