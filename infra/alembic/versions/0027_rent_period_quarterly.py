"""rent_period_quarterly

Revision ID: 0027_rent_period_quarterly
Revises: 0026_audit_action_expansion
Create Date: 2026-05-14 00:00:00.000000

Adds 'quarterly' to the rent_period Postgres enum type.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0027_rent_period_quarterly"
down_revision: Union[str, None] = "0026_audit_action_expansion"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("ALTER TYPE rent_period ADD VALUE IF NOT EXISTS 'quarterly'"))


def downgrade() -> None:
    # Postgres does not support removing enum values; downgrade is a no-op.
    pass
