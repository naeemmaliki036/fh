"""Consumer listing leads router — public buyer inquiry endpoint.

Prefix: /public  (mounted in main.py)
Route:  POST /public/listings/{listing_id}/consumer-inquiry

No auth required — the buyer is an anonymous visitor.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Request

from apps.api.dependencies import DbSession
from apps.api.schemas.consumer_listing_lead import (
    ConsumerListingLeadRequest,
    ConsumerListingLeadResponse,
    SellerContact,
)
from apps.api.services.consumer_listing_lead_service import ConsumerListingLeadService

router = APIRouter()


def _svc(db: DbSession) -> ConsumerListingLeadService:
    return ConsumerListingLeadService(db)


@router.post(
    "/listings/{listing_id}/consumer-inquiry",
    response_model=ConsumerListingLeadResponse,
)
async def submit_inquiry(
    listing_id: UUID,
    body: ConsumerListingLeadRequest,
    request: Request,
    svc: ConsumerListingLeadService = Depends(_svc),
) -> ConsumerListingLeadResponse:
    """Submit a buyer inquiry on a consumer-posted listing.

    Notifies the seller via email and reveals their contact details
    in the response (hybrid contact-reveal pattern).
    """
    ip = request.client.host if request.client else None
    result = await svc.submit(
        listing_id=listing_id,
        buyer_data=body.model_dump(),
        ip=ip,
    )
    return ConsumerListingLeadResponse(
        lead_id=result["lead_id"],
        seller_contact=SellerContact(**result["seller_contact"]),
    )
