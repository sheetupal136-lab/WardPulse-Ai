import os
from typing import List

class Settings:
    PROJECT_NAME: str = "WardPulse AI Backend"
    VERSION: str = "0.1.0"
    API_PREFIX: str = "/api"
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

settings = Settings()
