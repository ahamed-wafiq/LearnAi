"""
Health Check Schemas.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel


class HealthCheckResponse(BaseModel):
    status: str  # "healthy" / "degraded" / "ok"
    database: str  # "connected" / "unavailable"
    faiss: str  # "ready" / "empty"
    embeddings: str  # "ready"
    gemini: str  # "configured" / "missing_key"
    documents_count: int = 0
    index: Optional[Dict[str, Any]] = None
    gemini_configured: bool = False
