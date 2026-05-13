"""tenant_operating_countries

Revision ID: 0017_tenant_operating_countries
Revises: 0016_protect_super_admin_delete
Create Date: 2026-05-13 00:00:17.000000

Adds tenants.operating_countries TEXT[] NOT NULL DEFAULT ARRAY['AE']::text[].
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0017_tenant_operating_countries"
down_revision: Union[str, None] = "0016_protect_super_admin_delete"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE tenants "
        "ADD COLUMN operating_countries TEXT[] NOT NULL DEFAULT ARRAY['AE']::text[]"
    ))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE tenants DROP COLUMN IF EXISTS operating_countries"
    ))
