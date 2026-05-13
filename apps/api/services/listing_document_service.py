"""Listing document upload/list/delete service.

Documents stored in public R2 bucket under a listing-scoped path.
Max 10 documents per listing, 5 MB each.
Allowed MIME: application/pdf, image/png, image/jpeg, image/webp.
Allowed kinds: brochure, floor_plan, payment_plan, other.
"""

import uuid as uuid_mod
from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import AuditAction, TenantRole
from apps.api.models.listing import Listing
from apps.api.models.listing_document import ListingDocument
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.storage import get_public_storage
from packages.common.utils.error_handlers import bad_request, forbidden, not_found

_MANAGER_ROLES = {
    TenantRole.COMPANY_OWNER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.PROPERTY_ADMIN.value,
    TenantRole.LISTING_MANAGER.value,
}

_ALLOWED_MIMES = {"application/pdf", "image/png", "image/jpeg", "image/webp"}
_ALLOWED_KINDS = {"brochure", "floor_plan", "payment_plan", "other"}
_MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
_MAX_PER_LISTING = 10


class ListingDocumentService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    def _require_manager(self, role: str) -> None:
        if role not in _MANAGER_ROLES:
            raise forbidden("listing_manager, property_admin, company_admin or company_owner required")

    def _doc_url(self, storage_key: str) -> str:
        storage = get_public_storage()
        if storage.public_base_url:
            return f"{storage.public_base_url}/{storage_key}"
        return f"/_local-public/{storage_key}"

    async def _get_listing(self, listing_id: UUID, tenant_id: UUID) -> Listing:
        listing = await self.session.get(Listing, listing_id)
        if not listing or listing.tenant_id != tenant_id:
            raise not_found("Listing")
        return listing

    async def _doc_count(self, listing_id: UUID) -> int:
        r = await self.session.execute(
            select(func.count()).where(ListingDocument.listing_id == listing_id)
        )
        return r.scalar_one()

    # ------------------------------------------------------------------
    # Upload
    # ------------------------------------------------------------------

    async def upload(
        self,
        listing_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        file_bytes: bytes,
        filename: str,
        mime_type: str,
        kind: str,
        name: str | None = None,
    ) -> tuple[ListingDocument, str]:
        self._require_manager(current_user["role"])

        if mime_type not in _ALLOWED_MIMES:
            raise bad_request(f"Unsupported mime type '{mime_type}'. Allowed: {sorted(_ALLOWED_MIMES)}")
        if kind not in _ALLOWED_KINDS:
            raise bad_request(f"Invalid kind '{kind}'. Allowed: {sorted(_ALLOWED_KINDS)}")
        if len(file_bytes) > _MAX_SIZE_BYTES:
            raise bad_request("File exceeds 5 MB size limit")

        await self._set_rls(tenant_id)
        listing = await self._get_listing(listing_id, tenant_id)

        count = await self._doc_count(listing_id)
        if count >= _MAX_PER_LISTING:
            raise bad_request(f"Listing already has {_MAX_PER_LISTING} documents (maximum reached)")

        storage = get_public_storage()
        file_id = uuid_mod.uuid4()
        safe_name = (name or filename).replace("/", "_").replace("..", "_")
        key = f"public/listings/{tenant_id}/{listing_id}/docs/{file_id}-{safe_name}"

        await storage.put_object(key, file_bytes, mime_type)

        doc = ListingDocument(
            tenant_id=tenant_id,
            listing_id=listing.id,
            storage_key=key,
            file_name=name or filename,
            mime_type=mime_type,
            size_bytes=len(file_bytes),
            kind=kind,
            uploaded_by_user_id=UUID(current_user["id"]),
        )
        self.session.add(doc)
        await self.session.flush()

        await self._audit.record(
            AuditAction.LISTING_DOCUMENT_UPLOADED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="listing_document",
            entity_id=doc.id,
            after={"listing_id": str(listing_id), "kind": kind, "file_name": doc.file_name},
        )

        await self.session.refresh(doc)
        return doc, self._doc_url(key)

    # ------------------------------------------------------------------
    # List
    # ------------------------------------------------------------------

    async def list_documents(
        self, listing_id: UUID, tenant_id: UUID
    ) -> tuple[list[tuple[ListingDocument, str]], int]:
        await self._set_rls(tenant_id)
        await self._get_listing(listing_id, tenant_id)
        stmt = (
            select(ListingDocument)
            .where(
                ListingDocument.listing_id == listing_id,
                ListingDocument.tenant_id == tenant_id,
            )
            .order_by(ListingDocument.created_at.asc())
        )
        docs = list((await self.session.execute(stmt)).scalars().all())
        return [(d, self._doc_url(d.storage_key)) for d in docs], len(docs)

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    async def delete_document(
        self,
        listing_id: UUID,
        doc_id: UUID,
        tenant_id: UUID,
        current_user: dict,
    ) -> None:
        self._require_manager(current_user["role"])
        await self._set_rls(tenant_id)
        await self._get_listing(listing_id, tenant_id)

        doc = await self.session.get(ListingDocument, doc_id)
        if not doc or doc.listing_id != listing_id or doc.tenant_id != tenant_id:
            raise not_found("ListingDocument")

        storage = get_public_storage()
        await storage.delete_object(doc.storage_key)

        await self._audit.record(
            AuditAction.LISTING_DOCUMENT_DELETED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="listing_document",
            entity_id=doc.id,
            before={"listing_id": str(listing_id), "kind": doc.kind, "file_name": doc.file_name},
        )

        await self.session.delete(doc)
        await self.session.flush()
