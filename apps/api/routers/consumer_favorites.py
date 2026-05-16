"""Consumer favorites router — toggle saved listings, list favorites.

Prefix: /consumer  (mounted in main.py)
Routes: /consumer/me/favorites, /consumer/me/favorites/{listing_id}
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import DbSession
from apps.api.consumer_deps import CurrentConsumer
from apps.api.schemas.consumer_favorite import FavoriteToggleResponse
from apps.api.services.consumer_favorite_service import ConsumerFavoriteService

router = APIRouter()


def _svc(db: DbSession) -> ConsumerFavoriteService:
    return ConsumerFavoriteService(db)


@router.post(
    "/me/favorites/{listing_id}", response_model=FavoriteToggleResponse
)
async def toggle_favorite(
    listing_id: UUID,
    consumer: CurrentConsumer,
    svc: ConsumerFavoriteService = Depends(_svc),
) -> FavoriteToggleResponse:
    """Toggle a listing in/out of the consumer's saved list."""
    result = await svc.toggle(consumer.id, listing_id)
    return FavoriteToggleResponse(**result)


@router.get("/me/favorites")
async def list_favorites(
    consumer: CurrentConsumer,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    svc: ConsumerFavoriteService = Depends(_svc),
) -> dict:
    """Paginated list of the consumer's saved listings."""
    return await svc.list_favorites(
        consumer.id, page=page, page_size=page_size
    )
