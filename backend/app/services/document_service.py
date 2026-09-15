import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.models.client import Client
from app.models.document import Document, DocumentRequest, DocumentStatusEnum
from app.schemas.document import DocumentRequestCreate
from app.services.storage import get_storage_service

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".docx", ".xlsx", ".csv"}

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "text/plain",
    "application/csv",
    "application/octet-stream",  # Fallback often sent by browsers
}


class DocumentService:
    def validate_file(self, filename: str, content_type: str, file_size: int) -> str:
        """
        Validate file extension, mime type, and file size.
        Returns cleaned lowercase extension.
        """
        if not filename or "." not in filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Filename must have a valid extension.",
            )

        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File extension '{ext}' is not permitted. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            )

        if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
            max_mb = settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds the {max_mb} MB limit.",
            )

        return ext

    def generate_safe_storage_key(self, client_id: uuid.UUID, ext: str) -> str:
        """
        Generate a safe, unguessable storage key.
        Never incorporates the user's raw input filename directly in the storage path.
        """
        doc_uuid = uuid.uuid4()
        return f"clients/{client_id}/{doc_uuid}{ext}"

    # ─── Document Requests ─────────────────────────────────────────────────────

    def create_request(
        self, db: Session, data: DocumentRequestCreate, creator_user_id: uuid.UUID
    ) -> DocumentRequest:
        client = db.query(Client).filter(Client.id == data.client_id).first()
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target client not found.",
            )

        doc_req = DocumentRequest(
            client_id=data.client_id,
            created_by_id=creator_user_id,
            title=data.title,
            description=data.description,
            due_date=data.due_date,
            status=DocumentStatusEnum.REQUESTED,
        )
        db.add(doc_req)
        db.commit()
        db.refresh(doc_req)
        return doc_req

    def get_request_by_id(
        self, db: Session, request_id: uuid.UUID
    ) -> Optional[DocumentRequest]:
        return (
            db.query(DocumentRequest)
            .options(
                joinedload(DocumentRequest.client),
                joinedload(DocumentRequest.documents),
            )
            .filter(DocumentRequest.id == request_id)
            .first()
        )

    def list_requests_for_client(
        self,
        db: Session,
        client_id: uuid.UUID,
        status_filter: Optional[DocumentStatusEnum] = None,
    ) -> List[DocumentRequest]:
        query = (
            db.query(DocumentRequest)
            .options(joinedload(DocumentRequest.documents))
            .filter(DocumentRequest.client_id == client_id)
        )
        if status_filter:
            query = query.filter(DocumentRequest.status == status_filter)
        return query.order_by(DocumentRequest.created_at.desc()).all()

    def list_all_requests(
        self,
        db: Session,
        status_filter: Optional[DocumentStatusEnum] = None,
        client_id: Optional[uuid.UUID] = None,
    ) -> List[DocumentRequest]:
        query = db.query(DocumentRequest).options(
            joinedload(DocumentRequest.client),
            joinedload(DocumentRequest.documents),
        )
        if client_id:
            query = query.filter(DocumentRequest.client_id == client_id)
        if status_filter:
            query = query.filter(DocumentRequest.status == status_filter)
        return query.order_by(DocumentRequest.created_at.desc()).all()

    # ─── Documents ─────────────────────────────────────────────────────────────

    def upload_document(
        self,
        db: Session,
        client_id: uuid.UUID,
        uploaded_by_id: uuid.UUID,
        file_bytes: bytes,
        original_filename: str,
        content_type: str,
        document_request_id: Optional[uuid.UUID] = None,
    ) -> Document:
        ext = self.validate_file(original_filename, content_type, len(file_bytes))
        storage_key = self.generate_safe_storage_key(client_id, ext)

        # If document_request_id provided, verify ownership
        doc_req: Optional[DocumentRequest] = None
        if document_request_id:
            doc_req = (
                db.query(DocumentRequest)
                .filter(
                    DocumentRequest.id == document_request_id,
                    DocumentRequest.client_id == client_id,
                )
                .first()
            )
            if not doc_req:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Associated document request not found or not owned by client.",
                )

        # Save to storage abstraction
        storage = get_storage_service()
        storage.save_file(file_bytes, storage_key, content_type)

        # Create database metadata record
        doc = Document(
            document_request_id=document_request_id,
            client_id=client_id,
            uploaded_by_id=uploaded_by_id,
            original_filename=original_filename,
            file_size=len(file_bytes),
            mime_type=content_type,
            storage_key=storage_key,
            status=DocumentStatusEnum.UPLOADED,
        )
        db.add(doc)

        if doc_req:
            doc_req.status = DocumentStatusEnum.UPLOADED

        db.commit()
        db.refresh(doc)
        return doc

    def get_document_by_id(
        self, db: Session, document_id: uuid.UUID
    ) -> Optional[Document]:
        return (
            db.query(Document)
            .options(
                joinedload(Document.client),
                joinedload(Document.document_request),
            )
            .filter(Document.id == document_id)
            .first()
        )

    def list_documents_for_client(
        self,
        db: Session,
        client_id: uuid.UUID,
        status_filter: Optional[DocumentStatusEnum] = None,
        limit: Optional[int] = None,
    ) -> List[Document]:
        query = db.query(Document).filter(Document.client_id == client_id)
        if status_filter:
            query = query.filter(Document.status == status_filter)
        query = query.order_by(Document.created_at.desc())
        if limit:
            query = query.limit(limit)
        return query.all()

    def list_all_documents(
        self,
        db: Session,
        status_filter: Optional[DocumentStatusEnum] = None,
        client_id: Optional[uuid.UUID] = None,
        limit: Optional[int] = None,
    ) -> List[Document]:
        query = db.query(Document).options(
            joinedload(Document.client),
            joinedload(Document.document_request),
        )
        if client_id:
            query = query.filter(Document.client_id == client_id)
        if status_filter:
            query = query.filter(Document.status == status_filter)
        query = query.order_by(Document.created_at.desc())
        if limit:
            query = query.limit(limit)
        return query.all()

    def review_document(
        self,
        db: Session,
        document: Document,
        reviewer_user_id: uuid.UUID,
        new_status: DocumentStatusEnum,
        rejection_reason: Optional[str] = None,
    ) -> Document:
        document.status = new_status
        document.reviewed_by_id = reviewer_user_id
        document.reviewed_at = datetime.now(timezone.utc)
        document.rejection_reason = (
            rejection_reason if new_status == DocumentStatusEnum.REJECTED else None
        )

        if document.document_request_id:
            doc_req = (
                db.query(DocumentRequest)
                .filter(DocumentRequest.id == document.document_request_id)
                .first()
            )
            if doc_req:
                doc_req.status = new_status

        db.commit()
        db.refresh(document)
        return document

    def replace_document(
        self,
        db: Session,
        document: Document,
        user_id: uuid.UUID,
        file_bytes: bytes,
        original_filename: str,
        content_type: str,
    ) -> Document:
        ext = self.validate_file(original_filename, content_type, len(file_bytes))
        new_storage_key = self.generate_safe_storage_key(document.client_id, ext)

        storage = get_storage_service()
        # Save new file
        storage.save_file(file_bytes, new_storage_key, content_type)

        # Delete previous storage file if it exists
        if document.storage_key:
            storage.delete_file(document.storage_key)

        document.storage_key = new_storage_key
        document.original_filename = original_filename
        document.file_size = len(file_bytes)
        document.mime_type = content_type
        document.uploaded_by_id = user_id
        document.status = DocumentStatusEnum.UPLOADED
        document.rejection_reason = None
        document.reviewed_by_id = None
        document.reviewed_at = None

        if document.document_request_id:
            doc_req = (
                db.query(DocumentRequest)
                .filter(DocumentRequest.id == document.document_request_id)
                .first()
            )
            if doc_req:
                doc_req.status = DocumentStatusEnum.UPLOADED

        db.commit()
        db.refresh(document)
        return document

    def generate_download_url(self, document: Document) -> str:
        storage = get_storage_service()
        return storage.generate_signed_download_url(
            document.storage_key,
            document.original_filename,
            expires_in=settings.SIGNED_URL_EXPIRE_SECONDS,
        )


document_service = DocumentService()
