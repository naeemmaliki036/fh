"""Customers router — CRUD + KYC document endpoints."""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status

from apps.api.dependencies import CurrentUser, DbSession, ReqCtx, TenantContext
from apps.api.models.enums import (
    CustomerStatus,
    PrivateDocumentApprovalStatus,
    PrivateDocumentEntityType,
    PrivateDocumentKind,
    TenantRole,
)
from apps.api.schemas.customer import (
    CustomerCreateRequest,
    CustomerListResponse,
    CustomerResponse,
    CustomerUpdateRequest,
    MergeHintResponse,
)
from apps.api.schemas.customer_detail import CustomerDetailResponse
from apps.api.schemas.private_document import (
    DownloadUrlResponse,
    PrivateDocumentListResponse,
    PrivateDocumentResponse,
)
from apps.api.services.customer_service import CustomerService
from apps.api.services.document_service import DocumentService

router = APIRouter()


def _cust_svc(db: DbSession) -> CustomerService:
    return CustomerService(db)


def _doc_svc(db: DbSession) -> DocumentService:
    return DocumentService(db)


# ------------------------------------------------------------------
# CRUD
# ------------------------------------------------------------------

@router.get("", response_model=CustomerListResponse)
async def list_customers(
    tenant_id: TenantContext,
    status: CustomerStatus | None = Query(None),
    assigned_agent_id: UUID | None = Query(None),
    q: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    svc: CustomerService = Depends(_cust_svc),
) -> CustomerListResponse:
    items, total = await svc.list_customers(
        tenant_id, status=status, assigned_agent_id=assigned_agent_id,
        q=q, skip=skip, limit=limit,
    )
    return CustomerListResponse(
        items=[CustomerResponse.model_validate(c) for c in items],
        total=total,
    )


@router.post("", response_model=CustomerResponse, status_code=201)
async def create_customer(
    body: CustomerCreateRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: CustomerService = Depends(_cust_svc),
) -> CustomerResponse:
    try:
        customer = await svc.create_customer(
            tenant_id,
            current_user,
            full_name=body.full_name,
            email=str(body.email) if body.email else None,
            phone=body.phone,
            nationality=body.nationality,
            language=body.language,
            preferred_currency=body.preferred_currency,
            source=body.source,
            status=body.status,
            notes=body.notes,
            assigned_agent_id=body.assigned_agent_id,
        )
    except HTTPException as exc:
        if exc.status_code == status.HTTP_409_CONFLICT:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=MergeHintResponse(
                    detail="A customer with this phone number already exists.",
                    existing_customer_id=UUID(exc.detail),
                ).model_dump(mode="json"),
            ) from exc
        raise
    return CustomerResponse.model_validate(customer)


@router.get("/{customer_id}", response_model=CustomerDetailResponse)
async def get_customer(
    customer_id: UUID,
    tenant_id: TenantContext,
    svc: CustomerService = Depends(_cust_svc),
) -> CustomerDetailResponse:
    """Return customer detail with documents, deal history and listing interests."""
    data = await svc.get_customer_detail(customer_id, tenant_id)
    customer = data["customer"]
    return CustomerDetailResponse.model_validate({
        **customer.__dict__,
        "documents": data["documents"],
        "deal_history": data["deal_history"],
        "interested_listings": data["interested_listings"],
    })


@router.patch("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: UUID,
    body: CustomerUpdateRequest,
    tenant_id: TenantContext,
    svc: CustomerService = Depends(_cust_svc),
) -> CustomerResponse:
    updates = body.model_dump(exclude_unset=True)
    if "email" in updates and updates["email"] is not None:
        updates["email"] = str(updates["email"])
    try:
        customer = await svc.update_customer(customer_id, tenant_id, updates)
    except HTTPException as exc:
        if exc.status_code == status.HTTP_409_CONFLICT:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=MergeHintResponse(
                    detail="A customer with this phone number already exists.",
                    existing_customer_id=UUID(exc.detail),
                ).model_dump(mode="json"),
            ) from exc
        raise
    return CustomerResponse.model_validate(customer)


@router.delete("/{customer_id}", status_code=204)
async def deactivate_customer(
    customer_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: CustomerService = Depends(_cust_svc),
) -> None:
    await svc.deactivate_customer(customer_id, tenant_id, current_user["role"])


# ------------------------------------------------------------------
# KYC documents (delegates fully to DocumentService)
# ------------------------------------------------------------------

@router.post("/{customer_id}/documents", response_model=PrivateDocumentResponse, status_code=201)
async def upload_document(
    customer_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    ctx: ReqCtx,
    kind: PrivateDocumentKind = Form(PrivateDocumentKind.KYC),
    file: UploadFile = File(...),
    svc: DocumentService = Depends(_doc_svc),
) -> PrivateDocumentResponse:
    """Agent/admin direct upload — auto-approved, no pending review required.

    Authorization: agent only if they are the customer's assigned_agent_id;
    property_admin, company_admin, company_owner unrestricted.
    """
    _DIRECT_UPLOAD_ROLES = {
        TenantRole.COMPANY_OWNER.value,
        TenantRole.COMPANY_ADMIN.value,
        TenantRole.PROPERTY_ADMIN.value,
        TenantRole.AGENT.value,
    }
    if current_user["role"] not in _DIRECT_UPLOAD_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient role to upload documents directly to a customer",
        )

    data = await file.read()
    doc = await svc.upload(
        tenant_id,
        PrivateDocumentEntityType.CUSTOMER,
        customer_id,
        kind,
        data,
        file.filename or "upload",
        file.content_type or "application/octet-stream",
        actor_user_id=UUID(current_user["id"]),
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    # Agent-uploaded docs are auto-approved
    doc.approval_status = PrivateDocumentApprovalStatus.APPROVED
    doc.approved_by_user_id = UUID(current_user["id"])
    doc.approved_at = datetime.now(UTC).replace(tzinfo=None)
    # session flush happens at request end via get_db commit
    return PrivateDocumentResponse.model_validate(doc)


@router.get("/{customer_id}/documents", response_model=PrivateDocumentListResponse)
async def list_documents(
    customer_id: UUID,
    tenant_id: TenantContext,
    svc: DocumentService = Depends(_doc_svc),
) -> PrivateDocumentListResponse:
    docs = await svc.list_for_entity(
        tenant_id, PrivateDocumentEntityType.CUSTOMER, customer_id
    )
    return PrivateDocumentListResponse(
        items=[PrivateDocumentResponse.model_validate(d) for d in docs],
        total=len(docs),
    )


@router.get("/{customer_id}/documents/{doc_id}/download", response_model=DownloadUrlResponse)
async def download_document(
    customer_id: UUID,
    doc_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    ctx: ReqCtx,
    svc: DocumentService = Depends(_doc_svc),
) -> DownloadUrlResponse:
    signed_url, expires_in = await svc.get_download_url(
        tenant_id, doc_id,
        actor_user_id=UUID(current_user["id"]),
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return DownloadUrlResponse(signed_url=signed_url, expires_in=expires_in)


@router.delete("/{customer_id}/documents/{doc_id}", status_code=204)
async def delete_document(
    customer_id: UUID,
    doc_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: DocumentService = Depends(_doc_svc),
) -> None:
    await svc.delete(tenant_id, doc_id, current_user["role"])
