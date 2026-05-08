"""tenant_contact_fields

Revision ID: 0009_tenant_contact_fields
Revises: 0008_deal
Create Date: 2026-05-09 00:00:00.000000

Adds two required contact columns to the tenants table:
  - contact_email VARCHAR(255) NOT NULL  (indexed)
  - contact_phone VARCHAR(32)  NOT NULL

Strategy for existing rows:
  1. Add columns as NULLABLE with no default.
  2. Backfill all existing rows with placeholder values.
  3. Alter columns to NOT NULL.

This avoids a full table rewrite in a single DDL statement and is safe
for tables with existing data in dev/staging.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0009_tenant_contact_fields"
down_revision: Union[str, None] = "0008_deal"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ------------------------------------------------------------------
    # 1. Add columns as nullable first so existing rows are not rejected.
    # ------------------------------------------------------------------
    conn.execute(sa.text(
        "ALTER TABLE tenants ADD COLUMN contact_email VARCHAR(255)"
    ))
    conn.execute(sa.text(
        "ALTER TABLE tenants ADD COLUMN contact_phone VARCHAR(32)"
    ))

    # ------------------------------------------------------------------
    # 2. Backfill existing rows with placeholder values.
    # ------------------------------------------------------------------
    conn.execute(sa.text(
        "UPDATE tenants "
        "SET contact_email = 'unknown@placeholder.local', "
        "    contact_phone = 'unknown' "
        "WHERE contact_email IS NULL OR contact_phone IS NULL"
    ))

    # ------------------------------------------------------------------
    # 3. Now safe to enforce NOT NULL.
    # ------------------------------------------------------------------
    conn.execute(sa.text(
        "ALTER TABLE tenants ALTER COLUMN contact_email SET NOT NULL"
    ))
    conn.execute(sa.text(
        "ALTER TABLE tenants ALTER COLUMN contact_phone SET NOT NULL"
    ))

    # ------------------------------------------------------------------
    # 4. Index on contact_email — used for lookup / deduplication checks.
    # ------------------------------------------------------------------
    conn.execute(sa.text(
        "CREATE INDEX ix_tenants_contact_email ON tenants (contact_email)"
    ))


def downgrade() -> None:
    conn = op.get_bind()

    conn.execute(sa.text(
        "DROP INDEX IF EXISTS ix_tenants_contact_email"
    ))
    conn.execute(sa.text(
        "ALTER TABLE tenants DROP COLUMN IF EXISTS contact_phone"
    ))
    conn.execute(sa.text(
        "ALTER TABLE tenants DROP COLUMN IF EXISTS contact_email"
    ))
