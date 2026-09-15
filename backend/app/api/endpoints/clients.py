"""
api/endpoints/clients.py — Client profile endpoints for Phase 2.2.

Routes:
  GET /clients/me  — Retrieve authenticated client's own profile
  PUT /clients/me  — Update authenticated client's own profile
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.client import ClientResponse, ClientUpdate
from app.services.client_service import client_service

router = APIRouter()


@router.get(
    "/me",
    response_model=ClientResponse,
    status_code=status.HTTP_200_OK,
    summary="Get authenticated client profile",
)
def get_my_client_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ClientResponse:
    """
    Retrieve the client profile belonging exclusively to the authenticated user.
    Never relies on client IDs passed in request body or path params.
    """
    client = client_service.get_or_create_for_user(db, current_user)
    return ClientResponse.model_validate(client)


@router.put(
    "/me",
    response_model=ClientResponse,
    status_code=status.HTTP_200_OK,
    summary="Update authenticated client profile",
)
def update_my_client_profile(
    payload: ClientUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ClientResponse:
    """
    Update the client profile belonging exclusively to the authenticated user.
    """
    updated_client = client_service.update_client_for_user(db, current_user, payload)
    return ClientResponse.model_validate(updated_client)
