"""add_clients

Revision ID: 0003_add_clients
Revises: 0002_add_refresh_tokens
Create Date: 2026-09-10 23:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0003_add_clients"
down_revision: Union[str, None] = "0002_add_refresh_tokens"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    client_type_enum = sa.Enum("INDIVIDUAL", "BUSINESS", name="client_type_enum")

    op.create_table(
        "clients",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("client_type", client_type_enum, nullable=False, server_default="INDIVIDUAL"),
        sa.Column("company_name", sa.String(length=255), nullable=True),
        sa.Column("pan", sa.String(length=10), nullable=True),
        sa.Column("gstin", sa.String(length=15), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("assigned_employee_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["assigned_employee_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_clients_id"), "clients", ["id"], unique=False)
    op.create_index(op.f("ix_clients_user_id"), "clients", ["user_id"], unique=True)
    op.create_index(op.f("ix_clients_name"), "clients", ["name"], unique=False)
    op.create_index(op.f("ix_clients_client_type"), "clients", ["client_type"], unique=False)
    op.create_index(op.f("ix_clients_pan"), "clients", ["pan"], unique=False)
    op.create_index(op.f("ix_clients_gstin"), "clients", ["gstin"], unique=False)
    op.create_index(op.f("ix_clients_email"), "clients", ["email"], unique=False)
    op.create_index(op.f("ix_clients_assigned_employee_id"), "clients", ["assigned_employee_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_clients_assigned_employee_id"), table_name="clients")
    op.drop_index(op.f("ix_clients_email"), table_name="clients")
    op.drop_index(op.f("ix_clients_gstin"), table_name="clients")
    op.drop_index(op.f("ix_clients_pan"), table_name="clients")
    op.drop_index(op.f("ix_clients_client_type"), table_name="clients")
    op.drop_index(op.f("ix_clients_name"), table_name="clients")
    op.drop_index(op.f("ix_clients_user_id"), table_name="clients")
    op.drop_index(op.f("ix_clients_id"), table_name="clients")
    op.drop_table("clients")

    # Drop enum type in PostgreSQL
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        sa.Enum(name="client_type_enum").drop(bind, checkfirst=True)
