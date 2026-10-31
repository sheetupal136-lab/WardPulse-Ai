from pydantic import BaseModel
from datetime import datetime

class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    timestamp: datetime
