"""Schemas for the listing review/approval workflow endpoints."""

import uuid
from typing import Literal

from pydantic import BaseModel


class SubmitForReviewRequest(BaseModel):
    reviewer_id: uuid.UUID
    note: str | None = None


class ReviewDecisionRequest(BaseModel):
    decision: Literal["approved", "changes_requested"]
    note: str | None = None


class EligibleReviewerResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    role: str

    model_config = {"from_attributes": True}


class EligibleReviewerListResponse(BaseModel):
    items: list[EligibleReviewerResponse]
    total: int
