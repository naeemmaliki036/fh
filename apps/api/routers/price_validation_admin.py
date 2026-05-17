"""Platform-admin CRUD for price_validation_rules.

Mounted at /admin/price-validation-rules.
All routes require OPS_AND_ABOVE (super_admin | operations_admin).
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import DbSession
from apps.api.schemas.price_validation_rule import (
    PriceValidationPreviewResponse,
    PriceValidationRuleCreateRequest,
    PriceValidationRuleListResponse,
    PriceValidationRuleReorderRequest,
    PriceValidationRuleResponse,
    PriceValidationRuleSourceItem,
    PriceValidationRuleUpdateRequest,
)
from apps.api.security.platform_roles import OPS_AND_ABOVE, require_platform_role
from apps.api.services.price_validation_admin_service import PriceValidationAdminService
from apps.api.services.price_validation_service import PriceValidationService

router = APIRouter()

_OpsAndAbove = Annotated[dict, Depends(require_platform_role(*OPS_AND_ABOVE))]


def _admin_svc(db: DbSession) -> PriceValidationAdminService:
    return PriceValidationAdminService(db)


def _val_svc(db: DbSession) -> PriceValidationService:
    return PriceValidationService(db)


# ---------------------------------------------------------------------------
# GET /admin/price-validation-rules
# ---------------------------------------------------------------------------


@router.get("", response_model=PriceValidationRuleListResponse)
async def list_price_validation_rules(
    actor: _OpsAndAbove,
    db: DbSession,
) -> PriceValidationRuleListResponse:
    """List all price validation rules ordered by display_order, created_at."""
    rules, total = await _admin_svc(db).list_all()
    return PriceValidationRuleListResponse(
        items=[PriceValidationRuleResponse.model_validate(r) for r in rules],
        total=total,
    )


# ---------------------------------------------------------------------------
# POST /admin/price-validation-rules
# ---------------------------------------------------------------------------


@router.post("", response_model=PriceValidationRuleResponse, status_code=201)
async def create_price_validation_rule(
    body: PriceValidationRuleCreateRequest,
    actor: _OpsAndAbove,
    db: DbSession,
) -> PriceValidationRuleResponse:
    """Create a new price validation rule."""
    rule = await _admin_svc(db).create(body.model_dump(), UUID(actor["id"]))
    return PriceValidationRuleResponse.model_validate(rule)


# ---------------------------------------------------------------------------
# POST /admin/price-validation-rules/reorder  (must precede /{rule_id})
# ---------------------------------------------------------------------------


@router.post("/reorder", status_code=204)
async def reorder_price_validation_rules(
    body: PriceValidationRuleReorderRequest,
    actor: _OpsAndAbove,
    db: DbSession,
) -> None:
    """Set display_order for each id in the ordered list. 422 if any id unknown."""
    await _admin_svc(db).reorder(body.ordered_ids, UUID(actor["id"]))


# ---------------------------------------------------------------------------
# GET /admin/price-validation-rules/preview
# (must precede /{rule_id} so 'preview' isn't parsed as a UUID)
# ---------------------------------------------------------------------------


@router.get("/preview", response_model=PriceValidationPreviewResponse)
async def preview_price_validation(
    actor: _OpsAndAbove,
    db: DbSession,
    country: str | None = Query(default=None),
    city: str | None = Query(default=None),
    purpose: str | None = Query(default=None),
    currency: str = Query(default="AED"),
) -> PriceValidationPreviewResponse:
    """Return effective min/max + contributing rules for the given scope."""
    result = await _val_svc(db).preview(
        country=country,
        city=city,
        purpose=purpose,
        currency=currency,
    )
    sources = [PriceValidationRuleSourceItem(**s) for s in result["sources"]]
    return PriceValidationPreviewResponse(
        effective_min_amount=result["effective_min_amount"],
        effective_max_amount=result["effective_max_amount"],
        currency=result["currency"],
        sources=sources,
    )


# ---------------------------------------------------------------------------
# PATCH /admin/price-validation-rules/{rule_id}
# ---------------------------------------------------------------------------


@router.patch("/{rule_id}", response_model=PriceValidationRuleResponse)
async def update_price_validation_rule(
    rule_id: UUID,
    body: PriceValidationRuleUpdateRequest,
    actor: _OpsAndAbove,
    db: DbSession,
) -> PriceValidationRuleResponse:
    """Partially update a price validation rule."""
    updates = body.model_dump(exclude_unset=True)
    rule = await _admin_svc(db).update(rule_id, updates, UUID(actor["id"]))
    return PriceValidationRuleResponse.model_validate(rule)


# ---------------------------------------------------------------------------
# DELETE /admin/price-validation-rules/{rule_id}
# ---------------------------------------------------------------------------


@router.delete("/{rule_id}", status_code=204)
async def delete_price_validation_rule(
    rule_id: UUID,
    actor: _OpsAndAbove,
    db: DbSession,
) -> None:
    """Hard-delete a price validation rule."""
    await _admin_svc(db).delete(rule_id, UUID(actor["id"]))
