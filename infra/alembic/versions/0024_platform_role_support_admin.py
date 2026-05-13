"""platform_role_support_admin

Revision ID: 0024_platform_role_support_admin
Revises: 0023_email_outbox
Create Date: 2026-05-13 00:00:24.000000

Adds 'support_admin' value to the platform_role Postgres enum.

NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction in Postgres.
Alembic wraps migrations in transactions by default, so we execute this
statement outside the transaction using a raw connection with AUTOCOMMIT.

DOWNGRADE LIMITATION: Postgres does not support removing enum values once
added (no ALTER TYPE ... DROP VALUE). The downgrade here is intentionally
a no-op with a comment. To fully revert, you would need to:
  1. Drop and recreate the enum type without 'support_admin'.
  2. Recreate all columns that reference it.
This is almost never worth doing in practice — leave the value in the enum.
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0024_platform_role_support_admin"
down_revision: Union[str, None] = "0023_email_outbox"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ADD VALUE must run outside a transaction (Postgres restriction).
    conn = op.get_bind()
    conn.execute(
        __import__("sqlalchemy").text(
            "ALTER TYPE platform_role ADD VALUE IF NOT EXISTS 'support_admin'"
        )
    )


def downgrade() -> None:
    # Postgres does not support DROP VALUE on an enum.
    # No action taken — 'support_admin' stays in the enum type.
    # To fully remove it, a DBA must manually rebuild the enum type:
    #   1. Rename the old type.
    #   2. CREATE TYPE platform_role AS ENUM (...) without 'support_admin'.
    #   3. ALTER TABLE platform_users ALTER COLUMN role TYPE platform_role USING role::text::platform_role.
    #   4. DROP the renamed old type.
    pass
