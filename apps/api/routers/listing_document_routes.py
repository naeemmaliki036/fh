"""Listing document upload / list / delete endpoints.

Mounted with prefix="" so paths match /listings/{id}/documents.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile

from apps.api.dependencies import CurrentUser, DbSession, TenantContext
from apps.api.schemas.listing import ListingDocumentListResponse, ListingDocumentResponse
from apps.api.services.listing_document_service import ListingDocumentService

router = APIRouter()


def _svc(db: DbSession) -> ListingDocumentService:
    return ListingDocumentService(db)


def _to_resp(doc, url: str) -> ListingDocumentResponse:
    return ListingDocumentResponse.model_validate(doc).model_copy(update={"url": url})


@router.post(
    "/listings/{listing_id}/documents",
    response_model=ListingDocumentResponse,
    status_code=201,
)
async def upload_listing_document(
    listing_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    file: UploadFile = File(...),
    kind: str = Form("other"),
    name: str | None = Form(None),
    svc: ListingDocumentService = Depends(_svc),
) -> ListingDocumentResponse:
    """Upload a document to a listing (max 10, 5 MB each).

    kind: brochure | floor_plan | payment_plan | other
    MIME: application/pdf | image/png | image/jpeg | image/webp
    """
    data = await file.read()
    doc, url = await svc.upload(
        listing_id=listing_id,
        tenant_id=tenant_id,
        current_user=current_user,
        file_bytes=data,
        filename=file.filename or "upload",
        mime_type=file.content_type or "application/octet-stream",
        kind=kind,
        name=name,
    )
    return _to_resp(doc, url)


@router.get(
    "/listings/{listing_id}/documents",
    response_model=ListingDocumentListResponse,
)
async def list_listing_documents(
    listing_id: UUID,
    tenant_id: TenantContext,
    svc: ListingDocumentService = Depends(_svc),
) -> ListingDocumentListResponse:
    """List all documents attached to a listing, ordered by upload time."""
    pairs, total = await svc.list_documents(listing_id, tenant_id)
    return ListingDocumentListResponse(
        items=[_to_resp(doc, url) for doc, url in pairs],
        total=total,
    )


@router.delete(
    "/listings/{listing_id}/documents/{doc_id}",
    status_code=204,
)
async def delete_listing_document(
    listing_id: UUID,
    doc_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: ListingDocumentService = Depends(_svc),
) -> None:
    """Hard-delete a listing document from storage and DB. Writes AuditLog."""
    await svc.delete_document(listing_id, doc_id, tenant_id, current_user)
