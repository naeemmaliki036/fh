"""Pydantic schemas for audit log list endpoint."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from apps.api.models.enums import AuditAction


class AuditLogActor(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    full_name: str | None = None
    email: str | None = None


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime
    action: AuditAction
    tenant_id: uuid.UUID | None = None
    entity_type: str | None = None
    entity_id: uuid.UUID | None = None
    actor_user_id: uuid.UUID | None = None
    actor_platform_user_id: uuid.UUID | None = None
    actor: AuditLogActor | None = None
    metadata_before: dict | None = None
    metadata_after: dict | None = None


class AuditLogListResponse(BaseModel):
    items: list[AuditLogResponse]
    total: int
