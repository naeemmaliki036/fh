"""email_outbox

Revision ID: 0023_email_outbox
Revises: 0022_email_templates
Create Date: 2026-05-13 00:00:23.000000

Creates email_outbox table — append-only log of outgoing emails for
reliable delivery tracking and retry logic.

status values: queued / sent / delivered / bounced / failed
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0023_email_outbox"
down_revision: Union[str, None] = "0022_email_templates"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("""
        CREATE TABLE email_outbox (
            id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id               UUID        REFERENCES tenants(id) ON DELETE SET NULL,
            recipient_email         TEXT        NOT NULL,
            template_key            TEXT        NOT NULL,
            subject_rendered        TEXT        NOT NULL,
            body_html_rendered      TEXT        NOT NULL,
            status                  TEXT        NOT NULL DEFAULT 'queued',
            provider_message_id     TEXT,
            attempts                INT         NOT NULL DEFAULT 0,
            last_error              TEXT,
            payload_json            JSONB       NOT NULL DEFAULT '{}'::jsonb,
            queued_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
            sent_at                 TIMESTAMPTZ
        )
    """))
    conn.execute(sa.text(
        "CREATE INDEX ix_email_outbox_tenant_queued "
        "ON email_outbox (tenant_id, queued_at DESC) WHERE tenant_id IS NOT NULL"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_email_outbox_status_queued "
        "ON email_outbox (status, queued_at)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_email_outbox_recipient_queued "
        "ON email_outbox (recipient_email, queued_at DESC)"
    ))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DROP TABLE IF EXISTS email_outbox"))
