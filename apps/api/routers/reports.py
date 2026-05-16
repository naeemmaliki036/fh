"""Reports router — analytics endpoints for tenant admins and finance users."""

import csv
import io
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from apps.api.dependencies import CurrentUser, DbSession, TenantContext
from apps.api.models.enums import DealType
from apps.api.schemas.reports import ClosedDealRow, ClosedDealsResponse
from apps.api.services.reports_service import ReportsService

router = APIRouter()


def _svc(db: DbSession) -> ReportsService:
    return ReportsService(db)


@router.get("/closed-deals", response_model=None)
async def closed_deals_report(
    tenant_id: TenantContext,
    current_user: CurrentUser,
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    agent_id: UUID | None = Query(None),
    deal_type: DealType | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    format: str = Query("json", pattern="^(json|csv)$"),
    svc: ReportsService = Depends(_svc),
) -> ClosedDealsResponse | StreamingResponse:
    items, total = await svc.closed_deals(
        tenant_id,
        current_user,
        from_date=from_date,
        to_date=to_date,
        agent_id=agent_id,
        deal_type=deal_type,
        page=page,
        page_size=page_size,
    )

    if format == "csv":
        return _to_csv_response(items)

    rows = [ClosedDealRow.model_validate(row) for row in items]
    return ClosedDealsResponse(items=rows, total=total, page=page, page_size=page_size)


_CSV_HEADERS = [
    "deal_id", "closed_at", "deal_type", "transaction_value", "transaction_currency",
    "property_id", "property_title", "customer_id", "customer_display_name",
    "primary_agent_id", "primary_agent_name", "secondary_agent_id", "secondary_agent_name",
    "commission_type", "commission_value", "commission_paid_amount",
]


def _to_csv_response(items: list[dict]) -> StreamingResponse:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=_CSV_HEADERS, extrasaction="ignore")
    writer.writeheader()
    for row in items:
        writer.writerow({k: str(v) if v is not None else "" for k, v in row.items()})
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=closed_deals.csv"},
    )
