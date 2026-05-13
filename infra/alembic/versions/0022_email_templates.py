"""email_templates

Revision ID: 0022_email_templates
Revises: 0021_listing_price_history
Create Date: 2026-05-13 00:00:22.000000

Creates email_templates table.
  - tenant_id NULL  => platform-level template (shared across all tenants)
  - tenant_id NOT NULL => tenant-specific override

Unique constraints:
  - (key) WHERE tenant_id IS NULL       (platform templates, one per key)
  - (tenant_id, key) WHERE tenant_id IS NOT NULL  (per-tenant overrides)
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0022_email_templates"
down_revision: Union[str, None] = "0021_listing_price_history"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("""
        CREATE TABLE email_templates (
            id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id   UUID        REFERENCES tenants(id) ON DELETE CASCADE,
            key         TEXT        NOT NULL,
            name        TEXT        NOT NULL,
            subject     TEXT        NOT NULL,
            body_html   TEXT        NOT NULL,
            body_text   TEXT,
            variables   JSONB       NOT NULL DEFAULT '{}'::jsonb,
            active      BOOLEAN     NOT NULL DEFAULT true,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """))
    # Platform-level templates: one per key where tenant_id IS NULL.
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX uq_email_templates_platform_key "
        "ON email_templates (key) WHERE tenant_id IS NULL"
    ))
    # Tenant-level templates: one per (tenant_id, key).
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX uq_email_templates_tenant_key "
        "ON email_templates (tenant_id, key) WHERE tenant_id IS NOT NULL"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_email_templates_tenant_id "
        "ON email_templates (tenant_id) WHERE tenant_id IS NOT NULL"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_email_templates_key ON email_templates (key)"
    ))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DROP TABLE IF EXISTS email_templates"))
