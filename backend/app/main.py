import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("wardpulse_backend")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for WardPulse AI Civic Intelligence & Demand Forecasting",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Set up CORS middleware supporting local development and Vercel domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global unhandled exception handler with full traceback logging
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}", 
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Internal Server Error: {str(exc)}",
            "type": "server_error",
            "path": request.url.path
        }
    )

# Include API router under /api
app.include_router(api_router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs": "/api/docs",
        "health": f"{settings.API_PREFIX}/health",
        "dataset_registry": f"{settings.API_PREFIX}/ml/dataset-registry"
    }

# Top-level redirects for convenience & standard cloud provider health checks
@app.get("/health", include_in_schema=False)
def root_health():
    """Direct root /health endpoint for cloud providers like Render and AWS."""
    from app.api.endpoints.health import health_check
    return health_check()

@app.get("/docs", include_in_schema=False)
def root_docs():
    """Redirects /docs to /api/docs."""
    return RedirectResponse(url="/api/docs")

@app.get("/openapi.json", include_in_schema=False)
def root_openapi():
    """Redirects /openapi.json to /api/openapi.json."""
    return RedirectResponse(url="/api/openapi.json")
