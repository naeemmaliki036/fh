"""Public-site feature tests.

Covers:
- GET /public/sites/{slug}         (profile: 404 variants + 200)
- GET /public/sites/{slug}/listings (list: cross-tenant isolation + disabled)
- GET /public/sites/{slug}/listings/{id} (detail: cross-tenant guard + non-active)
- POST /public/sites/{slug}/leads  (create: 201, rate-limit 429, disabled 404)
- PATCH /tenants/me/public-site    (settings: 403 non-owner, 200 owner + audit)

No exhaustive unit tests for services — the HTTP layer proves the right thing.
"""

import uuid

import pytest
from sqlalchemy import select, text

from apps.api.models.audit_log import AuditLog
from apps.api.models.enums import (
    AuditAction,
    ListingPurpose,
    ListingStatus,
    PropertyType,
    TenantRole,
)
from apps.api.models.listing import Listing
from apps.api.models.property import Property


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _auth(info: dict) -> dict:
    return {"Authorization": f"Bearer {info['access_token']}"}


async def _enable_public_site(db, tenant) -> None:
    """Directly set public_site_enabled=True on the tenant row."""
    tenant.public_site_enabled = True
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)


async def _make_property_and_listing(
    db,
    tenant_id: uuid.UUID,
    *,
    status: ListingStatus = ListingStatus.ACTIVE,
) -> tuple:
    """Insert a Property + Listing row; return (property, listing)."""
    prop = Property(
        tenant_id=tenant_id,
        title="Test Property",
        property_type=PropertyType.APARTMENT,
        bedrooms=2,
        bathrooms=1,
    )
    db.add(prop)
    await db.flush()

    listing = Listing(
        tenant_id=tenant_id,
        property_id=prop.id,
        title="Test Listing",
        price=500_000,
        currency="AED",
        purpose=ListingPurpose.SALE,
        status=status,
    )
    db.add(listing)
    await db.commit()
    await db.refresh(prop)
    await db.refresh(listing)
    return prop, listing


def _reset_rate_limit(key: str) -> None:
    """Remove a rate-limit bucket so the next request starts a fresh window."""
    from packages.common.utils import rate_limit as rl
    rl._STORE.pop(key, None)


# ---------------------------------------------------------------------------
# GET /public/sites/{slug}
# ---------------------------------------------------------------------------


async def test_get_profile_404_unknown_slug(client, tenant_factory) -> None:
    """Slug that does not exist → 404."""
    resp = await client.get("/public/sites/no-such-slug-ever")
    assert resp.status_code == 404


async def test_get_profile_404_when_site_disabled(client, tenant_factory) -> None:
    """Tenant exists but public_site_enabled=False → 404."""
    info = await tenant_factory(slug="site-disabled-test")
    # public_site_enabled defaults to False — do NOT enable it
    resp = await client.get(f"/public/sites/{info['tenant'].slug}")
    assert resp.status_code == 404


async def test_get_profile_200_when_enabled(client, db, tenant_factory) -> None:
    """Tenant with public_site_enabled=True → 200 with correct profile fields."""
    info = await tenant_factory(slug="site-enabled-test")
    await _enable_public_site(db, info["tenant"])

    resp = await client.get("/public/sites/site-enabled-test")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == info["tenant"].name
    assert data["contact_email"] == info["tenant"].contact_email
    assert data["contact_phone"] == info["tenant"].contact_phone


# ---------------------------------------------------------------------------
# GET /public/sites/{slug}/listings
# ---------------------------------------------------------------------------


async def test_list_listings_404_when_site_disabled(client, tenant_factory) -> None:
    """Site disabled → 404 on listings endpoint too."""
    info = await tenant_factory(slug="listings-disabled")
    resp = await client.get(f"/public/sites/{info['tenant'].slug}/listings")
    assert resp.status_code == 404


async def test_list_listings_no_cross_tenant_leakage(
    client, db, tenant_factory
) -> None:
    """Two enabled tenants each with a listing; each sees only their own listing."""
    info_a = await tenant_factory(slug="site-tenant-a")
    info_b = await tenant_factory(slug="site-tenant-b")

    await _enable_public_site(db, info_a["tenant"])
    await _enable_public_site(db, info_b["tenant"])

    _, listing_a = await _make_property_and_listing(db, info_a["tenant"].id)
    _, listing_b = await _make_property_and_listing(db, info_b["tenant"].id)

    resp_a = await client.get("/public/sites/site-tenant-a/listings")
    assert resp_a.status_code == 200
    ids_a = {item["id"] for item in resp_a.json()["items"]}
    assert str(listing_a.id) in ids_a
    assert str(listing_b.id) not in ids_a, "Cross-tenant listing leaked into tenant A"

    resp_b = await client.get("/public/sites/site-tenant-b/listings")
    assert resp_b.status_code == 200
    ids_b = {item["id"] for item in resp_b.json()["items"]}
    assert str(listing_b.id) in ids_b
    assert str(listing_a.id) not in ids_b, "Cross-tenant listing leaked into tenant B"


# ---------------------------------------------------------------------------
# GET /public/sites/{slug}/listings/{id}
# ---------------------------------------------------------------------------


async def test_listing_detail_404_wrong_tenant(client, db, tenant_factory) -> None:
    """Listing ID belonging to tenant B must 404 when fetched under tenant A's slug."""
    info_a = await tenant_factory(slug="detail-tenant-a")
    info_b = await tenant_factory(slug="detail-tenant-b")

    await _enable_public_site(db, info_a["tenant"])
    await _enable_public_site(db, info_b["tenant"])

    _, listing_b = await _make_property_and_listing(db, info_b["tenant"].id)

    # Request listing_b under tenant A's slug — must 404 (cross-tenant guard)
    resp = await client.get(f"/public/sites/detail-tenant-a/listings/{listing_b.id}")
    assert resp.status_code == 404


