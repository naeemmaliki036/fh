"""public_site_config

Revision ID: 0015_public_site_config
Revises: 0014_audit_action_status_changes
Create Date: 2026-05-13 00:00:00.000000

Hand-written migration:
  - Adds one column to the tenants table:
      public_site_config  JSONB NOT NULL DEFAULT '{}'::jsonb
  - Stores per-tenant public-site customization blob (hero copy, theme colors,
    services, footer, social links, section toggles). Schema validation lives
    in Pydantic — the DB column stays generic.
  - No index needed; the column is never used as a standalone filter predicate.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0015_public_site_config"
down_revision: Union[str, None] = "0014_audit_action_status_changes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    conn.execute(sa.text(
        "ALTER TABLE tenants "
        "ADD COLUMN public_site_config JSONB NOT NULL DEFAULT '{}'::jsonb"
    ))


def downgrade() -> None:
    conn = op.get_bind()

    conn.execute(sa.text(
        "ALTER TABLE tenants DROP COLUMN IF EXISTS public_site_config"
    ))
