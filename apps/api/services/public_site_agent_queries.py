"""Public site — agent-related bulk query helpers.

Extracted from public_site_queries.py to stay within the 300 LOC cap.
"""

from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.tenant import Tenant
from apps.api.services.public_site_media_helpers import _media_url


async def primary_agents_bulk(
    session: AsyncSession, property_ids: list[UUID]
) -> dict[UUID, dict]:
    """Return {property_id: agent_dict} for the primary agent of each property.

    Uses DISTINCT ON (property_id) — single round-trip, no N+1.
    """
    if not property_ids:
        return {}
    id_list = ", ".join(f"'{pid}'" for pid in property_ids)
    rows = (
        await session.execute(
            text(
                f"SELECT DISTINCT ON (pa.property_id) "
                f"  pa.property_id, a.full_name, a.phone, a.photo_key, a.license_id "
                f"FROM property_agents pa "
                f"JOIN agents a ON a.id = pa.agent_id "
                f"WHERE pa.property_id IN ({id_list}) AND pa.is_primary = true "
                f"ORDER BY pa.property_id"
            )
        )
    ).all()
    result: dict[UUID, dict] = {}
    for row in rows:
        result[row.property_id] = {
            "agent_name": row.full_name,
            "agent_phone": row.phone,
            "agent_photo_url": _media_url(row.photo_key) if row.photo_key else None,
            "agent_has_license": bool(row.license_id),
        }
    return result


async def fetch_listing_stats(session: AsyncSession, tenant: Tenant) -> dict:
    """Return total active listing count and breakdown by property_type."""
    tid = tenant.id
    rows = (
        await session.execute(
            text(
                "SELECT p.property_type, COUNT(*) AS cnt "
                "FROM listings l "
                "JOIN properties p ON p.id = l.property_id "
                "WHERE l.tenant_id = :tid AND l.status = 'active' "
                "GROUP BY p.property_type "
                "ORDER BY cnt DESC"
            ),
            {"tid": str(tid)},
        )
    ).all()
    total = sum(row.cnt for row in rows)
    by_type = [{"property_type": row.property_type, "count": int(row.cnt)} for row in rows]
    return {"total": int(total), "by_type": by_type}
