"""consumer_listing_moderation

Revision ID: 0048_consumer_listing_moderation
Revises: 0047_price_rules
Create Date: 2026-05-17 00:00:00.000000

Changes:
1. Column: listings.submitted_at (TIMESTAMPTZ NULL) — set when consumer submits
   a draft listing for platform review.
2. audit_action enum: 4 new consumer moderation event values.
3. Partial index on listings(status, submitted_at) WHERE status = 'pending_review'
   to make the admin moderation queue fast.

Note: listings.review_notes already exists (migration 0028).
      listings.reviewed_at / reviewed_by_user_id already exist (migration 0028).
      The listing_status enum already contains pending_review / changes_requested /
      approved (migration 0028) — no new status values needed.
      Existing consumer listings in active status are grandfathered (no backfill).
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0048_consumer_listing_moderation"
down_revision: Union[str, None] = "0047_price_rules"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_IDX_PENDING = "idx_listings_pending_review"


def upgrade() -> None:
    # ------------------------------------------------------------------
    # 1. New column: submitted_at
    # ------------------------------------------------------------------
    op.add_column(
        "listings",
        sa.Column(
            "submitted_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    # ------------------------------------------------------------------
    # 2. audit_action enum — ADD VALUE IF NOT EXISTS (idempotent)
    # ------------------------------------------------------------------
    for val in (
        "consumer_listing_submitted_for_review",
        "consumer_listing_approved",
        "consumer_listing_changes_requested",
        "consumer_listing_resubmitted",
    ):
        op.execute(
            f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{val}'"
        )

    # ------------------------------------------------------------------
    # 3. Partial index — moderation queue: pending_review listings ordered
    #    by submitted_at so the oldest sit at the top.
    # ------------------------------------------------------------------
    op.execute(
        f"""
        CREATE INDEX IF NOT EXISTS {_IDX_PENDING}
        ON listings (status, submitted_at)
        WHERE status = 'pending_review'
        """
    )


def downgrade() -> None:
    op.execute(f"DROP INDEX IF EXISTS {_IDX_PENDING}")
    op.drop_column("listings", "submitted_at")
    # Enum values intentionally left in place — Postgres does not support
    # ALTER TYPE ... DROP VALUE on a live enum.
