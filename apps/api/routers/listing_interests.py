"""Listing interested-customers router.

Endpoints:
  POST   /listings/{listing_id}/interested-customers
  DELETE /listings/{listing_id}/interested-customers/{customer_id}
  GET    /listings/{listing_id}/interested-customers
"""

from uuid import UUID

from fastapi import APIRouter, Depends, status

from apps.api.dependencies import CurrentUser, DbSession, TenantContext
from apps.api.schemas.customer_listing_interest import (
    CustomerListingInterestResponse,
    InterestedCustomerItem,
    InterestedCustomerListResponse,
    LinkCustomerRequest,
)
from apps.api.services.customer_listing_interest_service import (
    CustomerListingInterestService,
)

router = APIRouter()


def _svc(db: DbSession) -> CustomerListingInterestService:
    return CustomerListingInterestService(db)


@router.post(
    "/listings/{listing_id}/interested-customers",
    response_model=CustomerListingInterestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def link_customer_to_listing(
    listing_id: UUID,
    body: LinkCustomerRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: CustomerListingInterestService = Depends(_svc),
) -> CustomerListingInterestResponse:
    """Link a customer to a listing as interested.

    - Listing must be 'active' or 'draft'.
    - Max 10 interested customers per listing (app-level cap).
    - Customer must belong to the same tenant.
    """
    row = await svc.link(
        tenant_id,
        listing_id,
        body.customer_id,
        current_user,
        body.notes,
    )
    return CustomerListingInterestResponse.model_validate(row)


@router.delete(
    "/listings/{listing_id}/interested-customers/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def unlink_customer_from_listing(
    listing_id: UUID,
    customer_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: CustomerListingInterestService = Depends(_svc),
) -> None:
    """Remove an interested-customer link.

    Only rows with status='interested' can be removed.
    Won/lost rows are frozen (deal already settled).
    """
    await svc.unlink(tenant_id, listing_id, customer_id, current_user)


@router.get(
    "/listings/{listing_id}/interested-customers",
    response_model=InterestedCustomerListResponse,
)
async def list_interested_customers(
    listing_id: UUID,
    tenant_id: TenantContext,
    svc: CustomerListingInterestService = Depends(_svc),
) -> InterestedCustomerListResponse:
    """List all interested customers for a listing (max 10)."""
    rows = await svc.list_for_listing(tenant_id, listing_id)
    return InterestedCustomerListResponse(
        items=[
            InterestedCustomerItem(
                customer_id=r["customer_id"],
                customer_name=r["customer_name"],
                customer_phone=r["customer_phone"],
                customer_email=r["customer_email"],
                status=r["status"],
                notes=r["notes"],
                linked_at=r["linked_at"],
            )
            for r in rows
        ]
    )
