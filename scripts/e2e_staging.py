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
GREEN, RED, YELLOW, CYAN, BOLD, RESET = "\033[92m", "\033[91m", "\033[93m", "\033[96m", "\033[1m", "\033[0m"
PASS, FAIL, SKIP = f"{GREEN}✓{RESET}", f"{RED}✗{RESET}", f"{YELLOW}⚠{RESET}"

results: list[tuple[str, str, str | None]] = []
platform_token: str | None = None
tenant_token: str | None = None
marina_tenant_id: str | None = None
e2e_property_id: str | None = None
e2e_listing_id: str | None = None
e2e_listing_price: float | None = None
client = httpx.Client(timeout=30)


def header(s: str) -> None:
    print(f"\n{BOLD}{CYAN}{s}{RESET}")


def record(status: str, label: str, detail: str | None = None) -> None:
    results.append((status, label, detail))
    sym = PASS if status == "pass" else (FAIL if status == "fail" else SKIP)
    print(f"  {sym} {label}" + (f" — {detail}" if detail else ""))


def chk(label: str, resp: httpx.Response, *, code: int, fields: dict[str, Any] | None = None) -> dict | None:
    try:
        if resp.status_code != code:
            record("fail", label, f"HTTP {resp.status_code} (expected {code}) — {resp.text[:200]}")
            return None
        data = resp.json() if resp.content else {}
        if fields:
            for k, v in fields.items():
                got = data
                for p in k.split("."):
                    got = got.get(p) if isinstance(got, dict) else None
                if v is not None and got != v:
                    record("fail", label, f"field '{k}'={got!r}, expected {v!r}")
                    return None
                if v is None and got is None:
                    record("fail", label, f"field '{k}' is missing/None")
                    return None
        record("pass", label)
        return data
    except Exception as exc:
        record("fail", label, str(exc))
        return None


def ph(t: str) -> dict:
    return {"Authorization": f"Bearer {t}"}


def skip(label: str, reason: str) -> None:
    record("skip", label, reason)


# ---------------------------------------------------------------------------
# Sections 1–4: Health, Marketing, Auth
# ---------------------------------------------------------------------------
def s1_health() -> None:
    header("[1] Health")
    try:
        chk("GET /health → 200 {status: healthy}", client.get(f"{API}/health"),
            code=200, fields={"status": "healthy"})
    except Exception as e:
        record("fail", "GET /health", str(e))


def s2_marketing() -> None:
    header("[2] Marketing inbound")
    try:
        chk("POST /marketing/demo-request → 202", client.post(f"{API}/marketing/demo-request", json={
            "full_name": f"{TAG} Tester", "company_name": "E2E Realty",
            "email": "e2e-test@example.com", "phone": "+971501234567",
            "country": "UAE", "team_size": "1-10", "message": "Automated E2E — ignore",
        }), code=202, fields={"status": "received"})
    except Exception as e:
        record("fail", "POST /marketing/demo-request", str(e))
    try:
        chk("POST /marketing/waitlist → 202", client.post(f"{API}/marketing/waitlist",
            json={"email": "e2e-waitlist@example.com"}),
            code=202, fields={"status": "received"})
    except Exception as e:
        record("fail", "POST /marketing/waitlist", str(e))


def s3_platform_auth() -> None:
    global platform_token
    header("[3] Platform auth")
    try:
        d = chk("POST /auth/platform-login → token",
                client.post(f"{API}/auth/platform-login", json={"email": PLATFORM_EMAIL, "password": PLATFORM_PASSWORD}),
                code=200)
        if d:
            platform_token = d.get("access_token")
            record("pass" if platform_token else "fail", "Platform access_token received")
    except Exception as e:
        record("fail", "POST /auth/platform-login", str(e))

    if not platform_token:
        return skip("GET /auth/platform/me", "no platform token")
    try:
        d = chk("GET /auth/platform/me → platform user",
                client.get(f"{API}/auth/platform/me", headers=ph(platform_token)), code=200)
        if d:
            ok = d.get("is_platform") is True
            record("pass" if ok else "fail", "is_platform=true confirmed", None if ok else str(d.get("is_platform")))
    except Exception as e:
        record("fail", "GET /auth/platform/me", str(e))


