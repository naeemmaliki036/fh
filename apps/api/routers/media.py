"""Media router — upload + management for property media.

Video uploads (kind=video) are additionally validated against per-listing caps:
  - max 2 video media items per property
  - max 25 MB per video
  - MIME must be video/mp4 or video/webm
These checks are delegated to ListingService.validate_video_upload().
"""

from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile

from apps.api.dependencies import CurrentUser, DbSession, TenantContext
from apps.api.models.enums import MediaKind
from apps.api.models.media import Media
from apps.api.schemas.media import (
    MediaListResponse,
    MediaReorderRequest,
    MediaResponse,
    MediaUpdateRequest,
)
from apps.api.services.listing_service import ListingService
from apps.api.services.media_service import MediaService

router = APIRouter()


def _svc(db: DbSession) -> MediaService:
    return MediaService(db)


def _listing_svc(db: DbSession) -> ListingService:
    return ListingService(db)


def _to_resp(media: Media, url: str) -> MediaResponse:
    """Build MediaResponse from an ORM object without leaking _sa_instance_state."""
    return MediaResponse(
        id=media.id,
        tenant_id=media.tenant_id,
        property_id=media.property_id,
        kind=media.kind,
        storage_key=media.storage_key,
        url=url,
        mime_type=media.mime_type,
        size_bytes=media.size_bytes,
        ordering=media.ordering,
        alt_text=media.alt_text,
        variants=media.variants,
        width=media.width,
        height=media.height,
        is_floor_plan=bool(media.is_floor_plan),
        uploaded_by_user_id=media.uploaded_by_user_id,
        created_at=media.created_at,
        updated_at=media.updated_at,
    )


@router.post("/properties/{property_id}/media", response_model=MediaResponse, status_code=201)
async def upload_media(
    property_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    file: UploadFile = File(...),
    kind: MediaKind = Form(MediaKind.IMAGE),
    alt_text: str | None = Form(None),
    svc: MediaService = Depends(_svc),
    listing_svc: ListingService = Depends(_listing_svc),
) -> MediaResponse:
    data = await file.read()
    mime = file.content_type or "application/octet-stream"

    # Video-specific per-listing cap validation
    if kind == MediaKind.VIDEO:
        await listing_svc.validate_video_upload(property_id, tenant_id, data, mime)

    media, url = await svc.upload(
        property_id, tenant_id, current_user,
        data, file.filename or "upload",
        mime,
        kind, alt_text=alt_text,
    )
    return _to_resp(media, url)


@router.get("/properties/{property_id}/media", response_model=MediaListResponse)
async def list_media(
    property_id: UUID,
    tenant_id: TenantContext,
    svc: MediaService = Depends(_svc),
) -> MediaListResponse:
    items = await svc.list_media(property_id, tenant_id)
    return MediaListResponse(
        items=[_to_resp(m, svc._url(m.storage_key)) for m in items],
        total=len(items),
    )


@router.post("/properties/{property_id}/media/reorder", response_model=MediaListResponse)
async def reorder_media(
    property_id: UUID,
    body: MediaReorderRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: MediaService = Depends(_svc),
) -> MediaListResponse:
    results = await svc.reorder(property_id, tenant_id, current_user, body.ordered_ids)
    return MediaListResponse(items=[_to_resp(m, url) for m, url in results], total=len(results))


@router.patch("/media/{media_id}", response_model=MediaResponse)
async def update_media(
    media_id: UUID,
    body: MediaUpdateRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: MediaService = Depends(_svc),
) -> MediaResponse:
    updates = body.model_dump(exclude_unset=True)
    media, url = await svc.update_media(media_id, tenant_id, current_user, updates)
    return _to_resp(media, url)


@router.delete("/media/{media_id}", status_code=204)
async def delete_media(
    media_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: MediaService = Depends(_svc),
) -> None:
    await svc.delete_media(media_id, tenant_id, current_user)
