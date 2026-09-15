import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.document import DocumentStatusEnum


class DocumentResponse(BaseModel):
    id: uuid.UUID
    document_request_id: Optional[uuid.UUID] = None
    client_id: uuid.UUID
    uploaded_by_id: uuid.UUID
    original_filename: str
    file_size: int
    mime_type: str
    status: DocumentStatusEnum
    rejection_reason: Optional[str] = None
    reviewed_by_id: Optional[uuid.UUID] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentDetailResponse(DocumentResponse):
    download_url: Optional[str] = None


class DocumentRequestResponse(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    created_by_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: DocumentStatusEnum
    created_at: datetime
    updated_at: datetime
    documents: List[DocumentResponse] = []

    model_config = ConfigDict(from_attributes=True)


class DocumentRequestCreate(BaseModel):
    client_id: uuid.UUID
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    due_date: Optional[datetime] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be blank.")
        return v


class DocumentReviewRequest(BaseModel):
    status: DocumentStatusEnum
    rejection_reason: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: DocumentStatusEnum) -> DocumentStatusEnum:
        if v not in (DocumentStatusEnum.APPROVED, DocumentStatusEnum.REJECTED):
            raise ValueError("Review status must be either 'APPROVED' or 'REJECTED'.")
        return v

    @field_validator("rejection_reason")
    @classmethod
    def validate_rejection_reason(
        cls, v: Optional[str], info
    ) -> Optional[str]:
        status = info.data.get("status")
        if status == DocumentStatusEnum.REJECTED:
            if not v or not v.strip():
                raise ValueError("A rejection reason is required when rejecting a document.")
            return v.strip()
        return v.strip() if v else None


class DocumentDownloadUrlResponse(BaseModel):
    download_url: str
    expires_in: int
    filename: str
