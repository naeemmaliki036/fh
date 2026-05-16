"""Admin document requests router."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.config import settings
from apps.api.dependencies import CurrentUser, DbSession, TenantContext
from apps.api.models.enums import DocumentRequestStatus
from apps.api.schemas.document_request import (
    DocumentRequestCreate,
    DocumentRequestCreateResponse,
    DocumentRequestListResponse,
    DocumentRequestResponse,
    ReactivateDocumentRequest,
    ReactivateDocumentResponse,
    RegenerateCodeResponse,
)
from apps.api.services.document_request_service import DocumentRequestService

router = APIRouter()


def _svc(db: DbSession) -> DocumentRequestService:
    return DocumentRequestService(db)


def _to_resp(data: dict) -> DocumentRequestResponse:
    dr = data["request"]
    items = data["items"]
    return DocumentRequestResponse.model_validate({
        **dr.__dict__,
        "items": items,
        "items_count": len(items),
        "uploaded_count": data["uploaded_count"],
    })


@router.post("", response_model=DocumentRequestCreateResponse, status_code=201)
async def create_document_request(
    body: DocumentRequestCreate,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: DocumentRequestService = Depends(_svc),
) -> DocumentRequestCreateResponse:
    dr, items, code = await svc.create(
        tenant_id, current_user,
        customer_id=body.customer_id,
        lead_id=body.lead_id,
        deal_id=body.deal_id,
        property_id=body.property_id,
        title=body.title,
        instructions=body.instructions,
        agent_note=body.agent_note,
        items_data=[it.model_dump() for it in body.items],
        expires_in_days=body.expires_in_days,
    )
    return DocumentRequestCreateResponse.model_validate({
        **dr.__dict__,
        "items": items,
        "items_count": len(items),
        "uploaded_count": 0,
        "verification_code": code,
        "public_url": f"{settings.frontend_base_url}/d/{dr.token}",
    })


@router.get("", response_model=DocumentRequestListResponse)
async def list_document_requests(
    tenant_id: TenantContext,
    status: DocumentRequestStatus | None = Query(None),
    customer_id: UUID | None = Query(None),
    lead_id: UUID | None = Query(None),
    deal_id: UUID | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    svc: DocumentRequestService = Depends(_svc),
) -> DocumentRequestListResponse:
    rows, total = await svc.list_requests(
        tenant_id, status, customer_id, skip, limit,
        lead_id=lead_id, deal_id=deal_id,
    )
    return DocumentRequestListResponse(items=[_to_resp(r) for r in rows], total=total)


@router.get("/{request_id}", response_model=DocumentRequestResponse)
async def get_document_request(
    request_id: UUID,
    tenant_id: TenantContext,
    svc: DocumentRequestService = Depends(_svc),
) -> DocumentRequestResponse:
    return _to_resp(await svc.get_request(request_id, tenant_id))


@router.post("/{request_id}/cancel", response_model=DocumentRequestResponse)
async def cancel_document_request(
    request_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: DocumentRequestService = Depends(_svc),
) -> DocumentRequestResponse:
    dr = await svc.cancel(request_id, tenant_id, current_user)
    return _to_resp(await svc.get_request(dr.id, tenant_id))


@router.post("/{request_id}/regenerate-code", response_model=RegenerateCodeResponse)
async def regenerate_code(
    request_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: DocumentRequestService = Depends(_svc),
) -> RegenerateCodeResponse:
    _, code = await svc.regenerate_code(request_id, tenant_id, current_user)
    return RegenerateCodeResponse(verification_code=code)


@router.post("/{request_id}/reactivate", response_model=ReactivateDocumentResponse)
async def reactivate_document_request(
    request_id: UUID,
    body: ReactivateDocumentRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: DocumentRequestService = Depends(_svc),
) -> ReactivateDocumentResponse:
    """Re-open a completed/closed document request link.

    Clears closed_at, resets status to 'pending', increments reactivated_count.
    Returns a new plaintext verification code — share it with the customer.
    """
    dr, code = await svc.reactivate(
        request_id, tenant_id, current_user,
        expires_in_days=body.expires_in_days,
    )
    return ReactivateDocumentResponse(
        id=dr.id,
        status=dr.status,
        reactivated_count=dr.reactivated_count,
        expires_at=dr.expires_at,
        verification_code=code,
    )
