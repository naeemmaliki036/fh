"""tenant_commission_rates

Revision ID: 0049_tenant_commission_rates
Revises: 0048_consumer_listing_moderation
Create Date: 2026-05-18 00:00:00.000000

Changes:
1. New Postgres enum: commission_rate_transaction_type (sale, rent_long, rent_short,
   off_plan).  Created idempotently via DO $$ ... EXCEPTION WHEN duplicate_object.
2. New table: tenant_commission_rates — one row per (tenant, transaction_type) pair
   storing the company's earned commission rate as NUMERIC(5,4).
3. audit_action enum: tenant_commission_rate_created, tenant_commission_rate_updated.
4. Seed default rates for every existing active tenant (skips propertypoint-direct).
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0049_tenant_commission_rates"
down_revision: Union[str, None] = "0048_consumer_listing_moderation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLE = "tenant_commission_rates"
_IDX_TENANT = "idx_tenant_commission_rates_tenant_id"
_ENUM = "commission_rate_transaction_type"


def upgrade() -> None:
    conn = op.get_bind()

    # ------------------------------------------------------------------
    # 1. New enum: commission_rate_transaction_type — idempotent DO block
    # ------------------------------------------------------------------
    conn.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE commission_rate_transaction_type AS ENUM (
                'sale',
                'rent_long',
                'rent_short',
                'off_plan'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """))

    # ------------------------------------------------------------------
    # 2. tenant_commission_rates table
    # ------------------------------------------------------------------
    op.create_table(
        _TABLE,
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "transaction_type",
            postgresql.ENUM(
                "sale",
                "rent_long",
                "rent_short",
                "off_plan",
                name=_ENUM,
                create_type=False,
            ),
            nullable=False,
        ),
        # Stored as a decimal fraction: 0.0200 = 2%.
        # App layer enforces 0.0010 ≤ rate ≤ 0.1000; DB enforces rate > 0.
        sa.Column("rate", sa.Numeric(5, 4), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "updated_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
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
        sa.UniqueConstraint(
            "tenant_id",
            "transaction_type",
            name="uq_tenant_commission_rates_tenant_type",
        ),
        sa.CheckConstraint(
            "rate > 0",
            name="ck_tenant_commission_rates_rate_positive",
        ),
    )

    # Index on tenant_id for fast per-tenant lookups (UNIQUE already covers the
    # composite, but a plain index on tenant_id alone speeds up the common
    # "load all rates for a tenant" query without requiring the type predicate).
    op.create_index(_IDX_TENANT, _TABLE, ["tenant_id"])

    # ------------------------------------------------------------------
    # 3. audit_action enum — ADD VALUE IF NOT EXISTS (safe on live DB)
    # ------------------------------------------------------------------
    for val in (
        "tenant_commission_rate_created",
        "tenant_commission_rate_updated",
    ):
        op.execute(
            f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{val}'"
        )

    # ------------------------------------------------------------------
    # 4. Seed default rates for all existing tenants
    #    Skip propertypoint-direct — consumer marketplace, no agent commissions.
    #    Idempotent: INSERT … WHERE NOT EXISTS so re-runs are safe.
    # ------------------------------------------------------------------
    defaults = [
        ("sale",       "0.0200"),
        ("rent_long",  "0.0500"),
        ("rent_short", "0.1000"),
        ("off_plan",   "0.0300"),
    ]
    for tx_type, rate in defaults:
        conn.execute(sa.text(f"""
            INSERT INTO {_TABLE} (tenant_id, transaction_type, rate)
            SELECT t.id, '{tx_type}'::commission_rate_transaction_type, {rate}
            FROM tenants t
            WHERE t.slug != 'propertypoint-direct'
              AND NOT EXISTS (
                  SELECT 1 FROM {_TABLE} tcr
                  WHERE tcr.tenant_id = t.id
                    AND tcr.transaction_type = '{tx_type}'::commission_rate_transaction_type
              )
        """))


def downgrade() -> None:
    op.drop_index(_IDX_TENANT, table_name=_TABLE)
    op.drop_table(_TABLE)
    op.execute(f"DROP TYPE IF EXISTS {_ENUM}")
    # audit_action values intentionally left in place — Postgres does not
    # support ALTER TYPE ... DROP VALUE on a live enum.
