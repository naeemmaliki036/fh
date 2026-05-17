"""Consumer listing helper utilities — dict serialiser and cron expiry.

Kept separate from consumer_listing_service.py to respect the 300-LOC cap.
"""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import AuditAction, ListingStatus, PropertyStatus
from apps.api.models.listing import Listing
from apps.api.models.media import Media
from apps.api.models.property import Property
from apps.api.models.tenant import Tenant


def _days_until(dt: datetime | None) -> int | None:
    if dt is None:
        return None
    diff = dt.replace(tzinfo=UTC) - datetime.now(UTC)
    return max(0, diff.days)


def _media_url(storage_key: str) -> str:
    """Build a public URL for a media storage key (R2 or local fallback)."""
    if storage_key.startswith(("http://", "https://")):
        return storage_key
    from packages.common.storage import get_public_storage
    storage = get_public_storage()
    if storage.public_base_url:
        return f"{storage.public_base_url}/{storage_key}"
    return f"/_local-public/{storage_key}"


def listing_to_dict(
    listing: Listing,
    prop: Property,
    media_rows: list[Media] | None = None,
) -> dict:
    """Serialize a (Listing, Property) pair to a flat dict for consumer responses."""
    now = datetime.now(UTC)
    expires_at = listing.expires_at
    is_expired = (
        expires_at is not None
        and expires_at.replace(tzinfo=UTC) < now
    )
    media_items = []
    if media_rows is not None:
        for m in media_rows:
            media_items.append({
                "id": m.id,
                "url": _media_url(m.storage_key),
                "kind": m.kind.value if m.kind else None,
                "position": m.ordering,
            })
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
        "submitted_at": listing.submitted_at,
        "review_notes": listing.review_notes,
        "reviewed_at": listing.reviewed_at,
        "days_until_expiry": _days_until(expires_at),
        "is_expired": is_expired,
        "media": media_items,
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


async def fetch_listing_media(
    session: AsyncSession, property_id: UUID
) -> list[Media]:
    """Return ordered media rows for a property (used by consumer listing detail)."""
    rows = (
        await session.execute(
            select(Media)
            .where(Media.property_id == property_id)
            .order_by(Media.ordering)
        )
    ).scalars().all()
    return list(rows)


async def build_consumer_property(
    session: AsyncSession,
    tenant_id: UUID,
    consumer_id: UUID,
    data: dict,
) -> Property:
    """Construct a Property ORM object from consumer create-request data.

    Validates property_type, resolves the PPD tenant prefix, generates a
    unique internal_reference. Does NOT add/flush — caller owns that.
    """
    from apps.api.models.enums import PropertyType
    from apps.api.services.property_ref import generate_unique_reference
    from packages.common.utils.error_handlers import bad_request

    try:
        property_type = PropertyType(data["property_type"])
    except (KeyError, ValueError):
        raise bad_request("Invalid or missing property_type")

    tenant = await session.get(Tenant, tenant_id)
    prefix = tenant.property_ref_prefix if tenant else "PPD"
    ref = await generate_unique_reference(
        session, tenant_id, data["property_type"], prefix=prefix
    )
    return Property(
        tenant_id=tenant_id,
        consumer_account_id=consumer_id,
        title=data["title"],
        description=data.get("description"),
        property_type=property_type,
        country=data.get("country", "AE"),
        city=data.get("city"),
        area=data.get("area"),
        bedrooms=data.get("bedrooms"),
        bathrooms=data.get("bathrooms"),
        size_sqft=data.get("size_sqft"),
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        amenities=data.get("amenities") or [],
        furnishing_status=data.get("furnishing_status"),
        completion_status=data.get("completion_status"),
        ownership_type=data.get("ownership_type"),
        view_orientation=data.get("view_orientation"),
        parking_spaces=data.get("parking_spaces"),
        floor_level=data.get("floor_level"),
        handover_year=data.get("handover_year"),
        handover_quarter=data.get("handover_quarter"),
        payment_plan=data.get("payment_plan", False),
        build_year=data.get("build_year"),
        status=PropertyStatus.AVAILABLE,
        internal_reference=ref,
        tags=[],
    )


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
