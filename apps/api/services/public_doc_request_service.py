"""Public document request service — anonymous lookup, verify, and upload.

TODO (Phase 2): Replace the DB-owner RLS bypass on token lookup with a
SECURITY DEFINER function so this path works even when running as a
non-owner Postgres role.  For now the 'fh' role owns the tables and
bypasses RLS automatically — safe for Phase 1.
"""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.auth import encode_doc_request_token, verify_password
from apps.api.models.document_request import DocumentRequest
from apps.api.models.document_request_item import DocumentRequestItem
from apps.api.models.enums import (
    AuditAction,
    DocumentRequestStatus,
    PrivateDocumentEntityType,
    TenantStatus,
)
from apps.api.models.tenant import Tenant
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from apps.api.services.document_service import DocumentService
from packages.common.utils.error_handlers import bad_request, locked, not_found, unauthorized

_MAX_ATTEMPTS = 5


class PublicDocRequestService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        """Set RLS from the resolved request.tenant_id — NEVER from user input."""
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    async def _get_items(self, request_id: UUID) -> list[DocumentRequestItem]:
        stmt = select(DocumentRequestItem).where(
            DocumentRequestItem.document_request_id == request_id
        ).order_by(DocumentRequestItem.ordering)
        return list((await self.session.execute(stmt)).scalars().all())

    async def _check_and_expire(self, dr: DocumentRequest) -> None:
        _terminal = {DocumentRequestStatus.COMPLETE, DocumentRequestStatus.CANCELED, DocumentRequestStatus.EXPIRED}
        now = datetime.now(UTC)
        # expires_at is TIMESTAMPTZ → tz-aware; compare consistently
        expires = dr.expires_at if dr.expires_at.tzinfo else dr.expires_at.replace(tzinfo=UTC)
        if expires < now and dr.status not in _terminal:
            dr.status = DocumentRequestStatus.EXPIRED
            await self.session.flush()

    # ------------------------------------------------------------------
    # Anonymous lookup by token
    # ------------------------------------------------------------------

    async def get_by_token(self, token: str, verified: bool = False) -> dict:
        """Load request + tenant name. No RLS needed — owner role bypasses."""
        stmt = select(DocumentRequest).where(DocumentRequest.token == token)
        dr = (await self.session.execute(stmt)).scalar_one_or_none()
        if not dr:
            raise not_found("Document request")
        await self._check_and_expire(dr)
        tenant = await self.session.get(Tenant, dr.tenant_id)
        if tenant and tenant.status == TenantStatus.SUSPENDED:
            raise HTTPException(
                status_code=410,
                detail={
                    "detail": "site_offline",
                    "reason": tenant.suspended_reason or "This site is temporarily unavailable.",
                },
            )
        items = await self._get_items(dr.id)
        return {"request": dr, "tenant_name": tenant.name if tenant else "", "items": items, "verified": verified}

    # ------------------------------------------------------------------
    # Verify code
    # ------------------------------------------------------------------

    async def verify_code(self, token: str, code: str) -> dict:
        data = await self.get_by_token(token)
        dr = data["request"]

        if dr.status == DocumentRequestStatus.CANCELED:
            raise bad_request("This request has been canceled")
        if dr.status == DocumentRequestStatus.EXPIRED:
            raise bad_request("This request has expired")

        success = verify_password(code, dr.verification_code_hash)

        await self._set_rls(dr.tenant_id)
        await self._audit.record(
            AuditAction.OTHER,
            tenant_id=dr.tenant_id,
            entity_type="document_request",
            entity_id=dr.id,
            after={"event": "verify", "success": success},
        )

        if not success:
            dr.verification_attempts += 1
            if dr.verification_attempts >= _MAX_ATTEMPTS:
                dr.status = DocumentRequestStatus.CANCELED
            await self.session.flush()
            await self.session.commit()  # persist attempt count before raising; rollback would lose it
            if dr.verification_attempts >= _MAX_ATTEMPTS:
                raise locked("Too many failed attempts; this link is locked")
            attempts_left = _MAX_ATTEMPTS - dr.verification_attempts
            raise unauthorized({"message": "Invalid verification code", "attempts_left": attempts_left})

        if not dr.verified_at:
            dr.verified_at = datetime.now(UTC).replace(tzinfo=None)
        await self.session.flush()

        access_token = encode_doc_request_token(str(dr.id))
        return {"access_token": access_token, "token_type": "bearer", "expires_in": 1800}

    # ------------------------------------------------------------------
    # Upload item (requires verified JWT)
    # ------------------------------------------------------------------

    async def upload_item(
        self,
        dr: DocumentRequest,
        item_id: UUID,
        file_bytes: bytes,
        filename: str,
        mime_type: str,
    ) -> dict:
        await self._set_rls(dr.tenant_id)
        item = await self.session.get(DocumentRequestItem, item_id)
        if not item or item.document_request_id != dr.id:
            raise not_found("Document request item")

        doc_svc = DocumentService(self.session)
        doc = await doc_svc.upload(
            dr.tenant_id,
            PrivateDocumentEntityType.CUSTOMER,
            dr.customer_id,
            item.kind,
            file_bytes,
            filename,
            mime_type,
        )

        item.uploaded_document_id = doc.id
        item.uploaded_at = datetime.now(UTC).replace(tzinfo=None)
        await self.session.flush()

        # Recalculate status
        all_items = await self._get_items(dr.id)
        required_done = all(
            it.uploaded_document_id for it in all_items if it.is_required
        )
        dr.status = DocumentRequestStatus.COMPLETE if required_done else DocumentRequestStatus.PARTIAL
        await self.session.flush()

        return {"item": item, "request_status": dr.status}
