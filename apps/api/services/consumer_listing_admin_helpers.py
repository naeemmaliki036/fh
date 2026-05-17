"""Consumer listing admin helpers — dict builders and email HTML for moderation.

Kept separate from consumer_listing_moderation_service.py to stay within the
300-LOC file cap.
"""

from apps.api.models.consumer_account import ConsumerAccount
from apps.api.models.listing import Listing
from apps.api.models.media import Media
from apps.api.models.property import Property
from apps.api.services.consumer_listing_helpers import _media_url


def queue_item(
    listing: Listing,
    prop: Property,
    owner: ConsumerAccount,
    media_count: int,
) -> dict:
    """Build a summary dict for the moderation queue list."""
    return {
        "id": listing.id,
        "status": listing.status.value,
        "title": listing.title,
        "price": float(listing.price),
        "currency": listing.currency,
        "submitted_at": listing.submitted_at,
        "created_at": listing.created_at,
        "review_notes": listing.review_notes,
        "property_type": prop.property_type.value if prop.property_type else None,
        "city": prop.city,
        "area": prop.area,
        "bedrooms": prop.bedrooms,
        "media_count": media_count,
        "owner_email": owner.email,
        "owner_name": owner.full_name,
    }


def detail_dict(
    listing: Listing,
    prop: Property,
    owner: ConsumerAccount,
    media_rows: list[Media],
) -> dict:
    """Build a full detail dict for the admin review view."""
    media_items = [
        {
            "id": m.id,
            "url": _media_url(m.storage_key),
            "kind": m.kind.value if m.kind else None,
            "position": m.ordering,
        }
        for m in media_rows
    ]
    return {
        "id": listing.id,
        "status": listing.status.value,
        "title": listing.title,
        "description": listing.description,
        "price": float(listing.price),
        "currency": listing.currency,
        "submitted_at": listing.submitted_at,
        "reviewed_at": listing.reviewed_at,
        "review_notes": listing.review_notes,
        "expires_at": listing.expires_at,
        "created_at": listing.created_at,
        "property_type": prop.property_type.value if prop.property_type else None,
        "city": prop.city,
        "area": prop.area,
        "bedrooms": prop.bedrooms,
        "bathrooms": prop.bathrooms,
        "size_sqft": float(prop.size_sqft) if prop.size_sqft else None,
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
        "media": media_items,
        "owner_email": owner.email,
        "owner_name": owner.full_name,
        "owner_phone": owner.phone,
        "internal_reference": prop.internal_reference,
    }


def approval_email_html(title: str, expires_iso: str | None) -> str:
    expiry_line = (
        f"<p>Your listing will remain active until <b>{expires_iso}</b>.</p>"
        if expires_iso else ""
    )
    return (
        f"<p>Great news! Your listing <b>{title}</b> has been approved and is now live.</p>"
        f"{expiry_line}"
        f"<p>Buyers can now find and contact you through PropertyPoint.</p>"
    )


def changes_email_html(title: str, notes: str) -> str:
    return (
        f"<p>Our team reviewed your listing <b>{title}</b> and found some issues "
        f"that need to be addressed before it can go live.</p>"
        f"<p><b>Reviewer notes:</b></p>"
        f"<blockquote>{notes}</blockquote>"
        f"<p>Please log in to update your listing and resubmit for review.</p>"
    )
