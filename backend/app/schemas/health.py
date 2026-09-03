from datetime import datetime
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., description="Overall application status (healthy / degraded)")
    database: str = Field(..., description="Database connectivity status (connected / disconnected)")
    api_version: str = Field("v1.0.0", description="API version")
    environment: str = Field(..., description="Application execution environment")
    timestamp: datetime = Field(..., description="Current server UTC timestamp")
