"""Lightweight phone normalization — no external deps.

Examples (default_country="AE"):
    "050 123 4567"   -> "+971501234567"  (UAE local: 0 + 9 digits)
    "0501234567"     -> "+971501234567"  (same, no spaces)
    "+971501234567"  -> "+971501234567"  (already E.164)
    "+971-50-123-4567" -> "+971501234567" (strips non-digit chars after +)
    "00971501234567" -> "+971501234567"  (00 prefix)
    "501234567"      -> "+971501234567"  (no prefix, AE assumed)
    ""               -> None
    "123"            -> None             (too short)
"""

import re


def normalize_phone(raw: str | None, default_country: str = "AE") -> str | None:
    """Strip formatting and return E.164 string, or None if unusable."""
    if not raw:
        return None

    s = raw.strip()
    if not s:
        return None

    # Preserve leading + if present, then strip all non-digits.
    has_plus = s.startswith("+")
    digits_only = re.sub(r"\D", "", s)

    if not digits_only:
        return None

    if has_plus:
        # Already has country code.
        normalized = f"+{digits_only}"
    elif digits_only.startswith("00"):
        # International dialling prefix.
        normalized = f"+{digits_only[2:]}"
    elif digits_only.startswith("0") and default_country == "AE":
        # UAE local format: 0XXXXXXXXX (10 digits total).
        normalized = f"+971{digits_only[1:]}"
    elif default_country == "AE":
        # Bare number, no prefix — assume UAE.
        normalized = f"+971{digits_only}"
    else:
        normalized = f"+{digits_only}"

    # Sanity: E.164 is + followed by 7–15 digits.
    digit_count = len(normalized) - 1  # subtract the +
    if digit_count < 7 or digit_count > 15:
        return None

    return normalized
