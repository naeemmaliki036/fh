"""deal_workflow

Revision ID: 0032_deal_workflow
Revises: 0031_public_site_visibility
Create Date: 2026-05-14 00:00:00.000000

Adds secondary agent, split commission percentages, and dual-confirmation
columns to `deals`, plus new AuditAction enum values.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0032_deal_workflow"
down_revision: Union[str, None] = "0031_public_site_visibility"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # New AuditAction enum values
    op.execute("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'deal_admin_confirmed'")
    op.execute("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'deal_agent_confirmed'")
    op.execute("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'deal_secondary_agent_changed'")
    op.execute("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'off_market_reason_created'")
    op.execute("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'off_market_reason_updated'")
    op.execute("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'off_market_reason_deleted'")

    # secondary_agent_id — references agents (mirrors primary_agent_id)
    op.add_column(
        "deals",
        sa.Column(
            "secondary_agent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    # Split commission percentages
    op.add_column(
        "deals",
        sa.Column(
            "primary_commission_pct",
            sa.Integer,
            nullable=False,
            server_default="100",
        ),
    )
    op.add_column(
        "deals",
        sa.Column(
            "secondary_commission_pct",
            sa.Integer,
            nullable=False,
            server_default="0",
        ),
    )

    # CHECK constraints on percentages
    op.create_check_constraint(
        "ck_deals_primary_pct_range",
        "deals",
        "primary_commission_pct BETWEEN 0 AND 100",
    )
    op.create_check_constraint(
        "ck_deals_secondary_pct_range",
        "deals",
        "secondary_commission_pct BETWEEN 0 AND 100",
    )
    op.create_check_constraint(
        "ck_deals_pct_sum",
        "deals",
        "primary_commission_pct + secondary_commission_pct = 100",
    )

    # Admin confirmation
    op.add_column(
        "deals",
        sa.Column("admin_confirmed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "deals",
        sa.Column(
            "admin_confirmed_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    # Agent acknowledgement
    op.add_column(
        "deals",
        sa.Column("agent_confirmed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "deals",
        sa.Column(
            "agent_confirmed_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_constraint("ck_deals_pct_sum", "deals", type_="check")
    op.drop_constraint("ck_deals_secondary_pct_range", "deals", type_="check")
    op.drop_constraint("ck_deals_primary_pct_range", "deals", type_="check")
    op.drop_column("deals", "agent_confirmed_by_user_id")
    op.drop_column("deals", "agent_confirmed_at")
    op.drop_column("deals", "admin_confirmed_by_user_id")
    op.drop_column("deals", "admin_confirmed_at")
    op.drop_column("deals", "secondary_commission_pct")
    op.drop_column("deals", "primary_commission_pct")
    op.drop_column("deals", "secondary_agent_id")
    # Note: cannot remove enum values in Postgres without recreating the type
