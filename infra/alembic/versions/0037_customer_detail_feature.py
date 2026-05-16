"""customer_detail_feature

Revision ID: 0037_customer_detail_feature
Revises: 0036_money_precision
Create Date: 2026-05-16 00:00:00.000000

Changes:
1. New enum: customer_listing_interest_status (interested, won, lost)
2. New enum: private_document_approval_status (pending, approved, rejected)
3. New table: customer_listing_interest (customer ↔ listing many-to-many linkage)
4. Extend private_documents: approval_status (NOT NULL, backfilled), approved_by_user_id,
   approved_at, rejected_reason
5. Extend document_requests: closed_at, reactivated_count
6. Extend audit_action enum with 7 new values
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0037_customer_detail_feature"
down_revision: Union[str, None] = "0036_money_precision"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ------------------------------------------------------------------
    # 1. New enum: customer_listing_interest_status
    # Use DO block to guard against type already existing (idempotent).
    # ------------------------------------------------------------------
    conn.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE customer_listing_interest_status AS ENUM
                ('interested', 'won', 'lost');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """))

    # ------------------------------------------------------------------
    # 2. New enum: private_document_approval_status
    # ------------------------------------------------------------------
    conn.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE private_document_approval_status AS ENUM
                ('pending', 'approved', 'rejected');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """))

    # ------------------------------------------------------------------
    # 3. New table: customer_listing_interest
    # ------------------------------------------------------------------
    op.create_table(
        "customer_listing_interest",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "customer_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("customers.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "listing_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("listings.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "status",
            postgresql.ENUM(
                "interested",
                "won",
                "lost",
                name="customer_listing_interest_status",
                create_type=False,
            ),
            nullable=False,
            server_default="interested",
        ),
        sa.Column(
            "linked_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("notes", sa.Text, nullable=True),
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
        sa.UniqueConstraint(
            "tenant_id",
            "customer_id",
            "listing_id",
            name="uq_customer_listing_interest_tenant_customer_listing",
        ),
    )

    # Indexes
    op.create_index(
        "ix_customer_listing_interest_tenant_id",
        "customer_listing_interest",
        ["tenant_id"],
    )
    op.create_index(
        "ix_customer_listing_interest_customer_id",
        "customer_listing_interest",
        ["customer_id"],
    )
    op.create_index(
        "ix_customer_listing_interest_listing_id",
        "customer_listing_interest",
        ["listing_id"],
    )

    # ------------------------------------------------------------------
    # 4. Extend private_documents: approval workflow columns
    # ------------------------------------------------------------------
    # Step 1: add column nullable so existing rows don't violate NOT NULL yet.
    op.add_column(
        "private_documents",
        sa.Column(
            "approval_status",
            postgresql.ENUM(
                "pending",
                "approved",
                "rejected",
                name="private_document_approval_status",
                create_type=False,
            ),
            nullable=True,
        ),
    )

    # Step 2: backfill all existing rows to 'approved'.
    conn.execute(
        sa.text(
            "UPDATE private_documents SET approval_status = 'approved' "
            "WHERE approval_status IS NULL"
        )
    )

    # Step 3: enforce NOT NULL + set the server default.
    op.alter_column(
        "private_documents",
        "approval_status",
        existing_type=postgresql.ENUM(
            "pending",
            "approved",
            "rejected",
            name="private_document_approval_status",
            create_type=False,
        ),
        nullable=False,
        server_default="approved",
    )

    op.add_column(
        "private_documents",
        sa.Column(
            "approved_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "private_documents",
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "private_documents",
        sa.Column("rejected_reason", sa.Text, nullable=True),
    )

    # ------------------------------------------------------------------
    # 5. Extend document_requests: closed_at, reactivated_count
    # ------------------------------------------------------------------
    op.add_column(
        "document_requests",
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "document_requests",
        sa.Column(
            "reactivated_count",
            sa.Integer,
            nullable=False,
            server_default="0",
        ),
    )

    # ------------------------------------------------------------------
    # 6. Extend audit_action enum with 7 new values
    # Each ALTER TYPE ADD VALUE runs outside an explicit transaction block;
    # Alembic's get_bind() approach matches the pattern used in 0028.
    # ------------------------------------------------------------------
    conn.execute(sa.text(
        "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS "
        "'customer_listing_interest_linked'"
    ))
    conn.execute(sa.text(
        "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS "
        "'customer_listing_interest_unlinked'"
    ))
    conn.execute(sa.text(
        "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS "
        "'customer_listing_interest_won'"
    ))
    conn.execute(sa.text(
        "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS "
        "'customer_listing_interest_lost'"
    ))
    conn.execute(sa.text(
        "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS "
        "'private_document_approved'"
    ))
    conn.execute(sa.text(
        "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS "
        "'private_document_rejected'"
    ))
    conn.execute(sa.text(
        "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS "
        "'document_request_reactivated'"
    ))


def downgrade() -> None:
    # ------------------------------------------------------------------
    # 5. Revert document_requests columns
    # ------------------------------------------------------------------
    op.drop_column("document_requests", "reactivated_count")
    op.drop_column("document_requests", "closed_at")

    # ------------------------------------------------------------------
    # 4. Revert private_documents columns
    # ------------------------------------------------------------------
    op.drop_column("private_documents", "rejected_reason")
    op.drop_column("private_documents", "approved_at")
    op.drop_column("private_documents", "approved_by_user_id")
    op.drop_column("private_documents", "approval_status")

    # ------------------------------------------------------------------
    # 3. Drop customer_listing_interest table
    # ------------------------------------------------------------------
    op.drop_index(
        "ix_customer_listing_interest_listing_id",
        table_name="customer_listing_interest",
    )
    op.drop_index(
        "ix_customer_listing_interest_customer_id",
        table_name="customer_listing_interest",
    )
    op.drop_index(
        "ix_customer_listing_interest_tenant_id",
        table_name="customer_listing_interest",
    )
    op.drop_table("customer_listing_interest")

    # ------------------------------------------------------------------
    # 2 & 1. Drop the two new enum types
    # ------------------------------------------------------------------
    op.execute("DROP TYPE IF EXISTS private_document_approval_status")
    op.execute("DROP TYPE IF EXISTS customer_listing_interest_status")

    # audit_action enum values cannot be removed in Postgres without type
    # recreation — downgrade is a no-op for those additions.
