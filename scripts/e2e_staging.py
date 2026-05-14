#!/usr/bin/env python3
"""fh Real Estate SaaS — Staging E2E test script.

Usage:
    /Users/mna036/mna-bytes/fh/.venv/bin/python scripts/e2e_staging.py
"""

import sys
import time
from datetime import datetime, timezone
from typing import Any

import httpx

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
API = "https://fh-staging-api.up.railway.app"
PLATFORM_EMAIL = "devmna036+admin@gmail.com"
PLATFORM_PASSWORD = "Miange@036"
TENANT_EMAIL = "owner@marinarealty.ae"
TENANT_PASSWORD = "Marina@2026"
TENANT_SLUG = "marina-realty"
TS = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
TAG = f"[E2E] {TS}"

# ---------------------------------------------------------------------------
# ANSI colors
# ---------------------------------------------------------------------------
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

PASS = f"{GREEN}✓{RESET}"
FAIL = f"{RED}✗{RESET}"
SKIP = f"{YELLOW}⚠{RESET}"

# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------
results: list[tuple[str, str, str | None]] = []  # (status, label, detail)
platform_token: str | None = None
tenant_token: str | None = None
marina_tenant_id: str | None = None
e2e_property_id: str | None = None
e2e_listing_id: str | None = None
e2e_listing_price: float | None = None

client = httpx.Client(timeout=30)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def header(section: str) -> None:
    print(f"\n{BOLD}{CYAN}{section}{RESET}")


def record(status: str, label: str, detail: str | None = None) -> None:
    results.append((status, label, detail))
    sym = PASS if status == "pass" else (FAIL if status == "fail" else SKIP)
    detail_str = f" — {detail}" if detail else ""
    print(f"  {sym} {label}{detail_str}")


def check(
    label: str,
    resp: httpx.Response,
    *,
    expected_status: int,
    field_checks: dict[str, Any] | None = None,
) -> dict | None:
    """Validate response status + optional field checks. Returns parsed JSON or None."""
    try:
        if resp.status_code != expected_status:
            record(
                "fail",
                label,
                f"HTTP {resp.status_code} (expected {expected_status}) — {resp.text[:200]}",
            )
            return None
        data = resp.json() if resp.content else {}
        if field_checks:
            for key, expected in field_checks.items():
                parts = key.split(".")
                val: Any = data
                for p in parts:
                    if isinstance(val, dict):
                        val = val.get(p)
                    else:
                        val = None
                        break
                if expected is not None and val != expected:
                    record("fail", label, f"field '{key}'={val!r}, expected {expected!r}")
                    return None
                if expected is None and val is None:
                    record("fail", label, f"field '{key}' is missing/None")
                    return None
        record("pass", label)
        return data
    except Exception as exc:
        record("fail", label, str(exc))
        return None


