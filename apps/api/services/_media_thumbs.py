"""Shared thumbnail batch-fetch utility used by property and listing services."""

from uuid import UUID

from sqlalchemy import func, over, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.media import Media
from packages.common.storage import get_public_storage


def public_url(storage_key: str) -> str:
    """Assemble CDN URL for a storage key using public storage config."""
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
