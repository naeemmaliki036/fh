"""Admin document-request service — create, list, get, cancel, regenerate."""

import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.auth import hash_password
from apps.api.models.document_request import DocumentRequest
from apps.api.models.document_request_item import DocumentRequestItem
from apps.api.models.enums import AuditAction, DocumentRequestStatus, TenantRole
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import bad_request, forbidden, not_found

_ALLOWED_ROLES = {
    TenantRole.COMPANY_OWNER.value, TenantRole.COMPANY_ADMIN.value,
    TenantRole.PROPERTY_ADMIN.value, TenantRole.LISTING_MANAGER.value,
    TenantRole.AGENT.value,
}


class DocumentRequestService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    def _require_role(self, role: str) -> None:
        if role not in _ALLOWED_ROLES:
            raise forbidden("Insufficient role to manage document requests")

    def _gen_code(self) -> tuple[str, str]:
        """Return (plaintext_6digit, bcrypt_hash)."""
        code = f"{secrets.randbelow(10**6):06d}"
        return code, hash_password(code)

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    async def create(
        self, tenant_id: UUID, current_user: dict,
        customer_id: UUID, lead_id: UUID | None, deal_id: UUID | None,
        title: str, instructions: str | None,
        items_data: list[dict], expires_in_days: int,
    ) -> tuple[DocumentRequest, list[DocumentRequestItem], str]:
        self._require_role(current_user["role"])
        await self._set_rls(tenant_id)

        code, code_hash = self._gen_code()
        token = secrets.token_urlsafe(32)

        dr = DocumentRequest(
            tenant_id=tenant_id,
            customer_id=customer_id,
            lead_id=lead_id,
            deal_id=deal_id,
            title=title,
            instructions=instructions,
            token=token,
            verification_code_hash=code_hash,
            expires_at=datetime.now(UTC).replace(tzinfo=None) + timedelta(days=expires_in_days),
            created_by_user_id=UUID(current_user["id"]),
        )
        self.session.add(dr)
        await self.session.flush()

        items = []
        for i, item_data in enumerate(items_data):
            item = DocumentRequestItem(
                tenant_id=tenant_id,
                document_request_id=dr.id,
                kind=item_data["kind"],
                label=item_data["label"],
                is_required=item_data.get("is_required", True),
                ordering=item_data.get("ordering", i),
            )
            self.session.add(item)
            items.append(item)
        await self.session.flush()

        await self._audit.record(
            AuditAction.OTHER,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="document_request",
            entity_id=dr.id,
            after={"customer_id": str(customer_id), "items_count": len(items)},
        )
        await self.session.refresh(dr)
        return dr, items, code

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def list_requests(
        self, tenant_id: UUID,
        status: DocumentRequestStatus | None, customer_id: UUID | None,
        skip: int, limit: int,
    ) -> tuple[list[dict], int]:
        await self._set_rls(tenant_id)
        stmt = select(DocumentRequest).where(DocumentRequest.tenant_id == tenant_id)
        if status:
            stmt = stmt.where(DocumentRequest.status == status)
        if customer_id:
            stmt = stmt.where(DocumentRequest.customer_id == customer_id)
        total = (await self.session.execute(
            select(func.count()).select_from(stmt.subquery())
        )).scalar_one()
        rows = list((await self.session.execute(
            stmt.order_by(DocumentRequest.created_at.desc()).offset(skip).limit(limit)
        )).scalars().all())
        result = []
        for dr in rows:
            items_stmt = select(DocumentRequestItem).where(
                DocumentRequestItem.document_request_id == dr.id
            )
            items = list((await self.session.execute(items_stmt)).scalars().all())
            uploaded = sum(1 for it in items if it.uploaded_document_id)
            result.append({"request": dr, "items": items, "uploaded_count": uploaded})
        return result, total

    async def get_request(self, request_id: UUID, tenant_id: UUID) -> dict:
        await self._set_rls(tenant_id)
        dr = await self.session.get(DocumentRequest, request_id)
        if not dr or dr.tenant_id != tenant_id:
            raise not_found("DocumentRequest")
        items_stmt = select(DocumentRequestItem).where(
            DocumentRequestItem.document_request_id == dr.id
        ).order_by(DocumentRequestItem.ordering)
        items = list((await self.session.execute(items_stmt)).scalars().all())
        return {"request": dr, "items": items, "uploaded_count": sum(1 for it in items if it.uploaded_document_id)}

    # ------------------------------------------------------------------
    # Cancel / regenerate
    # ------------------------------------------------------------------

    async def cancel(self, request_id: UUID, tenant_id: UUID, current_user: dict) -> DocumentRequest:
        self._require_role(current_user["role"])
        data = await self.get_request(request_id, tenant_id)
        dr = data["request"]
        if dr.status in {DocumentRequestStatus.COMPLETE, DocumentRequestStatus.CANCELED}:
            raise bad_request(f"Cannot cancel a request with status '{dr.status.value}'")
        dr.status = DocumentRequestStatus.CANCELED
        await self.session.flush()
        await self._audit.record(
            AuditAction.OTHER, tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="document_request", entity_id=dr.id,
            after={"event": "canceled"},
        )
        return dr

    async def regenerate_code(
        self, request_id: UUID, tenant_id: UUID, current_user: dict
    ) -> tuple[DocumentRequest, str]:
        self._require_role(current_user["role"])
        data = await self.get_request(request_id, tenant_id)
        dr = data["request"]
        if dr.status == DocumentRequestStatus.CANCELED:
            raise bad_request("Cannot regenerate code for a canceled request")
        code, code_hash = self._gen_code()
        dr.verification_code_hash = code_hash
        dr.verification_attempts = 0
        dr.verified_at = None
        await self.session.flush()
        await self._audit.record(
            AuditAction.OTHER, tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="document_request", entity_id=dr.id,
            after={"event": "code_regenerated"},
        )
        return dr, code
