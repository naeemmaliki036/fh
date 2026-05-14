"""off_market_reasons

Revision ID: 0033_off_market_reasons
Revises: 0032_deal_workflow
Create Date: 2026-05-14 00:00:00.000000

New table `off_market_reasons` with platform-level seed rows.
NULL tenant_id = platform default visible to all tenants.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0033_off_market_reasons"
down_revision: Union[str, None] = "0032_deal_workflow"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SEEDS = [
    ("sold",                  "Sold",                          False, 0),
    ("rented",                "Rented",                        False, 1),
    ("sold_off_platform",     "Sold Off-Platform",             False, 2),
    ("rented_off_platform",   "Rented Off-Platform",           False, 3),
    ("owner_withdrew",        "Owner Withdrew",                False, 4),
    ("under_maintenance",     "Under Maintenance",             False, 5),
    ("reserved_under_offer",  "Reserved / Under Offer",        False, 6),
    ("listed_elsewhere",      "Listed Elsewhere",              False, 7),
    ("title_legal_issue",     "Title / Legal Issue",           False, 8),
    ("other",                 "Other",                         True,  9),
]


def upgrade() -> None:
    omr = op.create_table(
        "off_market_reasons",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("code", sa.Text, nullable=False),
        sa.Column("label", sa.Text, nullable=False),
        sa.Column("requires_note", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("ordering", sa.Integer, nullable=False, server_default="0"),
        sa.Column("active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("tenant_id", "code", name="uq_omr_tenant_code"),
    )

    # Partial unique index: code must be unique among platform-level rows (tenant_id IS NULL)
    op.create_index(
        "uq_omr_platform_code",
        "off_market_reasons",
        ["code"],
        unique=True,
        postgresql_where=sa.text("tenant_id IS NULL"),
    )

    # Seed platform defaults
    op.bulk_insert(
        omr,
        [
            {
                "id": None,   # let server_default fire
                "tenant_id": None,
                "code": code,
                "label": label,
                "requires_note": requires_note,
                "ordering": ordering,
                "active": True,
            }
            for code, label, requires_note, ordering in _SEEDS
        ],
    )


def downgrade() -> None:
    op.drop_index("uq_omr_platform_code", table_name="off_market_reasons")
    op.drop_table("off_market_reasons")
