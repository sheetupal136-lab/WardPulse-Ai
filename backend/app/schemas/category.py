from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class CategoryPredictionItem(BaseModel):
    category: str
    display_name: str
    department: str
    probability: float  # Calibrated probability (0.0 to 1.0)
    probability_pct: float  # Formatted percentage (e.g. 42.4)
    expected_count: float  # Expected count for selected horizon
    baseline_count: float  # Historical baseline count for selected horizon
    diff: float  # Net surge/drop in count
    pct_change: Optional[float] = None  # Percentage surge relative to baseline
    recommended_action: str
    required_resources: str
    approval_status: str = "Awaiting Municipal Approval"
    priority: str = "Normal"  # Critical | Elevated | Moderate | Normal


class WardCategoryPredictionResponse(BaseModel):
    ward_id: str
    ward_name: str
    zone: str
    horizon_days: int  # 30, 60, or 90
    horizon_months: int  # 1, 2, or 3
    total_predicted_demand: float
    total_baseline_demand: float
    categories: List[CategoryPredictionItem]
    status: str = "available"  # "available" | "unavailable"
    missing_data_reason: Optional[str] = None
    predicted_at: str


class PerClassMetrics(BaseModel):
    category: str
    display_name: str
    precision: float
    recall: float
    f1_score: float
    support: int


class CategoryClassificationMetrics(BaseModel):
    accuracy: float
    macro_f1: float
    weighted_f1: float
    macro_precision: float
    macro_recall: float
    per_class: List[PerClassMetrics]
    sample_count: int
    test_strategy: str


class CategoryCountForecastMetrics(BaseModel):
    mae: float
    rmse: float
    r2: float
    baseline_mae: float
    baseline_rmse: float
    baseline_r2: float
    evaluation_window: str


class CategoryModelEvaluationResponse(BaseModel):
    is_trained: bool
    model_name: str
    dataset_version: str
    classification_metrics: Optional[CategoryClassificationMetrics] = None
    forecast_metrics: Optional[CategoryCountForecastMetrics] = None
    evaluated_at: Optional[str] = None
    status: str = "available"
    missing_data_reason: Optional[str] = None


class CategoryPredictRequest(BaseModel):
    ward_id: str
    horizon_days: int = 30  # 30, 60, or 90
