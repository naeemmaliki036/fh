"""tenant_office_info

Revision ID: 0045_tenant_office
Revises: 0044_consumer_accounts
Create Date: 2026-05-17 00:00:00.000000

Changes:
1. tenants.office_country  VARCHAR(2)   NULL  CHECK(~'^[A-Z]{2}$' when not null)
2. tenants.office_city     VARCHAR(120) NULL
3. tenants.signup_notes    TEXT         NULL
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0045_tenant_office"
down_revision: Union[str, None] = "0044_consumer_accounts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tenants",
        sa.Column("office_country", sa.String(2), nullable=True),
    )
    op.create_check_constraint(
        "ck_tenants_office_country_iso2",
        "tenants",
        "office_country IS NULL OR office_country ~ '^[A-Z]{2}$'",
    )
    op.add_column(
        "tenants",
        sa.Column("office_city", sa.String(120), nullable=True),
    )
    op.add_column(
        "tenants",
        sa.Column("signup_notes", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_constraint("ck_tenants_office_country_iso2", "tenants", type_="check")
    op.drop_column("tenants", "office_country")
    op.drop_column("tenants", "office_city")
    op.drop_column("tenants", "signup_notes")
