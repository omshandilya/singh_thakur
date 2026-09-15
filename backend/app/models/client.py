import enum
import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Enum, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.document import Document, DocumentRequest


class ClientTypeEnum(str, enum.Enum):
    INDIVIDUAL = "INDIVIDUAL"
    BUSINESS = "BUSINESS"


class Client(Base, TimestampMixin):
    __tablename__ = "clients"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    client_type: Mapped[ClientTypeEnum] = mapped_column(
        Enum(ClientTypeEnum, name="client_type_enum"),
        default=ClientTypeEnum.INDIVIDUAL,
        nullable=False,
        index=True,
    )
    company_name: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    pan: Mapped[Optional[str]] = mapped_column(
        String(10),
        nullable=True,
        index=True,
    )
    gstin: Mapped[Optional[str]] = mapped_column(
        String(15),
        nullable=True,
        index=True,
    )
    phone: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    email: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )
    address: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    assigned_employee_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="client_profile",
        foreign_keys=[user_id],
    )
    assigned_employee: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[assigned_employee_id],
    )
    document_requests: Mapped[List["DocumentRequest"]] = relationship(
        "DocumentRequest",
        back_populates="client",
        cascade="all, delete-orphan",
        order_by="desc(DocumentRequest.created_at)",
    )
    documents: Mapped[List["Document"]] = relationship(
        "Document",
        back_populates="client",
        cascade="all, delete-orphan",
        order_by="desc(Document.created_at)",
    )

    def __repr__(self) -> str:
        return f"<Client(name='{self.name}', type='{self.client_type}')>"
