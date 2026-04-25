"""lead

Revision ID: 0006_lead
Revises: 0005_property_listing_media
Create Date: 2026-04-25 00:00:05.000000

Hand-written migration:
  - 2 new Postgres enum types: lead_stage, lead_activity_kind.
  - `source` column reuses the existing customer_source enum (no new type).
  - leads and lead_activities tables with all indexes.
  - Partial index on leads.next_action_at WHERE NOT NULL.
  - RLS on both tables.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006_lead"
down_revision: Union[str, None] = "0005_property_listing_media"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ------------------------------------------------------------------
    # 1. Enum types — customer_source already exists, do NOT recreate it.
    # ------------------------------------------------------------------
    conn.execute(sa.text(
        "CREATE TYPE lead_stage AS ENUM "
        "('new','contacted','qualified','viewing','offer','won','lost')"
    ))
    conn.execute(sa.text(
        "CREATE TYPE lead_activity_kind AS ENUM "
        "('note','stage_changed','assignment_changed','contact_made',"
        "'viewing_scheduled','viewing_completed','offer_made',"
        "'offer_accepted','offer_rejected','other')"
    ))

    # ------------------------------------------------------------------
    # 2. leads table
    # ------------------------------------------------------------------
    conn.execute(sa.text("""
        CREATE TABLE leads (
            id                    UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id             UUID            NOT NULL
                                                  REFERENCES tenants(id)    ON DELETE CASCADE,
            customer_id           UUID            NOT NULL
                                                  REFERENCES customers(id)  ON DELETE CASCADE,
            source                customer_source NOT NULL,
            stage                 lead_stage      NOT NULL DEFAULT 'new',
            assigned_agent_id     UUID            REFERENCES agents(id)     ON DELETE SET NULL,
            assigned_at           TIMESTAMPTZ,
            interest_property_id  UUID            REFERENCES properties(id) ON DELETE SET NULL,
            interest_listing_id   UUID            REFERENCES listings(id)   ON DELETE SET NULL,
            notes                 TEXT,
            next_action_at        TIMESTAMPTZ,
            closed_at             TIMESTAMPTZ,
            created_by_user_id    UUID            REFERENCES users(id)      ON DELETE SET NULL,
            created_at            TIMESTAMPTZ     NOT NULL DEFAULT now(),
            updated_at            TIMESTAMPTZ     NOT NULL DEFAULT now()
        )
    """))

    conn.execute(sa.text(
        "CREATE INDEX ix_leads_tenant_id ON leads (tenant_id)"
    ))
    # Pipeline view: all leads in a given stage.
    conn.execute(sa.text(
        "CREATE INDEX ix_leads_tenant_stage ON leads (tenant_id, stage)"
    ))
    # Agent's personal pipeline.
    conn.execute(sa.text(
        "CREATE INDEX ix_leads_tenant_agent_stage "
        "ON leads (tenant_id, assigned_agent_id, stage)"
    ))
    # All leads for a customer.
    conn.execute(sa.text(
        "CREATE INDEX ix_leads_tenant_customer "
        "ON leads (tenant_id, customer_id)"
    ))
    # Due follow-ups — partial: only rows with a reminder set.
    conn.execute(sa.text(
        "CREATE INDEX ix_leads_tenant_next_action "
        "ON leads (tenant_id, next_action_at) "
        "WHERE next_action_at IS NOT NULL"
    ))
    # Default sort for lead lists.
    conn.execute(sa.text(
        "CREATE INDEX ix_leads_tenant_created "
        "ON leads (tenant_id, created_at DESC)"
    ))

    conn.execute(sa.text("ALTER TABLE leads ENABLE ROW LEVEL SECURITY"))
    conn.execute(sa.text("""
        CREATE POLICY tenant_isolation ON leads
            USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid)
    """))

    # ------------------------------------------------------------------
    # 3. lead_activities table (append-only timeline)
    # ------------------------------------------------------------------
    conn.execute(sa.text("""
        CREATE TABLE lead_activities (
            id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id       UUID                NOT NULL
                                                REFERENCES tenants(id) ON DELETE CASCADE,
            lead_id         UUID                NOT NULL
                                                REFERENCES leads(id)   ON DELETE CASCADE,
            kind            lead_activity_kind  NOT NULL,
            description     TEXT,
            metadata        JSONB,
            actor_user_id   UUID                REFERENCES users(id)   ON DELETE SET NULL,
            created_at      TIMESTAMPTZ         NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ         NOT NULL DEFAULT now()
        )
    """))

    conn.execute(sa.text(
        "CREATE INDEX ix_lead_activities_tenant_id "
        "ON lead_activities (tenant_id)"
    ))
    # Primary read: timeline for a lead, newest first.
    conn.execute(sa.text(
        "CREATE INDEX ix_lead_activities_lead_created "
        "ON lead_activities (tenant_id, lead_id, created_at DESC)"
    ))

    conn.execute(sa.text(
        "ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY"
    ))
    conn.execute(sa.text("""
        CREATE POLICY tenant_isolation ON lead_activities
            USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid)
    """))


def downgrade() -> None:
    conn = op.get_bind()

    for table in ("lead_activities", "leads"):
        conn.execute(sa.text(
            f"DROP POLICY IF EXISTS tenant_isolation ON {table}"
        ))
        conn.execute(sa.text(
            f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY"
        ))

    conn.execute(sa.text("DROP TABLE IF EXISTS lead_activities"))
    conn.execute(sa.text("DROP TABLE IF EXISTS leads"))

    conn.execute(sa.text("DROP TYPE IF EXISTS lead_activity_kind"))
    conn.execute(sa.text("DROP TYPE IF EXISTS lead_stage"))
