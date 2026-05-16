"""Agents router — CRUD, photo, and private document endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile

from apps.api.dependencies import CurrentUser, DbSession, ReqCtx, TenantContext
from apps.api.models.enums import (
    AgentStatus,
    PrivateDocumentEntityType,
    PrivateDocumentKind,
)
from apps.api.schemas.agent import (
    AgentCreateRequest,
    AgentListResponse,
    AgentResponse,
    AgentUpdateRequest,
    PhotoUploadResponse,
)
from apps.api.schemas.status_change import AgentStatusChangeRequest
from apps.api.schemas.private_document import (
    DownloadUrlResponse,
    PrivateDocumentListResponse,
    PrivateDocumentResponse,
)
from apps.api.services.agent_service import AgentService
from apps.api.services.document_service import DocumentService

router = APIRouter()


def _agent_svc(db: DbSession) -> AgentService:
    return AgentService(db)


def _doc_svc(db: DbSession) -> DocumentService:
    return DocumentService(db)


def _to_response(agent, public_base_url: str | None = None) -> AgentResponse:
    photo_url = (
        f"{public_base_url}/{agent.photo_key}"
        if agent.photo_key and public_base_url
        else None
    )
    return AgentResponse.model_validate(agent).model_copy(update={"photo_url": photo_url})


# ------------------------------------------------------------------
# CRUD
# ------------------------------------------------------------------

@router.get("", response_model=AgentListResponse)
async def list_agents(
    tenant_id: TenantContext,
    status: AgentStatus | None = Query(None),
    q: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    svc: AgentService = Depends(_agent_svc),
) -> AgentListResponse:
    items, total = await svc.list_agents(tenant_id, status=status, q=q, skip=skip, limit=limit)
    return AgentListResponse(items=[_to_response(a) for a in items], total=total)


@router.post("", response_model=AgentResponse, status_code=201)
async def create_agent(
    body: AgentCreateRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: AgentService = Depends(_agent_svc),
) -> AgentResponse:
    agent = await svc.create_agent(
        tenant_id, current_user,
        full_name=body.full_name,
        email=str(body.email),
        phone=body.phone,
        license_id=body.license_id,
        license_expiry_at=body.license_expiry_at,
        default_commission_type=body.default_commission_type,
        default_commission_value=body.default_commission_value,
        linked_user_id=body.linked_user_id,
    )
    return _to_response(agent)


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: UUID,
    tenant_id: TenantContext,
    svc: AgentService = Depends(_agent_svc),
) -> AgentResponse:
    return _to_response(await svc.get_agent(agent_id, tenant_id))


@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: UUID,
    body: AgentUpdateRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    ctx: ReqCtx,
    svc: AgentService = Depends(_agent_svc),
) -> AgentResponse:
    updates = body.model_dump(exclude_unset=True)
    agent = await svc.update_agent(
        agent_id, tenant_id, current_user, updates,
        ip_address=ctx.ip_address, user_agent=ctx.user_agent,
    )
    return _to_response(agent)


@router.delete("/{agent_id}", status_code=204)
async def deactivate_agent(
    agent_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: AgentService = Depends(_agent_svc),
) -> None:
    await svc.deactivate_agent(agent_id, tenant_id, current_user)


@router.patch("/{agent_id}/status", response_model=AgentResponse)
async def change_agent_status(
    agent_id: UUID,
    body: AgentStatusChangeRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    ctx: ReqCtx,
    svc: AgentService = Depends(_agent_svc),
) -> AgentResponse:
    agent = await svc.change_status(
        agent_id, tenant_id, current_user,
        new_status=body.status,
        reason_code=body.reason_code,
        reason_note=body.reason_note,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return _to_response(agent)


# ------------------------------------------------------------------
# Photo
# ------------------------------------------------------------------

@router.post("/{agent_id}/photo", response_model=PhotoUploadResponse)
async def upload_photo(
    agent_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    file: UploadFile = File(...),
    svc: AgentService = Depends(_agent_svc),
) -> PhotoUploadResponse:
    data = await file.read()
    mime = file.content_type or "application/octet-stream"
    ext = (file.filename or "photo").rsplit(".", 1)[-1].lower() or "jpg"
    key, url = await svc.set_photo(agent_id, tenant_id, current_user, data, mime, ext)
    return PhotoUploadResponse(photo_key=key, url=url)


@router.delete("/{agent_id}/photo", status_code=204)
async def delete_photo(
    agent_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: AgentService = Depends(_agent_svc),
) -> None:
    await svc.delete_photo(agent_id, tenant_id, current_user)


# ------------------------------------------------------------------
# Private documents
# ------------------------------------------------------------------

@router.post("/{agent_id}/documents", response_model=PrivateDocumentResponse, status_code=201)
async def upload_document(
    agent_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    ctx: ReqCtx,
    kind: PrivateDocumentKind = Form(...),
    file: UploadFile = File(...),
    svc: DocumentService = Depends(_doc_svc),
) -> PrivateDocumentResponse:
    data = await file.read()
    doc = await svc.upload(
        tenant_id,
        PrivateDocumentEntityType.AGENT,
        agent_id,
        kind,
        data,
        file.filename or "upload",
        file.content_type or "application/octet-stream",
        actor_user_id=UUID(current_user["id"]),
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return PrivateDocumentResponse.model_validate(doc)


@router.get("/{agent_id}/documents", response_model=PrivateDocumentListResponse)
async def list_documents(
    agent_id: UUID,
    tenant_id: TenantContext,
    svc: DocumentService = Depends(_doc_svc),
) -> PrivateDocumentListResponse:
    docs = await svc.list_for_entity(tenant_id, PrivateDocumentEntityType.AGENT, agent_id)
    return PrivateDocumentListResponse(
        items=[PrivateDocumentResponse.model_validate(d) for d in docs],
        total=len(docs),
    )


@router.get("/{agent_id}/documents/{doc_id}/download", response_model=DownloadUrlResponse)
async def download_document(
    agent_id: UUID,
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


@router.delete("/{agent_id}/documents/{doc_id}", status_code=204)
async def delete_document(
    agent_id: UUID,
    doc_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: DocumentService = Depends(_doc_svc),
) -> None:
    await svc.delete(tenant_id, doc_id, current_user["role"])
