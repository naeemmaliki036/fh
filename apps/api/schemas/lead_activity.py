"""LeadActivity request/response schemas.

The DB column is named `metadata` but the Python attribute is `activity_metadata`
(SQLAlchemy DeclarativeBase reserves the name `metadata`).
The API surface exposes it as `metadata` via alias.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from apps.api.models.enums import LeadActivityKind

# Kinds that only the system may create — rejected on manual POST.
SYSTEM_ONLY_KINDS = {LeadActivityKind.STAGE_CHANGED, LeadActivityKind.ASSIGNMENT_CHANGED}

# Kinds allowed for manual deletion (audit integrity preserved for system events).
DELETABLE_KINDS = {LeadActivityKind.NOTE}


class LeadActivityCreateRequest(BaseModel):
    kind: LeadActivityKind
    description: str | None = None
    activity_metadata: dict | None = Field(default=None, alias="metadata")

    model_config = ConfigDict(populate_by_name=True)


class LeadActivityResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: uuid.UUID
    lead_id: uuid.UUID
    tenant_id: uuid.UUID
    kind: LeadActivityKind
    description: str | None = None
    metadata: dict | None = Field(default=None, alias="activity_metadata")
    actor_user_id: uuid.UUID | None = None
    actor_full_name: str | None = None  # populated by service from join
    created_at: datetime


class LeadActivityListResponse(BaseModel):
    items: list[LeadActivityResponse]
    total: int