def s4_tenant_auth() -> None:
    global tenant_token
    header("[4] Tenant auth")
    try:
        d = chk("POST /auth/login (owner@marinarealty.ae) → tokens",
                client.post(f"{API}/auth/login", json={"email": TENANT_EMAIL, "password": TENANT_PASSWORD}),
                code=200)
        if d:
            tenant_token = d.get("access_token")
            record("pass" if tenant_token else "fail", "Tenant access_token received")
    except Exception as e:
        record("fail", "POST /auth/login", str(e))

    if not tenant_token:
        return skip("GET /auth/me", "no tenant token")
    try:
        d = chk("GET /auth/me → owner identity",
                client.get(f"{API}/auth/me", headers=ph(tenant_token)), code=200)
        if d:
            record("pass" if d.get("email") == TENANT_EMAIL else "fail",
                   f"/auth/me email={d.get('email')}")
    except Exception as e:
        record("fail", "GET /auth/me", str(e))


# ---------------------------------------------------------------------------
# Section 5: Public site
# ---------------------------------------------------------------------------
def s5_public_site() -> None:
    header("[5] Public site")
    listing_id: str | None = None
    try:
        d = chk(f"GET /public/sites/{TENANT_SLUG} → name + operating_countries",
                client.get(f"{API}/public/sites/{TENANT_SLUG}"), code=200)
        if d:
            ok = bool(d.get("name")) and bool(d.get("operating_countries"))
            record("pass" if ok else "fail",
                   f"name={d.get('name')!r} countries={d.get('operating_countries')}")
    except Exception as e:
        record("fail", f"GET /public/sites/{TENANT_SLUG}", str(e))

    try:
        d = chk(f"GET /public/sites/{TENANT_SLUG}/listings → items",
                client.get(f"{API}/public/sites/{TENANT_SLUG}/listings"), code=200)
        if d:
            items = d.get("items", [])
            record("pass", f"listings returned {len(items)} items")
            if items:
                listing_id = str(items[0]["id"])
    except Exception as e:
        record("fail", f"GET /public/sites/{TENANT_SLUG}/listings", str(e))

    if listing_id:
        try:
            d = chk(f"GET /public/sites/{TENANT_SLUG}/listings/{{id}} → status field",
                    client.get(f"{API}/public/sites/{TENANT_SLUG}/listings/{listing_id}"), code=200)
            if d:
                record("pass" if "status" in d else "fail",
                       f"listing detail status={d.get('status')!r}")
        except Exception as e:
            record("fail", f"GET /public/sites/{TENANT_SLUG}/listings/{{id}}", str(e))
    else:
        skip(f"GET /public/sites/{TENANT_SLUG}/listings/{{id}}", "no listings")

    try:
        d = chk(f"GET /public/sites/{TENANT_SLUG}/agents → 200",
                client.get(f"{API}/public/sites/{TENANT_SLUG}/agents"), code=200)
        if d is not None:
            record("pass", f"agents endpoint returned {len(d.get('items', []))} items")
    except Exception as e:
        record("fail", f"GET /public/sites/{TENANT_SLUG}/agents", str(e))


