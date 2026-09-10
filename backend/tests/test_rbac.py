import pytest
from fastapi import APIRouter, Depends
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.security import create_access_token
from app.main import app
from app.models.role import RoleEnum
from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.services.user_service import user_service

# We mount a temporary router to test the RBAC dependency
rbac_router = APIRouter()


@rbac_router.get("/admin-only")
def admin_only(user: User = Depends(require_roles(RoleEnum.ADMIN))):
    return {"message": "Admin area"}


@rbac_router.get("/staff-only")
def staff_only(user: User = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.CA, RoleEnum.EMPLOYEE))):
    return {"message": "Staff area"}


app.include_router(rbac_router, prefix="/test-rbac")


@pytest.fixture
def test_admin(db_session: Session) -> dict:
    email = "admin@example.com"
    password = "AdminPassword123"
    
    req = RegisterRequest(
        email=email,
        password=password,
    )
    user = user_service.create_user(db_session, req, role_name=RoleEnum.ADMIN)
        
    return {
        "user": user,
        "email": email,
        "password": password
    }


def test_admin_only_endpoint_with_admin_role(client: TestClient, test_admin: dict):
    user = test_admin["user"]
    token = create_access_token(
        subject=str(user.id),
        role=user.role.name.value
    )
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/test-rbac/admin-only", headers=headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Admin area"


def test_admin_only_endpoint_with_client_role(client: TestClient, auth_headers: dict):
    # auth_headers is for the CLIENT user from conftest
    response = client.get("/test-rbac/admin-only", headers=auth_headers)
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_multi_role_endpoint_allows_admin(client: TestClient, test_admin: dict):
    user = test_admin["user"]
    token = create_access_token(
        subject=str(user.id),
        role=user.role.name.value
    )
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/test-rbac/staff-only", headers=headers)
    assert response.status_code == 200


def test_multi_role_endpoint_denies_client(client: TestClient, auth_headers: dict):
    # auth_headers is for the CLIENT user from conftest
    response = client.get("/test-rbac/staff-only", headers=auth_headers)
    assert response.status_code == 403
