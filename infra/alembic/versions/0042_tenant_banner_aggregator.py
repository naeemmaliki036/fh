"""tenant_banner_aggregator

Revision ID: 0042_tenant_banner
Revises: 0041_open_houses
Create Date: 2026-05-16 00:00:00.000000

Changes:
1. Add banner_url, aggregator_enabled, aggregator_disabled_at,
   aggregator_disabled_reason columns to tenants.
2. Partial covering index idx_tenants_marketplace_visible on
   (status, aggregator_enabled, public_site_enabled) for the
   high-traffic marketplace listing query.
3. audit_action enum: tenant_aggregator_disabled, tenant_aggregator_enabled.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0042_tenant_banner"
down_revision: Union[str, None] = "0041_open_houses"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_INDEX = "idx_tenants_marketplace_visible"


def _add_audit_value(conn: sa.engine.Connection, value: str) -> None:
    conn.execute(sa.text(
        f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{value}'"
    ))


def upgrade() -> None:
    # ------------------------------------------------------------------
    # 1. New columns on tenants
    # ------------------------------------------------------------------
    op.add_column(
        "tenants",
        sa.Column("banner_url", sa.String(512), nullable=True),
    )
    op.add_column(
        "tenants",
        sa.Column(
            "aggregator_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )
    op.add_column(
        "tenants",
        sa.Column(
            "aggregator_disabled_at",
            sa.TIMESTAMP(timezone=True),
            nullable=True,
        ),
    )
    op.add_column(
        "tenants",
        sa.Column("aggregator_disabled_reason", sa.Text(), nullable=True),
    )

    # ------------------------------------------------------------------
    # 2. Partial covering index for marketplace visibility query
    # ------------------------------------------------------------------
    op.execute(sa.text(
        f"""
        CREATE INDEX IF NOT EXISTS {_INDEX}
        ON tenants (status, aggregator_enabled, public_site_enabled)
        WHERE status = 'active'
          AND aggregator_enabled = true
          AND public_site_enabled = true
        """
    ))

    # ------------------------------------------------------------------
    # 3. New audit_action enum values
    # ------------------------------------------------------------------
    conn = op.get_bind()
    _add_audit_value(conn, "tenant_aggregator_disabled")
    _add_audit_value(conn, "tenant_aggregator_enabled")


def downgrade() -> None:
    # Drop partial index
    op.execute(sa.text(f"DROP INDEX IF EXISTS {_INDEX}"))

    # Drop columns (reverse order)
    op.drop_column("tenants", "aggregator_disabled_reason")
    op.drop_column("tenants", "aggregator_disabled_at")
    op.drop_column("tenants", "aggregator_enabled")
    op.drop_column("tenants", "banner_url")

    # Enum values are left in place (project convention).
