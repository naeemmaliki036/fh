"""Leaderboard response schemas."""

import uuid
from decimal import Decimal

from pydantic import BaseModel


class AgentLeaderboardRow(BaseModel):
    agent_id: uuid.UUID
    agent_name: str
    deals_won_count: int
    sold_count: int
    rented_count: int
    total_transaction_value: Decimal
    total_commission_value: Decimal
    paid_commission: Decimal
    pending_commission: Decimal
