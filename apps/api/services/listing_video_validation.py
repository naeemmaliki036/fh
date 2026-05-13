"""Listing video upload validation — extracted from listing_service to stay under 300 LOC.

Called by ListingService.validate_video_upload(). Not a public API.
"""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import MediaKind
from apps.api.models.media import Media
from packages.common.utils.error_handlers import bad_request

MAX_VIDEOS_PER_LISTING = 2
MAX_VIDEO_BYTES = 25 * 1024 * 1024  # 25 MB
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
    2. file size ≤ 25 MB
    3. property doesn't already have MAX_VIDEOS_PER_LISTING videos
    """
    if mime_type not in ALLOWED_VIDEO_MIMES:
        raise bad_request(
            f"Unsupported video mime type '{mime_type}'. "
            f"Allowed: {sorted(ALLOWED_VIDEO_MIMES)}"
        )
    if len(file_bytes) > MAX_VIDEO_BYTES:
        raise bad_request("Video file exceeds 25 MB size limit")

    r = await session.execute(
        select(func.count()).where(
            Media.property_id == property_id,
            Media.tenant_id == tenant_id,
            Media.kind == MediaKind.VIDEO,
        )
    )
    count = r.scalar_one()
    if count >= MAX_VIDEOS_PER_LISTING:
        raise bad_request(
            f"Property already has {MAX_VIDEOS_PER_LISTING} video media items (maximum reached)"
        )
