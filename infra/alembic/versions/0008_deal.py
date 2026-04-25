"""deal

Revision ID: 0008_deal
Revises: 0007_document_request
Create Date: 2026-04-25 00:00:07.000000

Hand-written migration:
  - 3 new Postgres enum types: deal_type, deal_stage, commission_payout_status.
  - commission_type is reused from migration 0003 (no new type needed).
  - deals table with all indexes and RLS.
  - Deferred FK: ALTER TABLE document_requests ADD CONSTRAINT
    document_requests_deal_id_fkey FOREIGN KEY (deal_id)
    REFERENCES deals(id) ON DELETE SET NULL.
    This was promised in migration 0007 comments.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0008_deal"
down_revision: Union[str, None] = "0007_document_request"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ------------------------------------------------------------------
    # 1. New enum types
    # commission_type already exists from migration 0003 — do NOT recreate.
    # ------------------------------------------------------------------
    conn.execute(sa.text(
        "CREATE TYPE deal_type AS ENUM ('sale','rent_short','rent_long')"
    ))
    conn.execute(sa.text(
        "CREATE TYPE deal_stage AS ENUM "
        "('initiated','documents_pending','deposit_pending',"
        "'closed_won','closed_lost','canceled')"
    ))
    conn.execute(sa.text(
        "CREATE TYPE commission_payout_status AS ENUM "
        "('pending','partial','paid','canceled')"
    ))

    # ------------------------------------------------------------------
    # 2. deals table
    # ------------------------------------------------------------------
    conn.execute(sa.text("""
        CREATE TABLE deals (
            id                          UUID          PRIMARY KEY
                                                      DEFAULT gen_random_uuid(),
            tenant_id                   UUID          NOT NULL
                                                      REFERENCES tenants(id)
                                                      ON DELETE CASCADE,
            deal_type                   deal_type     NOT NULL,
            customer_id                 UUID          NOT NULL
                                                      REFERENCES customers(id)
                                                      ON DELETE RESTRICT,
            property_id                 UUID          NOT NULL
                                                      REFERENCES properties(id)
                                                      ON DELETE RESTRICT,
            listing_id                  UUID
                                        REFERENCES listings(id) ON DELETE SET NULL,
            primary_agent_id            UUID          NOT NULL
                                                      REFERENCES agents(id)
                                                      ON DELETE RESTRICT,
            lead_id                     UUID
                                        REFERENCES leads(id) ON DELETE SET NULL,
            stage                       deal_stage    NOT NULL DEFAULT 'initiated',
            transaction_value           NUMERIC(14,2) NOT NULL,
            transaction_currency        VARCHAR(8)    NOT NULL,
            expected_close_at           DATE,
            closed_at                   TIMESTAMPTZ,
            notes                       TEXT,
            commission_type             commission_type        NOT NULL,
            commission_value            NUMERIC(14,4)          NOT NULL,
            commission_overridden       BOOLEAN                NOT NULL DEFAULT false,
            commission_override_reason  TEXT,
            commission_payout_status    commission_payout_status NOT NULL DEFAULT 'pending',
            commission_paid_amount      NUMERIC(14,2)          NOT NULL DEFAULT 0,
            commission_paid_at          TIMESTAMPTZ,
            created_by_user_id          UUID
                                        REFERENCES users(id) ON DELETE SET NULL,
            created_at                  TIMESTAMPTZ   NOT NULL DEFAULT now(),
            updated_at                  TIMESTAMPTZ   NOT NULL DEFAULT now()
        )
    """))

    # Indexes
    conn.execute(sa.text(
        "CREATE INDEX ix_deals_tenant_id ON deals (tenant_id)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_deals_tenant_stage ON deals (tenant_id, stage)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_deals_tenant_agent_stage "
        "ON deals (tenant_id, primary_agent_id, stage)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_deals_tenant_customer ON deals (tenant_id, customer_id)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_deals_tenant_property ON deals (tenant_id, property_id)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_deals_tenant_type ON deals (tenant_id, deal_type)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_deals_tenant_expected_close "
        "ON deals (tenant_id, expected_close_at)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_deals_tenant_created ON deals (tenant_id, created_at DESC)"
    ))

    # RLS
    conn.execute(sa.text("ALTER TABLE deals ENABLE ROW LEVEL SECURITY"))
    conn.execute(sa.text("""
        CREATE POLICY tenant_isolation ON deals
            USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid)
    """))

    # ------------------------------------------------------------------
    # 3. Deferred FK: document_requests.deal_id → deals.id
    # Promised in migration 0007 — now that deals exists, wire it up.
    # ------------------------------------------------------------------
    conn.execute(sa.text(
        "ALTER TABLE document_requests "
        "ADD CONSTRAINT document_requests_deal_id_fkey "
        "FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL"
    ))


def downgrade() -> None:
    conn = op.get_bind()

    # Remove the deferred FK first.
    conn.execute(sa.text(
        "ALTER TABLE document_requests "
        "DROP CONSTRAINT IF EXISTS document_requests_deal_id_fkey"
    ))

    conn.execute(sa.text(
        "DROP POLICY IF EXISTS tenant_isolation ON deals"
    ))
    conn.execute(sa.text("ALTER TABLE deals DISABLE ROW LEVEL SECURITY"))
    conn.execute(sa.text("DROP TABLE IF EXISTS deals"))

    conn.execute(sa.text("DROP TYPE IF EXISTS commission_payout_status"))
    conn.execute(sa.text("DROP TYPE IF EXISTS deal_stage"))
    conn.execute(sa.text("DROP TYPE IF EXISTS deal_type"))
