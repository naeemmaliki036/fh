"""Commission computation helpers. Under 50 LOC.

Examples:
    compute_commission_amount(PERCENTAGE, Decimal('2.5'), Decimal('2500000'))
        -> Decimal('62500.00')
    compute_commission_amount(FIXED, Decimal('50000'), Decimal('2500000'))
        -> Decimal('50000.00')
"""

from decimal import ROUND_HALF_UP, Decimal

from apps.api.models.enums import CommissionType

_CENT = Decimal("0.01")


def compute_commission_amount(
    commission_type: CommissionType,
    commission_value: Decimal,
    transaction_value: Decimal,
) -> Decimal:
    """Return the absolute commission amount, rounded to 2 decimal places."""
    if commission_type == CommissionType.PERCENTAGE:
        return (transaction_value * commission_value / Decimal(100)).quantize(
            _CENT, rounding=ROUND_HALF_UP
        )
    return commission_value.quantize(_CENT, rounding=ROUND_HALF_UP)
