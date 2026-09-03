import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr
from app.schemas.role import RoleResponse


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    password: Optional[str] = None
    role_id: uuid.UUID


class UserResponse(UserBase):
    id: uuid.UUID
    is_verified: bool
    role_id: uuid.UUID
    role: Optional[RoleResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
