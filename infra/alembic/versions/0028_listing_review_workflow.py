"""listing_review_workflow

Revision ID: 0028_listing_review_workflow
Revises: 0027_rent_period_quarterly
Create Date: 2026-05-14 00:00:00.000000

Adds review/approval workflow to the listings table:
- 3 new listing_status enum values: pending_review, changes_requested, approved
- 3 new audit_action enum values for review events
- 6 new columns on listings (submitted_for_review_at/by, assigned_reviewer_id,
  reviewed_at/by, review_notes)
- Composite index: (tenant_id, assigned_reviewer_id, status)
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0028_listing_review_workflow"
down_revision: Union[str, None] = "0027_rent_period_quarterly"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Extend listing_status enum
    conn.execute(sa.text(
        "ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'pending_review'"
    ))
    conn.execute(sa.text(
        "ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'changes_requested'"
    ))
    conn.execute(sa.text(
        "ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'approved'"
    ))
    conn.execute(sa.text(
        "ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'sold'"
    ))
    conn.execute(sa.text(
        "ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'rented'"
    ))
    conn.execute(sa.text(
        "ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'off_market'"
    ))

    # 2. Extend audit_action enum with review events
    conn.execute(sa.text(
        "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'listing_submitted_for_review'"
    ))
    conn.execute(sa.text(
        "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'listing_review_decision'"
    ))
    conn.execute(sa.text(
        "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'listing_published'"
    ))

    # 3. Add review workflow columns to listings
    op.add_column(
        "listings",
        sa.Column(
            "submitted_for_review_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )
    op.add_column(
        "listings",
        sa.Column(
            "submitted_for_review_by_user_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "listings",
        sa.Column(
            "assigned_reviewer_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "listings",
        sa.Column(
            "reviewed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )
    op.add_column(
        "listings",
        sa.Column(
            "reviewed_by_user_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "listings",
        sa.Column("review_notes", sa.Text, nullable=True),
    )

    # 4. Composite index for "pending reviews assigned to me" query
    op.create_index(
        "ix_listings_tenant_reviewer_status",
        "listings",
        ["tenant_id", "assigned_reviewer_id", "status"],
    )


def downgrade() -> None:
    # Drop index
    op.drop_index("ix_listings_tenant_reviewer_status", table_name="listings")

    # Drop review columns
    op.drop_column("listings", "review_notes")
    op.drop_column("listings", "reviewed_by_user_id")
    op.drop_column("listings", "reviewed_at")
    op.drop_column("listings", "assigned_reviewer_id")
    op.drop_column("listings", "submitted_for_review_by_user_id")
    op.drop_column("listings", "submitted_for_review_at")

    # Postgres does not support removing enum values; enum downgrade is a no-op.
