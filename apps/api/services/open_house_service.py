"""Open house CRUD service.

Status transitions (enforced here, not at DB level):
  scheduled → cancelled  (cancel_open_house)
  scheduled → completed  (batch job or future manual endpoint)
"""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import AuditAction, TenantRole
from apps.api.models.listing import Listing
from apps.api.models.open_house import OpenHouse
from apps.api.models.open_house_enums import OpenHouseStatus
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import bad_request, forbidden, not_found

_MIN_DURATION = timedelta(minutes=15)

_WRITE_ROLES = {
    TenantRole.COMPANY_OWNER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.LISTING_MANAGER.value,
}


class OpenHouseService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _require_write_role(self, role: str) -> None:
        if role not in _WRITE_ROLES:
            raise forbidden("company_owner, company_admin or listing_manager required")

    def _validate_times(self, starts_at: datetime, ends_at: datetime) -> None:
        if ends_at <= starts_at + _MIN_DURATION:
            raise bad_request("ends_at must be at least 15 minutes after starts_at")

    async def _get_listing(self, listing_id: UUID, tenant_id: UUID) -> Listing:
        listing = await self.session.get(Listing, listing_id)
        if not listing or listing.tenant_id != tenant_id:
            raise not_found("Listing")
        return listing

    async def _get_open_house(self, open_house_id: UUID, tenant_id: UUID) -> OpenHouse:
        oh = await self.session.get(OpenHouse, open_house_id)
        if not oh or oh.tenant_id != tenant_id:
            raise not_found("OpenHouse")
        return oh

    # ------------------------------------------------------------------
    # Write operations
    # ------------------------------------------------------------------

    async def create_open_house(
        self,
        listing_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        starts_at: datetime,
        ends_at: datetime,
        capacity: int | None = None,
        notes: str | None = None,
    ) -> OpenHouse:
        self._require_write_role(current_user["role"])
        self._validate_times(starts_at, ends_at)

        listing = await self._get_listing(listing_id, tenant_id)

        oh = OpenHouse(
            listing_id=listing_id,
            property_id=listing.property_id,
            tenant_id=tenant_id,
            starts_at=starts_at,
            ends_at=ends_at,
            capacity=capacity,
            notes=notes,
            status=OpenHouseStatus.SCHEDULED,
            created_by_user_id=UUID(current_user["id"]),
        )
        self.session.add(oh)
        await self.session.flush()

        await self._audit.record(
            AuditAction.OPEN_HOUSE_CREATED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="open_house",
            entity_id=oh.id,
            after={
                "listing_id": str(listing_id),
                "starts_at": starts_at.isoformat(),
                "ends_at": ends_at.isoformat(),
                "capacity": capacity,
            },
        )

        await self.session.refresh(oh)
        return oh

    async def update_open_house(
        self,
        open_house_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        updates: dict,
    ) -> OpenHouse:
        self._require_write_role(current_user["role"])
        oh = await self._get_open_house(open_house_id, tenant_id)

        if oh.status != OpenHouseStatus.SCHEDULED:
            raise bad_request("Only scheduled open houses can be updated")

        new_starts = updates.get("starts_at", oh.starts_at)
        new_ends = updates.get("ends_at", oh.ends_at)
        self._validate_times(new_starts, new_ends)

        before = {
            "starts_at": oh.starts_at.isoformat(),
            "ends_at": oh.ends_at.isoformat(),
            "capacity": oh.capacity,
            "notes": oh.notes,
        }

        for field in ("starts_at", "ends_at", "capacity", "notes"):
            if field in updates:
                setattr(oh, field, updates[field])

        await self.session.flush()

        await self._audit.record(
            AuditAction.OPEN_HOUSE_UPDATED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="open_house",
            entity_id=oh.id,
            before=before,
            after={
                "starts_at": oh.starts_at.isoformat(),
                "ends_at": oh.ends_at.isoformat(),
                "capacity": oh.capacity,
                "notes": oh.notes,
            },
        )

        await self.session.refresh(oh)
        return oh

    async def cancel_open_house(
        self,
        open_house_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        reason: str | None = None,
    ) -> OpenHouse:
        self._require_write_role(current_user["role"])
        oh = await self._get_open_house(open_house_id, tenant_id)

        if oh.status != OpenHouseStatus.SCHEDULED:
            raise bad_request("Only scheduled open houses can be cancelled")

        oh.status = OpenHouseStatus.CANCELLED
        await self.session.flush()

        await self._audit.record(
            AuditAction.OPEN_HOUSE_CANCELLED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="open_house",
            entity_id=oh.id,
            after={"reason": reason, "listing_id": str(oh.listing_id)},
        )

        await self.session.refresh(oh)
        return oh

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------

    async def list_for_listing(
        self,
        listing_id: UUID,
        tenant_id: UUID,
        *,
        include_past: bool = False,
    ) -> list[OpenHouse]:
        stmt = select(OpenHouse).where(
            OpenHouse.listing_id == listing_id,
            OpenHouse.tenant_id == tenant_id,
        )
        if not include_past:
            now = datetime.now(tz=timezone.utc)
            stmt = stmt.where(OpenHouse.ends_at >= now)
        stmt = stmt.order_by(OpenHouse.starts_at.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def next_upcoming_for_listing(
        self,
        listing_id: UUID,
        tenant_id: UUID | None,
    ) -> OpenHouse | None:
        now = datetime.now(tz=timezone.utc)
        stmt = select(OpenHouse).where(
            OpenHouse.listing_id == listing_id,
            OpenHouse.status == OpenHouseStatus.SCHEDULED,
            OpenHouse.starts_at >= now,
        )
        if tenant_id is not None:
            stmt = stmt.where(OpenHouse.tenant_id == tenant_id)
        stmt = stmt.order_by(OpenHouse.starts_at.asc()).limit(1)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
