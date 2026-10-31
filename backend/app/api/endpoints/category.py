from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.schemas.category import (
    WardCategoryPredictionResponse,
    CategoryModelEvaluationResponse,
    CategoryPredictRequest
)
from app.services.category_service import CategoryService

router = APIRouter(prefix="/ml/categories", tags=["Category Predictions"])


@router.get("/status")
def get_category_status():
    """Returns whether complaint history data is available for category prediction."""
    available = CategoryService.is_complaint_history_available()
    return {
        "is_available": available,
        "status": "available" if available else "unavailable",
        "message": "Complaint history is verified and active." if available else "CATEGORY PREDICTION UNAVAILABLE: Historical complaint records required."
    }


@router.get("/evaluation", response_model=CategoryModelEvaluationResponse)
def get_category_evaluation():
    """Returns classification and count forecasting backtesting evaluation metrics."""
    try:
        return CategoryService.get_evaluation()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch category evaluation: {str(e)}")


@router.get("/predict/{ward_id}", response_model=WardCategoryPredictionResponse)
def get_ward_category_prediction(
    ward_id: str,
    horizon_days: int = Query(default=30, ge=15, le=120, description="Forecast window (30, 60, or 90 days)")
):
    """Generates category-wise complaint demand forecasts for the selected ward."""
    try:
        return CategoryService.predict_ward_categories(ward_id=ward_id, horizon_days=horizon_days)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Category prediction error: {str(e)}")


@router.post("/predict", response_model=WardCategoryPredictionResponse)
def predict_ward_categories_post(request: CategoryPredictRequest):
    """POST endpoint for category demand prediction."""
    try:
        return CategoryService.predict_ward_categories(ward_id=request.ward_id, horizon_days=request.horizon_days)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Category prediction error: {str(e)}")
