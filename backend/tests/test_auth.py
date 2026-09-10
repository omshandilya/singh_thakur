from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User


def test_register_success(client: TestClient):
    payload = {
        "email": "newuser@example.com",
        "password": "StrongPassword1",
        "full_name": "New User"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "hashed_password" not in data


def test_register_duplicate_email(client: TestClient, test_user: dict):
    payload = {
        "email": test_user["email"],
        "password": "StrongPassword2",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409
    assert response.json()["success"] is False


def test_login_success(client: TestClient, test_user: dict):
    payload = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["role"] == "CLIENT"


def test_login_invalid_credentials(client: TestClient, test_user: dict):
    payload = {
        "email": test_user["email"],
        "password": "wrongpassword"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401


def test_login_inactive_user(client: TestClient, db_session: Session, test_user: dict):
    # Make user inactive
    user = db_session.query(User).filter_by(email=test_user["email"]).first()
    user.is_active = False
    db_session.commit()

    payload = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    
    # Restore user
    user.is_active = True
    db_session.commit()


def test_get_me_authenticated(client: TestClient, auth_headers: dict, test_user: dict):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user["email"]


def test_get_me_unauthenticated(client: TestClient):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_token_refresh(client: TestClient, test_user: dict):
    # 1. Login to get refresh token
    login_payload = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    login_response = client.post("/api/v1/auth/login", json=login_payload)
    refresh_token = login_response.json()["refresh_token"]

    # 2. Refresh
    refresh_payload = {"refresh_token": refresh_token}
    refresh_response = client.post("/api/v1/auth/refresh", json=refresh_payload)
    assert refresh_response.status_code == 200
    
    data = refresh_response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["refresh_token"] != refresh_token


def test_token_refresh_invalid_token(client: TestClient):
    refresh_payload = {"refresh_token": "invalid_or_expired_token"}
    response = client.post("/api/v1/auth/refresh", json=refresh_payload)
    assert response.status_code == 401


def test_logout(client: TestClient, test_user: dict, auth_headers: dict):
    # 1. Login to get refresh token
    login_payload = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    login_response = client.post("/api/v1/auth/login", json=login_payload)
    refresh_token = login_response.json()["refresh_token"]

    # 2. Logout
    logout_payload = {"refresh_token": refresh_token}
    logout_response = client.post("/api/v1/auth/logout", json=logout_payload, headers=auth_headers)
    assert logout_response.status_code == 204

    # 3. Refresh should fail (token revoked)
    refresh_payload = {"refresh_token": refresh_token}
    refresh_response = client.post("/api/v1/auth/refresh", json=refresh_payload)
    assert refresh_response.status_code == 401


def test_password_hashing_never_plaintext(client: TestClient, db_session: Session):
    payload = {
        "email": "hashcheck@example.com",
        "password": "MySecretPassword123"
    }
    client.post("/api/v1/auth/register", json=payload)
    
    user = db_session.query(User).filter_by(email="hashcheck@example.com").first()
    assert user is not None
    assert user.hashed_password is not None
    assert user.hashed_password != "MySecretPassword123"
    assert user.hashed_password.startswith("$2")
