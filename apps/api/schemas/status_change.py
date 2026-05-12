"""Shared status-change request schemas.

One base class with reason fields; per-entity subclasses pin the status type.
"""

from pydantic import BaseModel

from apps.api.models.enums import AgentStatus, ListingStatus, PropertyStatus, UserStatus


class _StatusChangeBase(BaseModel):
    reason_code: str
    reason_note: str | None = None


class AgentStatusChangeRequest(_StatusChangeBase):
    status: AgentStatus


class UserStatusChangeRequest(_StatusChangeBase):
    status: UserStatus


class ListingStatusChangeRequest(_StatusChangeBase):
    status: ListingStatus


class PropertyStatusChangeRequest(_StatusChangeBase):
    status: PropertyStatus
