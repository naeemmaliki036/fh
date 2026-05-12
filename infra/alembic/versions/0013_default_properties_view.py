"""default_properties_view

Revision ID: 0013_default_properties_view
Revises: 0012_audit_action_lead_created
Create Date: 2026-05-13 00:00:00.000000

Hand-written migration:
  - Creates the `properties_view_mode` Postgres enum type with values
    'card' and 'list'.
  - Adds column `default_properties_view` to the tenants table:
      properties_view_mode NOT NULL DEFAULT 'card'
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0013_default_properties_view"
down_revision: Union[str, None] = "0012_audit_action_lead_created"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    conn.execute(sa.text(
        "CREATE TYPE properties_view_mode AS ENUM ('card', 'list')"
    ))
    conn.execute(sa.text(
        "ALTER TABLE tenants "
        "ADD COLUMN default_properties_view properties_view_mode NOT NULL DEFAULT 'card'"
    ))


def downgrade() -> None:
    conn = op.get_bind()

    conn.execute(sa.text(
        "ALTER TABLE tenants DROP COLUMN IF EXISTS default_properties_view"
    ))
    conn.execute(sa.text(
        "DROP TYPE IF EXISTS properties_view_mode"
    ))
