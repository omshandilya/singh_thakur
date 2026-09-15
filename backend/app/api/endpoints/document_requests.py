"""
api/endpoints/document_requests.py — Document Request endpoints for Phase 2.3.

Routes:
  GET  /document-requests       — List document requests (Client sees own; CA/Staff sees all or filters)
  GET  /document-requests/{id}  — Retrieve a specific document request
  POST /document-requests       — Create a document request (CA / Admin / Employee only)
"""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, require_roles
from app.db.session import get_db
from app.models.document import DocumentStatusEnum
from app.models.role import RoleEnum
from app.models.user import User
from app.schemas.document import DocumentRequestCreate, DocumentRequestResponse
from app.services.client_service import client_service
from app.services.document_service import document_service

router = APIRouter()


@router.get(
    "",
    response_model=List[DocumentRequestResponse],
    status_code=status.HTTP_200_OK,
    summary="List document requests",
)
def list_document_requests(
    status_filter: Optional[DocumentStatusEnum] = Query(None, alias="status"),
    client_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> List[DocumentRequestResponse]:
    """
    List document requests. Clients only ever see their own requests.
    Staff/Admin can filter across all clients or inspect a specific client.
    """
    if current_user.role.name == RoleEnum.CLIENT:
        client = client_service.get_or_create_for_user(db, current_user)
        requests = document_service.list_requests_for_client(
            db, client_id=client.id, status_filter=status_filter
        )
    else:
        requests = document_service.list_all_requests(
            db, status_filter=status_filter, client_id=client_id
        )

    return [DocumentRequestResponse.model_validate(r) for r in requests]


@router.get(
    "/{id}",
    response_model=DocumentRequestResponse,
    status_code=status.HTTP_200_OK,
    summary="Get document request by ID",
)
def get_document_request(
    id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> DocumentRequestResponse:
    doc_req = document_service.get_request_by_id(db, id)
    if not doc_req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document request not found.",
        )

    # Enforce tenant isolation for CLIENT role
    if current_user.role.name == RoleEnum.CLIENT:
        if doc_req.client.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view this document request.",
            )

    return DocumentRequestResponse.model_validate(doc_req)


@router.post(
    "",
    response_model=DocumentRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create document request (CA/Employee/Admin only)",
)
def create_document_request(
    payload: DocumentRequestCreate,
    current_user: User = Depends(
        require_roles(RoleEnum.ADMIN, RoleEnum.CA, RoleEnum.EMPLOYEE)
    ),
    db: Session = Depends(get_db),
) -> DocumentRequestResponse:
    created = document_service.create_request(db, payload, current_user.id)
    return DocumentRequestResponse.model_validate(created)