def ph(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def skip(label: str, reason: str) -> None:
    record("skip", label, reason)


# ---------------------------------------------------------------------------
# Section 1 — Health
# ---------------------------------------------------------------------------
def s1_health() -> None:
    header("[1] Health")
    try:
        r = client.get(f"{API}/health")
        check("GET /health → 200 {status: healthy}", r, expected_status=200,
              field_checks={"status": "healthy"})
    except Exception as exc:
        record("fail", "GET /health", str(exc))


# ---------------------------------------------------------------------------
# Section 2 — Marketing inbound
# ---------------------------------------------------------------------------
def s2_marketing() -> None:
    header("[2] Marketing inbound")
    try:
        r = client.post(f"{API}/marketing/demo-request", json={
            "full_name": f"{TAG} Tester",
            "company_name": "E2E Realty",
            "email": "e2e-test@example.com",
            "phone": "+971501234567",
            "country": "UAE",
            "team_size": "1-10",
            "message": "Automated E2E test — please ignore",
        })
        check("POST /marketing/demo-request → 202 {status: received}", r,
              expected_status=202, field_checks={"status": "received"})
    except Exception as exc:
        record("fail", "POST /marketing/demo-request", str(exc))

    try:
        r = client.post(f"{API}/marketing/waitlist", json={"email": "e2e-waitlist@example.com"})
        check("POST /marketing/waitlist → 202", r, expected_status=202,
              field_checks={"status": "received"})
    except Exception as exc:
        record("fail", "POST /marketing/waitlist", str(exc))


# ---------------------------------------------------------------------------
# Section 3 — Platform auth
# ---------------------------------------------------------------------------
def s3_platform_auth() -> None:
    global platform_token
    header("[3] Platform auth")
    try:
        r = client.post(f"{API}/auth/platform-login", json={
            "email": PLATFORM_EMAIL, "password": PLATFORM_PASSWORD,
        })
        data = check("POST /auth/platform-login → token", r, expected_status=200)
        if data:
            platform_token = data.get("access_token")
            if not platform_token:
                record("fail", "Platform token present in response", "access_token missing")
            else:
                record("pass", "Platform access_token received")
    except Exception as exc:
        record("fail", "POST /auth/platform-login", str(exc))

    if not platform_token:
        skip("GET /auth/platform/me", "no platform token")
        return
    try:
        r = client.get(f"{API}/auth/platform/me", headers=ph(platform_token))
        data = check("GET /auth/platform/me → platform user", r, expected_status=200)
        if data:
            if not data.get("is_platform"):
                record("fail", "is_platform=true in /auth/platform/me", f"got {data.get('is_platform')}")
            else:
                record("pass", "is_platform=true confirmed")
    except Exception as exc:
        record("fail", "GET /auth/platform/me", str(exc))


# ---------------------------------------------------------------------------
# Section 4 — Tenant auth
# ---------------------------------------------------------------------------
def s4_tenant_auth() -> None:
    global tenant_token
    header("[4] Tenant auth")
    try:
        r = client.post(f"{API}/auth/login", json={
            "email": TENANT_EMAIL, "password": TENANT_PASSWORD,
        })
        data = check("POST /auth/login (owner@marinarealty.ae) → tokens", r, expected_status=200)
        if data:
            tenant_token = data.get("access_token")
            if not tenant_token:
                record("fail", "Tenant token present in response", "access_token missing")
            else:
                record("pass", "Tenant access_token received")
    except Exception as exc:
        record("fail", "POST /auth/login", str(exc))

    if not tenant_token:
        skip("GET /auth/me", "no tenant token")
        return
    try:
        r = client.get(f"{API}/auth/me", headers=ph(tenant_token))
        data = check("GET /auth/me → owner identity", r, expected_status=200)
        if data and data.get("email") != TENANT_EMAIL:
            record("fail", f"/auth/me email matches {TENANT_EMAIL}", f"got {data.get('email')}")
        elif data:
            record("pass", f"/auth/me email={data.get('email')}")
    except Exception as exc:
        record("fail", "GET /auth/me", str(exc))


# ---------------------------------------------------------------------------
# Section 5 — Public site
# ---------------------------------------------------------------------------
def s5_public_site() -> None:
    header("[5] Public site")
    try:
        r = client.get(f"{API}/public/sites/{TENANT_SLUG}")
        data = check(f"GET /public/sites/{TENANT_SLUG} → name + operating_countries", r,
                     expected_status=200)
        if data:
            if not data.get("name"):
                record("fail", "name present", f"got {data.get('name')!r}")
            elif not data.get("operating_countries"):
                record("fail", "operating_countries present", f"got {data.get('operating_countries')!r}")
            else:
                record("pass", f"name={data['name']!r} countries={data['operating_countries']}")
    except Exception as exc:
        record("fail", f"GET /public/sites/{TENANT_SLUG}", str(exc))

    listing_id: str | None = None
    try:
        r = client.get(f"{API}/public/sites/{TENANT_SLUG}/listings")
        data = check(f"GET /public/sites/{TENANT_SLUG}/listings → items", r, expected_status=200)
        if data:
            items = data.get("items") or []
            record("pass", f"listings returned {len(items)} items")
            if items:
                listing_id = str(items[0]["id"])
    except Exception as exc:
        record("fail", f"GET /public/sites/{TENANT_SLUG}/listings", str(exc))

    if listing_id:
        try:
            r = client.get(f"{API}/public/sites/{TENANT_SLUG}/listings/{listing_id}")
            data = check(f"GET /public/sites/{TENANT_SLUG}/listings/{{id}} → status field", r,
                         expected_status=200)
            if data and "status" not in data:
                record("fail", "status field in listing detail", "missing")
            elif data:
                record("pass", f"listing detail status={data.get('status')!r}")
        except Exception as exc:
            record("fail", f"GET /public/sites/{TENANT_SLUG}/listings/{{id}}", str(exc))
    else:
        skip(f"GET /public/sites/{TENANT_SLUG}/listings/{{id}}", "no listings available")

    try:
        r = client.get(f"{API}/public/sites/{TENANT_SLUG}/agents")
        data = check(f"GET /public/sites/{TENANT_SLUG}/agents → 200", r, expected_status=200)
        if data is not None:
            record("pass", f"agents endpoint returned {len(data.get('items', []))} items")
    except Exception as exc:
        record("fail", f"GET /public/sites/{TENANT_SLUG}/agents", str(exc))


# ---------------------------------------------------------------------------
# Section 6 — Suspended tenant
# ---------------------------------------------------------------------------
def s6_suspended_tenant() -> None:
    header("[6] Public site for suspended tenant")
    if not platform_token:
        skip("Suspended tenant test", "no platform token")
        return

    # Find a tenant that is NOT marina-realty
    other_slug: str | None = None
    other_id: str | None = None
    try:
        r = client.get(f"{API}/tenants", headers=ph(platform_token))
        if r.status_code == 200:
            items = r.json().get("items", [])
            for t in items:
                if t.get("slug") != TENANT_SLUG and t.get("status") == "active":
                    other_slug = t["slug"]
                    other_id = t["id"]
                    break
    except Exception as exc:
        skip("Suspended tenant test", f"could not list tenants: {exc}")
        return

    if not other_slug or not other_id:
        skip("Suspended tenant test", "no second active tenant found")
        return

    # Suspend
    suspended = False
    try:
        r = client.post(
            f"{API}/tenants/{other_id}/suspend",
            json={"reason_note": f"{TAG} E2E suspend test"},
            headers=ph(platform_token),
        )
        if r.status_code == 200:
            suspended = True
            record("pass", f"POST /tenants/{other_id}/suspend → 200 status=suspended")
        else:
            record("fail", f"POST /tenants/{{id}}/suspend", f"HTTP {r.status_code} {r.text[:200]}")
    except Exception as exc:
        record("fail", "POST /tenants/{id}/suspend", str(exc))

    if suspended:
        try:
            r = client.get(f"{API}/public/sites/{other_slug}")
            if r.status_code == 410:
                detail = r.json().get("detail", {})
                site_offline = (
                    detail == "site_offline"
                    or (isinstance(detail, dict) and detail.get("detail") == "site_offline")
                )
                if site_offline:
                    record("pass", f"GET /public/sites/{other_slug} → 410 site_offline")
                else:
                    record("fail", f"GET /public/sites/{other_slug} → 410 but wrong detail", str(detail)[:100])
            else:
                record("fail", f"GET /public/sites/{other_slug} suspended → 410", f"got {r.status_code}")
        except Exception as exc:
            record("fail", f"GET /public/sites/{other_slug}", str(exc))

        # Reactivate
        try:
            r = client.post(
                f"{API}/tenants/{other_id}/reactivate",
                json={"reason_note": f"{TAG} E2E restore"},
                headers=ph(platform_token),
            )
            if r.status_code == 200:
                record("pass", f"POST /tenants/{other_id}/reactivate → restored")
            else:
                record("fail", "Reactivate other tenant", f"HTTP {r.status_code} {r.text[:200]}")
        except Exception as exc:
            record("fail", "Reactivate other tenant", str(exc))


# ---------------------------------------------------------------------------
# Section 7 — Tenant lifecycle (marina-realty)
# ---------------------------------------------------------------------------
def s7_tenant_lifecycle() -> None:
    global marina_tenant_id
    header("[7] Tenant lifecycle (platform admin)")
    if not platform_token:
        skip("All lifecycle checks", "no platform token")
        return

    # List
    try:
        r = client.get(f"{API}/tenants", headers=ph(platform_token))
        data = check("GET /tenants → array", r, expected_status=200)
        if data:
            items = data.get("items", [])
            record("pass", f"total={data.get('total')} tenants")
            for t in items:
                if t.get("slug") == TENANT_SLUG:
                    marina_tenant_id = t["id"]
    except Exception as exc:
        record("fail", "GET /tenants", str(exc))

    if not marina_tenant_id:
        skip("All remaining lifecycle checks", "marina-realty tenant id not found")
        return

    # Detail
    try:
        r = client.get(f"{API}/tenants/{marina_tenant_id}", headers=ph(platform_token))
        data = check("GET /tenants/{id} → TenantDetailResponse", r, expected_status=200)
        if data:
            has_counts = "counts" in data
            has_activity = "recent_activity" in data
            if has_counts and has_activity:
                record("pass", f"counts={data['counts']} recent_activity={len(data['recent_activity'])} items")
            else:
                record("fail", "TenantDetailResponse has counts + recent_activity",
                       f"counts={has_counts} activity={has_activity}")
    except Exception as exc:
        record("fail", "GET /tenants/{id}", str(exc))

    # Suspend marina-realty
    try:
        r = client.post(
            f"{API}/tenants/{marina_tenant_id}/suspend",
            json={"reason_note": f"{TAG} test suspend"},
            headers=ph(platform_token),
        )
        data = check("POST /tenants/{id}/suspend → status=suspended", r, expected_status=200)
        if data and data.get("tenant", {}).get("status") != "suspended":
            # maybe flat structure
            status_val = data.get("status") or data.get("tenant", {}).get("status")
            if status_val == "suspended":
                record("pass", "status=suspended confirmed")
            else:
                record("fail", "status=suspended after suspend", f"got {status_val}")
    except Exception as exc:
        record("fail", "POST /tenants/{id}/suspend", str(exc))

    # Quick check — public site should 410
    try:
        r = client.get(f"{API}/public/sites/{TENANT_SLUG}")
        if r.status_code == 410:
            record("pass", f"GET /public/sites/{TENANT_SLUG} → 410 (suspended)")
        else:
            record("fail", f"GET /public/sites/{TENANT_SLUG} suspended → 410", f"got {r.status_code}")
    except Exception as exc:
        record("fail", f"GET /public/sites/{TENANT_SLUG} after suspend", str(exc))

    # Reactivate
    try:
        r = client.post(
            f"{API}/tenants/{marina_tenant_id}/reactivate",
            json={"reason_note": f"{TAG} test restore"},
            headers=ph(platform_token),
        )
        data = check("POST /tenants/{id}/reactivate → status=active", r, expected_status=200)
        if data:
            status_val = data.get("status") or data.get("tenant", {}).get("status")
            if status_val == "active":
                record("pass", "status=active after reactivate")
            else:
                record("fail", "status=active after reactivate", f"got {status_val}")
    except Exception as exc:
        record("fail", "POST /tenants/{id}/reactivate", str(exc))

    # Verify public site is back
    try:
        r = client.get(f"{API}/public/sites/{TENANT_SLUG}")
        if r.status_code == 200:
            record("pass", f"GET /public/sites/{TENANT_SLUG} → 200 after reactivate")
        else:
            record("fail", f"GET /public/sites/{TENANT_SLUG} after reactivate → 200",
                   f"got {r.status_code}")
    except Exception as exc:
        record("fail", f"GET /public/sites/{TENANT_SLUG} after reactivate", str(exc))


# ---------------------------------------------------------------------------
# Section 8 — Property + media flow
# ---------------------------------------------------------------------------
def s8_property_media() -> None:
    header("[8] Property + media flow")
    if not tenant_token:
        skip("All property/media checks", "no tenant token")
        return

    prop_id: str | None = None
    try:
        r = client.get(f"{API}/properties", headers=ph(tenant_token))
        data = check("GET /properties → items", r, expected_status=200)
        if data:
            items = data.get("items", [])
            record("pass", f"returned {len(items)} properties")
            if items:
                prop_id = str(items[0]["id"])
                thumb = items[0].get("thumbnail_url")
                if thumb and "//images.unsplash.com//images.unsplash.com" in thumb:
                    record("fail", "thumbnail_url not double-prefixed", thumb[:120])
                elif thumb:
                    record("pass", f"thumbnail_url looks clean: {thumb[:80]}")
                else:
                    record("pass", "thumbnail_url is null (no media yet)")
    except Exception as exc:
        record("fail", "GET /properties", str(exc))

    if not prop_id:
        skip("Media list + reorder checks", "no property found")
        return

    media_ids: list[str] = []
    try:
        r = client.get(f"{API}/properties/{prop_id}/media", headers=ph(tenant_token))
        data = check(f"GET /properties/{prop_id}/media → list", r, expected_status=200)
        if data:
            items = data.get("items", [])
            media_ids = [str(m["id"]) for m in items]
            record("pass", f"media list returned {len(items)} items")
    except Exception as exc:
        record("fail", f"GET /properties/{prop_id}/media", str(exc))

    if len(media_ids) >= 2:
        reversed_ids = list(reversed(media_ids))
        try:
            r = client.post(
                f"{API}/properties/{prop_id}/media/reorder",
                json={"ordered_ids": reversed_ids},
                headers=ph(tenant_token),
            )
            check("POST /properties/{id}/media/reorder → 200 (not 500)", r, expected_status=200)
        except Exception as exc:
            record("fail", "POST /properties/{id}/media/reorder", str(exc))

        # Restore original order
        try:
            r = client.post(
                f"{API}/properties/{prop_id}/media/reorder",
                json={"ordered_ids": media_ids},
                headers=ph(tenant_token),
            )
            check("POST /properties/{id}/media/reorder restore → 200", r, expected_status=200)
        except Exception as exc:
            record("fail", "Media reorder restore", str(exc))
    else:
        skip("Media reorder", f"need ≥2 media items, found {len(media_ids)}")


# ---------------------------------------------------------------------------
# Section 9 — Listing review workflow
# ---------------------------------------------------------------------------
def s9_listing_review() -> None:
    global e2e_property_id, e2e_listing_id, e2e_listing_price
    header("[9] Listing review workflow")
    if not tenant_token:
        skip("All review workflow checks", "no tenant token")
        return

    # Create property
    prop_title = f"{TAG} Property"
    try:
        r = client.post(f"{API}/properties", json={
            "title": prop_title,
            "property_type": "apartment",
            "price": 1500000,
            "currency": "AED",
            "city": "Dubai",
            "country": "AE",
            "bedrooms": 2,
            "bathrooms": 2,
        }, headers=ph(tenant_token))
        data = check(f"POST /properties '{prop_title}' → 201", r, expected_status=201)
        if data:
            e2e_property_id = str(data["id"])
            record("pass", f"Property created id={e2e_property_id}")
    except Exception as exc:
        record("fail", "POST /properties (E2E)", str(exc))

    if not e2e_property_id:
        skip("Listing creation + review workflow", "property creation failed")
        return

    # Create listing
    listing_title = f"{TAG} Listing"
    try:
        r = client.post(f"{API}/properties/{e2e_property_id}/listings", json={
            "title": listing_title,
            "purpose": "sale",
            "price": 1500000,
            "currency": "AED",
            "status": "draft",
        }, headers=ph(tenant_token))
        data = check(f"POST /properties/{e2e_property_id}/listings → 201", r, expected_status=201)
        if data:
            e2e_listing_id = str(data["id"])
            e2e_listing_price = float(data.get("price", 1500000))
            record("pass", f"Listing created id={e2e_listing_id}")
    except Exception as exc:
        record("fail", "POST /properties/{id}/listings (E2E)", str(exc))

    if not e2e_listing_id:
        skip("Review workflow", "listing creation failed")
        return

    # Get eligible reviewers
    reviewers: list[dict] = []
    try:
        r = client.get(f"{API}/users/eligible-reviewers", headers=ph(tenant_token))
        data = check("GET /users/eligible-reviewers → list", r, expected_status=200)
        if data:
            reviewers = data.get("items", [])
            record("pass", f"eligible reviewers: {len(reviewers)}")
    except Exception as exc:
        record("fail", "GET /users/eligible-reviewers", str(exc))

    if not reviewers:
        skip("Submit-for-review → approve → publish workflow", "0 eligible reviewers")
        return

    reviewer_id = str(reviewers[0]["id"])

    # Submit for review
    try:
        r = client.post(f"{API}/listings/{e2e_listing_id}/submit-for-review", json={
            "reviewer_id": reviewer_id,
            "note": f"{TAG} submit",
        }, headers=ph(tenant_token))
        data = check(f"POST /listings/{e2e_listing_id}/submit-for-review → pending_review", r,
                     expected_status=200)
        if data and data.get("status") != "pending_review":
            record("fail", "status=pending_review after submit", f"got {data.get('status')}")
        elif data:
            record("pass", f"status={data['status']}")
    except Exception as exc:
        record("fail", "POST /listings/{id}/submit-for-review", str(exc))

    # Review decision: approve
    try:
        r = client.post(f"{API}/listings/{e2e_listing_id}/review-decision", json={
            "decision": "approved",
            "note": f"{TAG} approve",
        }, headers=ph(tenant_token))
        data = check(f"POST /listings/{e2e_listing_id}/review-decision approved", r,
                     expected_status=200)
        if data and data.get("status") != "approved":
            record("fail", "status=approved after decision", f"got {data.get('status')}")
        elif data:
            record("pass", f"status={data['status']}")
    except Exception as exc:
        record("fail", "POST /listings/{id}/review-decision", str(exc))

    # Publish
    try:
        r = client.post(f"{API}/listings/{e2e_listing_id}/publish",
                        json={}, headers=ph(tenant_token))
        data = check(f"POST /listings/{e2e_listing_id}/publish → active", r, expected_status=200)
        if data and data.get("status") != "active":
            record("fail", "status=active after publish", f"got {data.get('status')}")
        elif data:
            record("pass", f"status={data['status']}")
    except Exception as exc:
        record("fail", "POST /listings/{id}/publish", str(exc))

    # Try review-decision again → expect 400
    try:
        r = client.post(f"{API}/listings/{e2e_listing_id}/review-decision", json={
            "decision": "approved",
            "note": f"{TAG} double-review attempt",
        }, headers=ph(tenant_token))
        if r.status_code == 400:
            record("pass", "POST /listings/{id}/review-decision on active → 400 (correct)")
        else:
            record("fail", "POST /listings/{id}/review-decision on active listing → 400",
                   f"got {r.status_code}")
    except Exception as exc:
        record("fail", "Double review-decision guard", str(exc))


# ---------------------------------------------------------------------------
# Section 10 — Price change + history
# ---------------------------------------------------------------------------
def s10_price() -> None:
    header("[10] Listing price change + history")
    if not tenant_token or not e2e_listing_id:
        skip("All price checks", "no tenant token or listing id")
        return

    base_price = e2e_listing_price or 1500000
    new_price = base_price + 100

    try:
        r = client.patch(f"{API}/listings/{e2e_listing_id}/price", json={
            "new_price": new_price,
            "reason_note": f"{TAG} price bump",
        }, headers=ph(tenant_token))
        data = check(f"PATCH /listings/{e2e_listing_id}/price → 200", r, expected_status=200)
        if data:
            got_price = float(data.get("price", 0))
            if abs(got_price - new_price) < 1:
                record("pass", f"price updated to {got_price}")
            else:
                record("fail", "price updated correctly", f"got {got_price}, expected {new_price}")
    except Exception as exc:
        record("fail", "PATCH /listings/{id}/price", str(exc))

    try:
        r = client.get(f"{API}/listings/{e2e_listing_id}/price-history",
                       headers=ph(tenant_token))
        data = check(f"GET /listings/{e2e_listing_id}/price-history → ≥1 entry", r,
                     expected_status=200)
        if data:
            items = data.get("items", [])
            if len(items) >= 1:
                record("pass", f"price-history has {len(items)} entries")
            else:
                record("fail", "price-history has at least 1 entry", f"got {len(items)}")
    except Exception as exc:
        record("fail", "GET /listings/{id}/price-history", str(exc))

    # Restore
    try:
        r = client.patch(f"{API}/listings/{e2e_listing_id}/price", json={
            "new_price": base_price,
            "reason_note": f"{TAG} restore",
        }, headers=ph(tenant_token))
        check(f"PATCH /listings/{e2e_listing_id}/price restore → 200", r, expected_status=200)
    except Exception as exc:
        record("fail", "PATCH /listings/{id}/price restore", str(exc))


# ---------------------------------------------------------------------------
# Section 11 — Audit log
# ---------------------------------------------------------------------------
def s11_audit() -> None:
    header("[11] Audit log")
    if not tenant_token or not e2e_listing_id:
        skip("Audit log check", "no tenant token or listing id")
        return

    try:
        r = client.get(
            f"{API}/audit-logs",
            params={"entity_type": "listing", "entity_id": e2e_listing_id, "limit": 20},
            headers=ph(tenant_token),
        )
        data = check(
            f"GET /audit-logs?entity_type=listing&entity_id={e2e_listing_id}&limit=20 → items",
            r, expected_status=200,
        )
        if data:
            items = data.get("items", [])
            if items:
                record("pass", f"audit-log returned {len(items)} entries for listing")
            else:
                record("fail", "audit-log has entries for e2e listing", "0 entries found")
    except Exception as exc:
        record("fail", "GET /audit-logs", str(exc))


# ---------------------------------------------------------------------------
# Section 12 — Email module
# ---------------------------------------------------------------------------
def s12_email() -> None:
    header("[12] Email module")

    if platform_token:
        try:
            r = client.get(f"{API}/admin/email-templates",
                           params={"scope": "platform"},
                           headers=ph(platform_token))
            data = check("GET /admin/email-templates?scope=platform → ≥24 items", r,
                         expected_status=200)
            if data:
                total = data.get("total", 0)
                if total >= 24:
                    record("pass", f"platform templates total={total}")
                else:
                    record("fail", "platform templates ≥24", f"got {total}")
        except Exception as exc:
            record("fail", "GET /admin/email-templates?scope=platform", str(exc))

        try:
            r = client.get(f"{API}/admin/email-outbox",
                           params={"limit": 5},
                           headers=ph(platform_token))
            data = check("GET /admin/email-outbox?limit=5 → 200", r, expected_status=200)
            if data is not None:
                record("pass", f"outbox total={data.get('total')}")
        except Exception as exc:
            record("fail", "GET /admin/email-outbox", str(exc))
    else:
        skip("GET /admin/email-templates?scope=platform", "no platform token")
        skip("GET /admin/email-outbox", "no platform token")

    if tenant_token:
        try:
            r = client.get(f"{API}/admin/email-templates",
                           params={"scope": "tenant"},
                           headers=ph(tenant_token))
            data = check("GET /admin/email-templates?scope=tenant (owner) → tenant copies", r,
                         expected_status=200)
            if data is not None:
                record("pass", f"tenant templates total={data.get('total')}")
        except Exception as exc:
            record("fail", "GET /admin/email-templates?scope=tenant", str(exc))
    else:
        skip("GET /admin/email-templates?scope=tenant", "no tenant token")


# ---------------------------------------------------------------------------
# Section 13 — Per-tenant media limits
# ---------------------------------------------------------------------------
def s13_media_limits() -> None:
    header("[13] Per-tenant media limits")
    if not platform_token or not marina_tenant_id:
        skip("Media limits checks", "no platform token or marina tenant id")
        return

    # Verify defaults in detail response
    try:
        r = client.get(f"{API}/tenants/{marina_tenant_id}", headers=ph(platform_token))
        data = check(f"GET /tenants/{marina_tenant_id} → media limit defaults", r,
                     expected_status=200)
        if data:
            t = data.get("tenant", data)  # handle nested or flat
            checks = {
                "max_images_per_property": 20,
                "max_videos_per_property": 2,
                "max_image_mb": 10,
                "max_video_mb": 25,
            }
            for k, floor in checks.items():
                val = t.get(k)
                if val is None or val < floor:
                    record("fail", f"{k} >= {floor}", f"got {val}")
                else:
                    record("pass", f"{k}={val} (>= floor {floor})")
    except Exception as exc:
        record("fail", f"GET /tenants/{marina_tenant_id} (media limits)", str(exc))

    # Set higher limits
    try:
        r = client.post(f"{API}/tenants/{marina_tenant_id}/media-limits", json={
            "max_images_per_property": 50,
            "max_videos_per_property": 5,
            "max_image_mb": 15,
            "max_video_mb": 50,
        }, headers=ph(platform_token))
        data = check("POST /tenants/{id}/media-limits {50,5,15,50} → 200", r, expected_status=200)
        if data:
            t = data.get("tenant", data)
            if t.get("max_images_per_property") == 50:
                record("pass", "media limits updated to custom values")
            else:
                record("fail", "media limits updated", f"max_images={t.get('max_images_per_property')}")
    except Exception as exc:
        record("fail", "POST /tenants/{id}/media-limits (set higher)", str(exc))

    # Below-floor → 422
    try:
        r = client.post(f"{API}/tenants/{marina_tenant_id}/media-limits", json={
            "max_images_per_property": 5,
            "max_videos_per_property": 2,
            "max_image_mb": 10,
            "max_video_mb": 25,
        }, headers=ph(platform_token))
        if r.status_code == 422:
            record("pass", "POST /tenants/{id}/media-limits below-floor → 422 (correct)")
        else:
            record("fail", "POST /tenants/{id}/media-limits below-floor → 422",
                   f"got {r.status_code}")
    except Exception as exc:
        record("fail", "POST /tenants/{id}/media-limits (below floor)", str(exc))

    # Restore to floors
    try:
        r = client.post(f"{API}/tenants/{marina_tenant_id}/media-limits", json={
            "max_images_per_property": 20,
            "max_videos_per_property": 2,
            "max_image_mb": 10,
            "max_video_mb": 25,
        }, headers=ph(platform_token))
        check("POST /tenants/{id}/media-limits restore to floors → 200", r, expected_status=200)
    except Exception as exc:
        record("fail", "POST /tenants/{id}/media-limits (restore)", str(exc))


# ---------------------------------------------------------------------------
# Section 14 — List Your Property (public lead)
# ---------------------------------------------------------------------------
def s14_public_lead() -> None:
    header("[14] List Your Property (public lead)")
    try:
        r = client.post(f"{API}/public/sites/{TENANT_SLUG}/leads", json={
            "name": f"{TAG} Test",
            "email": "e2e-lead@example.com",
            "phone": "+971501234567",
            "message": "Intent: sell\nProperty type: villa\nCity: Dubai",
        })
        data = check(f"POST /public/sites/{TENANT_SLUG}/leads → 201 with id", r,
                     expected_status=201)
        if data:
            if data.get("id"):
                record("pass", f"lead id={data['id']}")
            else:
                record("fail", "lead id present in response", str(data))
    except Exception as exc:
        record("fail", f"POST /public/sites/{TENANT_SLUG}/leads", str(exc))


# ---------------------------------------------------------------------------
# Section 15 — Marketing demo follow-up via outbox
# ---------------------------------------------------------------------------
def s15_marketing_outbox() -> None:
    header("[15] Marketing demo follow-up via outbox")
    if not platform_token:
        skip("Outbox marketing check", "no platform token")
        return

    try:
        r = client.get(f"{API}/admin/email-outbox",
                       params={"limit": 50},
                       headers=ph(platform_token))
        data = check("GET /admin/email-outbox → marketing_demo_request row", r,
                     expected_status=200)
        if data:
            items = data.get("items", [])
            found = any(
                item.get("template_key") == "marketing_demo_request"
                for item in items
            )
            if found:
                record("pass", "outbox contains marketing_demo_request row")
            else:
                record("fail", "outbox contains marketing_demo_request row",
                       f"not found in {len(items)} items (may need higher limit or different status)")
    except Exception as exc:
        record("fail", "GET /admin/email-outbox (marketing check)", str(exc))


# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------
def cleanup() -> None:
    if not tenant_token:
        return
    if e2e_listing_id:
        try:
            client.post(f"{API}/listings/{e2e_listing_id}/archive",
                        json={}, headers=ph(tenant_token))
        except Exception:
            pass
    if e2e_property_id:
        try:
            client.delete(f"{API}/properties/{e2e_property_id}",
                          headers=ph(tenant_token))
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> int:
    width = 47
    border = "═" * width
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n{BOLD}{border}{RESET}")
    print(f"{BOLD}  fh-staging E2E test run — {now}{RESET}")
    print(f"{BOLD}{border}{RESET}")

    t0 = time.monotonic()

    s1_health()
    s2_marketing()
    s3_platform_auth()
    s4_tenant_auth()
    s5_public_site()
    s6_suspended_tenant()
    s7_tenant_lifecycle()
    s8_property_media()
    s9_listing_review()
    s10_price()
    s11_audit()
    s12_email()
    s13_media_limits()
    s14_public_lead()
    s15_marketing_outbox()

    cleanup()

    elapsed = time.monotonic() - t0
    passed = sum(1 for s, _, _ in results if s == "pass")
    failed = sum(1 for s, _, _ in results if s == "fail")
    skipped = sum(1 for s, _, _ in results if s == "skip")
    total = len(results)

    print(f"\n{BOLD}{'─' * width}{RESET}")
    summary = (
        f"Summary: {GREEN}{passed} passed{RESET}, "
        f"{RED}{failed} failed{RESET}, "
        f"{YELLOW}{skipped} skipped{RESET} "
        f"({total} total) in {elapsed:.1f}s"
    )
    print(summary)
    print()

    return 1 if failed > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
