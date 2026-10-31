import { apiClient } from './client';

export interface WardCoordinateBackend {
  ward_id: string;
  ward_name: string;
  zone?: string;
  lat: number;
  lon: number;
  population?: number;
}

export interface DatasetRegistryItemBackend {
  id: string;
  name: string;
  description: string;
  source: string;
  file_name: string;
  row_count: number;
  column_count: number;
  has_complaint_target: boolean;
  mode: 'ward_analysis' | 'complaint_prediction' | 'grievance_logs' | 'spatial_geometry';
  available_features: string[];
  missing_data_explanation?: string;
  is_available?: boolean;
}

export interface DatasetRegistryResponseBackend {
  datasets: DatasetRegistryItemBackend[];
  default_dataset_id: string;
}

export interface DatasetColumnBackend {
  name: string;
  type: 'number' | 'string' | 'boolean';
  non_null_count: number;
  null_count: number;
  unique_count: number;
  sample_values: (string | number)[];
  is_candidate_target: boolean;
}

export interface DatasetInspectionBackend {
  filename: string;
  row_count: number;
  column_count: number;
  columns: DatasetColumnBackend[];
  preview_rows: Record<string, any>[];
  candidate_targets: string[];
  has_valid_complaint_target: boolean;
  target_validation_message?: string;
  mode?: 'ward_analysis' | 'complaint_prediction' | 'grievance_logs';
  source?: string;
  dataset_id?: string;
  ward_coordinates?: WardCoordinateBackend[];
  can_join_complaints?: boolean;
  missing_data_explanation?: string;
}

export interface ValidationMetricsBackend {
  mae: number;
  rmse: number;
  r2: number;
  baseline_mae: number;
  baseline_rmse: number;
  sample_count: number;
  test_ward_count: number;
  validation_strategy: string;
}

export interface FeatureImportanceBackend {
  feature: string;
  importance: number;
}

export interface TrainModelRequestBackend {
  target_column: string;
  feature_columns?: string[];
  algorithm?: 'ridge' | 'random_forest' | 'gradient_boosting';
  test_size?: number;
}

export interface TrainModelResponseBackend {
  success: boolean;
  message: string;
  model_name: string;
  target_column: string;
  features_used: string[];
  metrics?: ValidationMetricsBackend;
  feature_importances: FeatureImportanceBackend[];
  trained_at: string;
}

export interface ModelStatusResponseBackend {
  is_trained: boolean;
  model_name?: string;
  target_column?: string;
  features_used?: string[];
  metrics?: ValidationMetricsBackend;
  feature_importances?: FeatureImportanceBackend[];
  trained_at?: string;
}

export interface DrivingFeatureBackend {
  feature: string;
  value: number;
  impact: string;
}

export interface PredictRequestBackend {
  ward_id: string;
  horizon_months?: number;
}

export interface PredictResponseBackend {
  ward_id: string;
  ward_name: string;
  zone: string;
  population: number;
  predicted_demand: number;
  baseline_demand?: number;
  diff?: number;
  pct_change?: number;
  confidence_interval: [number, number];
  model_name: string;
  target_column: string;
  features_used: string[];
  top_driving_features: DrivingFeatureBackend[];
  predicted_at: string;
}

export interface ResourceRankItemBackend {
  rank: number;
  ward_id: string;
  ward_name: string;
  zone: string;
  priority: 'Critical' | 'Elevated' | 'Moderate' | 'Low';
  population: number;
  recorded_complaints: number;
  predicted_demand: number;
  uncertainty_bounds: string;
  inspection_directive: string;
}

export interface ResourceRankingResponseBackend {
  total_wards: number;
  critical_count: number;
  elevated_count: number;
  total_predicted_demand: number;
  ranking_methodology: string;
  items: ResourceRankItemBackend[];
}

// API methods
export async function uploadDatasetFile(file: File): Promise<DatasetInspectionBackend> {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient<DatasetInspectionBackend>('/ml/upload-dataset', {
    method: 'POST',
    body: formData,
  });
}

export async function loadBenchmarkDataset(): Promise<DatasetInspectionBackend> {
  return apiClient<DatasetInspectionBackend>('/ml/load-benchmark', {
    method: 'POST',
  });
}

