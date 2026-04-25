"""customer

Revision ID: 0004_customer
Revises: 0003_agent_and_private_document
Create Date: 2026-04-25 00:00:03.000000

Hand-written migration:
  - 2 new Postgres enum types: customer_source, customer_status.
  - customers table with all indexes.
  - Partial unique index on (tenant_id, phone_normalized) WHERE phone_normalized
    IS NOT NULL — autogenerate cannot produce partial indexes, so raw SQL is used.
  - RLS policy mirroring the pattern on agents / private_documents.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004_customer"
down_revision: Union[str, None] = "0003_agent_and_private_document"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ------------------------------------------------------------------
    # 1. Enum types
    # ------------------------------------------------------------------
    conn.execute(sa.text(
        "CREATE TYPE customer_source AS ENUM "
        "('portal', 'website', 'manual', 'import', 'referral', 'walk_in', 'other')"
    ))
    conn.execute(sa.text(
        "CREATE TYPE customer_status AS ENUM "
        "('active', 'inactive', 'blacklisted')"
    ))

    # ------------------------------------------------------------------
    # 2. customers table
    # ------------------------------------------------------------------
    conn.execute(sa.text("""
        CREATE TABLE customers (
            id                   UUID             PRIMARY KEY
                                                  DEFAULT gen_random_uuid(),
            tenant_id            UUID             NOT NULL
                                                  REFERENCES tenants(id)
                                                  ON DELETE CASCADE,
            full_name            VARCHAR(255)     NOT NULL,
            email                VARCHAR(255),
            phone                VARCHAR(32),
            phone_normalized     VARCHAR(32),
            nationality          VARCHAR(8),
            language             VARCHAR(8),
            preferred_currency   VARCHAR(8),
            source               customer_source  NOT NULL DEFAULT 'manual',
            status               customer_status  NOT NULL DEFAULT 'active',
            notes                TEXT,
            assigned_agent_id    UUID             REFERENCES agents(id)
                                                  ON DELETE SET NULL,
            created_by_user_id   UUID             REFERENCES users(id)
                                                  ON DELETE SET NULL,
            created_at           TIMESTAMPTZ      NOT NULL DEFAULT now(),
            updated_at           TIMESTAMPTZ      NOT NULL DEFAULT now()
        )
    """))

    # ------------------------------------------------------------------
    # 3. Indexes
    # ------------------------------------------------------------------

    # TenantMixin FK — always needed.
    conn.execute(sa.text(
        "CREATE INDEX ix_customers_tenant_id "
        "ON customers (tenant_id)"
    ))

    # Partial unique: phone dedup within tenant, skipping NULL phones.
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX uq_customers_tenant_phone_normalized "
        "ON customers (tenant_id, phone_normalized) "
        "WHERE phone_normalized IS NOT NULL"
    ))

    # Email lookup (non-unique — see model docstring).
    conn.execute(sa.text(
        "CREATE INDEX ix_customers_tenant_email "
        "ON customers (tenant_id, email)"
    ))

    # Status filter ("show active customers").
    conn.execute(sa.text(
        "CREATE INDEX ix_customers_tenant_status "
        "ON customers (tenant_id, status)"
    ))

    # Agent workload view ("customers assigned to agent X").
    conn.execute(sa.text(
        "CREATE INDEX ix_customers_tenant_agent "
        "ON customers (tenant_id, assigned_agent_id)"
    ))

    # Recently added list — default sort order for customer lists.
    conn.execute(sa.text(
        "CREATE INDEX ix_customers_tenant_created "
        "ON customers (tenant_id, created_at DESC)"
    ))

    # ------------------------------------------------------------------
    # 4. Row-Level Security
    # ------------------------------------------------------------------
    conn.execute(sa.text("ALTER TABLE customers ENABLE ROW LEVEL SECURITY"))
    conn.execute(sa.text("""
        CREATE POLICY tenant_isolation ON customers
            USING (
                tenant_id = current_setting('app.tenant_id', true)::uuid
            )
            WITH CHECK (
                tenant_id = current_setting('app.tenant_id', true)::uuid
            )
    """))


def downgrade() -> None:
    conn = op.get_bind()

    conn.execute(sa.text(
        "DROP POLICY IF EXISTS tenant_isolation ON customers"
    ))
    conn.execute(sa.text(
        "ALTER TABLE customers DISABLE ROW LEVEL SECURITY"
    ))
    conn.execute(sa.text("DROP TABLE IF EXISTS customers"))

    conn.execute(sa.text("DROP TYPE IF EXISTS customer_status"))
    conn.execute(sa.text("DROP TYPE IF EXISTS customer_source"))
