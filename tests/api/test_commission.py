"""Tests for commission utility + service-level commission logic.

Pure-unit tests for compute_commission_amount (no DB needed).
Integration tests for override + payout via DealCommissionService
run against the real DB through the API client.
"""

from decimal import Decimal

import pytest

from apps.api.models.enums import CommissionType
from apps.api.utils.commission import compute_commission_amount

# ---------------------------------------------------------------------------
# Pure-unit: compute_commission_amount
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "commission_type, commission_value, transaction_value, expected",
    [
        # Percentage
        (CommissionType.PERCENTAGE, Decimal("2.5"), Decimal("2_500_000"), Decimal("62500.00")),
        (CommissionType.PERCENTAGE, Decimal("0"), Decimal("1_000_000"), Decimal("0.00")),
        (CommissionType.PERCENTAGE, Decimal("100"), Decimal("1_000"), Decimal("1000.00")),
        # Very large — should not overflow; Decimal handles it
        (CommissionType.PERCENTAGE, Decimal("5"), Decimal("999_999_999"), Decimal("49999999.95")),
        # Fixed
        (CommissionType.FIXED, Decimal("50_000"), Decimal("2_500_000"), Decimal("50000.00")),
        (CommissionType.FIXED, Decimal("0"), Decimal("0"), Decimal("0.00")),
        # Rounding — 2.5 % of 1 AED = 0.025 → rounds to 0.03
        (CommissionType.PERCENTAGE, Decimal("2.5"), Decimal("1"), Decimal("0.03")),
    ],
)
def test_compute_commission_amount(
    commission_type: CommissionType,
    commission_value: Decimal,
    transaction_value: Decimal,
    expected: Decimal,
) -> None:
    result = compute_commission_amount(commission_type, commission_value, transaction_value)
    assert result == expected


# ---------------------------------------------------------------------------
# Integration: override + payout via HTTP endpoints
# ---------------------------------------------------------------------------

@pytest.fixture
def owner_headers(tenant_factory):
    """Return auth headers for a company_owner user (via the factory)."""
    # Fixture is async; we call it inside an async test instead.
    return tenant_factory


async def _make_tenant(tenant_factory) -> dict:
    return await tenant_factory()


async def _make_agent(client, headers: dict, tenant_id: str) -> dict:
    resp = await client.post(
        "/agents",
        json={
            "full_name": "Sales Agent",
            "email": f"agent-{__import__('uuid').uuid4().hex[:6]}@test.com",
            "default_commission_type": "percentage",
            "default_commission_value": 2.5,
        },
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


async def _make_customer(client, headers: dict) -> dict:
    resp = await client.post(
        "/customers",
        json={"full_name": "Jane Buyer", "source": "manual"},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


async def _make_property(client, headers: dict) -> dict:
    resp = await client.post(
        "/properties",
        json={"title": "Marina Apt", "property_type": "apartment"},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


async def _make_deal(client, headers: dict, agent_id: str, customer_id: str, property_id: str) -> dict:
    resp = await client.post(
        "/deals",
        json={
            "deal_type": "sale",
            "customer_id": customer_id,
            "property_id": property_id,
            "primary_agent_id": agent_id,
            "transaction_value": 2_000_000,
            "transaction_currency": "AED",
        },
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


async def test_commission_override_missing_reason_returns_422(client, tenant_factory) -> None:
    info = await tenant_factory()
    headers = {"Authorization": f"Bearer {info['access_token']}"}
    agent = await _make_agent(client, headers, str(info["tenant"].id))
    customer = await _make_customer(client, headers)
    prop = await _make_property(client, headers)
    deal = await _make_deal(client, headers, agent["id"], customer["id"], prop["id"])

    resp = await client.post(
        f"/deals/{deal['id']}/commission",
        json={
            "commission_type": "fixed",
            "commission_value": 80_000,
            # missing override_reason → 422
        },
        headers=headers,
    )
    assert resp.status_code == 422


async def test_commission_override_on_closed_deal_returns_400(client, tenant_factory) -> None:
    info = await tenant_factory()
    headers = {"Authorization": f"Bearer {info['access_token']}"}
    agent = await _make_agent(client, headers, str(info["tenant"].id))
    customer = await _make_customer(client, headers)
    prop = await _make_property(client, headers)
    deal = await _make_deal(client, headers, agent["id"], customer["id"], prop["id"])

    # Advance to CLOSED_LOST
    await client.post(
        f"/deals/{deal['id']}/transition",
        json={"stage": "closed_lost", "description": "not interested"},
        headers=headers,
    )

    resp = await client.post(
        f"/deals/{deal['id']}/commission",
        json={
            "commission_type": "fixed",
            "commission_value": 80_000,
            "override_reason": "manager approved",
        },
        headers=headers,
    )
    assert resp.status_code == 400


async def test_commission_payout_flow(client, tenant_factory) -> None:
    """0 → partial → paid; verify payout_status transitions."""
    info = await tenant_factory()
    headers = {"Authorization": f"Bearer {info['access_token']}"}
    agent = await _make_agent(client, headers, str(info["tenant"].id))
    customer = await _make_customer(client, headers)
    prop = await _make_property(client, headers)

    # Deal with 2% of 1_000_000 = 20_000 commission
    resp = await client.post(
        "/deals",
        json={
            "deal_type": "sale",
            "customer_id": customer["id"],
            "property_id": prop["id"],
            "primary_agent_id": agent["id"],
            "transaction_value": 1_000_000,
            "transaction_currency": "AED",
            "commission_type": "fixed",
            "commission_value": 20_000,
            "commission_override_reason": "fixed fee agreed",
        },
        headers=headers,
    )
    assert resp.status_code == 201
    deal = resp.json()
    assert deal["commission_payout_status"] == "pending"

    # Partial payout
    resp = await client.post(
        f"/deals/{deal['id']}/commission/payout",
        json={"amount": 10_000},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["commission_payout_status"] == "partial"

    # Full payout
    resp = await client.post(
        f"/deals/{deal['id']}/commission/payout",
        json={"amount": 10_000},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["commission_payout_status"] == "paid"


async def test_commission_overpay_still_marks_paid(client, tenant_factory) -> None:
    """Over-pay should log warning but still mark status=paid (not crash)."""
    info = await tenant_factory()
    headers = {"Authorization": f"Bearer {info['access_token']}"}
    agent = await _make_agent(client, headers, str(info["tenant"].id))
    customer = await _make_customer(client, headers)
    prop = await _make_property(client, headers)

    resp = await client.post(
        "/deals",
        json={
            "deal_type": "sale",
            "customer_id": customer["id"],
            "property_id": prop["id"],
            "primary_agent_id": agent["id"],
            "transaction_value": 500_000,
            "transaction_currency": "AED",
            "commission_type": "fixed",
            "commission_value": 10_000,
            "commission_override_reason": "fixed fee",
        },
        headers=headers,
    )
    deal = resp.json()

    resp = await client.post(
        f"/deals/{deal['id']}/commission/payout",
        json={"amount": 99_000},  # way more than 10_000
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["commission_payout_status"] == "paid"
