"""Tests for apps/api/utils/phone.py — normalize_phone."""

import pytest

from apps.api.utils.phone import normalize_phone


@pytest.mark.parametrize(
    "raw, expected",
    [
        # UAE local format (0 + 9 digits)
        ("050 123 4567", "+971501234567"),
        ("0501234567", "+971501234567"),
        ("050 000 1111", "+971500001111"),
        # Already E.164
        ("+971501234567", "+971501234567"),
        # E.164 with hyphens
        ("+971-50-123-4567", "+971501234567"),
        # 00 international prefix
        ("00971501234567", "+971501234567"),
        ("00971 50 123 4567", "+971501234567"),
        # Bare 9-digit number, AE assumed
        ("501234567", "+971501234567"),
        # Non-UAE E.164 passed through
        ("+12025550173", "+12025550173"),
        # Empty / None → None
        ("", None),
        (None, None),
        ("   ", None),
        # Too short
        ("123", None),
        # Too long (17 digits after +)
        ("+1" + "0" * 16, None),
        # All non-digits
        ("abcdef", None),
    ],
)
def test_normalize_phone(raw: str | None, expected: str | None) -> None:
    assert normalize_phone(raw) == expected
