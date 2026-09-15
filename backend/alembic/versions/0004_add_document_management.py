"""add_document_management

Revision ID: 0004_add_document_management
Revises: 0003_add_clients
Create Date: 2026-09-15 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0004_add_document_management"
down_revision: Union[str, None] = "0003_add_clients"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    document_status_enum = sa.Enum(
        "REQUESTED",
        "UPLOADED",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
        name="document_status_enum",
    )

    # 1. document_requests table
    op.create_table(
        "document_requests",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("client_id", sa.Uuid(), nullable=False),
        sa.Column("created_by_id", sa.Uuid(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", document_status_enum, nullable=False, server_default="REQUESTED"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["client_id"],
            ["clients.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["created_by_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_document_requests_id"), "document_requests", ["id"], unique=False)
    op.create_index(op.f("ix_document_requests_client_id"), "document_requests", ["client_id"], unique=False)
    op.create_index(op.f("ix_document_requests_created_by_id"), "document_requests", ["created_by_id"], unique=False)
    op.create_index(op.f("ix_document_requests_title"), "document_requests", ["title"], unique=False)
    op.create_index(op.f("ix_document_requests_due_date"), "document_requests", ["due_date"], unique=False)
    op.create_index(op.f("ix_document_requests_status"), "document_requests", ["status"], unique=False)

    # 2. documents table
    op.create_table(
        "documents",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("document_request_id", sa.Uuid(), nullable=True),
        sa.Column("client_id", sa.Uuid(), nullable=False),
        sa.Column("uploaded_by_id", sa.Uuid(), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("storage_key", sa.String(length=500), nullable=False),
        sa.Column("status", document_status_enum, nullable=False, server_default="UPLOADED"),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("reviewed_by_id", sa.Uuid(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["document_request_id"],
            ["document_requests.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["client_id"],
            ["clients.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["uploaded_by_id"],
            ["users.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["reviewed_by_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("storage_key"),
    )
    op.create_index(op.f("ix_documents_id"), "documents", ["id"], unique=False)
    op.create_index(op.f("ix_documents_document_request_id"), "documents", ["document_request_id"], unique=False)
    op.create_index(op.f("ix_documents_client_id"), "documents", ["client_id"], unique=False)
    op.create_index(op.f("ix_documents_uploaded_by_id"), "documents", ["uploaded_by_id"], unique=False)
    op.create_index(op.f("ix_documents_storage_key"), "documents", ["storage_key"], unique=True)
    op.create_index(op.f("ix_documents_status"), "documents", ["status"], unique=False)
    op.create_index(op.f("ix_documents_reviewed_by_id"), "documents", ["reviewed_by_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_documents_reviewed_by_id"), table_name="documents")
    op.drop_index(op.f("ix_documents_status"), table_name="documents")
    op.drop_index(op.f("ix_documents_storage_key"), table_name="documents")
    op.drop_index(op.f("ix_documents_uploaded_by_id"), table_name="documents")
    op.drop_index(op.f("ix_documents_client_id"), table_name="documents")
    op.drop_index(op.f("ix_documents_document_request_id"), table_name="documents")
    op.drop_index(op.f("ix_documents_id"), table_name="documents")
    op.drop_table("documents")

    op.drop_index(op.f("ix_document_requests_status"), table_name="document_requests")
    op.drop_index(op.f("ix_document_requests_due_date"), table_name="document_requests")
    op.drop_index(op.f("ix_document_requests_title"), table_name="document_requests")
    op.drop_index(op.f("ix_document_requests_created_by_id"), table_name="document_requests")
    op.drop_index(op.f("ix_document_requests_client_id"), table_name="document_requests")
    op.drop_index(op.f("ix_document_requests_id"), table_name="document_requests")
    op.drop_table("document_requests")

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        sa.Enum(name="document_status_enum").drop(bind, checkfirst=True)
