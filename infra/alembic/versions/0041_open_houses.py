"""open_houses

Revision ID: 0041_open_houses
Revises: 0040_uae_essentials
Create Date: 2026-05-16 00:00:00.000000

Changes:
1. Create open_house_status enum (scheduled, cancelled, completed).
2. Create open_houses table with all columns, constraints, and indexes.
3. audit_action enum: open_house_created, open_house_updated, open_house_cancelled.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0041_open_houses"
down_revision: Union[str, None] = "0040_uae_essentials"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _add_audit_value(conn: sa.engine.Connection, value: str) -> None:
    conn.execute(sa.text(
        f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{value}'"
    ))


def upgrade() -> None:
    conn = op.get_bind()

    # ------------------------------------------------------------------
    # 1. open_house_status enum — idempotent DO block
    # ------------------------------------------------------------------
    conn.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'open_house_status'
            ) THEN
                CREATE TYPE open_house_status AS ENUM (
                    'scheduled',
                    'cancelled',
                    'completed'
                );
            END IF;
        END $$;
    """))

    # ------------------------------------------------------------------
    # 2. open_houses table
    # ------------------------------------------------------------------
    op.create_table(
        "open_houses",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "listing_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("listings.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "property_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("properties.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("capacity", sa.Integer, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column(
            "status",
            postgresql.ENUM(
                "scheduled", "cancelled", "completed",
                name="open_house_status",
                create_type=False,
            ),
            nullable=False,
            server_default="scheduled",
        ),
        sa.Column(
            "created_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        # CHECK constraints
        sa.CheckConstraint("ends_at > starts_at", name="ck_open_houses_time_order"),
        sa.CheckConstraint(
            "capacity IS NULL OR capacity > 0",
            name="ck_open_houses_capacity_positive",
        ),
    )

    # Indexes
    op.create_index(
        "idx_open_houses_tenant_listing",
        "open_houses",
        ["tenant_id", "listing_id"],
    )
    op.create_index(
        "idx_open_houses_starts_at",
        "open_houses",
        ["starts_at"],
    )
    op.create_index(
        "idx_open_houses_listing_status_starts",
        "open_houses",
        ["listing_id", "status", "starts_at"],
    )

    # ------------------------------------------------------------------
    # 3. audit_action enum — new values
    # ADD VALUE cannot run inside a transaction block; IF NOT EXISTS guard
    # makes it safe on repeated runs (same pattern as migration 0040).
    # ------------------------------------------------------------------
    _add_audit_value(conn, "open_house_created")
    _add_audit_value(conn, "open_house_updated")
    _add_audit_value(conn, "open_house_cancelled")


def downgrade() -> None:
    # 3. audit_action: enum values cannot be removed — no-op (project pattern).

    # 2. open_houses indexes + table
    op.drop_index("idx_open_houses_listing_status_starts", table_name="open_houses")
    op.drop_index("idx_open_houses_starts_at", table_name="open_houses")
    op.drop_index("idx_open_houses_tenant_listing", table_name="open_houses")
    op.drop_table("open_houses")

    # 1. open_house_status enum
    op.execute(sa.text("DROP TYPE IF EXISTS open_house_status"))
