import enum
import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Enum, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    CA = "CA"
    EMPLOYEE = "EMPLOYEE"
    CLIENT = "CLIENT"


class Role(Base, TimestampMixin):
    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    name: Mapped[RoleEnum] = mapped_column(
        Enum(RoleEnum, name="role_enum"),
        unique=True,
        index=True,
        nullable=False,
    )
    description: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )

    # Relationships
    users: Mapped[List["User"]] = relationship(
        "User",
        back_populates="role",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Role(name='{self.name}')>"
