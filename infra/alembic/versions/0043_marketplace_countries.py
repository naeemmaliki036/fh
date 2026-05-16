"""marketplace_countries

Revision ID: 0043_mp_countries
Revises: 0042_tenant_banner
Create Date: 2026-05-16 00:00:00.000000

Changes:
1. New table marketplace_countries — platform-global country catalog for
   the marketplace country gate and selector.
2. Composite index idx_marketplace_countries_enabled_order on
   (enabled, display_order).
3. Seed 12 GCC / regional countries via idempotent DO block.
4. audit_action enum: marketplace_country_created/updated/deleted.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0043_mp_countries"
down_revision: Union[str, None] = "0042_tenant_banner"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLE = "marketplace_countries"
_INDEX = "idx_marketplace_countries_enabled_order"

# Seed only the five GCC markets we go live with first. Platform admin can
# add more (Oman, Egypt, India, …) via the admin UI later.
_SEED_ROWS = [
    ("AE", "United Arab Emirates", "\U0001f1e6\U0001f1ea", 10),
    ("SA", "Saudi Arabia",         "\U0001f1f8\U0001f1e6", 20),
    ("QA", "Qatar",                "\U0001f1f6\U0001f1e6", 30),
    ("BH", "Bahrain",              "\U0001f1e7\U0001f1ed", 40),
    ("KW", "Kuwait",               "\U0001f1f0\U0001f1fc", 50),
]


def _add_audit_value(conn: sa.engine.Connection, value: str) -> None:
    conn.execute(sa.text(
        f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{value}'"
    ))


def upgrade() -> None:
    # ------------------------------------------------------------------
    # 1. Create marketplace_countries table
    # ------------------------------------------------------------------
    op.create_table(
        _TABLE,
        sa.Column(
            "id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("code", sa.String(2), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("flag_emoji", sa.String(8), nullable=False),
        sa.Column(
            "display_order",
            sa.Integer(),
            nullable=False,
            server_default="100",
        ),
        sa.Column(
            "enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("code", name="uq_marketplace_countries_code"),
        sa.CheckConstraint(
            "code ~ '^[A-Z]{2}$'",
            name="ck_marketplace_countries_code_format",
        ),
    )

    # ------------------------------------------------------------------
    # 2. Composite index used by GET /marketplace/countries
    # ------------------------------------------------------------------
    op.create_index(
        _INDEX,
        _TABLE,
        ["enabled", "display_order"],
    )

    # ------------------------------------------------------------------
    # 3. Seed — idempotent ON CONFLICT DO NOTHING
    # ------------------------------------------------------------------
    rows_sql = ", ".join(
        f"('{code}', '{name}', '{flag}', {order})"
        for code, name, flag, order in _SEED_ROWS
    )
    op.execute(sa.text(
        f"""
        INSERT INTO {_TABLE} (code, name, flag_emoji, display_order)
        VALUES {rows_sql}
        ON CONFLICT (code) DO NOTHING
        """
    ))

    # ------------------------------------------------------------------
    # 4. New audit_action enum values
    # ------------------------------------------------------------------
    conn = op.get_bind()
    _add_audit_value(conn, "marketplace_country_created")
    _add_audit_value(conn, "marketplace_country_updated")
    _add_audit_value(conn, "marketplace_country_deleted")


def downgrade() -> None:
    op.drop_index(_INDEX, table_name=_TABLE)
    op.drop_table(_TABLE)
    # Enum values left in place (project convention).
