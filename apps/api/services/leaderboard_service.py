"""Leaderboard service — agent performance aggregates."""

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import case, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.agent import Agent
from apps.api.models.deal import Deal
from apps.api.models.enums import CommissionPayoutStatus, DealStage, DealType
from apps.api.services.base import BaseService
from apps.api.utils.commission import compute_commission_amount
from decimal import Decimal


def _period_bounds(period: str, from_dt: datetime | None, to_dt: datetime | None) -> tuple[datetime, datetime]:
    now = datetime.now(UTC).replace(tzinfo=None)
    if period == "custom":
        if not from_dt or not to_dt:
            raise ValueError("from and to required for custom period")
        return from_dt.replace(tzinfo=None) if from_dt.tzinfo else from_dt, \
               to_dt.replace(tzinfo=None) if to_dt.tzinfo else to_dt
    if period == "this_month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "this_quarter":
        quarter_start_month = ((now.month - 1) // 3) * 3 + 1
        start = now.replace(month=quarter_start_month, day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "this_year":
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        raise ValueError(f"Unknown period: {period}")
    return start, now


class LeaderboardService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    async def agent_leaderboard(
        self,
        tenant_id: UUID,
        period: str = "this_month",
        from_dt: datetime | None = None,
        to_dt: datetime | None = None,
    ) -> list[dict]:
        await self._set_rls(tenant_id)
        start, end = _period_bounds(period, from_dt, to_dt)

        # Base deals CTE: closed_won deals in period for this tenant
        stmt = (
            select(
                Deal.primary_agent_id.label("agent_id"),
                func.count().label("deals_won_count"),
                func.sum(
                    case(
                        (Deal.deal_type == DealType.SALE, 1),
                        else_=0,
                    )
                ).label("sold_count"),
                func.sum(
                    case(
                        (Deal.deal_type.in_([DealType.RENT_SHORT, DealType.RENT_LONG]), 1),
                        else_=0,
                    )
                ).label("rented_count"),
                func.sum(Deal.transaction_value).label("total_transaction_value"),
                func.sum(Deal.commission_paid_amount).label("paid_commission"),
            )
            .where(
                Deal.tenant_id == tenant_id,
                Deal.stage == DealStage.CLOSED_WON,
                Deal.closed_at >= start,
                Deal.closed_at <= end,
            )
            .group_by(Deal.primary_agent_id)
        )
        rows = list((await self.session.execute(stmt)).mappings().all())

        # Enrich with agent name and compute total_commission_value
        result = []
        for row in rows:
            agent = await self.session.get(Agent, row["agent_id"])
            agent_name = agent.full_name if agent else "Unknown"
            # total_commission_value requires per-deal calculation; approximate with DB data
            # Get all deals for this agent in period
            deals_stmt = select(Deal).where(
                Deal.tenant_id == tenant_id,
                Deal.primary_agent_id == row["agent_id"],
                Deal.stage == DealStage.CLOSED_WON,
                Deal.closed_at >= start,
                Deal.closed_at <= end,
            )
            deals = list((await self.session.execute(deals_stmt)).scalars().all())
            total_commission = sum(
                compute_commission_amount(
                    d.commission_type,
                    Decimal(str(d.commission_value)),
                    Decimal(str(d.transaction_value)),
                )
                for d in deals
            )
            paid = Decimal(str(row["paid_commission"] or 0))
            result.append({
                "agent_id": row["agent_id"],
                "agent_name": agent_name,
                "deals_won_count": row["deals_won_count"],
                "sold_count": row["sold_count"],
                "rented_count": row["rented_count"],
                "total_transaction_value": Decimal(str(row["total_transaction_value"] or 0)),
                "total_commission_value": total_commission,
                "paid_commission": paid,
                "pending_commission": max(Decimal("0"), total_commission - paid),
            })

        result.sort(key=lambda x: x["total_commission_value"], reverse=True)
        return result
