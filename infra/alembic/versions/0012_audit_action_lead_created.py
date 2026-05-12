"""audit_action_lead_created

Revision ID: 0012_audit_action_lead_created
Revises: 0011_public_site
Create Date: 2026-05-12 00:00:00.000000

Adds lead_created to the audit_action Postgres enum type.
ALTER TYPE ... ADD VALUE can run inside a transaction on PG 16.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0012_audit_action_lead_created"
down_revision: Union[str, None] = "0011_public_site"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'lead_created'"))


def downgrade() -> None:
    # Postgres does not support removing enum values; downgrade is a no-op.
    # To fully revert: recreate the enum without this value (requires a table rewrite).
    pass
