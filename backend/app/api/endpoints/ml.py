from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from typing import Optional, Dict, Any

from app.schemas.ml import (
    DatasetInspectionResponse,
    DatasetRegistryResponse,
    TrainModelRequest,
    TrainModelResponse,
    ModelStatusResponse,
    PredictRequest,
    PredictResponse,
    ResourceRankingResponse
)
from app.services.ml_service import MLService
from app.services.dataset_registry import DatasetRegistryService

router = APIRouter(prefix="/ml", tags=["Machine Learning"])


@router.get("/dataset-registry", response_model=DatasetRegistryResponse)
def get_dataset_registry():
    """Lists authentic pre-provided hackathon datasets, sources, row counts, and features."""
    try:
        return DatasetRegistryService.get_registry()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load dataset registry: {str(e)}")


@router.post("/load-hackathon", response_model=DatasetInspectionResponse)
def load_hackathon_dataset(dataset_id: str = Query(default="hackathon_joined", description="Dataset identifier from registry")):
    """Directly loads the authentic bundled hackathon dataset without manual file upload."""
    try:
        return DatasetRegistryService.load_dataset_by_id(dataset_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load hackathon dataset: {str(e)}")


@router.post("/load-dataset/{dataset_id}", response_model=DatasetInspectionResponse)
def load_dataset_by_id(dataset_id: str):
    """Loads a specific pre-provided dataset by its ID."""
    try:
        return DatasetRegistryService.load_dataset_by_id(dataset_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load dataset '{dataset_id}': {str(e)}")


@router.post("/join-complaints", response_model=DatasetInspectionResponse)
def join_complaints():
    """Authentically joins grievances_public_wards.csv and ward_features.csv on ward_id."""
    try:
        return DatasetRegistryService.join_complaint_history()
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to join complaint history: {str(e)}")


@router.get("/geojson")
def get_geojson():
    """Returns official WGS84 GeoJSON polygons for all 198 municipal wards."""
    try:
        return DatasetRegistryService.get_geojson_data()
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load GeoJSON: {str(e)}")


@router.post("/upload-dataset", response_model=DatasetInspectionResponse)
async def upload_dataset(file: UploadFile = File(...)):
    """Uploads a CSV or Excel civic dataset, inspects schema, and identifies complaint targets."""
    try:
        content = await file.read()
        return MLService.save_uploaded_dataset(content, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process dataset: {str(e)}")


@router.post("/load-benchmark", response_model=DatasetInspectionResponse)
def load_benchmark_dataset():
    """Loads the authentic municipal benchmark dataset containing historical complaints and features."""
    try:
        return MLService.load_benchmark_dataset()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not load benchmark data: {str(e)}")


@router.get("/dataset-info", response_model=DatasetInspectionResponse)
def get_dataset_info():
    """Returns inspection metadata, columns, row preview, and target candidate info."""
    try:
        return MLService.get_current_dataset_info()
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/train", response_model=TrainModelResponse)
def train_model(request: TrainModelRequest):
    """Trains a regression model on the selected complaint demand target column."""
    try:
        return MLService.train_model(
            target_column=request.target_column,
            feature_columns=request.feature_columns,
            algorithm=request.algorithm,
            test_size=request.test_size
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")


@router.get("/training-status", response_model=ModelStatusResponse)
def get_training_status():
    """Returns whether a trained model exists and its evaluation metrics."""
    return MLService.get_model_status()


@router.post("/predict", response_model=PredictResponse)
def predict_ward(request: PredictRequest):
    """Runs genuine model inference for a selected ward with confidence bounds."""
    try:
        return MLService.predict_ward(
            ward_id=request.ward_id,
            horizon_months=request.horizon_months
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("/resource-ranking", response_model=ResourceRankingResponse)
def get_resource_ranking():
    """Returns ward priority ranking based on actual trained model predictions."""
    try:
        return MLService.get_resource_ranking()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate resource ranking: {str(e)}")
