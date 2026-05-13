"""property_tags

Revision ID: 0019_property_tags
Revises: 0018_tenant_suspension_metadata
Create Date: 2026-05-13 00:00:19.000000

Adds properties.tags TEXT[] NOT NULL DEFAULT '{}'::text[].
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0019_property_tags"
down_revision: Union[str, None] = "0018_tenant_suspension_metadata"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE properties "
        "ADD COLUMN tags TEXT[] NOT NULL DEFAULT '{}'::text[]"
    ))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE properties DROP COLUMN IF EXISTS tags"
    ))
