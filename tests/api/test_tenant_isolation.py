"""Tenant isolation tests — the highest-ROI test in the suite.

Creates two tenants A and B. Tenant A creates data (agent, property, customer,
lead, deal). Tenant B must NOT see any of A's data in list endpoints, and must
get 404 (not 403) when fetching A's individual resources by ID.

Also smoke-tests that the service-layer tenant_id scoping is consistent with
what the DB RLS policy enforces.
"""

import uuid

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _headers(info: dict) -> dict:
    return {"Authorization": f"Bearer {info['access_token']}"}


async def _make_agent(client, headers: dict) -> dict:
    resp = await client.post(
        "/agents",
        json={
            "full_name": "Isolation Agent",
            "email": f"iso-{uuid.uuid4().hex[:6]}@tenanta.example.com",
            "default_commission_type": "percentage",
            "default_commission_value": 2.5,
        },
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


async def _make_customer(client, headers: dict) -> dict:
    resp = await client.post(
        "/customers",
        json={"full_name": "Isolation Customer", "source": "manual"},
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


async def _make_property(client, headers: dict) -> dict:
    resp = await client.post(
        "/properties",
        json={"title": "Isolation Property", "property_type": "apartment"},
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


async def _make_lead(client, headers: dict, customer_id: str) -> dict:
    resp = await client.post(
        "/leads",
        json={"customer_id": customer_id, "source": "manual"},
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


async def _make_deal(
    client, headers: dict, agent_id: str, customer_id: str, property_id: str
) -> dict:
    resp = await client.post(
        "/deals",
        json={
            "deal_type": "sale",
            "customer_id": customer_id,
            "property_id": property_id,
            "primary_agent_id": agent_id,
            "transaction_value": 1_500_000,
            "transaction_currency": "AED",
        },
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


# ---------------------------------------------------------------------------
# The isolation test itself
# ---------------------------------------------------------------------------

async def test_tenant_isolation_list_endpoints(client, tenant_factory) -> None:
    """Tenant B's list responses must not contain any of Tenant A's data."""
    a = await tenant_factory(slug="tenant-a-iso")
    b = await tenant_factory(slug="tenant-b-iso")
    ha = await _headers(a)
    hb = await _headers(b)

    # Create data as Tenant A
    agent_a = await _make_agent(client, ha)
    customer_a = await _make_customer(client, ha)
    prop_a = await _make_property(client, ha)
    lead_a = await _make_lead(client, ha, customer_a["id"])
    deal_a = await _make_deal(client, ha, agent_a["id"], customer_a["id"], prop_a["id"])

    a_ids = {
        agent_a["id"],
        customer_a["id"],
        prop_a["id"],
        lead_a["id"],
        deal_a["id"],
    }

    # List from Tenant B — none of A's IDs should appear
    for endpoint in ["/agents", "/customers", "/properties", "/leads", "/deals"]:
        resp = await client.get(endpoint, headers=hb)
        assert resp.status_code == 200, f"{endpoint}: {resp.text}"
        data = resp.json()
        # All list endpoints return {"items": [...], "total": N}
        items = data.get("items", data) if isinstance(data, dict) else data
        returned_ids = {item["id"] for item in items}
        leaked = returned_ids & a_ids
        assert not leaked, f"{endpoint}: tenant B sees tenant A IDs: {leaked}"


async def test_tenant_isolation_get_by_id_returns_404(client, tenant_factory) -> None:
    """Tenant B fetching Tenant A's resource by ID must get 404, not 403 or 200."""
    a = await tenant_factory(slug="tenant-a-get")
    b = await tenant_factory(slug="tenant-b-get")
    ha = await _headers(a)
    hb = await _headers(b)

    agent_a = await _make_agent(client, ha)
    customer_a = await _make_customer(client, ha)
    prop_a = await _make_property(client, ha)
    lead_a = await _make_lead(client, ha, customer_a["id"])
    deal_a = await _make_deal(client, ha, agent_a["id"], customer_a["id"], prop_a["id"])

    pairs = [
        (f"/agents/{agent_a['id']}", hb),
        (f"/customers/{customer_a['id']}", hb),
        (f"/properties/{prop_a['id']}", hb),
        (f"/leads/{lead_a['id']}", hb),
        (f"/deals/{deal_a['id']}", hb),
    ]
    for url, headers in pairs:
        resp = await client.get(url, headers=headers)
        assert resp.status_code == 404, (
            f"Expected 404 for {url} from tenant B, got {resp.status_code}: {resp.text}"
        )


async def test_tenant_isolation_nonexistent_id_is_also_404(client, tenant_factory) -> None:
    """Completely random IDs must also 404 (existence leak test)."""
    b = await tenant_factory(slug="tenant-b-nonexist")
    hb = await _headers(b)

    fake_id = str(uuid.uuid4())
    for endpoint in ["/agents", "/customers", "/properties", "/leads", "/deals"]:
        resp = await client.get(f"{endpoint}/{fake_id}", headers=hb)
        assert resp.status_code == 404, (
            f"{endpoint}/{fake_id} returned {resp.status_code}"
        )


async def test_tenant_a_can_still_read_own_data(client, tenant_factory) -> None:
    """Sanity: Tenant A must be able to read its own resources."""
    a = await tenant_factory(slug="tenant-a-own")
    ha = await _headers(a)

    agent_a = await _make_agent(client, ha)
    customer_a = await _make_customer(client, ha)
    prop_a = await _make_property(client, ha)
    lead_a = await _make_lead(client, ha, customer_a["id"])
    deal_a = await _make_deal(client, ha, agent_a["id"], customer_a["id"], prop_a["id"])

    pairs = [
        f"/agents/{agent_a['id']}",
        f"/customers/{customer_a['id']}",
        f"/properties/{prop_a['id']}",
        f"/leads/{lead_a['id']}",
        f"/deals/{deal_a['id']}",
    ]
    for url in pairs:
        resp = await client.get(url, headers=ha)
        assert resp.status_code == 200, f"Tenant A could not read own {url}: {resp.text}"
