"""property_attributes

Revision ID: 0039_property_attrs
Revises: 0038_customer_type_commission
Create Date: 2026-05-16 00:00:00.000000

Changes:
1. Five new Postgres enums (idempotent DO blocks):
   furnishing_status, completion_status, ownership_type,
   view_orientation, fit_out_status
2. Fourteen new nullable columns + payment_plan (NOT NULL default false).
3. Composite indexes: (tenant_id, furnishing_status/completion_status/view_orientation).
4. GIN index on the existing amenities JSONB column.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0039_property_attrs"
down_revision: Union[str, None] = "0038_customer_type_commission"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
_ENUM_DDL = {
    "furnishing_status": "('furnished','semi_furnished','unfurnished')",
    "completion_status": "('ready','off_plan')",
    "ownership_type": "('freehold','leasehold','gcc_only')",
    "view_orientation": (
        "('sea','marina','canal','lake','creek',"
        "'city','garden','pool','golf','landmark','partial','none')"
    ),
    "fit_out_status": "('fitted','shell_and_core','partially_fitted')",
}


def _create_enum(conn: sa.engine.Connection, name: str, values: str) -> None:
    conn.execute(sa.text(
        f"DO $$ BEGIN "
        f"IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '{name}') "
        f"THEN CREATE TYPE {name} AS ENUM {values}; "
        f"END IF; END $$;"
    ))


def _pg_enum(name: str, *values: str) -> postgresql.ENUM:
    return postgresql.ENUM(*values, name=name, create_type=False)


# ---------------------------------------------------------------------------


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Enums
    for name, values in _ENUM_DDL.items():
        _create_enum(conn, name, values)

    # 2. Columns
    op.add_column("properties", sa.Column(
        "furnishing_status",
        _pg_enum("furnishing_status", "furnished", "semi_furnished", "unfurnished"),
        nullable=True,
    ))
    op.add_column("properties", sa.Column(
        "completion_status",
        _pg_enum("completion_status", "ready", "off_plan"),
        nullable=True,
    ))
    op.add_column("properties", sa.Column(
        "ownership_type",
        _pg_enum("ownership_type", "freehold", "leasehold", "gcc_only"),
        nullable=True,
    ))
    op.add_column("properties", sa.Column(
        "view_orientation",
        _pg_enum(
            "view_orientation",
            "sea", "marina", "canal", "lake", "creek",
            "city", "garden", "pool", "golf", "landmark", "partial", "none",
        ),
        nullable=True,
    ))
    op.add_column("properties", sa.Column(
        "service_charge_aed_sqft", sa.Numeric(8, 2), nullable=True,
    ))
    op.add_column("properties", sa.Column(
        "rera_permit_number", sa.String(64), nullable=True,
    ))
    op.add_column("properties", sa.Column(
        "plot_area_sqft", sa.Integer, nullable=True,
    ))
    op.add_column("properties", sa.Column(
        "parking_spaces", sa.Integer, nullable=True,
    ))
    op.add_column("properties", sa.Column(
        "floor_level", sa.String(16), nullable=True,
    ))
    op.add_column("properties", sa.Column(
        "fit_out_status",
        _pg_enum("fit_out_status", "fitted", "shell_and_core", "partially_fitted"),
        nullable=True,
    ))
    op.add_column("properties", sa.Column(
        "ceiling_height_m", sa.Numeric(4, 2), nullable=True,
    ))
    op.add_column("properties", sa.Column(
        "handover_year", sa.Integer, nullable=True,
    ))
    op.add_column("properties", sa.Column(
        "handover_quarter", sa.SmallInteger, nullable=True,
    ))
    op.create_check_constraint(
        "ck_properties_handover_quarter_range",
        "properties",
        "handover_quarter IS NULL"
        " OR (handover_quarter >= 1 AND handover_quarter <= 4)",
    )

    # payment_plan: NOT NULL default false — backfill existing rows first.
    op.add_column("properties", sa.Column(
        "payment_plan", sa.Boolean, nullable=True,
    ))
    conn.execute(sa.text(
        "UPDATE properties SET payment_plan = false WHERE payment_plan IS NULL"
    ))
    op.alter_column(
        "properties", "payment_plan",
        existing_type=sa.Boolean,
        nullable=False,
        server_default=sa.text("false"),
    )

    # 3. Composite indexes for enum filter columns
    op.create_index(
        "idx_properties_tenant_furnishing",
        "properties", ["tenant_id", "furnishing_status"],
    )
    op.create_index(
        "idx_properties_tenant_completion",
        "properties", ["tenant_id", "completion_status"],
    )
    op.create_index(
        "idx_properties_tenant_view",
        "properties", ["tenant_id", "view_orientation"],
    )

    # 4. GIN index on existing amenities JSONB column
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS idx_properties_amenities_gin "
        "ON properties USING GIN (amenities)"
    ))


def downgrade() -> None:
    conn = op.get_bind()

    # 4. GIN index — per spec, do NOT drop amenities or its index in downgrade.

    # 3. Composite indexes
    op.drop_index("idx_properties_tenant_view", table_name="properties")
    op.drop_index("idx_properties_tenant_completion", table_name="properties")
    op.drop_index("idx_properties_tenant_furnishing", table_name="properties")

    # 2. Columns (reverse order)
    op.drop_constraint(
        "ck_properties_handover_quarter_range", "properties", type_="check",
    )
    op.drop_column("properties", "payment_plan")
    op.drop_column("properties", "handover_quarter")
    op.drop_column("properties", "handover_year")
    op.drop_column("properties", "ceiling_height_m")
    op.drop_column("properties", "fit_out_status")
    op.drop_column("properties", "floor_level")
    op.drop_column("properties", "parking_spaces")
    op.drop_column("properties", "plot_area_sqft")
    op.drop_column("properties", "rera_permit_number")
    op.drop_column("properties", "service_charge_aed_sqft")
    op.drop_column("properties", "view_orientation")
    op.drop_column("properties", "ownership_type")
    op.drop_column("properties", "completion_status")
    op.drop_column("properties", "furnishing_status")

    # 1. Enums (reverse order)
    for name in reversed(list(_ENUM_DDL.keys())):
        conn.execute(sa.text(f"DROP TYPE IF EXISTS {name}"))
