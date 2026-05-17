"""country_hero_image

Revision ID: 0046_country_hero
Revises: 0045_tenant_office
Create Date: 2026-05-17 00:00:00.000000

Changes:
1. marketplace_countries.hero_image_url  VARCHAR(1024)  NULL
   Full CDN URL of the per-country hero background image.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0046_country_hero"
down_revision: Union[str, None] = "0045_tenant_office"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "marketplace_countries",
        sa.Column("hero_image_url", sa.String(1024), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("marketplace_countries", "hero_image_url")
