"""Platform user service — CRUD for cross-tenant platform operators.

All mutations are super_admin only (enforced at the router level via
require_platform_role(SUPER_ADMIN)).  This service trusts that the role gate
has already fired; it does NOT re-check the caller's role internally.

Delete is intentionally absent — blocked by DB trigger (migration 0016).
"""

import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.auth import hash_password
from apps.api.models.enums import AuditAction, PlatformRole, UserStatus
from apps.api.models.platform_user import PlatformUser
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import bad_request, conflict, not_found

_log = logging.getLogger("fh.platform_user")


class PlatformUserService(BaseService):
    """Manage platform_users — list, create, update, reset-password."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    # ------------------------------------------------------------------
    # Reads
    # ------------------------------------------------------------------

    async def list_users(self) -> list[PlatformUser]:
        """Return all platform users ordered by created_at desc."""
        stmt = select(PlatformUser).order_by(PlatformUser.created_at.desc())
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_user(self, user_id: UUID) -> PlatformUser:
        """Fetch by id — raises 404 if missing."""
        pu = await self.session.get(PlatformUser, user_id)
        if not pu:
            raise not_found("PlatformUser")
        return pu

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    async def create_user(
        self,
        *,
        email: str,
        full_name: str,
        role: PlatformRole,
        password: str,
        actor_id: UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> PlatformUser:
        """Create a new platform user. Raises 409 if email already exists."""
        existing = (
            await self.session.execute(
                select(PlatformUser).where(PlatformUser.email == email.lower())
            )
        ).scalar_one_or_none()
        if existing:
            raise conflict(f"Platform user with email '{email}' already exists")

        pu = PlatformUser(
            email=email.lower(),
            full_name=full_name,
            role=role,
            password_hash=hash_password(password),
            status=UserStatus.ACTIVE,
            email_verified=False,
        )
        self.session.add(pu)
        await self.session.flush()

        await self._audit.record(
            AuditAction.PLATFORM_USER_CREATED,
            actor_platform_user_id=actor_id,
            entity_type="platform_user",
            entity_id=pu.id,
            after={"email": email, "role": role.value, "full_name": full_name},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        await self.session.refresh(pu)
        return pu

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    async def update_user(
        self,
        user_id: UUID,
        actor_id: UUID,
        *,
        full_name: str | None = None,
        role: PlatformRole | None = None,
        status: UserStatus | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> PlatformUser:
        """Partial update. Super admin cannot change their own role."""
        pu = await self.get_user(user_id)

        if role is not None and user_id == actor_id:
            raise bad_request("You cannot change your own platform role")

        before = {
            "full_name": pu.full_name,
            "role": pu.role.value,
            "status": pu.status.value,
        }

        role_changed = role is not None and role != pu.role
        if full_name is not None:
            pu.full_name = full_name
        if role is not None:
            pu.role = role
        if status is not None:
            pu.status = status
        await self.session.flush()

        after = {
            "full_name": pu.full_name,
            "role": pu.role.value,
            "status": pu.status.value,
        }

        action = (
            AuditAction.PLATFORM_USER_ROLE_CHANGED
            if role_changed
            else AuditAction.PLATFORM_USER_UPDATED
        )
        await self._audit.record(
            action,
            actor_platform_user_id=actor_id,
            entity_type="platform_user",
            entity_id=user_id,
            before=before,
            after=after,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        await self.session.refresh(pu)
        return pu

    # ------------------------------------------------------------------
    # Password reset
    # ------------------------------------------------------------------

    async def reset_password(
        self,
        user_id: UUID,
        actor_id: UUID,
        new_password: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> PlatformUser:
        """Replace the password hash for a platform user."""
        pu = await self.get_user(user_id)
        pu.password_hash = hash_password(new_password)
        await self.session.flush()

        await self._audit.record(
            AuditAction.PLATFORM_USER_PASSWORD_RESET,
            actor_platform_user_id=actor_id,
            entity_type="platform_user",
            entity_id=user_id,
            after={"event": "password_reset"},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        await self.session.refresh(pu)
        return pu
