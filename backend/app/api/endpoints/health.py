from fastapi import APIRouter
from datetime import datetime, timezone
from app.schemas.health import HealthResponse
from app.core.config import settings

router = APIRouter()

@router.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        app=settings.PROJECT_NAME,
        version=settings.VERSION,
        timestamp=datetime.now(timezone.utc)
    )