# ---------------------------------------------------------------------------
# Section 6: Suspended tenant
# ---------------------------------------------------------------------------
def s6_suspended_tenant() -> None:
    header("[6] Public site for suspended tenant")
    if not platform_token:
        return skip("Suspended tenant test", "no platform token")
    other_slug: str | None = None
    other_id: str | None = None
    try:
        r = client.get(f"{API}/tenants", headers=ph(platform_token))
        for t in (r.json().get("items", []) if r.status_code == 200 else []):
            if t.get("slug") != TENANT_SLUG and t.get("status") == "active" and t.get("public_site_enabled"):
                other_slug, other_id = t["slug"], t["id"]
                break
    except Exception as e:
        return skip("Suspended tenant test", str(e))
    if not other_slug:
        return skip("Suspended tenant test", "no second active public-site tenant")

    suspended = False
    try:
        r = client.post(f"{API}/tenants/{other_id}/suspend",
                        json={"reason_note": f"{TAG} E2E suspend test"}, headers=ph(platform_token))
        if r.status_code == 200:
            suspended = True
            record("pass", f"POST /tenants/{other_id}/suspend → 200 status=suspended")
        else:
            record("fail", "POST /tenants/{id}/suspend", f"HTTP {r.status_code} {r.text[:200]}")
    except Exception as e:
        record("fail", "POST /tenants/{id}/suspend", str(e))

    if suspended:
        try:
            r = client.get(f"{API}/public/sites/{other_slug}")
            if r.status_code == 410:
                detail = r.json().get("detail", {})
                ok = detail == "site_offline" or (isinstance(detail, dict) and detail.get("detail") == "site_offline")
                record("pass" if ok else "fail",
                       f"GET /public/sites/{other_slug} → 410 site_offline",
                       None if ok else str(detail)[:100])
            else:
                record("fail", f"GET /public/sites/{other_slug} suspended → 410", f"got {r.status_code}")
        except Exception as e:
            record("fail", f"GET /public/sites/{other_slug}", str(e))
        try:
            r = client.post(f"{API}/tenants/{other_id}/reactivate",
                            json={"reason_note": f"{TAG} E2E restore"}, headers=ph(platform_token))
            record("pass" if r.status_code == 200 else "fail",
                   f"POST /tenants/{other_id}/reactivate → restored",
                   None if r.status_code == 200 else f"HTTP {r.status_code}")
        except Exception as e:
            record("fail", "Reactivate other tenant", str(e))


# ---------------------------------------------------------------------------
# Section 7: Tenant lifecycle
# ---------------------------------------------------------------------------
def s7_tenant_lifecycle() -> None:
    global marina_tenant_id
    header("[7] Tenant lifecycle (platform admin)")
    if not platform_token:
        return skip("All lifecycle checks", "no platform token")

    try:
        d = chk("GET /tenants → array", client.get(f"{API}/tenants", headers=ph(platform_token)), code=200)
        if d:
            record("pass", f"total={d.get('total')} tenants")
            for t in d.get("items", []):
                if t.get("slug") == TENANT_SLUG:
                    marina_tenant_id = t["id"]
    except Exception as e:
        record("fail", "GET /tenants", str(e))

    if not marina_tenant_id:
        return skip("Remaining lifecycle checks", "marina-realty not found")

    try:
        d = chk("GET /tenants/{id} → TenantDetailResponse",
                client.get(f"{API}/tenants/{marina_tenant_id}", headers=ph(platform_token)), code=200)
        if d:
            ok = "counts" in d and "recent_activity" in d
            record("pass" if ok else "fail",
                   f"counts+recent_activity present",
                   None if ok else f"counts={'counts' in d} activity={'recent_activity' in d}")
    except Exception as e:
        record("fail", "GET /tenants/{id}", str(e))

    try:
        r = client.post(f"{API}/tenants/{marina_tenant_id}/suspend",
                        json={"reason_note": f"{TAG} test suspend"}, headers=ph(platform_token))
        d = chk("POST /tenants/{id}/suspend → status=suspended", r, code=200)
        if d:
            sv = d.get("status") or d.get("tenant", {}).get("status")
            record("pass" if sv == "suspended" else "fail", "status=suspended confirmed",
                   None if sv == "suspended" else sv)
    except Exception as e:
        record("fail", "POST /tenants/{id}/suspend", str(e))

    try:
        r = client.get(f"{API}/public/sites/{TENANT_SLUG}")
        record("pass" if r.status_code == 410 else "fail",
               f"GET /public/sites/{TENANT_SLUG} → 410 (suspended)",
               None if r.status_code == 410 else f"got {r.status_code}")
    except Exception as e:
        record("fail", f"GET /public/sites/{TENANT_SLUG} after suspend", str(e))

    try:
        r = client.post(f"{API}/tenants/{marina_tenant_id}/reactivate",
                        json={"reason_note": f"{TAG} test restore"}, headers=ph(platform_token))
        d = chk("POST /tenants/{id}/reactivate → status=active", r, code=200)
        if d:
            sv = d.get("status") or d.get("tenant", {}).get("status")
            record("pass" if sv == "active" else "fail", "status=active after reactivate",
                   None if sv == "active" else sv)
    except Exception as e:
        record("fail", "POST /tenants/{id}/reactivate", str(e))

    try:
        r = client.get(f"{API}/public/sites/{TENANT_SLUG}")
        record("pass" if r.status_code == 200 else "fail",
               f"GET /public/sites/{TENANT_SLUG} → 200 after reactivate",
               None if r.status_code == 200 else f"got {r.status_code}")
    except Exception as e:
        record("fail", f"GET /public/sites/{TENANT_SLUG} after reactivate", str(e))


