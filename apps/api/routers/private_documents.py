"""Private document approval/rejection router.

Endpoints:
  PATCH /private-documents/{document_id}/approve
  PATCH /private-documents/{document_id}/reject
  GET   /private-documents/pending
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import CurrentUser, DbSession, TenantContext
from apps.api.models.enums import PrivateDocumentEntityType
from apps.api.schemas.private_document import (
    PendingDocumentFilter,
    PrivateDocumentListResponse,
    PrivateDocumentResponse,
    RejectDocumentRequest,
)
from apps.api.services.private_document_service import PrivateDocumentApprovalService

router = APIRouter()


def _svc(db: DbSession) -> PrivateDocumentApprovalService:
    return PrivateDocumentApprovalService(db)


# NOTE: /pending must be declared BEFORE /{document_id} routes to avoid
# the parameterised route consuming the literal "pending" segment.

@router.get("/pending", response_model=PrivateDocumentListResponse)
async def list_pending_documents(
    tenant_id: TenantContext,
    current_user: CurrentUser,
    entity_type: PrivateDocumentEntityType | None = Query(None),
    assigned_to_me: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    svc: PrivateDocumentApprovalService = Depends(_svc),
) -> PrivateDocumentListResponse:
    """List all pending documents in the tenant for the review queue."""
    docs, total = await svc.list_pending(
        tenant_id,
        current_user,
        entity_type=entity_type,
        assigned_to_me=assigned_to_me,
        skip=skip,
        limit=limit,
    )
    return PrivateDocumentListResponse(
        items=[PrivateDocumentResponse.model_validate(d) for d in docs],
        total=total,
    )


@router.patch("/{document_id}/approve", response_model=PrivateDocumentResponse)
async def approve_document(
    document_id: UUID,
    tenant_id: TenantContext,
    current_user: CurrentUser,
    svc: PrivateDocumentApprovalService = Depends(_svc),
) -> PrivateDocumentResponse:
    """Approve a pending private document.

    Allowed roles: property_admin, company_admin, company_owner, or the
    agent assigned to the owning customer.
    """
    doc = await svc.approve(document_id, tenant_id, current_user)
    return PrivateDocumentResponse.model_validate(doc)


@router.patch("/{document_id}/reject", response_model=PrivateDocumentResponse)
async def reject_document(
    document_id: UUID,
    body: RejectDocumentRequest,
    tenant_id: TenantContext,
    current_user: CurrentUser,
    svc: PrivateDocumentApprovalService = Depends(_svc),
) -> PrivateDocumentResponse:
    """Reject a pending private document. File is retained in S3.

    Body: { "reason": "<at least 5 chars>" }
    """
    doc = await svc.reject(document_id, tenant_id, current_user, body.reason)
    return PrivateDocumentResponse.model_validate(doc)
