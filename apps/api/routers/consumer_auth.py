"""Consumer auth router — OTP login/signup, profile read/update.

Prefix: /consumer  (mounted in main.py)
"""

from fastapi import APIRouter, Depends, HTTPException, status

from apps.api.dependencies import DbSession, ReqCtx
from apps.api.consumer_deps import CurrentConsumer
from apps.api.schemas.consumer_auth import (
    ConsumerAuthResponse,
    ConsumerResponse,
    ConsumerUpdateRequest,
    RequestOtpRequest,
    RequestOtpResponse,
    VerifyOtpRequest,
)
from apps.api.services.consumer_auth_service import ConsumerAuthService

router = APIRouter()


def _svc(db: DbSession) -> ConsumerAuthService:
    return ConsumerAuthService(db)


# ---------------------------------------------------------------------------
# OTP flow
# ---------------------------------------------------------------------------


@router.post("/auth/request-otp", response_model=RequestOtpResponse)
async def request_otp(
    body: RequestOtpRequest,
    ctx: ReqCtx,
    svc: ConsumerAuthService = Depends(_svc),
) -> RequestOtpResponse:
    """Request a 6-digit OTP sent to the provided email."""
    result = await svc.send_otp(
        str(body.email), ip=ctx.ip_address, user_agent=ctx.user_agent
    )
    return RequestOtpResponse(**result)


@router.post("/auth/verify-otp", response_model=ConsumerAuthResponse)
async def verify_otp(
    body: VerifyOtpRequest,
    ctx: ReqCtx,
    svc: ConsumerAuthService = Depends(_svc),
) -> ConsumerAuthResponse:
    """Exchange OTP code for an access token. Creates account on first login."""
    result = await svc.verify_otp(
        email=str(body.email),
        code=body.code,
        full_name=body.full_name,
        phone=body.phone,
        ip=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    consumer_resp = ConsumerResponse(**result["consumer"])
    return ConsumerAuthResponse(
        access_token=result["access_token"],
        consumer=consumer_resp,
    )


@router.post("/auth/google", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def google_sign_in() -> dict:
    """Google Sign-In stub — coming soon."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Google sign-in coming soon",
    )


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------


@router.get("/me", response_model=ConsumerResponse)
async def me(
    consumer: CurrentConsumer,
    svc: ConsumerAuthService = Depends(_svc),
) -> ConsumerResponse:
    """Return the current consumer's profile."""
    data = await svc.get_consumer(consumer)
    return ConsumerResponse(**data)


@router.patch("/me", response_model=ConsumerResponse)
async def update_me(
    body: ConsumerUpdateRequest,
    consumer: CurrentConsumer,
    svc: ConsumerAuthService = Depends(_svc),
) -> ConsumerResponse:
    """Partial-update the current consumer's profile."""
    updates = body.model_dump(exclude_unset=True)
    data = await svc.update_consumer(consumer, updates)
    return ConsumerResponse(**data)