# ---------------------------------------------------------------------------
# Section 8: Property + media
# ---------------------------------------------------------------------------
def s8_property_media() -> None:
    header("[8] Property + media flow")
    if not tenant_token:
        return skip("All property/media checks", "no tenant token")
    prop_id: str | None = None
    try:
        d = chk("GET /properties → items", client.get(f"{API}/properties", headers=ph(tenant_token)), code=200)
        if d:
            items = d.get("items", [])
            record("pass", f"returned {len(items)} properties")
            # Pick property with most media for reorder test
            best = max(items, key=lambda i: i.get("media_count", 0), default=None)
            if best:
                prop_id = str(best["id"])
                thumb = best.get("thumbnail_url")
                if thumb and "//images.unsplash.com//images.unsplash.com" in thumb:
                    record("fail", "thumbnail_url not double-prefixed", thumb[:120])
                elif thumb:
                    record("pass", f"thumbnail_url looks clean: {thumb[:80]}")
                else:
                    record("pass", "thumbnail_url is null (no media yet)")
    except Exception as e:
        record("fail", "GET /properties", str(e))

    if not prop_id:
        return skip("Media list + reorder checks", "no property found")

    media_ids: list[str] = []
    try:
        d = chk(f"GET /properties/{prop_id}/media → list",
                client.get(f"{API}/properties/{prop_id}/media", headers=ph(tenant_token)), code=200)
        if d:
            media_ids = [str(m["id"]) for m in d.get("items", [])]
            record("pass", f"media list returned {len(media_ids)} items")
    except Exception as e:
        record("fail", f"GET /properties/{prop_id}/media", str(e))

    if len(media_ids) >= 2:
        for label, ids in [("reorder", list(reversed(media_ids))), ("restore", media_ids)]:
            try:
                chk(f"POST /properties/{{id}}/media/{label} → 200",
                    client.post(f"{API}/properties/{prop_id}/media/reorder",
                                json={"ordered_ids": ids}, headers=ph(tenant_token)), code=200)
            except Exception as e:
                record("fail", f"Media {label}", str(e))
    else:
        skip("Media reorder", f"need ≥2 media items, found {len(media_ids)}")


