"""Operating-countries validation helper.

This module exposes a single async function that property and listing
create/update services can call to validate that an incoming country code
is permitted for the tenant.

The property and listing services themselves are NOT modified — they call this
helper and let it raise the appropriate HTTP error.

Usage (in property_service.py / listing_service.py):
    from apps.api.services.operating_countries_validator import (
        validate_country_for_tenant,
    )

    # Inside create / update:
    if payload.country:
        await validate_country_for_tenant(session, tenant_id, payload.country)
"""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.tenant import Tenant
from packages.common.utils.error_handlers import bad_request, not_found

# ISO 3166-1 alpha-2 pattern validation is done at schema level (Pydantic).
# Here we only enforce that the code is in the tenant's operating_countries list.


async def validate_country_for_tenant(
    session: AsyncSession,
    tenant_id: UUID,
    country: str | None,
) -> None:
    """Raise 422-style bad_request if *country* is not in tenant.operating_countries.

    Silently returns when *country* is None (field omitted — no-op).
    Raises 404 if the tenant itself is missing (should not happen in normal flow).
    """
    if country is None:
        return

    tenant = await session.get(Tenant, tenant_id)
    if not tenant:
        raise not_found("Tenant")

    allowed: list[str] = tenant.operating_countries or []
    if country.upper() not in [c.upper() for c in allowed]:
        raise bad_request(
            f"Country '{country}' is not in the tenant's operating countries: "
            f"{sorted(allowed)}. Update tenant settings to add it."
        )
