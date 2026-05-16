"""Consumer auth service — passwordless OTP login / signup.

Flow:
  1. send_otp   → rate-check, generate/hash code, queue email
  2. verify_otp → validate code, get-or-create account, mint JWT

Consumer JWT payload: { sub: consumer.id, kind: "consumer", email: ... }
Expires in 30 days (not using the standard tenant TTL).
"""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

from jose import jwt
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.config import settings
from apps.api.models.consumer_account import ConsumerAccount, ConsumerAccountStatus
from apps.api.models.consumer_otp import ConsumerOtp
from apps.api.models.enums import AuditAction
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from apps.api.services.email_outbox_helper import queue_email
from packages.common.utils.error_handlers import too_many_requests, unauthorized

_CONSUMER_JWT_TTL_DAYS = 30
_OTP_TTL_MINUTES = 10
_OTP_RATE_LIMIT_SECONDS = 60
_OTP_MAX_ATTEMPTS = 5


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def _mint_consumer_token(consumer: ConsumerAccount) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(consumer.id),
        "kind": "consumer",
        "email": consumer.email,
        "iat": now,
        "exp": now + timedelta(days=_CONSUMER_JWT_TTL_DAYS),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def _otp_email_html(code: str) -> str:
    return (
        f"<p>Your PropertyPoint sign-in code is:</p>"
        f"<h1 style='letter-spacing:4px;font-size:36px;'>{code}</h1>"
        f"<p>This code expires in {_OTP_TTL_MINUTES} minutes.</p>"
        f"<p>If you didn't request this, you can ignore this email.</p>"
    )



