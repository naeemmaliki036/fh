"""notifications

Revision ID: 0010_notifications
Revises: 0009_tenant_contact_fields
Create Date: 2026-05-09 00:00:01.000000

Creates the notifications table for per-recipient platform-level fan-out.
One row per platform_user per event — each recipient marks-read independently.

No RLS — this table is platform-scoped, not tenant-scoped.
No tenant_id column.

Indexes:
  - (recipient_platform_user_id, read_at)       — unread count / unread list
  - (recipient_platform_user_id, created_at DESC) — recent feed
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0010_notifications"
down_revision: Union[str, None] = "0009_tenant_contact_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ------------------------------------------------------------------
    # 1. notifications table
    # ------------------------------------------------------------------
    conn.execute(sa.text("""
        CREATE TABLE notifications (
            id                          UUID            PRIMARY KEY
                                                        DEFAULT gen_random_uuid(),
            recipient_platform_user_id  UUID            NOT NULL
                                                        REFERENCES platform_users(id)
                                                        ON DELETE CASCADE,
            event_type                  VARCHAR(64)     NOT NULL,
            title                       VARCHAR(255)    NOT NULL,
            body                        TEXT            NOT NULL,
            link_path                   VARCHAR(512),
            payload                     JSONB,
            read_at                     TIMESTAMPTZ,
            created_at                  TIMESTAMPTZ     NOT NULL DEFAULT now()
        )
    """))

    # ------------------------------------------------------------------
    # 2. Indexes
    # ------------------------------------------------------------------

    # Unread count + unread list: WHERE read_at IS NULL ORDER BY created_at DESC
    conn.execute(sa.text(
        "CREATE INDEX ix_notifications_recipient_read_at "
        "ON notifications (recipient_platform_user_id, read_at)"
    ))

    # Recent feed: ORDER BY created_at DESC per recipient
    conn.execute(sa.text(
        "CREATE INDEX ix_notifications_recipient_created_at "
        "ON notifications (recipient_platform_user_id, created_at DESC)"
    ))


def downgrade() -> None:
    conn = op.get_bind()

    conn.execute(sa.text(
        "DROP INDEX IF EXISTS ix_notifications_recipient_created_at"
    ))
    conn.execute(sa.text(
        "DROP INDEX IF EXISTS ix_notifications_recipient_read_at"
    ))
    conn.execute(sa.text(
        "DROP TABLE IF EXISTS notifications"
    ))
