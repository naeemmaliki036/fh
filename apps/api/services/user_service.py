"""User service — tenant-scoped user management.

All queries are explicitly filtered by tenant_id; RLS is a safety net only.
"""

from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.auth import hash_password
from apps.api.models.enums import AuditAction, TenantRole, UserStatus
from apps.api.models.user import User
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import bad_request, conflict, forbidden, not_found

_ADMIN_ROLES = {TenantRole.COMPANY_OWNER.value, TenantRole.COMPANY_ADMIN.value}


class UserService(BaseService):
    """CRUD operations for tenant users, all scoped by tenant_id."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        """SET LOCAL does not accept bind params — embed UUID literal (safe: it's a UUID)."""
        await self.session.execute(
            text(f"SET LOCAL app.tenant_id = '{tenant_id}'")
        )

    def _require_admin(self, current_user: dict) -> None:
        if current_user.get("role") not in _ADMIN_ROLES:
            raise forbidden("company_owner or company_admin required")

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def list_users(
        self, tenant_id: UUID, current_user: dict
    ) -> tuple[list[User], int]:
        self._require_admin(current_user)
        await self._set_rls(tenant_id)
        stmt = select(User).where(
            User.tenant_id == tenant_id,
            User.status != UserStatus.DISABLED,
        )
        result = await self.session.execute(stmt)
        items = list(result.scalars().all())
        return items, len(items)

    async def get_user(self, user_id: UUID, tenant_id: UUID) -> User:
        await self._set_rls(tenant_id)
        stmt = select(User).where(User.id == user_id, User.tenant_id == tenant_id)
        result = await self.session.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            raise not_found("User")
        return user

    async def get_me(self, user_id: UUID, tenant_id: UUID) -> User:
        return await self.get_user(user_id, tenant_id)

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    async def create_user(
        self,
        tenant_id: UUID,
        current_user: dict,
        *,
        email: str,
        password: str,
        full_name: str,
        role: TenantRole,
        phone: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> User:
        self._require_admin(current_user)
        await self._set_rls(tenant_id)

        exists = await self.session.execute(
            select(User.id).where(
                User.tenant_id == tenant_id,
                func.lower(User.email) == email.lower(),
            )
        )
        if exists.scalar_one_or_none():
            raise conflict(f"Email '{email}' already exists in this tenant")

        user = User(
            tenant_id=tenant_id,
            email=email.lower(),
            password_hash=hash_password(password),
            full_name=full_name,
            role=role,
            phone=phone,
        )
        self.session.add(user)
        await self.session.flush()

        await self._audit.record(
            AuditAction.USER_CREATED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="user",
            entity_id=user.id,
            after={"email": user.email, "role": user.role.value},
            ip_address=ip_address,
            user_agent=user_agent,
        )

        await self.session.refresh(user)
        return user

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    async def update_user(
        self,
        user_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        updates: dict,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> User:
        self._require_admin(current_user)
        user = await self.get_user(user_id, tenant_id)

        if str(user.id) == current_user.get("id"):
            raise bad_request("Use /users/me to edit your own profile")

        # Capture role before mutation for audit.
        old_role = user.role.value if "role" in updates else None

        allowed = {"full_name", "phone", "role"}
        for field, value in updates.items():
            if field in allowed and value is not None:
                setattr(user, field, value)

        await self.session.flush()

        if old_role is not None and old_role != user.role.value:
            await self._audit.record(
                AuditAction.USER_ROLE_CHANGED,
                tenant_id=tenant_id,
                actor_user_id=UUID(current_user["id"]),
                entity_type="user",
                entity_id=user.id,
                before={"role": old_role},
                after={"role": user.role.value},
                ip_address=ip_address,
                user_agent=user_agent,
            )

        await self.session.refresh(user)
        return user

    async def update_me(
        self,
        user_id: UUID,
        tenant_id: UUID,
        updates: dict,
    ) -> User:
        user = await self.get_user(user_id, tenant_id)
        allowed = {"full_name", "phone"}
        for field, value in updates.items():
            if field in allowed and value is not None:
                setattr(user, field, value)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    # ------------------------------------------------------------------
    # Delete (soft)
    # ------------------------------------------------------------------

    async def disable_user(
        self,
        user_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        if current_user.get("role") != TenantRole.COMPANY_OWNER.value:
            raise forbidden("Only company_owner can disable users")

        user = await self.get_user(user_id, tenant_id)
        if str(user.id) == current_user.get("id"):
            raise bad_request("Cannot disable your own account")

        user.status = UserStatus.DISABLED
        await self.session.flush()

        await self._audit.record(
            AuditAction.USER_DISABLED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="user",
            entity_id=user.id,
            after={"status": UserStatus.DISABLED.value},
            ip_address=ip_address,
            user_agent=user_agent,
        )

    async def change_status(
        self,
        user_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        new_status: UserStatus,
        reason_code: str,
        reason_note: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> "User":
        from packages.common.utils.error_handlers import bad_request as _bad, conflict as _conflict
        self._require_admin(current_user)
        user = await self.get_user(user_id, tenant_id)

        if str(user.id) == current_user.get("id"):
            raise _bad("Cannot change status of your own account")

        _allowed_transitions: dict[UserStatus, set[UserStatus]] = {
            UserStatus.ACTIVE: {UserStatus.DISABLED},
            UserStatus.DISABLED: {UserStatus.ACTIVE},
        }
        if new_status not in _allowed_transitions.get(user.status, set()):
            raise _bad(f"Transition {user.status.value} → {new_status.value} is not allowed")

        if user.status == new_status:
            raise _conflict(f"User is already {new_status.value}")

        old_status = user.status
        user.status = new_status
        await self.session.flush()

        action = AuditAction.USER_ENABLED if new_status == UserStatus.ACTIVE else AuditAction.USER_DISABLED
        await self._audit.record(
            action,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="user",
            entity_id=user.id,
            after={
                "from": old_status.value,
                "to": new_status.value,
                "reason_code": reason_code,
                "reason_note": reason_note,
            },
            ip_address=ip_address,
            user_agent=user_agent,
        )
        await self.session.refresh(user)
        return user
