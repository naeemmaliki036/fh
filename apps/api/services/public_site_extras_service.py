"""Public-site extras service — stats block and agents grid.

Keeps public_site_service.py under the 300 LOC limit while reusing the
same _resolve_tenant / _media_url helpers via composition.
"""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.agent import Agent
from apps.api.models.enums import AgentStatus, ListingPurpose, ListingStatus, TenantStatus
from apps.api.models.listing import Listing
from apps.api.models.property import Property
from apps.api.models.tenant import Tenant
from apps.api.services.base import BaseService
from packages.common.storage import get_public_storage
from packages.common.utils.error_handlers import not_found


def _media_url(storage_key: str) -> str:
    if storage_key.startswith(("http://", "https://")):
        return storage_key
    storage = get_public_storage()
    if storage.public_base_url:
        return f"{storage.public_base_url}/{storage_key}"
    return f"/_local-public/{storage_key}"


class PublicSiteExtrasService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def _resolve_tenant(self, slug: str) -> Tenant:
        stmt = select(Tenant).where(Tenant.slug == slug)
        tenant = (await self.session.execute(stmt)).scalar_one_or_none()
        if not tenant or not tenant.public_site_enabled or tenant.status != TenantStatus.ACTIVE:
            raise not_found("Public site")
        return tenant

    async def get_stats(self, slug: str) -> dict:
        tenant = await self._resolve_tenant(slug)
        tid: UUID = tenant.id

        counts_row = (
            await self.session.execute(
                select(
                    func.count(Listing.id).label("listings_count"),
                    func.coalesce(
                        func.sum(Listing.price).filter(
                            Listing.purpose == ListingPurpose.SALE
                        ),
                        0,
                    ).label("inventory_value"),
                ).where(
                    Listing.tenant_id == tid,
                    Listing.status == ListingStatus.ACTIVE,
                )
            )
        ).one()

        agents_count = (
            await self.session.execute(
                select(func.count(Agent.id)).where(
                    Agent.tenant_id == tid,
                    Agent.status == AgentStatus.ACTIVE,
                )
            )
        ).scalar_one()

        featured_area = (
            await self.session.execute(
                select(Property.area)
                .join(Listing, Listing.property_id == Property.id)
                .where(
                    Listing.tenant_id == tid,
                    Listing.status == ListingStatus.ACTIVE,
                    Property.area.isnot(None),
                )
                .group_by(Property.area)
                .order_by(func.count().desc())
                .limit(1)
            )
        ).scalar_one_or_none()

        return {
            "listings_count": counts_row.listings_count,
            "agents_count": agents_count,
            "featured_area": featured_area,
            "inventory_value_aed": int(counts_row.inventory_value),
        }

    async def list_agents(self, slug: str) -> list[dict]:
        tenant = await self._resolve_tenant(slug)
        tid: UUID = tenant.id

        rows = (
            await self.session.execute(
                select(Agent)
                .where(Agent.tenant_id == tid, Agent.status == AgentStatus.ACTIVE)
                .order_by(Agent.created_at.asc())
                .limit(12)
            )
        ).scalars().all()

        return [
            {
                "id": a.id,
                "full_name": a.full_name,
                "email": a.email,
                "phone": a.phone,
                "photo_url": _media_url(a.photo_key) if a.photo_key else None,
                "license_id": a.license_id,
            }
            for a in rows
        ]
