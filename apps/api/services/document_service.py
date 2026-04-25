"""Generic private-document service — reusable across agents, customers, deals.

Handles upload, listing, signed-URL generation, deletion and auditing.
Each caller (agent router, future customer/deal routers) calls this directly.
"""

import uuid as uuid_mod
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import (
    AuditAction,
    PrivateDocumentEntityType,
    PrivateDocumentKind,
    TenantRole,
)
from apps.api.models.private_document import PrivateDocument
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.storage import get_private_storage
from packages.common.utils.error_handlers import forbidden, not_found

_MAX_DOC_BYTES = 25 * 1024 * 1024
_ALLOWED_MIME = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
_SIGNED_URL_TTL = 900  # 15 minutes

_UPLOAD_ROLES = {
    TenantRole.COMPANY_OWNER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.PROPERTY_ADMIN.value,
    TenantRole.AGENT.value,
}
_ADMIN_ROLES = {TenantRole.COMPANY_OWNER.value, TenantRole.COMPANY_ADMIN.value}


class DocumentService(BaseService):
    """Polymorphic private-document writer, reader and signer."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    # ------------------------------------------------------------------
    # Upload
    # ------------------------------------------------------------------

    async def upload(
        self,
        tenant_id: UUID,
        entity_type: PrivateDocumentEntityType,
        entity_id: UUID,
        kind: PrivateDocumentKind,
        file_bytes: bytes,
        filename: str,
        mime_type: str,
        actor_user_id: UUID | None = None,
        actor_platform_user_id: UUID | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> PrivateDocument:
        if mime_type not in _ALLOWED_MIME:
            raise forbidden(f"Unsupported file type '{mime_type}'.")
        if len(file_bytes) > _MAX_DOC_BYTES:
            raise forbidden("File exceeds 25 MB limit")

        storage = get_private_storage()
        file_id = uuid_mod.uuid4()
        safe_name = filename.replace("/", "_").replace("..", "_")
        key = f"private/{tenant_id}/{entity_type.value}/{entity_id}/{file_id}-{safe_name}"

        await storage.put_object(key, file_bytes, mime_type)

        await self._set_rls(tenant_id)
        doc = PrivateDocument(
            tenant_id=tenant_id,
            entity_type=entity_type,
            entity_id=entity_id,
            kind=kind,
            storage_key=key,
            original_filename=filename,
            mime_type=mime_type,
            size_bytes=len(file_bytes),
            uploaded_by_user_id=actor_user_id,
            uploaded_by_platform_user_id=actor_platform_user_id,
        )
        self.session.add(doc)
        await self.session.flush()

        await self._audit.record(
            AuditAction.DOCUMENT_UPLOADED,
            tenant_id=tenant_id,
            actor_user_id=actor_user_id,
            actor_platform_user_id=actor_platform_user_id,
            entity_type="private_document",
            entity_id=doc.id,
            after={"kind": kind.value, "filename": filename, "entity_type": entity_type.value},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        await self.session.refresh(doc)
        return doc

    # ------------------------------------------------------------------
    # List
    # ------------------------------------------------------------------

    async def list_for_entity(
        self,
        tenant_id: UUID,
        entity_type: PrivateDocumentEntityType,
        entity_id: UUID,
    ) -> list[PrivateDocument]:
        await self._set_rls(tenant_id)
        stmt = select(PrivateDocument).where(
            PrivateDocument.tenant_id == tenant_id,
            PrivateDocument.entity_type == entity_type,
            PrivateDocument.entity_id == entity_id,
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # ------------------------------------------------------------------
    # Download URL
    # ------------------------------------------------------------------

    async def get_download_url(
        self,
        tenant_id: UUID,
        document_id: UUID,
        actor_user_id: UUID | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[str, int]:
        await self._set_rls(tenant_id)
        doc = await self.session.get(PrivateDocument, document_id)
        if not doc or doc.tenant_id != tenant_id:
            raise not_found("Document")

        storage = get_private_storage()
        signed_url = await storage.get_signed_url(doc.storage_key, expires_in=_SIGNED_URL_TTL)

        await self._audit.record(
            AuditAction.DOCUMENT_ACCESSED,
            tenant_id=tenant_id,
            actor_user_id=actor_user_id,
            entity_type="private_document",
            entity_id=doc.id,
            after={"storage_key": doc.storage_key},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        return signed_url, _SIGNED_URL_TTL

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    async def delete(
        self,
        tenant_id: UUID,
        document_id: UUID,
        actor_role: str,
    ) -> None:
        if actor_role not in _ADMIN_ROLES:
            raise forbidden("company_owner or company_admin required")
        await self._set_rls(tenant_id)
        doc = await self.session.get(PrivateDocument, document_id)
        if not doc or doc.tenant_id != tenant_id:
            raise not_found("Document")

        storage = get_private_storage()
        await storage.delete_object(doc.storage_key)
        await self.session.delete(doc)
        await self.session.flush()
