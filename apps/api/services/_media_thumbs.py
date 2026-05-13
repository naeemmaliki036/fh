"""Shared thumbnail batch-fetch utility used by property and listing services."""

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import func, over, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.media import Media
from packages.common.storage import get_public_storage

if TYPE_CHECKING:
    from apps.api.models.listing import Listing


def public_url(storage_key: str) -> str:
    """Assemble CDN URL for a storage key using public storage config.

    Seed/demo data may store full external URLs (e.g. Unsplash/Pexels)
    directly in storage_key — in that case return as-is.
    """
    if storage_key.startswith(("http://", "https://")):
        return storage_key
    storage = get_public_storage()
    if storage.public_base_url:
        return f"{storage.public_base_url}/{storage_key}"
    return f"/_local-public/{storage_key}"


async def batch_first_media(
    session: AsyncSession, property_ids: list[UUID]
) -> dict[UUID, dict]:
    """Return {property_id: {thumbnail_url, thumbnail_kind}} for the first
    ordered Media row per property. One SQL query — no N+1.

    Uses a ROW_NUMBER() window over (ordering ASC, created_at ASC) to pick
    the top-1 media row per property without DISTINCT ON (stays ORM-portable).
    """
    if not property_ids:
        return {}

    inner = (
        select(
            Media.property_id,
            Media.storage_key,
            Media.kind,
            Media.ordering,
            Media.created_at,
        )
        .where(Media.property_id.in_(property_ids))
    ).subquery()

    rn_col = over(
        func.row_number(),
        partition_by=inner.c.property_id,
        order_by=(inner.c.ordering.asc(), inner.c.created_at.asc()),
    ).label("rn")

    ranked = select(
        inner.c.property_id,
        inner.c.storage_key,
        inner.c.kind,
        rn_col,
    ).subquery()

    rows = list((await session.execute(
        select(
            ranked.c.property_id,
            ranked.c.storage_key,
            ranked.c.kind,
        ).where(ranked.c.rn == 1)
    )).all())

    result: dict[UUID, dict] = {}
    for row in rows:
        pid, key, kind = row.property_id, row.storage_key, row.kind
        result[pid] = {
            "thumbnail_url": public_url(key),
            "thumbnail_kind": kind.value if hasattr(kind, "value") else str(kind),
        }
    return result


async def batch_fallback_thumbnails(
    session: AsyncSession, listings: "list[Listing]"
) -> dict[str, dict]:
    """Return {listing_id_str: {thumbnail_url, thumbnail_kind}}.

    Prefer listing.hero_media if already loaded. For listings without a
    hero, delegates to batch_first_media for one SQL query — no N+1.
    """
    result: dict[str, dict] = {}
    need_fallback: list[UUID] = []
    listing_to_property: dict[str, UUID] = {}

    for lst in listings:
        m = lst.hero_media
        if m is not None:
            result[str(lst.id)] = {
                "thumbnail_url": public_url(m.storage_key),
                "thumbnail_kind": m.kind.value if hasattr(m.kind, "value") else str(m.kind),
            }
        else:
            need_fallback.append(lst.property_id)
            listing_to_property[str(lst.id)] = lst.property_id

    if not need_fallback:
        return result

    prop_thumb = await batch_first_media(session, need_fallback)
    for lid, pid in listing_to_property.items():
        result[lid] = prop_thumb.get(pid, {"thumbnail_url": None, "thumbnail_kind": None})

    return result
