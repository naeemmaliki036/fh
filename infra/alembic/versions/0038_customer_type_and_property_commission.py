"""customer_type_and_property_commission

Revision ID: 0038_customer_type_commission
Revises: 0037_customer_detail_feature
Create Date: 2026-05-16 00:00:00.000000

Changes:
1. New enum: customer_type (individual, company)
2. Extend customers: customer_type (NOT NULL, default individual),
   company_trade_license, contact_person_name, contact_person_designation
3. Extend property_agents: commission_override_type, commission_override_value
   + CHECK constraint (both-or-neither)
4. Extend audit_action enum with 3 new values:
   customer_type_changed, property_commission_override_set,
   property_commission_override_cleared
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0038_customer_type_commission"
down_revision: Union[str, None] = "0037_customer_detail_feature"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ------------------------------------------------------------------
    # 1. New enum: customer_type
    # DO block guards against the type already existing (idempotent).
    # ------------------------------------------------------------------
    conn.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE customer_type AS ENUM ('individual', 'company');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """))

    # ------------------------------------------------------------------
    # 2. Extend customers table
    # ------------------------------------------------------------------

    # Step 1: add customer_type as nullable so existing rows don't
    # violate NOT NULL until backfill is done.
    op.add_column(
        "customers",
        sa.Column(
            "customer_type",
            postgresql.ENUM(
                "individual",
                "company",
                name="customer_type",
                create_type=False,
            ),
            nullable=True,
        ),
    )

    # Step 2: backfill all existing rows to 'individual'.
    conn.execute(
        sa.text(
            "UPDATE customers SET customer_type = 'individual' "
            "WHERE customer_type IS NULL"
        )
    )

    # Step 3: enforce NOT NULL + set server default.
    op.alter_column(
        "customers",
        "customer_type",
        existing_type=postgresql.ENUM(
            "individual",
            "company",
            name="customer_type",
            create_type=False,
        ),
        nullable=False,
        server_default="individual",
    )

    # Company-specific nullable columns — no backfill needed.
    op.add_column(
        "customers",
        sa.Column("company_trade_license", sa.String(64), nullable=True),
    )
    op.add_column(
        "customers",
        sa.Column("contact_person_name", sa.String(255), nullable=True),
    )
    op.add_column(
        "customers",
        sa.Column("contact_person_designation", sa.String(128), nullable=True),
    )

    # ------------------------------------------------------------------
    # 3. Extend property_agents table
    # ------------------------------------------------------------------
    op.add_column(
        "property_agents",
        sa.Column(
            "commission_override_type",
            postgresql.ENUM(
                "percentage",
                "fixed",
                name="commission_type",
                create_type=False,
            ),
            nullable=True,
        ),
    )
    op.add_column(
        "property_agents",
        sa.Column(
            "commission_override_value",
            sa.Numeric(12, 2),
            nullable=True,
        ),
    )
    op.create_check_constraint(
        "ck_property_agents_commission_override_both_or_neither",
        "property_agents",
        "(commission_override_type IS NULL AND commission_override_value IS NULL)"
        " OR "
        "(commission_override_type IS NOT NULL"
        " AND commission_override_value IS NOT NULL)",
    )

    # ------------------------------------------------------------------
    # 4. Extend audit_action enum with 3 new values
    # Each ALTER TYPE ADD VALUE runs outside an explicit transaction;
    # IF NOT EXISTS is safe for re-runs.
    # ------------------------------------------------------------------
    conn.execute(sa.text(
        "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'customer_type_changed'"
    ))
    conn.execute(sa.text(
        "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS "
        "'property_commission_override_set'"
    ))
    conn.execute(sa.text(
        "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS "
        "'property_commission_override_cleared'"
    ))


def downgrade() -> None:
    # ------------------------------------------------------------------
    # 3. Revert property_agents columns + constraint
    # ------------------------------------------------------------------
    op.drop_constraint(
        "ck_property_agents_commission_override_both_or_neither",
        "property_agents",
        type_="check",
    )
    op.drop_column("property_agents", "commission_override_value")
    op.drop_column("property_agents", "commission_override_type")

    # ------------------------------------------------------------------
    # 2. Revert customers columns
    # ------------------------------------------------------------------
    op.drop_column("customers", "contact_person_designation")
    op.drop_column("customers", "contact_person_name")
    op.drop_column("customers", "company_trade_license")
    op.drop_column("customers", "customer_type")

    # ------------------------------------------------------------------
    # 1. Drop customer_type enum
    # ------------------------------------------------------------------
    op.execute("DROP TYPE IF EXISTS customer_type")

    # audit_action enum values cannot be removed in Postgres without
    # type recreation — downgrade is a no-op for those additions.