export async function getDatasetInfo(): Promise<DatasetInspectionBackend> {
  return apiClient<DatasetInspectionBackend>('/ml/dataset-info', {
    method: 'GET',
  });
}

export async function trainModelApi(request: TrainModelRequestBackend): Promise<TrainModelResponseBackend> {
  return apiClient<TrainModelResponseBackend>('/ml/train', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getTrainingStatusApi(): Promise<ModelStatusResponseBackend> {
  return apiClient<ModelStatusResponseBackend>('/ml/training-status', {
    method: 'GET',
  });
}

export async function predictWardApi(request: PredictRequestBackend): Promise<PredictResponseBackend> {
  return apiClient<PredictResponseBackend>('/ml/predict', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getResourceRankingApi(): Promise<ResourceRankingResponseBackend> {
  return apiClient<ResourceRankingResponseBackend>('/ml/resource-ranking', {
    method: 'GET',
  });
}

export async function getDatasetRegistryApi(): Promise<DatasetRegistryResponseBackend> {
  return apiClient<DatasetRegistryResponseBackend>('/ml/dataset-registry', {
    method: 'GET',
  });
}

export async function loadHackathonDatasetApi(datasetId?: string): Promise<DatasetInspectionBackend> {
  const query = datasetId ? `?dataset_id=${encodeURIComponent(datasetId)}` : '';
  return apiClient<DatasetInspectionBackend>(`/ml/load-hackathon${query}`, {
    method: 'POST',
  });
}

export async function joinComplaintsApi(): Promise<DatasetInspectionBackend> {
  return apiClient<DatasetInspectionBackend>('/ml/join-complaints', {
    method: 'POST',
  });
}

export async function getGeoJsonApi(): Promise<any> {
  return apiClient<any>('/ml/geojson', {
    method: 'GET',
  });
}

export interface CategoryPredictionItemBackend {
  category: string;
  display_name: string;
  department: string;
  probability: number;
  probability_pct: number;
  expected_count: number;
  baseline_count: number;
  diff: number;
  pct_change: number | null;
  recommended_action: string;
  required_resources: string;
  approval_status: string;
  priority: 'Critical' | 'Elevated' | 'Moderate' | 'Normal';
}

export interface WardCategoryPredictionBackend {
  ward_id: string;
  ward_name: string;
  zone: string;
  horizon_days: number;
  horizon_months: number;
  total_predicted_demand: number;
  total_baseline_demand: number;
  categories: CategoryPredictionItemBackend[];
  status: 'available' | 'unavailable';
  missing_data_reason?: string;
  predicted_at: string;
}

export interface PerClassMetricsBackend {
  category: string;
  display_name: string;
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
}

export interface CategoryClassificationMetricsBackend {
  accuracy: number;
  macro_f1: number;
  weighted_f1: number;
  macro_precision: number;
  macro_recall: number;
  per_class: PerClassMetricsBackend[];
  sample_count: number;
  test_strategy: string;
}

export interface CategoryCountForecastMetricsBackend {
  mae: number;
  rmse: number;
  r2: number;
  baseline_mae: number;
  baseline_rmse: number;
  baseline_r2: number;
  evaluation_window: string;
}

export interface CategoryModelEvaluationBackend {
  is_trained: boolean;
  model_name: string;
  dataset_version: string;
  classification_metrics?: CategoryClassificationMetricsBackend;
  forecast_metrics?: CategoryCountForecastMetricsBackend;
  evaluated_at?: string;
  status: 'available' | 'unavailable';
  missing_data_reason?: string;
}

export async function getCategoryPredictionApi(wardId: string, horizonDays: number = 30): Promise<WardCategoryPredictionBackend> {
  return apiClient<WardCategoryPredictionBackend>(`/ml/categories/predict/${encodeURIComponent(wardId)}?horizon_days=${horizonDays}`, {
    method: 'GET',
  });
}

export async function getCategoryEvaluationApi(): Promise<CategoryModelEvaluationBackend> {
  return apiClient<CategoryModelEvaluationBackend>('/ml/categories/evaluation', {
    method: 'GET',
  });
}

export async function getCategoryStatusApi(): Promise<{ is_available: boolean; status: string; message: string }> {
  return apiClient<{ is_available: boolean; status: string; message: string }>('/ml/categories/status', {
    method: 'GET',
  });
}
