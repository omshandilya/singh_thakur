import re
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.client import ClientTypeEnum

PAN_REGEX = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")
GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")


class AssignedEmployeeResponse(BaseModel):
    id: uuid.UUID
    full_name: Optional[str] = None
    email: str

    model_config = ConfigDict(from_attributes=True)


class ClientResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    client_type: ClientTypeEnum
    company_name: Optional[str] = None
    pan: Optional[str] = None
    gstin: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    assigned_employee_id: Optional[uuid.UUID] = None
    assigned_employee: Optional[AssignedEmployeeResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    client_type: Optional[ClientTypeEnum] = None
    company_name: Optional[str] = Field(None, max_length=255)
    pan: Optional[str] = None
    gstin: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    address: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Name cannot be blank.")
        return v

    @field_validator("pan")
    @classmethod
    def validate_pan(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip().upper()
        if not v:
            return None
        if not PAN_REGEX.match(v):
            raise ValueError("Invalid PAN format. PAN must be 10 characters (e.g., 'ABCDE1234F').")
        return v

    @field_validator("gstin")
    @classmethod
    def validate_gstin(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip().upper()
        if not v:
            return None
        if not GSTIN_REGEX.match(v):
            raise ValueError(
                "Invalid GSTIN format. GSTIN must be 15 characters (e.g., '22AAAAA0000A1Z5')."
            )
        return v

    @field_validator("phone", "company_name", "address")
    @classmethod
    def strip_whitespace(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            return v if v else None
        return None
