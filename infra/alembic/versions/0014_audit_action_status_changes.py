"""audit_action_status_changes

Revision ID: 0014_audit_action_status_changes
Revises: 0013_default_properties_view
Create Date: 2026-05-13 00:00:00.000000

Adds four new values to the audit_action Postgres enum type:
  - agent_status_changed
  - listing_status_changed
  - property_status_changed
  - user_enabled

ALTER TYPE ... ADD VALUE can run inside a transaction on PG 16.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0014_audit_action_status_changes"
down_revision: Union[str, None] = "0013_default_properties_view"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'agent_status_changed'"))
    conn.execute(sa.text("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'listing_status_changed'"))
    conn.execute(sa.text("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'property_status_changed'"))
    conn.execute(sa.text("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'user_enabled'"))


def downgrade() -> None:
    # Postgres does not support removing enum values; downgrade is a no-op.
    # To fully revert: recreate the enum without these values (requires a table rewrite).
    pass
