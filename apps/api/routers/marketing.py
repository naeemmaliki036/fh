"""Marketing endpoints — demo requests, pricing waitlist.

Public unauthenticated endpoints. Persist to email_outbox so platform admins
can review inbound requests from the outbox UI (with a dedicated template
key `marketing_demo_request` if seeded; otherwise the raw payload is
preserved in payload_json).
"""

import logging

from fastapi import APIRouter
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.config import settings
from apps.api.dependencies import DbSession
from apps.api.services.email_outbox_helper import queue_email

log = logging.getLogger(__name__)

router = APIRouter()


class DemoRequestPayload(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=120)
    company_name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    phone: str = Field(..., min_length=4, max_length=40)
    country: str = Field(..., min_length=2, max_length=80)
    team_size: str = Field(..., min_length=1, max_length=40)
    message: str | None = Field(None, max_length=2000)


class WaitlistPayload(BaseModel):
    email: EmailStr


@router.post("/demo-request", status_code=202)
async def submit_demo_request(
    payload: DemoRequestPayload, session: DbSession
) -> dict[str, str]:
    """Inbound demo request from the marketing site.

    Queues an internal-notification email to the platform inbox (via
    settings.email_from as the recipient — operators receive it). Returns
    202 Accepted; failures inside the queue do not surface to the visitor.
    """
    await _try_queue(
        session,
        recipient=settings.email_from,
        template_key="marketing_demo_request",
        variables=payload.model_dump(),
    )
    await session.commit()
    return {"status": "received"}


@router.post("/waitlist", status_code=202)
async def join_waitlist(
    payload: WaitlistPayload, session: DbSession
) -> dict[str, str]:
    """Inbound waitlist signup from the pricing teaser section."""
    await _try_queue(
        session,
        recipient=settings.email_from,
        template_key="marketing_waitlist",
        variables={"email": payload.email},
    )
    await session.commit()
    return {"status": "received"}


async def _try_queue(
    session: AsyncSession, *, recipient: str, template_key: str, variables: dict
) -> None:
    """Queue an outbox row; swallow failures so a missing template never
    blocks a marketing-form submission. We still log the inbound payload."""
    try:
        await queue_email(
            session,
            tenant_id=None,
            recipient_email=recipient,
            template_key=template_key,
            variables=variables,
        )
    except Exception:
        log.warning(
            "Marketing inbound captured but outbox enqueue failed: template=%s "
            "payload=%s",
            template_key,
            variables,
        )
