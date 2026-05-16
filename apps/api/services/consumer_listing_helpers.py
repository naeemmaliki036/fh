"""Consumer listing helper utilities — dict serialiser and cron expiry.

Kept separate from consumer_listing_service.py to respect the 300-LOC cap.
"""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import AuditAction, ListingStatus
from apps.api.models.listing import Listing
from apps.api.models.property import Property


def _days_until(dt: datetime | None) -> int | None:
    if dt is None:
        return None
    diff = dt.replace(tzinfo=UTC) - datetime.now(UTC)
    return max(0, diff.days)


def listing_to_dict(listing: Listing, prop: Property) -> dict:
    """Serialize a (Listing, Property) pair to a flat dict for consumer responses."""
    now = datetime.now(UTC)
    expires_at = listing.expires_at
    is_expired = (
        expires_at is not None
        and expires_at.replace(tzinfo=UTC) < now
    )
    return {
        "id": listing.id,
        "status": listing.status.value,
        "purpose": listing.purpose.value,
        "title": listing.title,
        "description": listing.description,
        "price": float(listing.price),
        "currency": listing.currency,
        "created_at": listing.created_at,
        "updated_at": listing.updated_at,
        "expires_at": expires_at,
        "days_until_expiry": _days_until(expires_at),
        "is_expired": is_expired,
        "property_type": prop.property_type.value if prop.property_type else None,
        "country": prop.country,
        "city": prop.city,
        "area": prop.area,
        "bedrooms": prop.bedrooms,
        "bathrooms": prop.bathrooms,
        "size_sqft": float(prop.size_sqft) if prop.size_sqft else None,
        "latitude": float(prop.latitude) if prop.latitude else None,
        "longitude": float(prop.longitude) if prop.longitude else None,
        "amenities": prop.amenities or [],
        "furnishing_status": (
            prop.furnishing_status.value if prop.furnishing_status else None
        ),
        "completion_status": (
            prop.completion_status.value if prop.completion_status else None
        ),
        "ownership_type": (
            prop.ownership_type.value if prop.ownership_type else None
        ),
        "view_orientation": (
            prop.view_orientation.value if prop.view_orientation else None
        ),
        "parking_spaces": prop.parking_spaces,
        "floor_level": prop.floor_level,
        "handover_year": prop.handover_year,
        "handover_quarter": prop.handover_quarter,
        "payment_plan": bool(prop.payment_plan),
        "build_year": prop.build_year,
        "internal_reference": prop.internal_reference,
    }


# ---------------------------------------------------------------------------
# Cron helper — wire to a scheduled job (daily) to expire stale listings.
#
# Usage:
#   from sqlalchemy.ext.asyncio import AsyncSession
#   n = await expire_consumer_listings(session)
#   await session.commit()
#
# Suggested schedule: once daily at 02:00 UTC via Railway Cron or APScheduler.
# ---------------------------------------------------------------------------


async def expire_consumer_listings(session: AsyncSession) -> int:
    """Flip active consumer listings past expires_at to 'expired'.

    Returns the number of rows updated. Audits each expiry event.
    """
    from sqlalchemy import select

    from apps.api.services.audit_service import AuditService

    now = datetime.now(UTC)

    rows = list(
        (
            await session.execute(
                select(Listing).where(
                    Listing.consumer_account_id.isnot(None),
                    Listing.status == ListingStatus.ACTIVE,
                    Listing.expires_at < now,
                )
            )
        )
        .scalars()
        .all()
    )
    if not rows:
        return 0

    audit_svc = AuditService(session)
    for listing in rows:
        listing.status = ListingStatus.EXPIRED
        await audit_svc.record(
            AuditAction.CONSUMER_LISTING_EXPIRED,
            entity_type="listing",
            entity_id=listing.id,
            after={"expired_at": now.isoformat()},
        )

    await session.flush()
    return len(rows)
