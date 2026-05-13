"""protect super_admin from DELETE

Revision ID: 0016_protect_super_admin_delete
Revises: 0015_public_site_config
Create Date: 2026-05-13 10:00:00.000000

Adds a Postgres trigger that raises an exception on any DELETE targeting a
platform_users row with role='super_admin'. This is defense-in-depth: there
is no application-layer endpoint that deletes platform_users today, but the
trigger guarantees super_admin accounts cannot be removed even if such an
endpoint is added by mistake.

To remove a super_admin (rare, manual operation), an operator must disable
the trigger in a direct DB session:

    ALTER TABLE platform_users DISABLE TRIGGER trg_block_super_admin_delete;
    DELETE FROM platform_users WHERE email = '...';
    ALTER TABLE platform_users ENABLE TRIGGER trg_block_super_admin_delete;
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0016_protect_super_admin_delete"
down_revision: Union[str, None] = "0015_public_site_config"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_FN_UP = """
CREATE OR REPLACE FUNCTION block_super_admin_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role = 'super_admin' THEN
        RAISE EXCEPTION
            'Deletion of super_admin platform users is blocked. Disable trigger trg_block_super_admin_delete to override.'
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
"""

_TRIGGER_UP = """
CREATE TRIGGER trg_block_super_admin_delete
BEFORE DELETE ON platform_users
FOR EACH ROW EXECUTE FUNCTION block_super_admin_delete();
"""

_TRIGGER_DOWN = """
DROP TRIGGER IF EXISTS trg_block_super_admin_delete ON platform_users;
"""

_FN_DOWN = """
DROP FUNCTION IF EXISTS block_super_admin_delete();
"""


def upgrade() -> None:
    op.execute(_FN_UP)
    op.execute(_TRIGGER_UP)


def downgrade() -> None:
    op.execute(_TRIGGER_DOWN)
    op.execute(_FN_DOWN)
