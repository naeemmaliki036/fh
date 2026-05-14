"""public_site_visibility

Revision ID: 0031_public_site_visibility
Revises: 0030_tenant_media_limits
Create Date: 2026-05-14 00:00:00.000000

Adds two visibility-gate columns to ``tenants``:

* ``public_site_feature_enabled`` — platform master switch (default FALSE).
  Backfilled TRUE for any existing tenant that already had public_site_enabled=TRUE,
  so their sites keep working after deploy.

* ``public_site_direct_links_only`` — tenant fine-grain (default FALSE).
  When TRUE (and both gates above are on), only the listing-detail URL resolves;
  all other public endpoints return 404.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0031_public_site_visibility"
down_revision: Union[str, None] = "0030_tenant_media_limits"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tenants",
        sa.Column(
            "public_site_feature_enabled",
            sa.Boolean,
            nullable=False,
            server_default="false",
        ),
    )
    op.add_column(
        "tenants",
        sa.Column(
            "public_site_direct_links_only",
            sa.Boolean,
            nullable=False,
            server_default="false",
        ),
    )

    # Backfill: existing tenants that had public_site_enabled=TRUE retain the
    # feature gate, so they continue to work after deploy.
    op.execute(
        "UPDATE tenants SET public_site_feature_enabled = TRUE "
        "WHERE public_site_enabled = TRUE"
    )


def downgrade() -> None:
    op.drop_column("tenants", "public_site_direct_links_only")
    op.drop_column("tenants", "public_site_feature_enabled")
