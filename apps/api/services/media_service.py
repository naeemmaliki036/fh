"""Media upload + management service. Uses public storage (R2 or local)."""

import logging
import uuid as uuid_mod
from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import MediaKind, TenantRole
from apps.api.models.media import Media
from apps.api.models.tenant import Tenant
from apps.api.services.base import BaseService
from packages.common.storage import get_public_storage
from packages.common.utils.error_handlers import bad_request, forbidden, not_found

logger = logging.getLogger(__name__)

_MAX_PDF = 25 * 1024 * 1024

# Mime-type → allowed kinds mapping (unchanged)
_MIME_LIMITS_STATIC: dict[str, int] = {
    "application/pdf": _MAX_PDF,
}
# Mime-type for PDF (size limit is static; images/videos use per-tenant caps)
_MIME_KINDS: dict[str, set[MediaKind]] = {
    "image/jpeg": {MediaKind.IMAGE, MediaKind.FLOORPLAN},
    "image/png": {MediaKind.IMAGE, MediaKind.FLOORPLAN},
    "image/webp": {MediaKind.IMAGE},
    "video/mp4": {MediaKind.VIDEO},
    "video/webm": {MediaKind.VIDEO},
    "application/pdf": {MediaKind.FLOORPLAN, MediaKind.BROCHURE},
}
_IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp"}
_VIDEO_MIMES = {"video/mp4", "video/webm"}
_MANAGER_ROLES = {
    TenantRole.COMPANY_OWNER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.PROPERTY_ADMIN.value,
    TenantRole.LISTING_MANAGER.value,
}