# ---------------------------------------------------------------------------
# Section 9: Listing review workflow
# ---------------------------------------------------------------------------
def s9_listing_review() -> None:
    global e2e_property_id, e2e_listing_id, e2e_listing_price
    header("[9] Listing review workflow")
    if not tenant_token:
        return skip("All review workflow checks", "no tenant token")

    try:
        d = chk(f"POST /properties '{TAG} Property' → 201",
                client.post(f"{API}/properties", json={
                    "title": f"{TAG} Property", "property_type": "apartment",
                    "price": 1500000, "currency": "AED", "city": "Dubai", "country": "AE",
                    "bedrooms": 2, "bathrooms": 2,
                }, headers=ph(tenant_token)), code=201)
        if d:
            e2e_property_id = str(d["id"])
            record("pass", f"Property created id={e2e_property_id}")
    except Exception as e:
        record("fail", "POST /properties (E2E)", str(e))

    if not e2e_property_id:
        return skip("Listing creation + review workflow", "property creation failed")

    try:
        d = chk(f"POST /properties/{e2e_property_id}/listings → 201",
                client.post(f"{API}/properties/{e2e_property_id}/listings", json={
                    "title": f"{TAG} Listing", "purpose": "sale",
                    "price": 1500000, "currency": "AED", "status": "draft",
                }, headers=ph(tenant_token)), code=201)
        if d:
            e2e_listing_id = str(d["id"])
            e2e_listing_price = float(d.get("price", 1500000))
            record("pass", f"Listing created id={e2e_listing_id}")
    except Exception as e:
        record("fail", "POST /properties/{id}/listings (E2E)", str(e))

    if not e2e_listing_id:
        return skip("Review workflow", "listing creation failed")

    reviewers: list[dict] = []
    try:
        d = chk("GET /users/eligible-reviewers → list",
                client.get(f"{API}/users/eligible-reviewers", headers=ph(tenant_token)), code=200)
        if d:
            reviewers = d.get("items", [])
            record("pass", f"eligible reviewers: {len(reviewers)}")
    except Exception as e:
        record("fail", "GET /users/eligible-reviewers", str(e))

    if not reviewers:
        return skip("Submit-for-review → approve → publish", "0 eligible reviewers")

    reviewer_id = str(reviewers[0]["id"])
    try:
        d = chk(f"POST /listings/{e2e_listing_id}/submit-for-review → pending_review",
                client.post(f"{API}/listings/{e2e_listing_id}/submit-for-review",
                            json={"reviewer_id": reviewer_id, "note": TAG}, headers=ph(tenant_token)), code=200)
        if d and d.get("status") != "pending_review":
            record("fail", "status=pending_review after submit", d.get("status"))
        elif d:
            record("pass", f"status={d['status']}")
    except Exception as e:
        record("fail", "POST /listings/{id}/submit-for-review", str(e))

    try:
        d = chk(f"POST /listings/{e2e_listing_id}/review-decision approved",
                client.post(f"{API}/listings/{e2e_listing_id}/review-decision",
                            json={"decision": "approved", "note": TAG}, headers=ph(tenant_token)), code=200)
        if d and d.get("status") != "approved":
            record("fail", "status=approved after decision", d.get("status"))
        elif d:
            record("pass", f"status={d['status']}")
    except Exception as e:
        record("fail", "POST /listings/{id}/review-decision", str(e))

    try:
        d = chk(f"POST /listings/{e2e_listing_id}/publish → active",
                client.post(f"{API}/listings/{e2e_listing_id}/publish",
                            json={}, headers=ph(tenant_token)), code=200)
        if d and d.get("status") != "active":
            record("fail", "status=active after publish", d.get("status"))
        elif d:
            record("pass", f"status={d['status']}")
    except Exception as e:
        record("fail", "POST /listings/{id}/publish", str(e))

    try:
        r = client.post(f"{API}/listings/{e2e_listing_id}/review-decision",
                        json={"decision": "approved", "note": "double-review"}, headers=ph(tenant_token))
        record("pass" if r.status_code == 400 else "fail",
               "POST /listings/{id}/review-decision on active → 400 (correct)",
               None if r.status_code == 400 else f"got {r.status_code}")
    except Exception as e:
        record("fail", "Double review-decision guard", str(e))


# ---------------------------------------------------------------------------
# Section 10: Price change + history
# ---------------------------------------------------------------------------
def s10_price() -> None:
    header("[10] Listing price change + history")
    if not tenant_token or not e2e_listing_id:
        return skip("All price checks", "no tenant token or listing id")

    base = e2e_listing_price or 1500000
    new_p = base + 100
    try:
        d = chk(f"PATCH /listings/{e2e_listing_id}/price → 200",
                client.patch(f"{API}/listings/{e2e_listing_id}/price",
                             json={"new_price": new_p, "reason_note": f"{TAG} price bump"},
                             headers=ph(tenant_token)), code=200)
        if d:
            got = float(d.get("price", 0))
            record("pass" if abs(got - new_p) < 1 else "fail", f"price updated to {got}",
                   None if abs(got - new_p) < 1 else f"expected {new_p}")
    except Exception as e:
        record("fail", "PATCH /listings/{id}/price", str(e))

    try:
        d = chk(f"GET /listings/{e2e_listing_id}/price-history → ≥1 entry",
                client.get(f"{API}/listings/{e2e_listing_id}/price-history", headers=ph(tenant_token)), code=200)
        if d:
            n = len(d.get("items", []))
            record("pass" if n >= 1 else "fail", f"price-history has {n} entries")
    except Exception as e:
        record("fail", "GET /listings/{id}/price-history", str(e))

    try:
        chk(f"PATCH /listings/{e2e_listing_id}/price restore → 200",
            client.patch(f"{API}/listings/{e2e_listing_id}/price",
                         json={"new_price": base, "reason_note": f"{TAG} restore"},
                         headers=ph(tenant_token)), code=200)
    except Exception as e:
        record("fail", "PATCH /listings/{id}/price restore", str(e))


