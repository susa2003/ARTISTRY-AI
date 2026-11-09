from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from datetime import datetime


class ApiResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    error: Optional[Dict[str, Any]] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class HealthStatus(BaseModel):
    status: str = "healthy"
    service: str = "artistry-ai-engine"
    version: str = "1.0.0"
    cv_backend: str = "opencv"
    mediapipe_supported: bool = True
