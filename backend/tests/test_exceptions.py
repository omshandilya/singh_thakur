from fastapi import APIRouter
from fastapi.testclient import TestClient
from app.core.exceptions import NotFoundException, BadRequestException
from app.main import app

# Error simulation router
custom_error_router = APIRouter(prefix="/test-errors")


@custom_error_router.get("/not-found")
def trigger_not_found():
    raise NotFoundException("Specific client profile not found")


@custom_error_router.get("/bad-request")
def trigger_bad_request():
    raise BadRequestException("Invalid date range provided")


app.include_router(custom_error_router)


def test_404_not_found_standard_format(client: TestClient):
    """
    Verifies that 404 errors return the standardized JSON structure.
    """
    response = client.get("/api/v1/non-existent-route-12345")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert "error" in data
    assert data["error"]["code"] == "NOT_FOUND"
    assert "message" in data["error"]


def test_custom_domain_exception_format(client: TestClient):
    """
    Verifies that custom domain exceptions return expected code, message, and status.
    """
    response = client.get("/test-errors/not-found")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "NOT_FOUND"
    assert data["error"]["message"] == "Specific client profile not found"

    response = client.get("/test-errors/bad-request")
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "BAD_REQUEST"
    assert data["error"]["message"] == "Invalid date range provided"