# ---------------------------------------------------------------------------
# Section 11: Audit log
# ---------------------------------------------------------------------------
def s11_audit() -> None:
    header("[11] Audit log")
    if not tenant_token or not e2e_listing_id:
        return skip("Audit log check", "no tenant token or listing id")
    try:
        d = chk(f"GET /audit-logs?entity_type=listing&entity_id={e2e_listing_id}&limit=20 → items",
                client.get(f"{API}/audit-logs",
                           params={"entity_type": "listing", "entity_id": e2e_listing_id, "limit": 20},
                           headers=ph(tenant_token)), code=200)
        if d:
            n = len(d.get("items", []))
            record("pass" if n > 0 else "fail", f"audit-log returned {n} entries for listing")
    except Exception as e:
        record("fail", "GET /audit-logs", str(e))


# ---------------------------------------------------------------------------
# Section 12: Email module
# ---------------------------------------------------------------------------
def s12_email() -> None:
    header("[12] Email module")
    if platform_token:
        try:
            d = chk("GET /admin/email-templates?scope=platform → ≥24 items",
                    client.get(f"{API}/admin/email-templates", params={"scope": "platform"},
                               headers=ph(platform_token)), code=200)
            if d:
                t = d.get("total", 0)
                record("pass" if t >= 24 else "fail", f"platform templates total={t}")
        except Exception as e:
            record("fail", "GET /admin/email-templates?scope=platform", str(e))
        try:
            d = chk("GET /admin/email-outbox?limit=5 → 200",
                    client.get(f"{API}/admin/email-outbox", params={"limit": 5},
                               headers=ph(platform_token)), code=200)
            if d is not None:
                record("pass", f"outbox total={d.get('total')}")
        except Exception as e:
            record("fail", "GET /admin/email-outbox", str(e))
    else:
        skip("Email templates + outbox (platform)", "no platform token")

    if tenant_token:
        try:
            d = chk("GET /admin/email-templates?scope=tenant (owner) → tenant copies",
                    client.get(f"{API}/admin/email-templates", params={"scope": "tenant"},
                               headers=ph(tenant_token)), code=200)
            if d is not None:
                record("pass", f"tenant templates total={d.get('total')}")
        except Exception as e:
            record("fail", "GET /admin/email-templates?scope=tenant", str(e))
    else:
        skip("GET /admin/email-templates?scope=tenant", "no tenant token")


# ---------------------------------------------------------------------------
# Section 13: Per-tenant media limits
# ---------------------------------------------------------------------------
def s13_media_limits() -> None:
    header("[13] Per-tenant media limits")
    if not platform_token or not marina_tenant_id:
        return skip("Media limits checks", "no platform token or marina tenant id")

    try:
        d = chk(f"GET /tenants/{marina_tenant_id} → media limit defaults",
                client.get(f"{API}/tenants/{marina_tenant_id}", headers=ph(platform_token)), code=200)
        if d:
            t = d.get("tenant", d)
            for k, floor in {"max_images_per_property": 20, "max_videos_per_property": 2,
                             "max_image_mb": 10, "max_video_mb": 25}.items():
                v = t.get(k)
                record("pass" if v is not None and v >= floor else "fail",
                       f"{k}={v} (>= floor {floor})", None if v and v >= floor else f"got {v}")
    except Exception as e:
        record("fail", f"GET /tenants/{marina_tenant_id} (media limits)", str(e))

    try:
        d = chk("POST /tenants/{id}/media-limits {50,5,15,50} → 200",
                client.post(f"{API}/tenants/{marina_tenant_id}/media-limits",
                            json={"max_images_per_property": 50, "max_videos_per_property": 5,
                                  "max_image_mb": 15, "max_video_mb": 50},
                            headers=ph(platform_token)), code=200)
        if d:
            t = d.get("tenant", d)
            record("pass" if t.get("max_images_per_property") == 50 else "fail",
                   "media limits updated to custom values",
                   None if t.get("max_images_per_property") == 50 else str(t.get("max_images_per_property")))
    except Exception as e:
        record("fail", "POST /tenants/{id}/media-limits (set higher)", str(e))

    try:
        r = client.post(f"{API}/tenants/{marina_tenant_id}/media-limits",
                        json={"max_images_per_property": 5, "max_videos_per_property": 2,
                              "max_image_mb": 10, "max_video_mb": 25},
                        headers=ph(platform_token))
        record("pass" if r.status_code == 422 else "fail",
               "POST /tenants/{id}/media-limits below-floor → 422 (correct)",
               None if r.status_code == 422 else f"got {r.status_code}")
    except Exception as e:
        record("fail", "POST /tenants/{id}/media-limits (below floor)", str(e))

    try:
        chk("POST /tenants/{id}/media-limits restore to floors → 200",
            client.post(f"{API}/tenants/{marina_tenant_id}/media-limits",
                        json={"max_images_per_property": 20, "max_videos_per_property": 2,
                              "max_image_mb": 10, "max_video_mb": 25},
                        headers=ph(platform_token)), code=200)
    except Exception as e:
        record("fail", "POST /tenants/{id}/media-limits (restore)", str(e))


