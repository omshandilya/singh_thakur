"""
api/endpoints/documents.py — Document management endpoints for Phase 2.3.

Routes:
  GET  /documents                — List documents (Client sees own; CA/Staff sees all or filters)
  GET  /documents/{id}           — Retrieve document metadata
  POST /documents/upload         — Upload document (multipart file + optional request link)
  GET  /documents/{id}/download-url — Get short-lived signed download URL
  GET  /documents/download-stream   — Stream file binary via verified signed token
  POST /documents/{id}/replace   — Replace / re-upload a rejected document
  POST /documents/{id}/review    — Review document status (CA / Admin / Employee only)
"""
import io
import mimetypes
import uuid
from typing import List, Optional
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, require_roles
from app.core.config import settings
from app.db.session import get_db
from app.models.document import DocumentStatusEnum
from app.models.role import RoleEnum
from app.models.user import User
from app.schemas.document import (
    DocumentDownloadUrlResponse,
    DocumentResponse,
    DocumentReviewRequest,
)
from app.services.client_service import client_service
from app.services.document_service import document_service
from app.services.storage import LocalStorageService, get_storage_service

router = APIRouter()


@router.get(
    "",
    response_model=List[DocumentResponse],
    status_code=status.HTTP_200_OK,
    summary="List documents",
)
def list_documents(
    status_filter: Optional[DocumentStatusEnum] = Query(None, alias="status"),
    client_id: Optional[uuid.UUID] = Query(None),
    limit: Optional[int] = Query(None, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> List[DocumentResponse]:
    """
    List uploaded documents. Clients only ever see their own documents.
    """
    if current_user.role.name == RoleEnum.CLIENT:
        client = client_service.get_or_create_for_user(db, current_user)
        docs = document_service.list_documents_for_client(
            db, client_id=client.id, status_filter=status_filter, limit=limit
        )
    else:
        docs = document_service.list_all_documents(
            db, status_filter=status_filter, client_id=client_id, limit=limit
        )

    return [DocumentResponse.model_validate(d) for d in docs]


@router.get(
    "/download-stream",
    summary="Stream file content via signed token",
)
def download_document_stream(token: str = Query(...)) -> Response:
    """
    Directly streams document bytes for local storage downloads after
    validating the cryptographic HMAC token and expiry timestamp.
    """
    try:
        storage_key, filename = LocalStorageService.verify_download_token(token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )

    storage = get_storage_service()
    try:
        data, content_type = storage.get_file(storage_key)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found in storage.",
        )

    # Guess MIME type if not detected
    guessed_type, _ = mimetypes.guess_type(filename)
    media_type = guessed_type or content_type or "application/octet-stream"

    return StreamingResponse(
        io.BytesIO(data),
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
    )


@router.get(
    "/{id}",
    response_model=DocumentResponse,
    status_code=status.HTTP_200_OK,
    summary="Get document metadata",
)
def get_document(
    id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    doc = document_service.get_document_by_id(db, id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    if current_user.role.name == RoleEnum.CLIENT:
        if doc.client.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view this document.",
            )

    return DocumentResponse.model_validate(doc)


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload document",
)
async def upload_document(
    file: UploadFile = File(...),
    document_request_id: Optional[uuid.UUID] = Form(None),
    client_id: Optional[uuid.UUID] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    """
    Upload a document file.
    Validates file extension, MIME type, and size limits.
    Stores binary in S3-compatible storage and creates DB metadata.
    """
    file_bytes = await file.read()
    original_filename = file.filename or "uploaded_document"
    content_type = file.content_type or "application/octet-stream"

    if current_user.role.name == RoleEnum.CLIENT:
        client = client_service.get_or_create_for_user(db, current_user)
        target_client_id = client.id
    else:
        # Staff can upload on behalf of client if client_id is given
        if not client_id and not document_request_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="client_id or document_request_id is required for staff uploads.",
            )
        if document_request_id:
            req = document_service.get_request_by_id(db, document_request_id)
            if not req:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Document request not found.",
                )
            target_client_id = req.client_id
        else:
            target_client_id = client_id  # type: ignore

    doc = document_service.upload_document(
        db=db,
        client_id=target_client_id,
        uploaded_by_id=current_user.id,
        file_bytes=file_bytes,
        original_filename=original_filename,
        content_type=content_type,
        document_request_id=document_request_id,
    )
    return DocumentResponse.model_validate(doc)


@router.get(
    "/{id}/download-url",
    response_model=DocumentDownloadUrlResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate short-lived signed download URL",
)
def get_document_download_url(
    id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> DocumentDownloadUrlResponse:
    doc = document_service.get_document_by_id(db, id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    if current_user.role.name == RoleEnum.CLIENT:
        if doc.client.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to download this document.",
            )

    download_url = document_service.generate_download_url(doc)
    return DocumentDownloadUrlResponse(
        download_url=download_url,
        expires_in=settings.SIGNED_URL_EXPIRE_SECONDS,
        filename=doc.original_filename,
    )


@router.post(
    "/{id}/replace",
    response_model=DocumentResponse,
    status_code=status.HTTP_200_OK,
    summary="Replace / re-upload a rejected document",
)
async def replace_document(
    id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    doc = document_service.get_document_by_id(db, id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    if current_user.role.name == RoleEnum.CLIENT:
        if doc.client.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to replace this document.",
            )

    file_bytes = await file.read()
    original_filename = file.filename or "uploaded_document"
    content_type = file.content_type or "application/octet-stream"

    replaced = document_service.replace_document(
        db=db,
        document=doc,
        user_id=current_user.id,
        file_bytes=file_bytes,
        original_filename=original_filename,
        content_type=content_type,
    )
    return DocumentResponse.model_validate(replaced)


@router.post(
    "/{id}/review",
    response_model=DocumentResponse,
    status_code=status.HTTP_200_OK,
    summary="Review document status (CA / Employee / Admin only)",
)
def review_document(
    id: uuid.UUID,
    payload: DocumentReviewRequest,
    current_user: User = Depends(
        require_roles(RoleEnum.ADMIN, RoleEnum.CA, RoleEnum.EMPLOYEE)
    ),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    doc = document_service.get_document_by_id(db, id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    reviewed = document_service.review_document(
        db=db,
        document=doc,
        reviewer_user_id=current_user.id,
        new_status=payload.status,
        rejection_reason=payload.rejection_reason,
    )
    return DocumentResponse.model_validate(reviewed)
