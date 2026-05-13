"""EmailTemplate router — admin CRUD for transactional email templates.

Mounted at /admin/email-templates in main.py.

RBAC:
  Platform users (any role) may manage all templates.
  Tenant company_owner / company_admin may manage only their own-tenant templates.
"""

import uuid

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import AnyAuthUser, DbSession
from apps.api.models.enums import TenantRole
from apps.api.schemas.email_template import (
    EmailTemplateCreateRequest,
    EmailTemplateListResponse,
    EmailTemplateResponse,
    EmailTemplateUpdateRequest,
    TestSendRequest,
    TestSendResponse,
)
from apps.api.services.email_template_service import EmailTemplateService, TENANT_TEMPLATE_KEYS
from packages.common.utils.error_handlers import bad_request, forbidden

router = APIRouter()

_TENANT_WRITE_ROLES = {TenantRole.COMPANY_OWNER, TenantRole.COMPANY_ADMIN}


def _svc(db: DbSession) -> EmailTemplateService:
    return EmailTemplateService(db)


def _caller_tenant_id(current_user: dict) -> uuid.UUID | None:
    tid = current_user.get("tenant_id")
    return uuid.UUID(tid) if tid else None


def _assert_tenant_write(current_user: dict) -> None:
    role = current_user.get("role")
    if role not in {r.value for r in _TENANT_WRITE_ROLES}:
        raise forbidden("company_owner or company_admin role required")


# ------------------------------------------------------------------
# List
# ------------------------------------------------------------------


@router.get("", response_model=EmailTemplateListResponse)
async def list_templates(
    current_user: AnyAuthUser,
    scope: str | None = Query(None, pattern="^(platform|tenant)$"),
    tenant_id: uuid.UUID | None = Query(None),
    svc: EmailTemplateService = Depends(_svc),
) -> EmailTemplateListResponse:
    """List templates.

    Platform users may filter by scope and optional tenant_id.
    Tenant users see only platform + their own templates (scope param ignored).
    """
    caller_tid = _caller_tenant_id(current_user)
    items, total = await svc.list_templates(
        scope=scope,
        tenant_id=tenant_id,
        caller_tenant_id=caller_tid,
    )
    return EmailTemplateListResponse(
        items=[EmailTemplateResponse.model_validate(r) for r in items],
        total=total,
    )


# ------------------------------------------------------------------
# Get single
# ------------------------------------------------------------------


@router.get("/{template_id}", response_model=EmailTemplateResponse)
async def get_template(
    template_id: uuid.UUID,
    current_user: AnyAuthUser,
    svc: EmailTemplateService = Depends(_svc),
) -> EmailTemplateResponse:
    caller_tid = _caller_tenant_id(current_user)
    row = await svc.get_template(template_id, caller_tenant_id=caller_tid)
    return EmailTemplateResponse.model_validate(row)


# ------------------------------------------------------------------
# Create — platform users only; tenants cannot create new templates
# ------------------------------------------------------------------

_LOCKED_TENANT_FIELDS = frozenset({"key", "name", "variables", "tenant_id"})


@router.post("", response_model=EmailTemplateResponse, status_code=201)
async def create_template(
    body: EmailTemplateCreateRequest,
    current_user: AnyAuthUser,
    svc: EmailTemplateService = Depends(_svc),
) -> EmailTemplateResponse:
    caller_tid = _caller_tenant_id(current_user)
    if caller_tid is not None:
        # Tenants cannot create new templates — templates are pre-seeded on approval.
        raise forbidden("Tenant templates are pre-seeded; use edit instead.")
    row = await svc.create_template(body.model_dump())
    return EmailTemplateResponse.model_validate(row)


# ------------------------------------------------------------------
# Update (partial) — tenant users may only touch content fields
# ------------------------------------------------------------------


@router.patch("/{template_id}", response_model=EmailTemplateResponse)
async def update_template(
    template_id: uuid.UUID,
    body: EmailTemplateUpdateRequest,
    current_user: AnyAuthUser,
    svc: EmailTemplateService = Depends(_svc),
) -> EmailTemplateResponse:
    caller_tid = _caller_tenant_id(current_user)
    if caller_tid is not None:
        _assert_tenant_write(current_user)

    updates = body.model_dump(exclude_unset=True)

    if caller_tid is not None:
        # Strip any locked fields a tenant may have sent
        locked_sent = _LOCKED_TENANT_FIELDS & updates.keys()
        if locked_sent:
            raise bad_request(
                f"Tenant users cannot change: {', '.join(sorted(locked_sent))}. "
                "Only subject, body_html, body_text, and active are editable."
            )

    row = await svc.update_template(template_id, updates, caller_tenant_id=caller_tid)
    return EmailTemplateResponse.model_validate(row)


# ------------------------------------------------------------------
# Delete — platform users only
# ------------------------------------------------------------------


@router.delete("/{template_id}", status_code=204)
async def delete_template(
    template_id: uuid.UUID,
    current_user: AnyAuthUser,
    svc: EmailTemplateService = Depends(_svc),
) -> None:
    caller_tid = _caller_tenant_id(current_user)
    if caller_tid is not None:
        raise forbidden("Tenants cannot delete seeded templates.")
    await svc.delete_template(template_id, caller_tenant_id=None)


# ------------------------------------------------------------------
# Test send
# ------------------------------------------------------------------


@router.post("/{template_id}/test-send", response_model=TestSendResponse)
async def test_send(
    template_id: uuid.UUID,
    body: TestSendRequest,
    current_user: AnyAuthUser,
    svc: EmailTemplateService = Depends(_svc),
) -> TestSendResponse:
    """Render a template with given variables and send immediately (bypass outbox)."""
    caller_tid = _caller_tenant_id(current_user)
    result = await svc.test_send(
        template_id,
        body.to_email,
        body.variables,
        caller_tenant_id=caller_tid,
    )
    return TestSendResponse(**result)
