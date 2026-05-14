"""Leaderboard router."""

from datetime import datetime

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import CurrentUser, DbSession, TenantContext
from apps.api.schemas.leaderboard import AgentLeaderboardRow
from apps.api.services.leaderboard_service import LeaderboardService

router = APIRouter()


def _svc(db: DbSession) -> LeaderboardService:
    return LeaderboardService(db)


@router.get("/agents", response_model=list[AgentLeaderboardRow])
async def agent_leaderboard(
    tenant_id: TenantContext,
    current_user: CurrentUser,
    period: str = Query(default="this_month", pattern="^(this_month|this_quarter|this_year|custom)$"),
    from_dt: datetime | None = Query(default=None, alias="from"),
    to_dt: datetime | None = Query(default=None, alias="to"),
    svc: LeaderboardService = Depends(_svc),
) -> list[AgentLeaderboardRow]:
    rows = await svc.agent_leaderboard(tenant_id, period=period, from_dt=from_dt, to_dt=to_dt)
    return [AgentLeaderboardRow(**r) for r in rows]
