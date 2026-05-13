"""listing_price_history

Revision ID: 0021_listing_price_history
Revises: 0020_listing_hero_media
Create Date: 2026-05-13 00:00:21.000000

Creates listing_price_history table to track every price change on a listing.
Tenant-scoped. Immutable append-only records (no updated_at).
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0021_listing_price_history"
down_revision: Union[str, None] = "0020_listing_hero_media"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("""
        CREATE TABLE listing_price_history (
            id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id           UUID        NOT NULL
                                            REFERENCES tenants(id)  ON DELETE CASCADE,
            listing_id          UUID        NOT NULL
                                            REFERENCES listings(id) ON DELETE CASCADE,
            old_price           NUMERIC(14,2) NOT NULL,
            new_price           NUMERIC(14,2) NOT NULL,
            currency            CHAR(3)     NOT NULL,
            changed_by_user_id  UUID
                                            REFERENCES users(id)    ON DELETE SET NULL,
            reason_note         TEXT,
            changed_at          TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """))
    conn.execute(sa.text(
        "CREATE INDEX ix_lph_tenant_listing_changed "
        "ON listing_price_history (tenant_id, listing_id, changed_at DESC)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_lph_listing_changed "
        "ON listing_price_history (listing_id, changed_at DESC)"
    ))
    conn.execute(sa.text(
        "ALTER TABLE listing_price_history ENABLE ROW LEVEL SECURITY"
    ))
    conn.execute(sa.text("""
        CREATE POLICY tenant_isolation ON listing_price_history
            USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid)
    """))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "DROP POLICY IF EXISTS tenant_isolation ON listing_price_history"
    ))
    conn.execute(sa.text(
        "ALTER TABLE listing_price_history DISABLE ROW LEVEL SECURITY"
    ))
    conn.execute(sa.text("DROP TABLE IF EXISTS listing_price_history"))
