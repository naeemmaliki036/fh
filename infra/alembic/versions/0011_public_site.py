"""public_site

Revision ID: 0011_public_site
Revises: 0010_notifications
Create Date: 2026-05-12 00:00:00.000000

Hand-written migration:
  - Adds three columns to the tenants table for the public site feature:
      public_site_enabled  BOOLEAN NOT NULL DEFAULT false
      public_site_logo_url TEXT    NULL
      public_site_tagline  VARCHAR(200) NULL
  - No new tables, no new enum types, no index needed (columns are not
    used in WHERE clauses independently; queries always filter on slug/id first).
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0011_public_site"
down_revision: Union[str, None] = "0010_notifications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    conn.execute(sa.text(
        "ALTER TABLE tenants "
        "ADD COLUMN public_site_enabled BOOLEAN NOT NULL DEFAULT false"
    ))
    conn.execute(sa.text(
        "ALTER TABLE tenants "
        "ADD COLUMN public_site_logo_url TEXT"
    ))
    conn.execute(sa.text(
        "ALTER TABLE tenants "
        "ADD COLUMN public_site_tagline VARCHAR(200)"
    ))


def downgrade() -> None:
    conn = op.get_bind()

    conn.execute(sa.text(
        "ALTER TABLE tenants DROP COLUMN IF EXISTS public_site_tagline"
    ))
    conn.execute(sa.text(
        "ALTER TABLE tenants DROP COLUMN IF EXISTS public_site_logo_url"
    ))
    conn.execute(sa.text(
        "ALTER TABLE tenants DROP COLUMN IF EXISTS public_site_enabled"
    ))
