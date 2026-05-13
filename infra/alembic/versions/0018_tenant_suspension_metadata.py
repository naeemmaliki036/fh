"""tenant_suspension_metadata

Revision ID: 0018_tenant_suspension_metadata
Revises: 0017_tenant_operating_countries
Create Date: 2026-05-13 00:00:18.000000

Adds suspension audit columns to tenants:
  - suspended_at        TIMESTAMPTZ NULL
  - suspended_reason    TEXT NULL
  - suspended_by_platform_user_id UUID NULL REFERENCES platform_users(id) ON DELETE SET NULL
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0018_tenant_suspension_metadata"
down_revision: Union[str, None] = "0017_tenant_operating_countries"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE tenants ADD COLUMN suspended_at TIMESTAMPTZ"
    ))
    conn.execute(sa.text(
        "ALTER TABLE tenants ADD COLUMN suspended_reason TEXT"
    ))
    conn.execute(sa.text(
        "ALTER TABLE tenants "
        "ADD COLUMN suspended_by_platform_user_id UUID "
        "REFERENCES platform_users(id) ON DELETE SET NULL"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_tenants_suspended_by "
        "ON tenants (suspended_by_platform_user_id) "
        "WHERE suspended_by_platform_user_id IS NOT NULL"
    ))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "DROP INDEX IF EXISTS ix_tenants_suspended_by"
    ))
    conn.execute(sa.text(
        "ALTER TABLE tenants DROP COLUMN IF EXISTS suspended_by_platform_user_id"
    ))
    conn.execute(sa.text(
        "ALTER TABLE tenants DROP COLUMN IF EXISTS suspended_reason"
    ))
    conn.execute(sa.text(
        "ALTER TABLE tenants DROP COLUMN IF EXISTS suspended_at"
    ))
