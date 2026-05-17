"""price_validation_rules

Revision ID: 0047_price_rules
Revises: 0046_country_hero
Create Date: 2026-05-17 00:00:00.000000

Changes:
1. New table price_validation_rules — platform-admin-managed price floors/ceilings.
2. Composite lookup index + order index.
3. Partial unique constraint for idempotent seeds.
4. Seed 6 base rows for UAE market.
5. audit_action enum: price_rule_created/updated/deleted + price_validation_failed.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0047_price_rules"
down_revision: Union[str, None] = "0046_country_hero"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLE = "price_validation_rules"
_IDX_LOOKUP = "idx_price_rules_lookup"
_IDX_ORDER = "idx_price_rules_order"
_UNIQ = "uq_price_rules_scope_currency"


def upgrade() -> None:
    op.create_table(
        _TABLE,
        sa.Column(
            "id",
            sa.UUID(),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("country", sa.String(2), nullable=True),
        sa.Column("city", sa.String(120), nullable=True),
        sa.Column("purpose", sa.String(32), nullable=True),
        sa.Column(
            "currency",
            sa.String(8),
            nullable=False,
            server_default="AED",
        ),
        sa.Column("min_amount", sa.Numeric(14, 2), nullable=True),
        sa.Column("max_amount", sa.Numeric(14, 2), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "enabled",
            sa.Boolean(),
            nullable=False,
            server_default="true",
        ),
        sa.Column(
            "display_order",
            sa.Integer(),
            nullable=False,
            server_default="100",
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
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            "min_amount IS NOT NULL OR max_amount IS NOT NULL",
            name="ck_price_rules_one_bound",
        ),
        sa.CheckConstraint(
            "min_amount IS NULL OR max_amount IS NULL OR max_amount >= min_amount",
            name="ck_price_rules_range",
        ),
        sa.CheckConstraint(
            "country IS NULL OR country ~ '^[A-Z]{2}$'",
            name="ck_price_rules_country_iso2",
        ),
        sa.CheckConstraint(
            "purpose IS NULL OR purpose IN ('sale','rent_long','rent_short')",
            name="ck_price_rules_purpose_value",
        ),
    )

    # Partial unique constraint so idempotent seeds can use ON CONFLICT DO NOTHING.
    op.execute(
        f"""
        CREATE UNIQUE INDEX {_UNIQ}
        ON {_TABLE} (
            coalesce(country, ''),
            coalesce(lower(city), ''),
            coalesce(purpose, ''),
            currency
        )
        """
    )

    op.create_index(
        _IDX_LOOKUP,
        _TABLE,
        ["enabled", "country", sa.text("lower(city)"), "purpose", "currency"],
    )
    op.create_index(_IDX_ORDER, _TABLE, ["display_order"])

    # ------------------------------------------------------------------
    # audit_action enum — ADD VALUE IF NOT EXISTS (safe on live DB)
    # ------------------------------------------------------------------
    for val in (
        "price_rule_created",
        "price_rule_updated",
        "price_rule_deleted",
        "price_validation_failed",
    ):
        op.execute(
            f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{val}'"
        )

    # ------------------------------------------------------------------
    # Seed rows — idempotent via ON CONFLICT DO NOTHING on the unique index
    # ------------------------------------------------------------------
    op.execute(
        f"""
        INSERT INTO {_TABLE}
            (country, city, purpose, currency, min_amount, notes, display_order)
        VALUES
            (NULL,  NULL,        'sale',      'AED', 10000,  'Global sale floor',      10),
            ('AE',  'Dubai',     'sale',      'AED', 100000, 'Dubai sale floor',        20),
            ('AE',  'Abu Dhabi', 'sale',      'AED', 75000,  'Abu Dhabi sale floor',    30),
            ('AE',  'Sharjah',   'sale',      'AED', 50000,  'Sharjah sale floor',      40),
            ('AE',  NULL,        'rent_long', 'AED', 12000,  'UAE annual rent floor',   50),
            ('AE',  'Dubai',     'rent_long', 'AED', 24000,  'Dubai annual rent floor', 60)
        ON CONFLICT DO NOTHING
        """
    )


def downgrade() -> None:
    op.drop_index(_IDX_ORDER, table_name=_TABLE)
    op.drop_index(_IDX_LOOKUP, table_name=_TABLE)
    op.execute(f"DROP INDEX IF EXISTS {_UNIQ}")
    op.drop_table(_TABLE)
    # Enum values intentionally left in place — cannot be removed from a live PG enum.
