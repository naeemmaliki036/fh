"""audit_action_expansion

Revision ID: 0026_audit_action_expansion
Revises: 0025_listing_documents
Create Date: 2026-05-13 12:00:00.000000

Adds new audit_action enum values for the property/listing/tenant/platform-user
workstreams (price changes, tag changes, hero media, listing documents,
tenant approval/reactivation/rejection, platform-user management).
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0026_audit_action_expansion"
down_revision: Union[str, None] = "0025_listing_documents"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_NEW_VALUES = [
    "property_tags_changed",
    "listing_price_changed",
    "listing_hero_media_set",
    "listing_document_uploaded",
    "listing_document_deleted",
    "tenant_reactivated",
    "tenant_rejected",
    "platform_user_created",
    "platform_user_updated",
    "platform_user_role_changed",
    "platform_user_password_reset",
]


def upgrade() -> None:
    conn = op.get_bind()
    for value in _NEW_VALUES:
        conn.execute(sa.text(f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{value}'"))


def downgrade() -> None:
    # Postgres does not support removing enum values without rebuilding the type.
    # No-op downgrade.
    pass
