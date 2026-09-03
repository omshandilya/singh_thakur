from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.db.session import get_db
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Application Health Check",
    description="Returns application health, database connectivity status, environment, and API version.",
)
def health_check(db: Session = Depends(get_db)) -> HealthResponse:
    """
    Validates application readiness and verifies database connection.
    """
    db_status = "connected"
    app_status = "healthy"

    try:
        # Perform quick active query to test database connectivity
        db.execute(text("SELECT 1"))
    except Exception as exc:
        logger.error(f"Health check database ping failed: {str(exc)}")
        db_status = "disconnected"
        app_status = "degraded"

    return HealthResponse(
        status=app_status,
        database=db_status,
        api_version="v1.0.0",
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc),
    )
