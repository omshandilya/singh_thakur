import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.models.client import Client, ClientTypeEnum
from app.models.role import RoleEnum
from app.schemas.auth import RegisterRequest
from app.services.user_service import user_service


@pytest.fixture
def second_test_user(db_session: Session) -> dict:
    email = "client2@example.com"
    password = "SecurePassword456"
    existing = user_service.get_by_email(db_session, email)
    if not existing:
        req = RegisterRequest(
            email=email,
            password=password,
            full_name="Second Client",
        )
        existing = user_service.create_user(db_session, req, role_name=RoleEnum.CLIENT)
    return {
        "user": existing,
        "email": email,
        "password": password,
    }


@pytest.fixture
def second_auth_headers(second_test_user: dict) -> dict:
    user = second_test_user["user"]
    token = create_access_token(
        subject=str(user.id),
        role=user.role.name.value,
    )
    return {"Authorization": f"Bearer {token}"}


def test_get_client_me_unauthenticated(client: TestClient):
    """Accessing /clients/me without credentials must fail with 401."""
    res = client.get("/api/v1/clients/me")
    assert res.status_code == 401


def test_get_client_me_authenticated(client: TestClient, auth_headers: dict, test_user: dict):
    """Accessing /clients/me with valid token should return the user's client profile."""
    res = client.get("/api/v1/clients/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == test_user["email"]
    assert data["name"] == test_user["user"].full_name
    assert data["client_type"] == "INDIVIDUAL"
    assert "id" in data
    assert "created_at" in data


def test_update_client_me_individual(client: TestClient, auth_headers: dict):
    """Update profile with valid PAN, phone, and address."""
    payload = {
        "name": "Rajesh Kumar",
        "client_type": "INDIVIDUAL",
        "pan": "abcde1234f",  # Lowercase should be uppercased
        "phone": "+91 9876543210",
        "address": "123 MG Road, Bengaluru, Karnataka",
    }
    res = client.put("/api/v1/clients/me", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Rajesh Kumar"
    assert data["client_type"] == "INDIVIDUAL"
    assert data["pan"] == "ABCDE1234F"  # Normalized to uppercase
    assert data["phone"] == "+91 9876543210"
    assert data["address"] == "123 MG Road, Bengaluru, Karnataka"


def test_update_client_me_business_with_gstin(client: TestClient, auth_headers: dict):
    """Update profile to BUSINESS with company name and GSTIN."""
    payload = {
        "name": "Rajesh Kumar (Partner)",
        "client_type": "BUSINESS",
        "company_name": "Kumar & Sons Enterprises",
        "pan": "ABCDE1234F",
        "gstin": "22abcde1234f1z5",  # Lowercase should be uppercased
        "phone": "+91 9876543210",
        "address": "Plot 45, Industrial Area, Mumbai",
    }
    res = client.put("/api/v1/clients/me", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["client_type"] == "BUSINESS"
    assert data["company_name"] == "Kumar & Sons Enterprises"
    assert data["gstin"] == "22ABCDE1234F1Z5"


def test_update_client_invalid_pan(client: TestClient, auth_headers: dict):
    """Updating with invalid PAN format must be rejected with 422."""
    payload = {
        "pan": "INVALID_PAN_123"
    }
    res = client.put("/api/v1/clients/me", json=payload, headers=auth_headers)
    assert res.status_code == 422


def test_update_client_invalid_gstin(client: TestClient, auth_headers: dict):
    """Updating with invalid GSTIN format must be rejected with 422."""
    payload = {
        "gstin": "INVALID123"
    }
    res = client.put("/api/v1/clients/me", json=payload, headers=auth_headers)
    assert res.status_code == 422


def test_update_client_blank_name(client: TestClient, auth_headers: dict):
    """Updating with a whitespace-only name must be rejected with 422."""
    payload = {
        "name": "   "
    }
    res = client.put("/api/v1/clients/me", json=payload, headers=auth_headers)
    assert res.status_code == 422


def test_client_isolation_and_security(
    client: TestClient,
    auth_headers: dict,
    second_auth_headers: dict,
    test_user: dict,
    second_test_user: dict,
):
    """
    Security check:
    Client 1 and Client 2 must each only access and modify their own records.
    Client identity is derived solely from the JWT token.
    """
    # Client 1 sets their profile
    client.put(
        "/api/v1/clients/me",
        json={"name": "Client One Exclusive", "pan": "AAAAA1111A"},
        headers=auth_headers,
    )

    # Client 2 sets their profile
    client.put(
        "/api/v1/clients/me",
        json={"name": "Client Two Exclusive", "pan": "BBBBB2222B"},
        headers=second_auth_headers,
    )

    # Verify Client 1 fetches only Client 1's profile
    res1 = client.get("/api/v1/clients/me", headers=auth_headers)
    data1 = res1.json()
    assert data1["name"] == "Client One Exclusive"
    assert data1["pan"] == "AAAAA1111A"
    assert data1["email"] == test_user["email"]

    # Verify Client 2 fetches only Client 2's profile
    res2 = client.get("/api/v1/clients/me", headers=second_auth_headers)
    data2 = res2.json()
    assert data2["name"] == "Client Two Exclusive"
    assert data2["pan"] == "BBBBB2222B"
    assert data2["email"] == second_test_user["email"]
