"""document_request

Revision ID: 0007_document_request
Revises: 0006_lead
Create Date: 2026-04-25 00:00:06.000000

Hand-written migration:
  - 1 new Postgres enum: document_request_status.
  - document_requests table.
  - document_request_items table (reuses private_document_kind).
  - RLS on both tables.

RLS / public-flow note
----------------------
The customer-facing route resolves a document_request by token, with no
tenant context set.  Phase 1 approach: the 'fh' DB role is the table owner
and bypasses RLS automatically (Postgres owner bypass).  The token column
is globally unique, so a token-only lookup cannot leak cross-tenant data.

TODO (Phase 2 hardening): create a restricted app role (no RLS bypass) and
a SECURITY DEFINER function that accepts a token, validates it, and returns
only the columns needed for the public flow — isolating the token lookup from
the rest of the session.  Until then, backend-dev must ensure the token-lookup
code path runs as the 'fh' owner role or within the existing trusted server.

deal_id FK note
---------------
document_requests.deal_id is present as a plain UUID column with no FK
constraint.  The FK to deals.id will be added in migration 0009 once the
deals table exists.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0007_document_request"
down_revision: Union[str, None] = "0006_lead"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ------------------------------------------------------------------
    # 1. Enum type
    # ------------------------------------------------------------------
    conn.execute(sa.text(
        "CREATE TYPE document_request_status AS ENUM "
        "('pending','partial','complete','expired','canceled')"
    ))

    # ------------------------------------------------------------------
    # 2. document_requests
    # ------------------------------------------------------------------
    conn.execute(sa.text("""
        CREATE TABLE document_requests (
            id                      UUID                      PRIMARY KEY
                                                              DEFAULT gen_random_uuid(),
            tenant_id               UUID                      NOT NULL
                                                              REFERENCES tenants(id)
                                                              ON DELETE CASCADE,
            customer_id             UUID                      NOT NULL
                                                              REFERENCES customers(id)
                                                              ON DELETE CASCADE,
            lead_id                 UUID
                                    REFERENCES leads(id) ON DELETE SET NULL,
            -- deal_id: FK to deals.id will be added in migration 0009.
            deal_id                 UUID,
            title                   VARCHAR(255)              NOT NULL,
            instructions            TEXT,
            token                   VARCHAR(64)               NOT NULL,
            verification_code_hash  VARCHAR(255)              NOT NULL,
            status                  document_request_status   NOT NULL DEFAULT 'pending',
            expires_at              TIMESTAMPTZ               NOT NULL,
            verified_at             TIMESTAMPTZ,
            verification_attempts   SMALLINT                  NOT NULL DEFAULT 0,
            created_by_user_id      UUID                      NOT NULL
                                                              REFERENCES users(id)
                                                              ON DELETE RESTRICT,
            created_at              TIMESTAMPTZ               NOT NULL DEFAULT now(),
            updated_at              TIMESTAMPTZ               NOT NULL DEFAULT now()
        )
    """))

    # token is globally unique — the public URL slug.
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX uq_document_requests_token "
        "ON document_requests (token)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_document_requests_tenant_id "
        "ON document_requests (tenant_id)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_document_requests_tenant_status "
        "ON document_requests (tenant_id, status)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_document_requests_tenant_customer "
        "ON document_requests (tenant_id, customer_id)"
    ))
    # For expiry sweeper jobs.
    conn.execute(sa.text(
        "CREATE INDEX ix_document_requests_tenant_expires "
        "ON document_requests (tenant_id, expires_at)"
    ))

    conn.execute(sa.text(
        "ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY"
    ))
    conn.execute(sa.text("""
        CREATE POLICY tenant_isolation ON document_requests
            USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid)
    """))

    # ------------------------------------------------------------------
    # 3. document_request_items (reuses private_document_kind enum)
    # ------------------------------------------------------------------
    conn.execute(sa.text("""
        CREATE TABLE document_request_items (
            id                    UUID                   PRIMARY KEY
                                                         DEFAULT gen_random_uuid(),
            tenant_id             UUID                   NOT NULL
                                                         REFERENCES tenants(id)
                                                         ON DELETE CASCADE,
            document_request_id   UUID                   NOT NULL
                                                         REFERENCES document_requests(id)
                                                         ON DELETE CASCADE,
            kind                  private_document_kind  NOT NULL,
            label                 VARCHAR(255)           NOT NULL,
            is_required           BOOLEAN                NOT NULL DEFAULT true,
            uploaded_document_id  UUID
                                  REFERENCES private_documents(id) ON DELETE SET NULL,
            uploaded_at           TIMESTAMPTZ,
            ordering              SMALLINT               NOT NULL DEFAULT 0,
            created_at            TIMESTAMPTZ            NOT NULL DEFAULT now(),
            updated_at            TIMESTAMPTZ            NOT NULL DEFAULT now()
        )
    """))

    conn.execute(sa.text(
        "CREATE INDEX ix_document_request_items_tenant_id "
        "ON document_request_items (tenant_id)"
    ))
    # Primary read: all items for a request, in display order.
    conn.execute(sa.text(
        "CREATE INDEX ix_document_request_items_request_ordering "
        "ON document_request_items (tenant_id, document_request_id, ordering)"
    ))
    # Reverse lookup: which item references this private document?
    conn.execute(sa.text(
        "CREATE INDEX ix_document_request_items_uploaded_doc "
        "ON document_request_items (uploaded_document_id) "
        "WHERE uploaded_document_id IS NOT NULL"
    ))

    conn.execute(sa.text(
        "ALTER TABLE document_request_items ENABLE ROW LEVEL SECURITY"
    ))
    conn.execute(sa.text("""
        CREATE POLICY tenant_isolation ON document_request_items
            USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid)
    """))


def downgrade() -> None:
    conn = op.get_bind()

    for table in ("document_request_items", "document_requests"):
        conn.execute(sa.text(
            f"DROP POLICY IF EXISTS tenant_isolation ON {table}"
        ))
        conn.execute(sa.text(
            f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY"
        ))

    conn.execute(sa.text("DROP TABLE IF EXISTS document_request_items"))
    conn.execute(sa.text("DROP TABLE IF EXISTS document_requests"))
    conn.execute(sa.text("DROP TYPE IF EXISTS document_request_status"))
