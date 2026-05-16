"""Public (unauthenticated) document request router.

No JWT, no TenantContext, no CurrentUser on anonymous endpoints.
Verified endpoints use get_verified_doc_request dependency instead.
"""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.dependencies import DbSession, get_db
from apps.api.models.document_request import DocumentRequest
from apps.api.schemas.public_document_request import (
    PublicDocumentRequestResponse,
    PublicItemResponse,
    UploadItemResponse,
    VerifyRequest,
    VerifyResponse,
)
from apps.api.services.public_doc_request_service import PublicDocRequestService

router = APIRouter()


def _svc(db: DbSession) -> PublicDocRequestService:
    return PublicDocRequestService(db)


def _check_link_usable(dr: "DocumentRequest") -> None:
    """Raise 410 if the link is used (closed_at set) or expired."""
    from apps.api.models.enums import DocumentRequestStatus

    if dr.closed_at is not None:
        raise HTTPException(
            status_code=410,
            detail="This upload link has been used. Contact your agent to reactivate it.",
        )
    now = datetime.now(UTC)
    expires = dr.expires_at if dr.expires_at.tzinfo else dr.expires_at.replace(tzinfo=UTC)
    if expires < now:
        raise HTTPException(
            status_code=410,
            detail="This upload link has expired. Contact your agent to get a new link.",
        )
    if dr.status in {DocumentRequestStatus.CANCELED, DocumentRequestStatus.EXPIRED}:
        raise HTTPException(status_code=410, detail="This document request is no longer active")


async def _get_verified_doc_request(
    token: str,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> DocumentRequest:
    """Load + validate a doc-request JWT for verified endpoints.

    Raises 401 if Authorization header is missing/invalid.
    Raises 410 if request is expired, canceled, or already used.
    """
    from fastapi import status
    from jose import JWTError

    from apps.api.auth import decode_doc_request_token
    from apps.api.services.public_doc_request_service import PublicDocRequestService

    svc = PublicDocRequestService(db)
    data = await svc.get_by_token(token)
    dr = data["request"]

    _check_link_usable(dr)

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Verification required. POST to /verify first.",
        )
    raw_token = authorization.removeprefix("Bearer ").strip()
    try:
        claims = decode_doc_request_token(raw_token)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired verification token. POST to /verify again.",
        ) from exc
    if claims.get("document_request_id") != str(dr.id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not match this document request.",
        )
    return dr


def _build_public_response(data: dict) -> PublicDocumentRequestResponse:
    dr = data["request"]
    items = data["items"]
    return PublicDocumentRequestResponse(
        title=dr.title,
        instructions=dr.instructions,
        tenant_name=data["tenant_name"],
        status=dr.status,
        expires_at=dr.expires_at,
        verified=data["verified"],
        items=[
            PublicItemResponse(
                id=it.id,
                kind=it.kind,
                label=it.label,
                is_required=it.is_required,
                uploaded=it.uploaded_document_id is not None,
                uploaded_at=it.uploaded_at,
            )
            for it in items
        ],
        customer_name=data.get("customer_name"),
        agent_name=data.get("agent_name"),
        agent_phone=data.get("agent_phone"),
    )


@router.get("/{token}", response_model=PublicDocumentRequestResponse)
async def get_public_request(
    token: str,
    authorization: str | None = Header(default=None),
    svc: PublicDocRequestService = Depends(_svc),
) -> PublicDocumentRequestResponse:
    """Anonymous or verified GET — returns verified=true if JWT is valid.

    Returns 410 if link is already used (closed_at set) or expired.
    """
    from jose import JWTError

    from apps.api.auth import decode_doc_request_token

    verified = False
    data = await svc.get_by_token(token, verified=False)
    dr = data["request"]

    # Enforce single-use and expiry at the GET level so the frontend can
    # render the correct 410 screen immediately on load.
    _check_link_usable(dr)

    if authorization and authorization.startswith("Bearer "):
        try:
            claims = decode_doc_request_token(authorization.removeprefix("Bearer ").strip())
            if claims.get("document_request_id") == str(dr.id):
                verified = True
        except JWTError:
            pass
    data["verified"] = verified
    return _build_public_response(data)


@router.post("/{token}/verify", response_model=VerifyResponse)
async def verify_code(
    token: str,
    body: VerifyRequest,
    svc: PublicDocRequestService = Depends(_svc),
) -> VerifyResponse:
    """Exchange a 6-digit code for a short-lived doc-request JWT."""
    result = await svc.verify_code(token, body.code)
    return VerifyResponse(**result)


@router.post("/{token}/items/{item_id}/upload", response_model=UploadItemResponse, status_code=201)
async def upload_item(
    token: str,
    item_id: UUID,
    dr: DocumentRequest = Depends(_get_verified_doc_request),
    file: UploadFile = File(...),
    svc: PublicDocRequestService = Depends(_svc),
) -> UploadItemResponse:
    """Upload a file for one item. Requires verified JWT."""
    data = await file.read()
    result = await svc.upload_item(
        dr, item_id, data,
        file.filename or "upload",
        file.content_type or "application/octet-stream",
    )
    item = result["item"]
    return UploadItemResponse(
        item_id=item.id,
        uploaded=True,
        uploaded_at=item.uploaded_at,
        request_status=result["request_status"],
    )
