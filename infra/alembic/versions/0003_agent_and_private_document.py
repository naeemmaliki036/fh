"""agent_and_private_document

Revision ID: 0003_agent_and_private_document
Revises: 0002_audit_log
Create Date: 2026-04-25 00:00:02.000000

Hand-written migration:
  - 4 new Postgres enum types.
  - agents table with RLS.
  - private_documents table with RLS.

RLS on agents / private_documents:
  Both tables use strict tenant isolation — tenant_id is NOT NULL here, so
  the simpler USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  is sufficient. The `, true` still makes the GUC missing-safe (returns NULL
  if unset), which causes the USING expression to be NULL, blocking all rows
  for sessions that forgot to SET LOCAL app.tenant_id — correct behaviour.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_agent_and_private_document"
down_revision: Union[str, None] = "0002_audit_log"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ------------------------------------------------------------------
    # 1. Enum types
    # ------------------------------------------------------------------
    conn.execute(sa.text(
        "CREATE TYPE agent_status AS ENUM ('active', 'inactive', 'on_leave')"
    ))
    conn.execute(sa.text(
        "CREATE TYPE commission_type AS ENUM ('percentage', 'fixed')"
    ))
    conn.execute(sa.text(
        "CREATE TYPE private_document_entity_type AS ENUM "
        "('agent', 'customer', 'deal', 'tenant')"
    ))
    conn.execute(sa.text(
        "CREATE TYPE private_document_kind AS ENUM "
        "('rera_id', 'passport', 'emirates_id', 'trade_license', "
        "'noc', 'contract', 'kyc', 'other')"
    ))

    # ------------------------------------------------------------------
    # 2. agents table
    # ------------------------------------------------------------------
    conn.execute(sa.text("""
        CREATE TABLE agents (
            id                       UUID           PRIMARY KEY
                                                    DEFAULT gen_random_uuid(),
            tenant_id                UUID           NOT NULL
                                                    REFERENCES tenants(id)
                                                    ON DELETE CASCADE,
            full_name                VARCHAR(255)   NOT NULL,
            email                    VARCHAR(255)   NOT NULL,
            phone                    VARCHAR(32),
            photo_key                VARCHAR(512),
            license_id               VARCHAR(64),
            license_expiry_at        DATE,
            status                   agent_status   NOT NULL DEFAULT 'active',
            default_commission_type  commission_type NOT NULL DEFAULT 'percentage',
            default_commission_value NUMERIC(12,4)  NOT NULL DEFAULT 0,
            linked_user_id           UUID           REFERENCES users(id)
                                                    ON DELETE SET NULL,
            created_at               TIMESTAMPTZ    NOT NULL DEFAULT now(),
            updated_at               TIMESTAMPTZ    NOT NULL DEFAULT now()
        )
    """))

    conn.execute(sa.text(
        "CREATE UNIQUE INDEX uq_agents_tenant_email "
        "ON agents (tenant_id, email)"
    ))
    # TenantMixin FK index.
    conn.execute(sa.text(
        "CREATE INDEX ix_agents_tenant_id ON agents (tenant_id)"
    ))
    # "Show active agents for tenant" — common list query.
    conn.execute(sa.text(
        "CREATE INDEX ix_agents_tenant_status "
        "ON agents (tenant_id, status)"
    ))
    # "Licenses expiring within 30 days" alert query.
    conn.execute(sa.text(
        "CREATE INDEX ix_agents_tenant_license_expiry "
        "ON agents (tenant_id, license_expiry_at)"
    ))

    conn.execute(sa.text("ALTER TABLE agents ENABLE ROW LEVEL SECURITY"))
    conn.execute(sa.text("""
        CREATE POLICY tenant_isolation ON agents
            USING (
                tenant_id = current_setting('app.tenant_id', true)::uuid
            )
            WITH CHECK (
                tenant_id = current_setting('app.tenant_id', true)::uuid
            )
    """))

    # ------------------------------------------------------------------
    # 3. private_documents table
    # ------------------------------------------------------------------
    conn.execute(sa.text("""
        CREATE TABLE private_documents (
            id                           UUID        PRIMARY KEY
                                                     DEFAULT gen_random_uuid(),
            tenant_id                    UUID        NOT NULL
                                                     REFERENCES tenants(id)
                                                     ON DELETE CASCADE,
            entity_type                  private_document_entity_type NOT NULL,
            entity_id                    UUID        NOT NULL,
            kind                         private_document_kind        NOT NULL,
            storage_key                  VARCHAR(1024) NOT NULL,
            original_filename            VARCHAR(512)  NOT NULL,
            mime_type                    VARCHAR(128)  NOT NULL,
            size_bytes                   BIGINT        NOT NULL,
            uploaded_by_user_id          UUID
                                         REFERENCES users(id)
                                         ON DELETE SET NULL,
            uploaded_by_platform_user_id UUID
                                         REFERENCES platform_users(id)
                                         ON DELETE SET NULL,
            created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """))

    # Globally unique S3 key — bucket-level enforcement + DB guard.
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX uq_private_documents_storage_key "
        "ON private_documents (storage_key)"
    ))
    # TenantMixin FK index.
    conn.execute(sa.text(
        "CREATE INDEX ix_private_documents_tenant_id "
        "ON private_documents (tenant_id)"
    ))
    # Primary read path: "all documents for this agent/deal/customer".
    conn.execute(sa.text(
        "CREATE INDEX ix_private_documents_entity "
        "ON private_documents (tenant_id, entity_type, entity_id)"
    ))

    conn.execute(sa.text(
        "ALTER TABLE private_documents ENABLE ROW LEVEL SECURITY"
    ))
    conn.execute(sa.text("""
        CREATE POLICY tenant_isolation ON private_documents
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
        "DROP POLICY IF EXISTS tenant_isolation ON private_documents"
    ))
    conn.execute(sa.text(
        "ALTER TABLE private_documents DISABLE ROW LEVEL SECURITY"
    ))
    conn.execute(sa.text("DROP TABLE IF EXISTS private_documents"))

    conn.execute(sa.text(
        "DROP POLICY IF EXISTS tenant_isolation ON agents"
    ))
    conn.execute(sa.text(
        "ALTER TABLE agents DISABLE ROW LEVEL SECURITY"
    ))
    conn.execute(sa.text("DROP TABLE IF EXISTS agents"))

    conn.execute(sa.text("DROP TYPE IF EXISTS private_document_kind"))
    conn.execute(sa.text("DROP TYPE IF EXISTS private_document_entity_type"))
    conn.execute(sa.text("DROP TYPE IF EXISTS commission_type"))
    conn.execute(sa.text("DROP TYPE IF EXISTS agent_status"))
