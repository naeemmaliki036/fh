"""Audit log list endpoint — tenant-scoped, used by Activity tab on detail pages."""

from uuid import UUID

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.models.audit_log import AuditLog
from apps.api.models.enums import AuditAction
from apps.api.models.user import User
from apps.api.schemas.audit_log import (
    AuditLogActor,
    AuditLogListResponse,
    AuditLogResponse,
)

router = APIRouter()


@router.get("", response_model=AuditLogListResponse)
async def list_audit_logs(
    current_user: CurrentUser,
    session: DbSession,
    entity_type: str | None = Query(None),
    entity_id: UUID | None = Query(None),
    action: AuditAction | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> AuditLogListResponse:
    """List audit log entries scoped to the current tenant.

    Used by the Activity tab on property/listing/tenant detail pages.
    Filters: entity_type + entity_id (for per-record timelines), action.
    """
    tenant_id = UUID(current_user["tenant_id"])

    stmt = (
        select(AuditLog)
        .where(AuditLog.tenant_id == tenant_id)
        .order_by(AuditLog.created_at.desc())
    )
    if entity_type:
        stmt = stmt.where(AuditLog.entity_type == entity_type)
    if entity_id:
        stmt = stmt.where(AuditLog.entity_id == entity_id)
    if action:
        stmt = stmt.where(AuditLog.action == action)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    stmt = stmt.limit(limit).offset(offset)
    result = await session.execute(stmt)
    rows = list(result.scalars().all())

    actor_ids = {r.actor_user_id for r in rows if r.actor_user_id}
    actors: dict[UUID, AuditLogActor] = {}
    if actor_ids:
        u_result = await session.execute(select(User).where(User.id.in_(actor_ids)))
        for u in u_result.scalars().all():
            actors[u.id] = AuditLogActor(id=u.id, full_name=u.full_name, email=u.email)

    items: list[AuditLogResponse] = []
    for row in rows:
        actor = actors.get(row.actor_user_id) if row.actor_user_id else None
        items.append(
            AuditLogResponse(
                id=row.id,
                created_at=row.created_at,
                action=row.action,
                tenant_id=row.tenant_id,
                entity_type=row.entity_type,
                entity_id=row.entity_id,
                actor_user_id=row.actor_user_id,
                actor_platform_user_id=row.actor_platform_user_id,
                actor=actor,
                metadata_before=row.metadata_before,
                metadata_after=row.metadata_after,
            )
        )

    return AuditLogListResponse(items=items, total=total)
