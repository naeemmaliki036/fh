"""listing_documents

Revision ID: 0025_listing_documents
Revises: 0024_platform_role_support_admin
Create Date: 2026-05-13 00:00:25.000000

Creates listing_documents table for public-facing PDFs associated with
a listing (brochures, floor plans, payment plans, etc.).
Storage is Cloudflare R2; storage_key is the R2 object path.

kind values (text): brochure / floor_plan / payment_plan / other
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0025_listing_documents"
down_revision: Union[str, None] = "0024_platform_role_support_admin"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("""
        CREATE TABLE listing_documents (
            id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id           UUID        NOT NULL
                                            REFERENCES tenants(id)  ON DELETE CASCADE,
            listing_id          UUID        NOT NULL
                                            REFERENCES listings(id) ON DELETE CASCADE,
            storage_key         TEXT        NOT NULL,
            file_name           TEXT        NOT NULL,
            mime_type           TEXT        NOT NULL,
            size_bytes          BIGINT      NOT NULL,
            kind                TEXT        NOT NULL,
            uploaded_by_user_id UUID
                                            REFERENCES users(id) ON DELETE SET NULL,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """))
    conn.execute(sa.text(
        "CREATE INDEX ix_listing_docs_tenant_listing_created "
        "ON listing_documents (tenant_id, listing_id, created_at DESC)"
    ))
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX uq_listing_docs_storage_key "
        "ON listing_documents (storage_key)"
    ))
    conn.execute(sa.text(
        "ALTER TABLE listing_documents ENABLE ROW LEVEL SECURITY"
    ))
    conn.execute(sa.text("""
        CREATE POLICY tenant_isolation ON listing_documents
            USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid)
    """))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "DROP POLICY IF EXISTS tenant_isolation ON listing_documents"
    ))
    conn.execute(sa.text(
        "ALTER TABLE listing_documents DISABLE ROW LEVEL SECURITY"
    ))
    conn.execute(sa.text("DROP TABLE IF EXISTS listing_documents"))
