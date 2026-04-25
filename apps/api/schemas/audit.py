"""Audit log response schema — for future read endpoints and frontend type generation."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from apps.api.models.enums import AuditAction


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    action: AuditAction
    tenant_id: uuid.UUID | None = None
    actor_user_id: uuid.UUID | None = None
    actor_platform_user_id: uuid.UUID | None = None
    entity_type: str | None = None
    entity_id: uuid.UUID | None = None
    metadata_before: dict | None = None
    metadata_after: dict | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: datetime