class ConsumerAuthService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    # ------------------------------------------------------------------
    # PPD tenant resolution (cached per instance)
    # ------------------------------------------------------------------

    async def _ppd_tenant_id(self) -> UUID:
        from apps.api.models.tenant import Tenant
        row = (
            await self.session.execute(
                select(Tenant.id).where(Tenant.slug == "propertypoint-direct")
            )
        ).scalar_one_or_none()
        if row is None:
            raise RuntimeError("propertypoint-direct tenant not seeded")
        return row

    # ------------------------------------------------------------------
    # send_otp
    # ------------------------------------------------------------------

    async def send_otp(
        self,
        email: str,
        ip: str | None,
        user_agent: str | None,
    ) -> dict:
        email = email.lower().strip()

        # Rate limit: max 1 OTP per email per 60s
        cutoff = datetime.now(UTC) - timedelta(seconds=_OTP_RATE_LIMIT_SECONDS)
        recent = (
            await self.session.execute(
                select(ConsumerOtp.id).where(
                    ConsumerOtp.email == email,
                    ConsumerOtp.created_at >= cutoff,
                ).limit(1)
            )
        ).scalar_one_or_none()
        if recent is not None:
            raise too_many_requests("Please wait before requesting another code")

        # Generate code (dev override or secure random)
        override = settings.consumer_otp_dev_override
        if override:
            code = override
        else:
            code = "".join(secrets.choice("0123456789") for _ in range(6))

        code_hash = _hash_code(code)
        expires_at = datetime.now(UTC) + timedelta(minutes=_OTP_TTL_MINUTES)

        otp_row = ConsumerOtp(
            email=email,
            code_hash=code_hash,
            expires_at=expires_at,
            ip_address=ip,
            user_agent=user_agent,
        )
        self.session.add(otp_row)
        await self.session.flush()

        await queue_email(
            self.session,
            template_key="consumer_otp_login",
            recipient_email=email,
            subject="Your PropertyPoint sign-in code",
            body_html=_otp_email_html(code),
            payload={"email": email},
        )

        # Only return the dev_otp value at the API boundary when override is active.
        return {"sent": True, "dev_otp": code if override else None}

    # ------------------------------------------------------------------
    # verify_otp
    # ------------------------------------------------------------------

    async def verify_otp(
        self,
        email: str,
        code: str,
        full_name: str | None,
        phone: str | None,
        ip: str | None,
        user_agent: str | None,
    ) -> dict:
        email = email.lower().strip()
        now = datetime.now(UTC)

        # Fetch the most recent unused OTP for this email
        otp_row = (
            await self.session.execute(
                select(ConsumerOtp)
                .where(
                    ConsumerOtp.email == email,
                    ConsumerOtp.used_at.is_(None),
                )
                .order_by(ConsumerOtp.created_at.desc())
                .limit(1)
            )
        ).scalar_one_or_none()

        if otp_row is None:
            raise unauthorized("No active OTP for this email")

        # Lock out after too many attempts
        if otp_row.attempts >= _OTP_MAX_ATTEMPTS:
            otp_row.used_at = now
            await self.session.flush()
            raise unauthorized("Too many failed attempts; request a new code")

        if otp_row.expires_at.replace(tzinfo=UTC) < now:
            raise unauthorized("Code has expired")

        otp_row.attempts = (otp_row.attempts or 0) + 1

        if otp_row.code_hash != _hash_code(code):
            await self.session.flush()
            raise unauthorized("Invalid code")

        otp_row.used_at = now
        await self.session.flush()

        # Get-or-create consumer account
        consumer = (
            await self.session.execute(
                select(ConsumerAccount).where(ConsumerAccount.email == email)
            )
        ).scalar_one_or_none()

        is_new = consumer is None
        ppd_id = await self._ppd_tenant_id()

        if is_new:
            consumer = ConsumerAccount(
                email=email,
                full_name=full_name,
                phone=phone,
                status=ConsumerAccountStatus.ACTIVE,
                last_login_at=now,
            )
            self.session.add(consumer)
            await self.session.flush()
            await self._audit.record(
                AuditAction.CONSUMER_ACCOUNT_CREATED,
                tenant_id=ppd_id,
                entity_type="consumer_account",
                entity_id=consumer.id,
                after={"email": email},
                ip_address=ip,
                user_agent=user_agent,
            )
        else:
            consumer.last_login_at = now
            if full_name and not consumer.full_name:
                consumer.full_name = full_name
            if phone and not consumer.phone:
                consumer.phone = phone
            await self.session.flush()

        await self.session.refresh(consumer)

        consumer_resp = await self._build_response(consumer)
        access_token = _mint_consumer_token(consumer)
        return {"access_token": access_token, "consumer": consumer_resp}

    # ------------------------------------------------------------------
    # Profile helpers
    # ------------------------------------------------------------------

    async def get_consumer(self, consumer: ConsumerAccount) -> dict:
        return await self._build_response(consumer)

    async def update_consumer(
        self, consumer: ConsumerAccount, updates: dict
    ) -> dict:
        if "full_name" in updates and updates["full_name"] is not None:
            consumer.full_name = updates["full_name"]
        if "phone" in updates and updates["phone"] is not None:
            consumer.phone = updates["phone"]
        await self.session.flush()
        await self.session.refresh(consumer)
        return await self._build_response(consumer)

    async def _build_response(self, consumer: ConsumerAccount) -> dict:
        from apps.api.models.consumer_favorite import ConsumerFavorite
        from apps.api.models.listing import Listing

        listings_count = (
            await self.session.execute(
                select(func.count()).where(
                    Listing.consumer_account_id == consumer.id
                )
            )
        ).scalar_one()
        favorites_count = (
            await self.session.execute(
                select(func.count()).where(
                    ConsumerFavorite.consumer_account_id == consumer.id
                )
            )
        ).scalar_one()
        return {
            "id": consumer.id,
            "email": consumer.email,
            "full_name": consumer.full_name,
            "phone": consumer.phone,
            "status": consumer.status.value,
            "created_at": consumer.created_at,
            "last_login_at": consumer.last_login_at,
            "listings_count": int(listings_count),
            "favorites_count": int(favorites_count),
        }
