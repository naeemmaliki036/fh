"""Property reference number generator (migration 0040).

Generates deterministic, tenant-scoped reference numbers in the format:
  <TENANT_PREFIX>-<TYPE_ABBR>-<RANDOM_SUFFIX>
  e.g. MAR-AP-K8X3DQ

ALPHABET omits visually ambiguous chars (I, O, 0, 1).
"""

from __future__ import annotations

import secrets
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.property import Property

PROPERTY_TYPE_ABBR: dict[str, str] = {
    "apartment": "AP",
    "villa": "VI",
    "townhouse": "TH",
    "penthouse": "PH",
    "plot": "PL",
    "office": "OF",
    "retail": "RT",
    "warehouse": "WH",
    "building": "BD",
    "other": "OT",
}

ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no I/O/0/1


def generate_random_suffix(length: int = 6) -> str:
    """Return a random string of `length` chars drawn from ALPHABET."""
    return "".join(secrets.choice(ALPHABET) for _ in range(length))


def compose_reference(
    prefix: str,
    property_type: str,
    suffix: str | None = None,
) -> str:
    """Return e.g. MAR-AP-K8X3DQ.

    Args:
        prefix:        Tenant's 3-char prefix (e.g. "MAR").
        property_type: PropertyType value string (e.g. "apartment").
        suffix:        Optional 6-char override; random if omitted.
    """
    abbr = PROPERTY_TYPE_ABBR.get(property_type.lower(), "OT")
    sfx = suffix or generate_random_suffix()
    return f"{prefix.upper()}-{abbr}-{sfx}"


async def generate_unique_reference(
    session: AsyncSession,
    tenant_id: UUID,
    property_type: str,
    *,
    prefix: str,
    max_retries: int = 10,
) -> str:
    """Generate a reference number that does not already exist for this tenant.

    Loops up to max_retries times before raising RuntimeError.
    Uses a SELECT 1 … LIMIT 1 existence check (no full row fetch).
    """
    for _ in range(max_retries):
        ref = compose_reference(prefix, property_type)
        exists_q = (
            select(text("1"))
            .select_from(Property)
            .where(
                Property.tenant_id == tenant_id,
                Property.internal_reference == ref,
            )
            .limit(1)
        )
        row = (await session.execute(exists_q)).first()
        if row is None:
            return ref
    raise RuntimeError(
        f"Could not generate a unique property reference after {max_retries} attempts"
    )
