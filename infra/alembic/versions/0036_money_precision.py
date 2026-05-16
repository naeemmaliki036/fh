"""Money precision: prices whole numbers, commissions 2 decimals.

Business rules:
- All money amounts (property price, listing price, deal transaction value,
  commission paid amount, listing price history) are stored as whole numbers.
- Commission rates (agent default, deal commission) are stored with at most
  2 decimal places — Numeric(*, 4) becomes Numeric(*, 2).

Existing values are ROUNDed before the column type is altered so PostgreSQL
doesn't error on overflow / loss of precision.
"""

from __future__ import annotations

from typing import Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0036_money_precision"
down_revision: Union[str, None] = "0035_locations"
branch_labels = None
depends_on = None


# Each entry: (table, column, target_scale, original_precision, original_scale)
PRICE_COLUMNS: list[tuple[str, str, int, int]] = [
    ("properties", "price", 14, 2),
    ("listings", "price", 14, 2),
    ("listing_price_history", "old_price", 14, 2),
    ("listing_price_history", "new_price", 14, 2),
    ("deals", "transaction_value", 14, 2),
    ("deals", "commission_paid_amount", 14, 2),
]

# Commission rate columns — keep decimal precision but cap at 2.
COMMISSION_COLUMNS: list[tuple[str, str, int, int]] = [
    ("agents", "default_commission_value", 12, 4),
    ("deals", "commission_value", 14, 4),
]


def upgrade() -> None:
    bind = op.get_bind()

    # 1. Round existing values, then retype price columns to scale 0.
    for table, col, precision, _orig_scale in PRICE_COLUMNS:
        bind.execute(sa.text(f"UPDATE {table} SET {col} = ROUND({col})"))
        op.alter_column(
            table,
            col,
            existing_type=sa.Numeric(precision, 2),
            type_=sa.Numeric(precision, 0),
            existing_nullable=True,
            postgresql_using=f"ROUND({col})",
        )

    # 2. Round commission rates to 2 decimals, then retype.
    for table, col, precision, _orig_scale in COMMISSION_COLUMNS:
        bind.execute(sa.text(f"UPDATE {table} SET {col} = ROUND({col}, 2)"))
        op.alter_column(
            table,
            col,
            existing_type=sa.Numeric(precision, 4),
            type_=sa.Numeric(precision, 2),
            existing_nullable=False,
            postgresql_using=f"ROUND({col}, 2)",
        )


def downgrade() -> None:
    for table, col, precision, _orig_scale in COMMISSION_COLUMNS:
        op.alter_column(
            table,
            col,
            existing_type=sa.Numeric(precision, 2),
            type_=sa.Numeric(precision, 4),
            existing_nullable=False,
        )

    for table, col, precision, _orig_scale in PRICE_COLUMNS:
        op.alter_column(
            table,
            col,
            existing_type=sa.Numeric(precision, 0),
            type_=sa.Numeric(precision, 2),
            existing_nullable=True,
        )
