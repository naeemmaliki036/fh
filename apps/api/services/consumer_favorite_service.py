"""Consumer favorite service — toggle saved listings, paginated list."""

from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.consumer_favorite import ConsumerFavorite
from apps.api.models.listing import Listing
from apps.api.models.property import Property
from apps.api.models.tenant import Tenant
from apps.api.services.base import BaseService
from apps.api.services.marketplace_queries import _listing_row_to_dict
from packages.common.utils.error_handlers import not_found


class ConsumerFavoriteService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    # ------------------------------------------------------------------
    # Toggle
    # ------------------------------------------------------------------

    async def toggle(self, consumer_id: UUID, listing_id: UUID) -> dict:
        # Verify listing exists
        listing = await self.session.get(Listing, listing_id)
        if not listing:
            raise not_found("Listing")

        existing = (
            await self.session.execute(
                select(ConsumerFavorite).where(
                    ConsumerFavorite.consumer_account_id == consumer_id,
                    ConsumerFavorite.listing_id == listing_id,
                )
            )
        ).scalar_one_or_none()

        if existing:
            await self.session.delete(existing)
            await self.session.flush()
            favorited = False
        else:
            fav = ConsumerFavorite(
                consumer_account_id=consumer_id,
                listing_id=listing_id,
            )
            self.session.add(fav)
            await self.session.flush()
            favorited = True

        count = (
            await self.session.execute(
                select(func.count()).where(
                    ConsumerFavorite.consumer_account_id == consumer_id
                )
            )
        ).scalar_one()
        return {"favorited": favorited, "favorites_count": int(count)}

    # ------------------------------------------------------------------
    # List
    # ------------------------------------------------------------------

    async def list_favorites(
        self, consumer_id: UUID, *, page: int, page_size: int
    ) -> dict:
        base = (
            select(ConsumerFavorite)
            .where(ConsumerFavorite.consumer_account_id == consumer_id)
        )
        total = (
            await self.session.execute(
                select(func.count()).select_from(base.subquery())
            )
        ).scalar_one()

        fav_rows = (
            await self.session.execute(
                base.order_by(ConsumerFavorite.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ).scalars().all()

        listing_ids = [f.listing_id for f in fav_rows]
        if not listing_ids:
            return {"items": [], "total": int(total)}

        rows = (
            await self.session.execute(
                select(Listing, Property, Tenant)
                .join(Property, Listing.property_id == Property.id)
                .join(Tenant, Listing.tenant_id == Tenant.id)
                .where(Listing.id.in_(listing_ids))
            )
        ).all()

        items = []
        for listing, prop, tenant in rows:
            items.append({
                "id": listing.id,
                "title": listing.title,
                "price": float(listing.price),
                "currency": listing.currency,
                "city": prop.city,
                "area": prop.area,
                "beds": prop.bedrooms,
                "baths": prop.bathrooms,
                "property_type": prop.property_type.value,
                "purpose": listing.purpose.value,
                "is_consumer_listing": listing.consumer_account_id is not None,
                "owner_display_name": (
                    None  # consumer name resolved on demand for consumer listings
                    if listing.consumer_account_id else tenant.name
                ),
                "tenant": {
                    "id": tenant.id,
                    "slug": tenant.slug,
                    "name": tenant.name,
                },
            })
        return {"items": items, "total": int(total)}
