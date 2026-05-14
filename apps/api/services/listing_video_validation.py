"""Listing video upload validation — extracted from listing_service to stay under 300 LOC.

Called by ListingService.validate_video_upload(). Not a public API.
Size/count limits are read from the Tenant row so they are per-tenant configurable.
"""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import MediaKind
from apps.api.models.media import Media
from apps.api.models.tenant import Tenant
from packages.common.utils.error_handlers import bad_request, not_found

ALLOWED_VIDEO_MIMES = {"video/mp4", "video/webm"}


async def validate_video_upload(
    session: AsyncSession,
    property_id: UUID,
    tenant_id: UUID,
    file_bytes: bytes,
    mime_type: str,
) -> None:
    """Raise bad_request if video limits are exceeded.

    Checks:
    1. mime type is allowed
    2. file size <= tenant.max_video_mb
    3. property doesn't already have tenant.max_videos_per_property videos
    """
    if mime_type not in ALLOWED_VIDEO_MIMES:
        raise bad_request(
            f"Unsupported video mime type '{mime_type}'. "
            f"Allowed: {sorted(ALLOWED_VIDEO_MIMES)}"
        )

    tenant = await session.get(Tenant, tenant_id)
    if not tenant:
        raise not_found("Tenant")

    max_bytes = tenant.max_video_mb * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise bad_request(f"Video file exceeds {tenant.max_video_mb} MB size limit")

    r = await session.execute(
        select(func.count()).where(
            Media.property_id == property_id,
            Media.tenant_id == tenant_id,
            Media.kind == MediaKind.VIDEO,
        )
    )
    count = r.scalar_one()
    if count >= tenant.max_videos_per_property:
        raise bad_request(
            f"Property already has {tenant.max_videos_per_property} video media items "
            f"(tenant cap reached)"
        )