class MediaService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    def _require_manager(self, role: str) -> None:
        if role not in _MANAGER_ROLES:
            raise forbidden("listing_manager, property_admin, company_admin or company_owner required")

    def _url(self, storage_key: str) -> str:
        if storage_key.startswith(("http://", "https://")):
            return storage_key
        storage = get_public_storage()
        if storage.public_base_url:
            return f"{storage.public_base_url}/{storage_key}"
        return f"/_local-public/{storage_key}"

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def list_media(self, property_id: UUID, tenant_id: UUID) -> list[Media]:
        await self._set_rls(tenant_id)
        r = await self.session.execute(
            select(Media)
            .where(Media.property_id == property_id, Media.tenant_id == tenant_id)
            .order_by(Media.ordering)
        )
        return list(r.scalars().all())

    async def get_media(self, media_id: UUID, tenant_id: UUID) -> Media:
        await self._set_rls(tenant_id)
        m = await self.session.get(Media, media_id)
        if not m or m.tenant_id != tenant_id:
            raise not_found("Media")
        return m

    # ------------------------------------------------------------------
    # Upload
    # ------------------------------------------------------------------

    async def _fetch_tenant(self, tenant_id: UUID) -> Tenant:
        tenant = await self.session.get(Tenant, tenant_id)
        if not tenant:
            raise not_found("Tenant")
        return tenant

    async def upload(
        self,
        property_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        file_bytes: bytes,
        filename: str,
        mime_type: str,
        kind: MediaKind,
        alt_text: str | None = None,
    ) -> tuple[Media, str]:
        self._require_manager(current_user["role"])

        valid_kinds = _MIME_KINDS.get(mime_type)
        if valid_kinds is None:
            raise bad_request(f"Unsupported mime type '{mime_type}'")
        if kind not in valid_kinds:
            raise bad_request(f"Kind '{kind.value}' is not valid for mime type '{mime_type}'")

        # Per-tenant size + count enforcement
        tenant = await self._fetch_tenant(tenant_id)
        file_size = len(file_bytes)

        if mime_type in _IMAGE_MIMES:
            max_bytes = tenant.max_image_mb * 1024 * 1024
            if file_size > max_bytes:
                raise bad_request(
                    f"Image exceeds {tenant.max_image_mb} MB limit for this tenant"
                )
            if kind == MediaKind.IMAGE:
                r = await self.session.execute(
                    select(func.count()).where(
                        Media.property_id == property_id,
                        Media.tenant_id == tenant_id,
                        Media.kind == MediaKind.IMAGE,
                    )
                )
                if r.scalar_one() >= tenant.max_images_per_property:
                    raise bad_request(
                        f"Property already has {tenant.max_images_per_property} images "
                        f"(tenant cap reached)"
                    )
        elif mime_type in _VIDEO_MIMES:
            max_bytes = tenant.max_video_mb * 1024 * 1024
            if file_size > max_bytes:
                raise bad_request(
                    f"Video exceeds {tenant.max_video_mb} MB limit for this tenant"
                )
            r = await self.session.execute(
                select(func.count()).where(
                    Media.property_id == property_id,
                    Media.tenant_id == tenant_id,
                    Media.kind == MediaKind.VIDEO,
                )
            )
            if r.scalar_one() >= tenant.max_videos_per_property:
                raise bad_request(
                    f"Property already has {tenant.max_videos_per_property} videos "
                    f"(tenant cap reached)"
                )
        else:
            # PDF — static cap
            if file_size > _MAX_PDF:
                raise bad_request("File exceeds 25 MB size limit")

        storage = get_public_storage()
        file_id = uuid_mod.uuid4()
        safe = filename.replace("/", "_").replace("..", "_")
        key = f"public/properties/{tenant_id}/{property_id}/{file_id}-{safe}"

        await storage.put_object(key, file_bytes, mime_type)

        await self._set_rls(tenant_id)
        # Next ordering position
        r = await self.session.execute(
            select(Media.ordering)
            .where(Media.property_id == property_id)
            .order_by(Media.ordering.desc())
            .limit(1)
        )
        last_ord = r.scalar_one_or_none()
        ordering = (last_ord or -1) + 1

        media = Media(
            property_id=property_id,
            tenant_id=tenant_id,
            kind=kind,
            storage_key=key,
            mime_type=mime_type,
            size_bytes=len(file_bytes),
            ordering=ordering,
            alt_text=alt_text,
            uploaded_by_user_id=UUID(current_user["id"]),
        )
        self.session.add(media)
        await self.session.flush()
        await self.session.refresh(media)
        return media, self._url(key)

    # ------------------------------------------------------------------
    # Update / Reorder / Delete
    # ------------------------------------------------------------------

    async def update_media(
        self, media_id: UUID, tenant_id: UUID, current_user: dict, updates: dict
    ) -> tuple[Media, str]:
        self._require_manager(current_user["role"])
        media = await self.get_media(media_id, tenant_id)
        for k, v in updates.items():
            if k in {"ordering", "alt_text"} and v is not None:
                setattr(media, k, v)
            elif k == "is_floor_plan" and v is not None:
                setattr(media, k, v)
        await self.session.flush()
        await self.session.refresh(media)
        return media, self._url(media.storage_key)

    async def reorder(
        self, property_id: UUID, tenant_id: UUID, current_user: dict, ordered_ids: list[UUID]
    ) -> list[tuple[Media, str]]:
        self._require_manager(current_user["role"])
        await self._set_rls(tenant_id)
        objects: list[tuple[Media, str]] = []
        for i, mid in enumerate(ordered_ids):
            m = await self.session.get(Media, mid)
            if not m or m.property_id != property_id or m.tenant_id != tenant_id:
                raise not_found(f"Media {mid}")
            m.ordering = i
            objects.append((m, self._url(m.storage_key)))
        try:
            await self.session.flush()
        except Exception:
            logger.exception("reorder flush failed for property %s", property_id)
            raise
        # Refresh each object so server-side updated_at is accurate before serialization.
        results: list[tuple[Media, str]] = []
        for m, url in objects:
            await self.session.refresh(m)
            results.append((m, url))
        return results

    async def delete_media(
        self, media_id: UUID, tenant_id: UUID, current_user: dict
    ) -> None:
        self._require_manager(current_user["role"])
        media = await self.get_media(media_id, tenant_id)
        storage = get_public_storage()
        await storage.delete_object(media.storage_key)
        await self.session.delete(media)
        await self.session.flush()
