"""Auth service: tenant registration, login, refresh, and /me."""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.auth import hash_password, make_token_pair, verify_password
from apps.api.models.enums import AuditAction, TenantRole, TenantStatus
from apps.api.models.platform_user import PlatformUser
from apps.api.models.tenant import Tenant
from apps.api.models.user import User
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import (
    bad_request,
    conflict,
    forbidden,
    not_found,
    unauthorized,
)


class AuthService(BaseService):
    """Handles authentication for both tenant users and platform users."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def _record_failed_login(
        self,
        email: str,
        ip_address: str | None,
        user_agent: str | None,
    ) -> None:
        """Write a login_failed audit row in its own committed session.

        login() raises an exception after a failed attempt, which causes get_db
        to roll back the main session.  A separate session here ensures the
        failed-login row survives that rollback.
        """
        from apps.api.config import settings
        from packages.common.db.session import make_session_factory

        factory = make_session_factory(settings.database_url)
        async with factory() as session:
            svc = AuditService(session)
            await svc.record(
                AuditAction.LOGIN_FAILED,
                after={"email": email},
                ip_address=ip_address,
                user_agent=user_agent,
            )
            await session.commit()

    # ------------------------------------------------------------------
    # Tenant registration
    # ------------------------------------------------------------------

    async def register_tenant(
        self,
        *,
        tenant_name: str,
        tenant_slug: str,
        currency: str,
        timezone_: str,
        locale: str,
        owner_email: str,
        owner_password: str,
        owner_full_name: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict:
        """Create a new tenant (pending_approval) + company_owner user."""
        slug_exists = await self.session.execute(
            select(Tenant.id).where(func.lower(Tenant.slug) == tenant_slug.lower())
        )
        if slug_exists.scalar_one_or_none():
            raise conflict(f"Slug '{tenant_slug}' is already taken")

        tenant = Tenant(
            name=tenant_name,
            slug=tenant_slug.lower(),
            status=TenantStatus.PENDING_APPROVAL,
            currency=currency,
            timezone=timezone_,
            locale=locale,
        )
        self.session.add(tenant)
        await self.session.flush()

        # SET LOCAL so RLS allows the users + audit_logs inserts.
        await self.session.execute(
            text(f"SET LOCAL app.tenant_id = '{tenant.id}'")
        )

        user = User(
            tenant_id=tenant.id,
            email=owner_email.lower(),
            password_hash=hash_password(owner_password),
            full_name=owner_full_name,
            role=TenantRole.COMPANY_OWNER,
        )
        self.session.add(user)
        await self.session.flush()

        await self._audit.record(
            AuditAction.TENANT_CREATED,
            tenant_id=tenant.id,
            actor_user_id=user.id,
            entity_type="tenant",
            entity_id=tenant.id,
            after={"name": tenant.name, "slug": tenant.slug, "status": tenant.status.value},
            ip_address=ip_address,
            user_agent=user_agent,
        )

        await self.session.refresh(tenant)
        await self.session.refresh(user)
        return {"tenant": tenant, "user": user}

    # ------------------------------------------------------------------
    # Tenant user login
    # ------------------------------------------------------------------

    async def login(
        self,
        email: str,
        password: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict:
        """Authenticate a tenant user and return tokens.

        When the same email exists across multiple tenants, try each candidate
        in order and pick the first whose password matches.  bcrypt verification
        disambiguates — the correct user is unambiguous once the hash matches.
        """
        stmt = select(User).where(func.lower(User.email) == email.lower())
        candidates = (await self.session.execute(stmt)).scalars().all()

        user: User | None = None
        for candidate in candidates:
            if verify_password(password, candidate.password_hash):
                user = candidate
                break

        if user is None:
            await self._record_failed_login(email, ip_address, user_agent)
            raise unauthorized("Invalid email or password")

        tenant = await self.session.get(Tenant, user.tenant_id)
        if not tenant:
            raise not_found("Tenant")
        if tenant.status == TenantStatus.PENDING_APPROVAL:
            raise forbidden("Tenant account is pending approval")
        if tenant.status == TenantStatus.SUSPENDED:
            raise forbidden("Tenant account has been suspended")

        user.last_login_at = datetime.now(UTC).replace(tzinfo=None)
        await self.session.execute(
            text(f"SET LOCAL app.tenant_id = '{user.tenant_id}'")
        )
        await self._audit.record(
            AuditAction.LOGIN_SUCCEEDED,
            tenant_id=user.tenant_id,
            actor_user_id=user.id,
            entity_type="user",
            entity_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        await self.session.flush()

        tokens = make_token_pair({
            "sub": str(user.id),
            "tenant_id": str(user.tenant_id),
            "email": user.email,
            "role": user.role.value,
            "is_platform": False,
        })
        return {**tokens, "user": user}

    # ------------------------------------------------------------------
    # Platform user login
    # ------------------------------------------------------------------

    async def platform_login(
        self,
        email: str,
        password: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict:
        """Authenticate a platform admin and return tokens."""
        stmt = select(PlatformUser).where(
            func.lower(PlatformUser.email) == email.lower()
        )
        result = await self.session.execute(stmt)
        pu = result.scalar_one_or_none()

        if not pu or not verify_password(password, pu.password_hash):
            await self._record_failed_login(email, ip_address, user_agent)
            raise unauthorized("Invalid email or password")

        pu.last_login_at = datetime.now(UTC).replace(tzinfo=None)
        await self._audit.record(
            AuditAction.LOGIN_SUCCEEDED,
            actor_platform_user_id=pu.id,
            entity_type="platform_user",
            entity_id=pu.id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        await self.session.flush()

        tokens = make_token_pair({
            "sub": str(pu.id),
            "email": pu.email,
            "role": pu.role.value,
            "is_platform": True,
            "tenant_id": None,
        })
        return {**tokens, "user": pu}

    # ------------------------------------------------------------------
    # Refresh
    # ------------------------------------------------------------------

    async def refresh(self, refresh_token: str) -> dict:
        """Issue new access token from a valid refresh token."""
        from jose import JWTError

        from apps.api.auth import create_access_token, decode_token

        try:
            payload = decode_token(refresh_token)
        except JWTError as exc:
            raise bad_request("Invalid or expired refresh token") from exc

        if payload.get("type") != "refresh":
            raise bad_request("Not a refresh token")

        new_access = create_access_token({
            k: v for k, v in payload.items() if k not in {"type", "exp", "iat"}
        })
        return {"access_token": new_access, "token_type": "bearer"}

    # ------------------------------------------------------------------
    # /me helpers
    # ------------------------------------------------------------------

    async def get_tenant_user(self, user_id: str, tenant_id: str) -> User:
        tid = UUID(tenant_id)
        uid = UUID(user_id)
        stmt = select(User).where(User.id == uid, User.tenant_id == tid)
        result = await self.session.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            raise not_found("User")
        return user

    async def get_platform_user(self, user_id: str) -> PlatformUser:
        uid = UUID(user_id)
        pu = await self.session.get(PlatformUser, uid)
        if not pu:
            raise not_found("Platform user")
        return pu
