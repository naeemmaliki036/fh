"""Consumer listing media service — upload/delete/reorder for self-posted listings.

Consumer listings do not have tenant RBAC (no role check), but ownership of
the property is enforced: the property must belong to the authenticated consumer.

Reuses the same public storage backend (R2 / local fallback) as the agency
media service. Images only — no video for consumer listings in Phase 1.
"""

import uuid as uuid_mod
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import MediaKind
from apps.api.models.listing import Listing
from apps.api.models.media import Media
from apps.api.models.property import Property
from apps.api.services.base import BaseService
from apps.api.services.consumer_listing_helpers import _media_url
from packages.common.storage import get_public_storage
from packages.common.utils.error_handlers import bad_request, forbidden, not_found

_ALLOWED_MIMES = {"image/jpeg", "image/png", "image/webp"}
_MAX_IMAGES = 20
_MAX_IMAGE_MB = 10


class ConsumerListingMediaService(BaseService):
    """Upload, list, reorder and delete media for consumer-owned listings."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def _resolve_property(
        self, consumer_id: UUID, listing_id: UUID
    ) -> Property:
        """Return the property for a consumer-owned listing (else 404/403)."""
        row = (
            await self.session.execute(
                select(Listing, Property)
                .join(Property, Listing.property_id == Property.id)
                .where(
                    Listing.id == listing_id,
                    Listing.consumer_account_id == consumer_id,
                )
            )
        ).one_or_none()
        if row is None:
            raise not_found("Listing")
        return row[1]

    # ------------------------------------------------------------------
    # List
    # ------------------------------------------------------------------

    async def list_media(
        self, consumer_id: UUID, listing_id: UUID
    ) -> list[dict]:
        prop = await self._resolve_property(consumer_id, listing_id)
        rows = (
            await self.session.execute(
                select(Media)
                .where(Media.property_id == prop.id)
                .order_by(Media.ordering)
            )
        ).scalars().all()
        return [_to_dict(m) for m in rows]

    # ------------------------------------------------------------------
    # Upload
    # ------------------------------------------------------------------

    async def upload(
        self,
        consumer_id: UUID,
        listing_id: UUID,
        file_bytes: bytes,
        filename: str,
        mime_type: str,
    ) -> dict:
        if mime_type not in _ALLOWED_MIMES:
            raise bad_request(
                f"Unsupported mime type '{mime_type}'. Accepted: jpeg, png, webp"
            )
        if len(file_bytes) > _MAX_IMAGE_MB * 1024 * 1024:
            raise bad_request(f"Image exceeds {_MAX_IMAGE_MB} MB limit")

        prop = await self._resolve_property(consumer_id, listing_id)

        count = (
            await self.session.execute(
                select(func.count()).where(
                    Media.property_id == prop.id,
                    Media.kind == MediaKind.IMAGE,
                )
            )
        ).scalar_one()
        if count >= _MAX_IMAGES:
            raise bad_request(f"Maximum {_MAX_IMAGES} images per listing")

        storage = get_public_storage()
        file_id = uuid_mod.uuid4()
        safe = filename.replace("/", "_").replace("..", "_")
        key = f"public/consumer/{prop.consumer_account_id}/{prop.id}/{file_id}-{safe}"
        await storage.put_object(key, file_bytes, mime_type)

        last_ord = (
            await self.session.execute(
                select(Media.ordering)
                .where(Media.property_id == prop.id)
                .order_by(Media.ordering.desc())
                .limit(1)
            )
        ).scalar_one_or_none()
        ordering = (last_ord or -1) + 1

        media = Media(
            property_id=prop.id,
            tenant_id=prop.tenant_id,
            kind=MediaKind.IMAGE,
            storage_key=key,
            mime_type=mime_type,
            size_bytes=len(file_bytes),
            ordering=ordering,
        )
        self.session.add(media)
        await self.session.flush()
        await self.session.refresh(media)
        return _to_dict(media)

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    async def delete_media(
        self, consumer_id: UUID, listing_id: UUID, media_id: UUID
    ) -> None:
        prop = await self._resolve_property(consumer_id, listing_id)
        media = await self.session.get(Media, media_id)
        if not media or media.property_id != prop.id:
            raise not_found("Media")
        storage = get_public_storage()
        await storage.delete_object(media.storage_key)
        await self.session.delete(media)
        await self.session.flush()

    # ------------------------------------------------------------------
    # Reorder
    # ------------------------------------------------------------------

    async def reorder(
        self,
        consumer_id: UUID,
        listing_id: UUID,
        ordered_ids: list[UUID],
    ) -> list[dict]:
        prop = await self._resolve_property(consumer_id, listing_id)
        results = []
        for i, mid in enumerate(ordered_ids):
            m = await self.session.get(Media, mid)
            if not m or m.property_id != prop.id:
                raise not_found(f"Media {mid}")
            m.ordering = i
            results.append(m)
        await self.session.flush()
        for m in results:
            await self.session.refresh(m)
        return [_to_dict(m) for m in results]


def _to_dict(media: Media) -> dict:
    return {
        "id": media.id,
        "url": _media_url(media.storage_key),
        "kind": media.kind.value if media.kind else None,
        "position": media.ordering,
        "mime_type": media.mime_type,
        "size_bytes": media.size_bytes,
        "created_at": media.created_at,
    }
