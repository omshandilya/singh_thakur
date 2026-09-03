from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from app.db.session import get_db
from app.main import app


def test_health_check_success(client: TestClient):
    """
    Verifies that the /api/v1/health endpoint returns 200 OK
    with healthy status and connected database.
    """
    response = client.get("/api/v1/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["api_version"] == "v1.0.0"
    assert "environment" in data
    assert "timestamp" in data


def test_health_check_database_failure():
    """
    Verifies that when database connection fails, the health check
    reports status='degraded' and database='disconnected'.
    """
    mock_db = MagicMock()
    mock_db.execute.side_effect = Exception("Database connection timeout")

    def override_get_db_failure():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db_failure

    with TestClient(app) as test_client:
        response = test_client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["database"] == "disconnected"

    app.dependency_overrides.clear()


def test_root_endpoint(client: TestClient):
    """
    Verifies that the root endpoint returns metadata and documentation link.
    """
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert data["docs"] == "/docs"
    assert data["api_v1"] == "/api/v1"
