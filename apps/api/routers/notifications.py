"""Notifications router — platform-scoped bell notification endpoints.

All endpoints require a valid platform JWT (CurrentPlatformUser).
Mounted at /platform/notifications in main.py.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response

from apps.api.dependencies import CurrentPlatformUser, DbSession
from apps.api.schemas.notification import (
    MarkAllReadResponse,
    NotificationListResponse,
    NotificationResponse,
    UnreadCountResponse,
)
from apps.api.services.notification_service import NotificationService

router = APIRouter()


def _svc(db: DbSession) -> NotificationService:
    return NotificationService(db)


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    current_user: CurrentPlatformUser,
    limit: int = Query(default=20, ge=1, le=100),
    before_id: UUID | None = Query(default=None),
    svc: NotificationService = Depends(_svc),
) -> NotificationListResponse:
    """Return paginated notifications for the authenticated platform user."""
    uid = UUID(current_user["id"])
    items = await svc.list_for_user(uid, limit=limit, before_id=before_id)
    next_cursor = str(items[-1].id) if len(items) == limit else None
    return NotificationListResponse(
        items=[NotificationResponse.model_validate(n) for n in items],
        next_before_id=next_cursor,
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def unread_count(
    current_user: CurrentPlatformUser,
    svc: NotificationService = Depends(_svc),
) -> UnreadCountResponse:
    """Return the number of unread notifications for the authenticated platform user."""
    uid = UUID(current_user["id"])
    count = await svc.unread_count(uid)
    return UnreadCountResponse(count=count)


@router.post("/{notification_id}/read", status_code=204)
async def mark_read(
    notification_id: UUID,
    current_user: CurrentPlatformUser,
    svc: NotificationService = Depends(_svc),
) -> Response:
    """Mark a single notification as read. Idempotent. 404 if not found or not owned."""
    uid = UUID(current_user["id"])
    await svc.mark_read(uid, notification_id)
    return Response(status_code=204)


@router.post("/read-all", response_model=MarkAllReadResponse)
async def mark_all_read(
    current_user: CurrentPlatformUser,
    svc: NotificationService = Depends(_svc),
) -> MarkAllReadResponse:
    """Mark all unread notifications for the authenticated platform user as read."""
    uid = UUID(current_user["id"])
    count = await svc.mark_all_read(uid)
    return MarkAllReadResponse(marked_read=count)
