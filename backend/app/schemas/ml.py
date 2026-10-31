from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field

class DatasetColumnInfo(BaseModel):
    name: str
    type: str  # 'number' | 'string' | 'boolean'
    non_null_count: int
    null_count: int
    unique_count: int
    sample_values: List[Any]
    is_candidate_target: bool = False

class WardCoordinateItem(BaseModel):
    ward_id: str
    ward_name: str
    zone: Optional[str] = None
    lat: float
    lon: float
    population: Optional[int] = None

class DatasetRegistryItem(BaseModel):
    id: str
    name: str
    description: str
    source: str
    file_name: str
    row_count: int
    column_count: int
    has_complaint_target: bool
    mode: str  # "ward_analysis" | "complaint_prediction" | "spatial_geometry"
    available_features: List[str]
    missing_data_explanation: Optional[str] = None
    is_available: bool = True

class DatasetRegistryResponse(BaseModel):
    datasets: List[DatasetRegistryItem]
    default_dataset_id: str

class DatasetInspectionResponse(BaseModel):
    filename: str
    row_count: int
    column_count: int
    columns: List[DatasetColumnInfo]
    preview_rows: List[Dict[str, Any]]
    candidate_targets: List[str]
    has_valid_complaint_target: bool
    target_validation_message: Optional[str] = None
    mode: str = "complaint_prediction"  # "ward_analysis" | "complaint_prediction"
    source: Optional[str] = None
    dataset_id: Optional[str] = None
    ward_coordinates: Optional[List[WardCoordinateItem]] = None
    can_join_complaints: bool = False
    missing_data_explanation: Optional[str] = None

class TrainModelRequest(BaseModel):
    target_column: str
    feature_columns: Optional[List[str]] = None
    algorithm: str = Field(default="ridge", description="One of: 'ridge', 'random_forest', 'gradient_boosting'")
    test_size: float = Field(default=0.2, ge=0.1, le=0.4)

class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float

class ValidationMetrics(BaseModel):
    mae: float
    rmse: float
    r2: float
    baseline_mae: float
    baseline_rmse: float
    sample_count: int
    test_ward_count: int
    validation_strategy: str

class TrainModelResponse(BaseModel):
    success: bool
    message: str
    model_name: str
    target_column: str
    features_used: List[str]
    metrics: Optional[ValidationMetrics] = None
    feature_importances: List[FeatureImportanceItem] = []
    trained_at: str

class ModelStatusResponse(BaseModel):
    is_trained: bool
    model_name: Optional[str] = None
    target_column: Optional[str] = None
    features_used: List[str] = []
    metrics: Optional[ValidationMetrics] = None
    feature_importances: List[FeatureImportanceItem] = []
    trained_at: Optional[str] = None

class DrivingFeature(BaseModel):
    feature: str
    value: float
    impact: str

class PredictRequest(BaseModel):
    ward_id: str
    horizon_months: int = Field(default=1, ge=1, le=18)

class PredictResponse(BaseModel):
    ward_id: str
    ward_name: str
    zone: str
    population: int
    predicted_demand: float
    baseline_demand: Optional[float] = None
    diff: Optional[float] = None
    pct_change: Optional[float] = None
    confidence_interval: Tuple[float, float]
    model_name: str
    target_column: str
    features_used: List[str]
    top_driving_features: List[DrivingFeature]
    predicted_at: str

class ResourceRankItem(BaseModel):
    rank: int
    ward_id: str
    ward_name: str
    zone: str
    priority: str
    population: int
    recorded_complaints: float
    predicted_demand: float
    uncertainty_bounds: str
    inspection_directive: str

class ResourceRankingResponse(BaseModel):
    total_wards: int
    critical_count: int
    elevated_count: int
    total_predicted_demand: float
    ranking_methodology: str
    items: List[ResourceRankItem]
