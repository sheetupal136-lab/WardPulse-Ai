import os
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_01_root_endpoint():
    """Verify GET / returns service information and docs link."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["docs"] == "/api/docs"
    assert data["health"] == "/api/health"


def test_02_health_endpoints():
    """Verify GET /api/health and GET /health return ok status."""
    res_api = client.get("/api/health")
    assert res_api.status_code == 200
    assert res_api.json()["status"] == "ok"

    res_root = client.get("/health", follow_redirects=True)
    assert res_root.status_code == 200
    assert res_root.json()["status"] == "ok"


def test_03_swagger_and_openapi():
    """Verify Swagger UI and OpenAPI JSON schemas are accessible."""
    res_docs = client.get("/api/docs")
    assert res_docs.status_code == 200
    assert "swagger-ui" in res_docs.text.lower()

    res_openapi = client.get("/api/openapi.json")
    assert res_openapi.status_code == 200
    schema = res_openapi.json()
    assert "openapi" in schema
    assert "/api/health" in schema["paths"]
    assert "/api/ml/dataset-registry" in schema["paths"]


def test_04_dataset_registry():
    """Verify GET /api/ml/dataset-registry lists available hackathon datasets."""
    response = client.get("/api/ml/dataset-registry")
    assert response.status_code == 200
    data = response.json()
    assert "datasets" in data
    assert len(data["datasets"]) >= 2
    ids = [d["id"] for d in data["datasets"]]
    assert "hackathon_joined" in ids
    assert "hackathon_features" in ids


def test_05_load_hackathon_joined_dataset():
    """Verify POST /api/ml/load-hackathon with dataset_id=hackathon_joined."""
    response = client.post("/api/ml/load-hackathon?dataset_id=hackathon_joined")
    assert response.status_code == 200
    data = response.json()
    assert data["row_count"] > 0
    assert data["column_count"] > 0
    assert data["has_valid_complaint_target"] is True
    assert "monthly_complaint_demand" in data["candidate_targets"]


def test_06_load_ward_infrastructure_features():
    """Verify POST /api/ml/load-hackathon with dataset_id=hackathon_features."""
    response = client.post("/api/ml/load-hackathon?dataset_id=hackathon_features")
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "ward_analysis"
    assert data["has_valid_complaint_target"] is False
    assert data["row_count"] == 198


def test_07_manual_csv_upload():
    """Verify POST /api/ml/upload-dataset with a simulated civic CSV file."""
    csv_content = (
        "ward_id,ward_name,centroid_lat,centroid_lon,total_complaints,population_2011\n"
        "1,Kempegowda Ward,13.0123,77.5678,245,45000\n"
        "2,Chowdeshwari Ward,13.0234,77.5789,180,38000\n"
    ).encode("utf-8")

    files = {"file": ("test_upload.csv", csv_content, "text/csv")}
    response = client.post("/api/ml/upload-dataset", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["row_count"] == 2
    assert "total_complaints" in data["candidate_targets"]


def test_08_dataset_info():
    """Verify GET /api/ml/dataset-info inspects the currently active dataset."""
    response = client.get("/api/ml/dataset-info")
    assert response.status_code == 200
    data = response.json()
    assert data["row_count"] > 0
    assert len(data["columns"]) > 0


def test_09_model_training():
    """Reload joined dataset and train regression model via POST /api/ml/train."""
    # Ensure joined dataset is active
    client.post("/api/ml/load-hackathon?dataset_id=hackathon_joined")

    train_payload = {
        "target_column": "monthly_complaint_demand",
        "algorithm": "ridge",
        "test_size": 0.2
    }
    response = client.post("/api/ml/train", json=train_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["target_column"] == "monthly_complaint_demand"
    assert data["metrics"]["r2"] > 0
    assert len(data["feature_importances"]) > 0


def test_10_ward_prediction():
    """Verify POST /api/ml/predict generates demand projection for a ward."""
    pred_payload = {
        "ward_id": "1",
        "horizon_months": 1
    }
    response = client.post("/api/ml/predict", json=pred_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ward_id"] == "1"
    assert data["predicted_demand"] > 0
    assert len(data["confidence_interval"]) == 2
    assert len(data["features_used"]) > 0


def test_11_resource_ranking():
    """Verify GET /api/ml/resource-ranking returns prioritized ward list."""
    response = client.get("/api/ml/resource-ranking")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) > 0
    first = data["items"][0]
    assert first["rank"] == 1
    assert first["priority"] in ["Critical", "Elevated", "Moderate", "Low"]


def test_12_cors_preflight_for_vercel():
    """Verify OPTIONS preflight request from Vercel domain receives proper CORS headers."""
    headers = {
        "Origin": "https://wardpulse-ai.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
    }
    response = client.options("/api/ml/load-hackathon", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://wardpulse-ai.vercel.app"
    assert "POST" in response.headers.get("access-control-allow-methods", "")