# ---------------------------------------------------------------------------
# Sections 14–15: Public lead + outbox follow-up
# ---------------------------------------------------------------------------
def s14_public_lead() -> None:
    header("[14] List Your Property (public lead)")
    try:
        d = chk(f"POST /public/sites/{TENANT_SLUG}/leads → 201 with id",
                client.post(f"{API}/public/sites/{TENANT_SLUG}/leads", json={
                    "name": f"{TAG} Test", "email": "e2e-lead@example.com",
                    "phone": "+971501234567",
                    "message": "Intent: sell\nProperty type: villa\nCity: Dubai",
                }), code=201)
        if d:
            record("pass" if d.get("id") else "fail", f"lead id={d.get('id')}")
    except Exception as e:
        record("fail", f"POST /public/sites/{TENANT_SLUG}/leads", str(e))


def s15_marketing_outbox() -> None:
    header("[15] Marketing demo follow-up via outbox")
    if not platform_token:
        return skip("Outbox marketing check", "no platform token")
    try:
        d = chk("GET /admin/email-outbox → marketing_demo_request row",
                client.get(f"{API}/admin/email-outbox", params={"limit": 50},
                           headers=ph(platform_token)), code=200)
        if d:
            found = any(i.get("template_key") == "marketing_demo_request" for i in d.get("items", []))
            record("pass" if found else "fail",
                   "outbox contains marketing_demo_request row",
                   None if found else f"not in {len(d.get('items', []))} items")
    except Exception as e:
        record("fail", "GET /admin/email-outbox (marketing check)", str(e))


# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------
def cleanup() -> None:
    if not tenant_token:
        return
    for lid in [e2e_listing_id]:
        if lid:
            try:
                client.post(f"{API}/listings/{lid}/archive", json={}, headers=ph(tenant_token))
            except Exception:
                pass
    for pid in [e2e_property_id]:
        if pid:
            try:
                client.delete(f"{API}/properties/{pid}", headers=ph(tenant_token))
            except Exception:
                pass


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> int:
    w = 47
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n{BOLD}{'═' * w}{RESET}")
    print(f"{BOLD}  fh-staging E2E test run — {now}{RESET}")
    print(f"{BOLD}{'═' * w}{RESET}")
    t0 = time.monotonic()
    for fn in [s1_health, s2_marketing, s3_platform_auth, s4_tenant_auth,
               s5_public_site, s6_suspended_tenant, s7_tenant_lifecycle,
               s8_property_media, s9_listing_review, s10_price, s11_audit,
               s12_email, s13_media_limits, s14_public_lead, s15_marketing_outbox]:
        fn()
    cleanup()
    elapsed = time.monotonic() - t0
    passed = sum(1 for s, *_ in results if s == "pass")
    failed = sum(1 for s, *_ in results if s == "fail")
    skipped = sum(1 for s, *_ in results if s == "skip")
    print(f"\n{BOLD}{'─' * w}{RESET}")
    print(f"Summary: {GREEN}{passed} passed{RESET}, {RED}{failed} failed{RESET}, "
          f"{YELLOW}{skipped} skipped{RESET} ({len(results)} total) in {elapsed:.1f}s")
    print()
    return 1 if failed > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
