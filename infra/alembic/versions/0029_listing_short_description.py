"""listing_short_description

Revision ID: 0029_listing_short_description
Revises: 0028_listing_review_workflow
Create Date: 2026-05-14 00:00:00.000000

Adds short_description TEXT NULL to listings.
No length constraint at DB level — Pydantic enforces max_length=250.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0029_listing_short_description"
down_revision: Union[str, None] = "0028_listing_review_workflow"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "listings",
        sa.Column("short_description", sa.Text, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("listings", "short_description")
