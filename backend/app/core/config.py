import os
import json
from typing import List

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "WardPulse AI Backend")
    VERSION: str = "0.1.0"
    API_PREFIX: str = "/api"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Base local development origins
    DEFAULT_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]

    # Regex allowing secure HTTPS Vercel preview and production domains
    CORS_ORIGIN_REGEX: str = r"^https:\/\/[\w\-]+(\.[\w\-]+)*\.vercel\.app$"

    @property
    def CORS_ORIGINS(self) -> List[str]:
        origins = list(self.DEFAULT_CORS_ORIGINS)
        
        # Read from CORS_ORIGINS env var (supports comma-separated string or JSON list)
        raw_env_origins = os.getenv("CORS_ORIGINS")
        if raw_env_origins:
            raw_trimmed = raw_env_origins.strip()
            if raw_trimmed.startswith("[") and raw_trimmed.endswith("]"):
                try:
                    parsed = json.loads(raw_trimmed)
                    if isinstance(parsed, list):
                        for o in parsed:
                            cleaned = str(o).strip().rstrip("/")
                            if cleaned and cleaned not in origins:
                                origins.append(cleaned)
                except Exception:
                    pass
            else:
                for item in raw_trimmed.split(","):
                    cleaned = item.strip().rstrip("/")
                    if cleaned and cleaned not in origins:
                        origins.append(cleaned)
        
        # Support FRONTEND_URL or VERCEL_URL if explicitly provided
        for env_var in ["FRONTEND_URL", "VERCEL_URL", "ALLOWED_ORIGIN"]:
            val = os.getenv(env_var)
            if val:
                cleaned = val.strip().rstrip("/")
                if not cleaned.startswith("http://") and not cleaned.startswith("https://"):
                    cleaned = f"https://{cleaned}"
                if cleaned not in origins:
                    origins.append(cleaned)

        return origins

settings = Settings()
