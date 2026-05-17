"""Customer source attribution: agent enum value + source_agent_id column.

Lets a tenant record which agent brought a customer in (vs. who currently
manages them — that's `assigned_agent_id`). Useful for commission attribution
and reporting.

Adds:
  - `agent` value to the `customer_source` Postgres enum (idempotent).
  - `customers.source_agent_id UUID NULL` FK → agents(id) ON DELETE SET NULL.
  - Partial index on (tenant_id, source_agent_id) for fast per-agent reports.
"""

from alembic import op

revision: str = "0050_customer_source_agent"
down_revision: str | None = "0049_tenant_commission_rates"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add 'agent' value to customer_source enum (idempotent).
    op.execute("ALTER TYPE customer_source ADD VALUE IF NOT EXISTS 'agent'")

    # 2. Add the column.
    op.execute(
        "ALTER TABLE customers "
        "ADD COLUMN IF NOT EXISTS source_agent_id UUID NULL "
        "REFERENCES agents(id) ON DELETE SET NULL"
    )

    # 3. Partial index for reporting (only when set).
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_customers_source_agent "
        "ON customers (tenant_id, source_agent_id) "
        "WHERE source_agent_id IS NOT NULL"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_customers_source_agent")
    op.execute("ALTER TABLE customers DROP COLUMN IF EXISTS source_agent_id")
    # PG can't drop enum values cleanly; leave 'agent' in place.
