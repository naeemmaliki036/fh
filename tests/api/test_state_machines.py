"""State-machine transition tests for Lead, Deal, and Listing lifecycle.

Uses parametrize to keep the file compact while covering all legal/illegal edges.
Runs against the real DB via the FastAPI test client.
"""

import pytest

# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

async def _auth_headers(tenant_factory) -> tuple[dict, dict]:
    info = await tenant_factory()
    return {"Authorization": f"Bearer {info['access_token']}"}, info


async def _make_agent(client, headers: dict) -> dict:
    import uuid
    resp = await client.post(
        "/agents",
        json={
            "full_name": "Test Agent",
            "email": f"sm-agent-{uuid.uuid4().hex[:6]}@test.com",
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
        json={"full_name": "State Machine Customer", "source": "manual"},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


async def _make_property(client, headers: dict) -> dict:
    resp = await client.post(
        "/properties",
        json={"title": "SM Property", "property_type": "apartment"},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


async def _make_lead(client, headers: dict, customer_id: str) -> dict:
    resp = await client.post(
        "/leads",
        json={"customer_id": customer_id, "source": "manual"},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


async def _make_deal(client, headers: dict, agent_id: str, customer_id: str, prop_id: str) -> dict:
    resp = await client.post(
        "/deals",
        json={
            "deal_type": "sale",
            "customer_id": customer_id,
            "property_id": prop_id,
            "primary_agent_id": agent_id,
            "transaction_value": 1_000_000,
            "transaction_currency": "AED",
        },
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


# ---------------------------------------------------------------------------
# Lead stage machine
# ---------------------------------------------------------------------------

# Legal transitions from NEW
_LEAD_LEGAL = [
    ("new", "contacted"),
    ("new", "lost"),
    ("contacted", "qualified"),
    ("contacted", "lost"),
    ("qualified", "viewing"),
    ("qualified", "lost"),
    ("viewing", "offer"),
    ("viewing", "qualified"),
    ("viewing", "lost"),
    ("offer", "won"),
    ("offer", "lost"),
    ("offer", "viewing"),
]

# Illegal transitions — pick a representative subset
_LEAD_ILLEGAL = [
    ("new", "qualified"),
    ("new", "viewing"),
    ("new", "offer"),
    ("new", "won"),
    ("contacted", "viewing"),
    ("contacted", "offer"),
    ("contacted", "won"),
    ("qualified", "offer"),
    ("qualified", "won"),
    ("won", "lost"),   # terminal
    ("lost", "new"),   # terminal
]


@pytest.mark.parametrize("from_stage,to_stage", _LEAD_LEGAL)
async def test_lead_legal_transition(from_stage: str, to_stage: str, client, tenant_factory) -> None:
    headers, _ = await _auth_headers(tenant_factory)
    customer = await _make_customer(client, headers)
    lead = await _make_lead(client, headers, customer["id"])

    # Fast-forward to from_stage if needed
    _path = _shortest_lead_path(from_stage)
    for stage in _path:
        r = await client.post(
            f"/leads/{lead['id']}/transition",
            json={"stage": stage, "description": "test"},
            headers=headers,
        )
        assert r.status_code == 200, f"Could not reach {stage}: {r.text}"

    resp = await client.post(
        f"/leads/{lead['id']}/transition",
        json={"stage": to_stage, "description": "legal move"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["stage"] == to_stage


@pytest.mark.parametrize("from_stage,to_stage", _LEAD_ILLEGAL)
async def test_lead_illegal_transition(from_stage: str, to_stage: str, client, tenant_factory) -> None:
    headers, _ = await _auth_headers(tenant_factory)
    customer = await _make_customer(client, headers)
    lead = await _make_lead(client, headers, customer["id"])

    _path = _shortest_lead_path(from_stage)
    for stage in _path:
        r = await client.post(
            f"/leads/{lead['id']}/transition",
            json={"stage": stage},
            headers=headers,
        )
        assert r.status_code == 200, f"Could not reach {stage}: {r.text}"

    resp = await client.post(
        f"/leads/{lead['id']}/transition",
        json={"stage": to_stage},
        headers=headers,
    )
    assert resp.status_code == 400


def _shortest_lead_path(target: str) -> list[str]:
    """Return the sequence of transitions needed to reach *target* from 'new'."""
    _paths: dict[str, list[str]] = {
        "new": [],
        "contacted": ["contacted"],
        "qualified": ["contacted", "qualified"],
        "viewing": ["contacted", "qualified", "viewing"],
        "offer": ["contacted", "qualified", "viewing", "offer"],
        "won": ["contacted", "qualified", "viewing", "offer", "won"],
        "lost": ["lost"],
    }
    return _paths[target]


# ---------------------------------------------------------------------------
# Deal stage machine
# ---------------------------------------------------------------------------

_DEAL_LEGAL = [
    ("initiated", "documents_pending"),
    ("initiated", "canceled"),
    ("initiated", "closed_lost"),
    ("documents_pending", "deposit_pending"),
    ("documents_pending", "initiated"),
    ("documents_pending", "canceled"),
    ("documents_pending", "closed_lost"),
    ("deposit_pending", "closed_won"),
    ("deposit_pending", "documents_pending"),
    ("deposit_pending", "canceled"),
    ("deposit_pending", "closed_lost"),
]

_DEAL_ILLEGAL = [
    ("initiated", "deposit_pending"),
    ("initiated", "closed_won"),
    ("documents_pending", "closed_won"),
    ("closed_won", "initiated"),   # terminal
    ("closed_lost", "initiated"),  # terminal
    ("canceled", "initiated"),     # terminal
]


@pytest.mark.parametrize("from_stage,to_stage", _DEAL_LEGAL)
async def test_deal_legal_transition(from_stage: str, to_stage: str, client, tenant_factory) -> None:
    headers, _ = await _auth_headers(tenant_factory)
    agent = await _make_agent(client, headers)
    customer = await _make_customer(client, headers)
    prop = await _make_property(client, headers)
    deal = await _make_deal(client, headers, agent["id"], customer["id"], prop["id"])

    for stage in _shortest_deal_path(from_stage):
        r = await client.post(
            f"/deals/{deal['id']}/transition",
            json={"stage": stage},
            headers=headers,
        )
        assert r.status_code == 200, f"Could not reach {stage}: {r.text}"

    resp = await client.post(
        f"/deals/{deal['id']}/transition",
        json={"stage": to_stage},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["stage"] == to_stage


@pytest.mark.parametrize("from_stage,to_stage", _DEAL_ILLEGAL)
async def test_deal_illegal_transition(from_stage: str, to_stage: str, client, tenant_factory) -> None:
    headers, _ = await _auth_headers(tenant_factory)
    agent = await _make_agent(client, headers)
    customer = await _make_customer(client, headers)
    prop = await _make_property(client, headers)
    deal = await _make_deal(client, headers, agent["id"], customer["id"], prop["id"])

    for stage in _shortest_deal_path(from_stage):
        r = await client.post(
            f"/deals/{deal['id']}/transition",
            json={"stage": stage},
            headers=headers,
        )
        assert r.status_code == 200, f"Could not reach {stage}: {r.text}"

    resp = await client.post(
        f"/deals/{deal['id']}/transition",
        json={"stage": to_stage},
        headers=headers,
    )
    assert resp.status_code == 400


def _shortest_deal_path(target: str) -> list[str]:
    _paths: dict[str, list[str]] = {
        "initiated": [],
        "documents_pending": ["documents_pending"],
        "deposit_pending": ["documents_pending", "deposit_pending"],
        "closed_won": ["documents_pending", "deposit_pending", "closed_won"],
        "closed_lost": ["closed_lost"],
        "canceled": ["canceled"],
    }
    return _paths[target]


# ---------------------------------------------------------------------------
# Listing lifecycle — activate without/with media
# ---------------------------------------------------------------------------

async def test_listing_activate_without_media_returns_400(client, tenant_factory) -> None:
    headers, _ = await _auth_headers(tenant_factory)
    prop = await _make_property(client, headers)

    r = await client.post(
        f"/properties/{prop['id']}/listings",
        json={"purpose": "sale", "title": "No Media Listing", "price": 1_000_000, "currency": "AED"},
        headers=headers,
    )
    assert r.status_code == 201
    listing_id = r.json()["id"]

    # Activate endpoint is flat: /listings/{id}/activate
    resp = await client.post(
        f"/listings/{listing_id}/activate",
        headers=headers,
    )
    assert resp.status_code == 400
