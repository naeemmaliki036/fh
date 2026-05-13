"""listing_hero_media

Revision ID: 0020_listing_hero_media
Revises: 0019_property_tags
Create Date: 2026-05-13 00:00:20.000000

Adds listings.hero_media_id UUID NULL REFERENCES media(id) ON DELETE SET NULL.
Indexed for FK lookup efficiency.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0020_listing_hero_media"
down_revision: Union[str, None] = "0019_property_tags"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE listings "
        "ADD COLUMN hero_media_id UUID REFERENCES media(id) ON DELETE SET NULL"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_listings_hero_media_id ON listings (hero_media_id) "
        "WHERE hero_media_id IS NOT NULL"
    ))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "DROP INDEX IF EXISTS ix_listings_hero_media_id"
    ))
    conn.execute(sa.text(
        "ALTER TABLE listings DROP COLUMN IF EXISTS hero_media_id"
    ))