async def test_listing_detail_404_when_not_active(client, db, tenant_factory) -> None:
    """Draft listing must not be publicly visible — 404."""
    info = await tenant_factory(slug="detail-draft-test")
    await _enable_public_site(db, info["tenant"])

    _, draft_listing = await _make_property_and_listing(
        db, info["tenant"].id, status=ListingStatus.DRAFT
    )

    resp = await client.get(
        f"/public/sites/detail-draft-test/listings/{draft_listing.id}"
    )
    assert resp.status_code == 404


async def test_listing_detail_200_happy_path(client, db, tenant_factory) -> None:
    """Active listing on its own tenant's slug → 200 with expected shape."""
    info = await tenant_factory(slug="detail-happy")
    await _enable_public_site(db, info["tenant"])

    _, listing = await _make_property_and_listing(db, info["tenant"].id)

    resp = await client.get(f"/public/sites/detail-happy/listings/{listing.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == str(listing.id)
    assert data["title"] == listing.title
    assert "price" in data


# ---------------------------------------------------------------------------
# POST /public/sites/{slug}/leads
# ---------------------------------------------------------------------------


async def test_create_lead_returns_201(client, db, tenant_factory) -> None:
    """Valid lead submission → 201 with only {id} in the response."""
    info = await tenant_factory(slug="lead-happy")
    await _enable_public_site(db, info["tenant"])

    slug = "lead-happy"
    _reset_rate_limit(f"testclient:{slug}")

    resp = await client.post(
        f"/public/sites/{slug}/leads",
        json={
            "name": "Alice Smith",
            "email": "alice@example.com",
            "phone": "+971501234567",
            "message": "Interested in the apartment",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "id" in data
    # Only id must be present — no internal data
    assert set(data.keys()) == {"id"}


async def test_create_lead_404_when_site_disabled(client, tenant_factory) -> None:
    """Lead submission on a disabled site → 404."""
    info = await tenant_factory(slug="lead-disabled")
    # Do NOT enable public site

    resp = await client.post(
        f"/public/sites/{info['tenant'].slug}/leads",
        json={"name": "Bob", "email": "bob@example.com"},
    )
    assert resp.status_code == 404


async def test_create_lead_404_for_non_active_listing(client, db, tenant_factory) -> None:
    """Lead referencing a draft/non-active listing must 404."""
    info = await tenant_factory(slug="lead-draft-listing")
    await _enable_public_site(db, info["tenant"])

    _, draft_listing = await _make_property_and_listing(
        db, info["tenant"].id, status=ListingStatus.DRAFT
    )

    slug = "lead-draft-listing"
    _reset_rate_limit(f"testclient:{slug}")

    resp = await client.post(
        f"/public/sites/{slug}/leads",
        json={
            "name": "Carol",
            "email": "carol@example.com",
            "listing_id": str(draft_listing.id),
        },
    )
    assert resp.status_code == 404


async def test_create_lead_rate_limit_429(client, db, tenant_factory) -> None:
    """6th request within the rate-limit window → 429.

    The in-memory rate limiter has no public reset function; we manipulate
    the module-level _STORE dict directly.  Tests that share an IP:slug key
    should use distinct slugs or call _reset_rate_limit() in setUp.
    """
    info = await tenant_factory(slug="lead-ratelimit")
    await _enable_public_site(db, info["tenant"])

    slug = "lead-ratelimit"
    rate_key = f"testclient:{slug}"
    _reset_rate_limit(rate_key)

    payload = {"name": "Rate Test", "email": "rate@example.com"}

    # Requests 1-5 must succeed (201)
    for i in range(5):
        resp = await client.post(f"/public/sites/{slug}/leads", json=payload)
        assert resp.status_code == 201, f"Request {i+1} unexpectedly blocked: {resp.text}"

    # 6th request must be rate-limited
    resp = await client.post(f"/public/sites/{slug}/leads", json=payload)
    assert resp.status_code == 429


# ---------------------------------------------------------------------------
# PATCH /tenants/me/public-site
# ---------------------------------------------------------------------------


async def test_patch_public_site_403_for_agent_role(
    client, tenant_factory
) -> None:
    """Agent-role user cannot update public-site settings → 403."""
    info = await tenant_factory(slug="patch-agent-test", role=TenantRole.AGENT)
    headers = _auth(info)

    resp = await client.patch(
        "/tenants/me/public-site",
        json={"public_site_enabled": True},
        headers=headers,
    )
    assert resp.status_code == 403


async def test_patch_public_site_200_for_owner_writes_audit(
    client, db, tenant_factory
) -> None:
    """Company owner can update public-site settings; an audit log entry is written."""
    info = await tenant_factory(
        slug="patch-owner-test", role=TenantRole.COMPANY_OWNER
    )
    headers = _auth(info)
    tenant_id = info["tenant"].id

    resp = await client.patch(
        "/tenants/me/public-site",
        json={"public_site_enabled": True, "public_site_tagline": "Best Agency"},
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["public_site_enabled"] is True
    assert data["public_site_tagline"] == "Best Agency"
    assert data["slug"] == "patch-owner-test"

    # Verify audit log entry exists for this tenant update
    await db.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))
    result = await db.execute(
        select(AuditLog).where(
            AuditLog.tenant_id == tenant_id,
            AuditLog.action == AuditAction.TENANT_UPDATED,
            AuditLog.entity_type == "tenant",
        )
    )
    rows = result.scalars().all()
    assert len(rows) >= 1, "Expected at least one TENANT_UPDATED audit log entry"
    latest = rows[-1]
    assert latest.metadata_after is not None
    assert latest.metadata_after.get("public_site_enabled") is True
