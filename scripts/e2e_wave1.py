#!/usr/bin/env python3
"""E2E checks for Wave 1: property reference numbers, listing verification,
UAE rental fields (cheques), Trakheesi, similar-listings, display metrics.

Usage:
    /Users/mna036/mna-bytes/fh/.venv/bin/python scripts/e2e_wave1.py
"""

from __future__ import annotations

import re
import sys

import httpx

API = "https://fh-staging-api.up.railway.app"
TENANT_EMAIL = "devmna036+marinarealty@gmail.com"
TENANT_PASSWORD = "Miange@036"
TENANT_SLUG = "marina-realty"
EXPECTED_PREFIX = "MAR"

GREEN, RED, CYAN, BOLD, RESET = "\033[92m", "\033[91m", "\033[96m", "\033[1m", "\033[0m"
PASS, FAIL = f"{GREEN}✓{RESET}", f"{RED}✗{RESET}"

results: list[tuple[str, str]] = []
client = httpx.Client(timeout=60)
tenant_token: str | None = None


def section(s: str) -> None:
    print(f"\n{BOLD}{CYAN}{s}{RESET}")


def record(status: str, label: str, detail: str | None = None) -> None:
    results.append((status, label))
    sym = PASS if status == "pass" else FAIL
    suffix = f" — {detail}" if detail else ""
    print(f"  {sym} {label}{suffix}")


def headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {tenant_token}"}


def auth() -> None:
    global tenant_token
    section("[A] Tenant auth")
    r = client.post(f"{API}/auth/login",
                    json={"email": TENANT_EMAIL, "password": TENANT_PASSWORD})
    if r.status_code != 200:
        record("fail", "login", f"HTTP {r.status_code}")
        return
    tenant_token = r.json().get("access_token")
    record("pass" if tenant_token else "fail", "tenant token received")


def t_tenant_prefix() -> None:
    section("[B] Tenant property_ref_prefix")
    if not tenant_token:
        return
    r = client.get(f"{API}/tenants/me", headers=headers())
    if r.status_code != 200:
        record("fail", "GET /tenants/me", f"HTTP {r.status_code}")
        return
    body = r.json()
    prefix = body.get("property_ref_prefix") or body.get("tenant", {}).get("property_ref_prefix")
    record(
        "pass" if prefix == EXPECTED_PREFIX else "fail",
        f"property_ref_prefix is {EXPECTED_PREFIX!r}",
        None if prefix == EXPECTED_PREFIX else f"got {prefix!r}",
    )


def t_auto_reference() -> tuple[str | None, str | None]:
    """Create a property and a listing, return (property_id, listing_id)."""
    section("[C] Auto-generated property reference number")
    if not tenant_token:
        return None, None
    body = {
        "title": "[E2E WAVE1] Test apartment for ref-gen",
        "property_type": "apartment",
        "price": 1_500_000,
        "currency": "AED",
        "city": "Dubai",
        "country": "AE",
        "bedrooms": 2,
        "bathrooms": 2,
        "size_sqft": 1200,
        "latitude": 25.20,
        "longitude": 55.27,
        "build_year": 2020,
    }
    r = client.post(f"{API}/properties", json=body, headers=headers())
    if r.status_code != 201:
        record("fail", "POST /properties", f"HTTP {r.status_code} {r.text[:200]}")
        return None, None
    data = r.json()
    pid = data["id"]
    ref = data.get("internal_reference") or ""
    pattern = re.compile(r"^MAR-AP-[A-Z0-9]{4,10}$")
    record(
        "pass" if pattern.match(ref) else "fail",
        f"internal_reference auto-set to MAR-AP-XXXXXX",
        None if pattern.match(ref) else f"got {ref!r}",
    )
    record("pass" if data.get("latitude") else "fail",
           f"latitude round-tripped: {data.get('latitude')}")
    record("pass" if data.get("build_year") == 2020 else "fail",
           f"build_year round-tripped: {data.get('build_year')}")

    # Create a draft listing
    body_l = {"title": body["title"], "purpose": "sale",
              "price": 1_500_000, "currency": "AED", "status": "draft"}
    r = client.post(f"{API}/properties/{pid}/listings", json=body_l, headers=headers())
    if r.status_code != 201:
        record("fail", "POST /properties/{id}/listings", f"HTTP {r.status_code} {r.text[:200]}")
        return pid, None
    lid = r.json()["id"]
    record("pass", f"listing created id={lid[:8]}")
    return pid, lid


def t_listing_detail_metrics(lid: str | None) -> None:
    section("[D] Listing detail computed metrics")
    if not (tenant_token and lid):
        return
    r = client.get(f"{API}/listings/{lid}", headers=headers())
    if r.status_code != 200:
        record("fail", "GET /listings/{id}", f"HTTP {r.status_code}")
        return
    body = r.json()
    pps = body.get("price_per_sqft")
    record("pass" if pps and pps > 0 else "fail",
           f"price_per_sqft computed: {pps}")
    has_days = "days_since_posted" in body
    record("pass" if has_days else "fail",
           f"days_since_posted present: {body.get('days_since_posted')}")
    iv = body.get("is_verified")
    record("pass" if iv is False else "fail",
           f"is_verified defaults to false (got {iv})")
    has_ref = bool(body.get("internal_reference"))
    record("pass" if has_ref else "fail",
           f"internal_reference returned on listing: {body.get('internal_reference')}")


def t_listing_verify_unverify(lid: str | None) -> None:
    section("[E] Verify / unverify listing")
    if not (tenant_token and lid):
        return
    r = client.post(f"{API}/listings/{lid}/verify",
                    json={"note": "E2E verify"}, headers=headers())
    if r.status_code != 200:
        record("fail", "POST /listings/{id}/verify", f"HTTP {r.status_code} {r.text[:200]}")
        return
    body = r.json()
    record("pass" if body.get("is_verified") is True else "fail",
           "verify sets is_verified=true",
           None if body.get("is_verified") else str(body.get("is_verified")))
    record("pass" if body.get("verified_at") else "fail",
           f"verified_at set: {body.get('verified_at')}")

    # Double-verify should be rejected (400 bad_request)
    r = client.post(f"{API}/listings/{lid}/verify",
                    json={"note": "E2E re-verify"}, headers=headers())
    record("pass" if r.status_code in (400, 422) else "fail",
           "double-verify rejected (400/422)",
           None if r.status_code in (400, 422) else f"got {r.status_code}")

    # Unverify
    r = client.post(f"{API}/listings/{lid}/unverify",
                    json={"note": "E2E unverify"}, headers=headers())
    record("pass" if r.status_code == 200 else "fail",
           "POST /listings/{id}/unverify → 200",
           None if r.status_code == 200 else f"got {r.status_code}")
    if r.status_code == 200:
        record("pass" if r.json().get("is_verified") is False else "fail",
               "unverify clears is_verified=false")


def t_rent_cheques() -> str | None:
    section("[F] rent_cheque_count on rent_long listing")
    if not tenant_token:
        return None
    body = {
        "title": "[E2E WAVE1] Rent test",
        "property_type": "apartment",
        "price": 900_000, "currency": "AED",
        "city": "Dubai", "country": "AE",
        "bedrooms": 1, "bathrooms": 1, "size_sqft": 700,
    }
    r = client.post(f"{API}/properties", json=body, headers=headers())
    if r.status_code != 201:
        record("fail", "POST /properties (rent)", f"HTTP {r.status_code}")
        return None
    pid = r.json()["id"]
    body_l = {"title": body["title"], "purpose": "rent_long",
              "price": 80_000, "currency": "AED", "status": "draft",
              "rent_period": "yearly", "rent_cheque_count": 4}
    r = client.post(f"{API}/properties/{pid}/listings", json=body_l, headers=headers())
    if r.status_code != 201:
        record("fail", "POST listing with rent_cheque_count", f"HTTP {r.status_code} {r.text[:200]}")
        return pid
    lid = r.json()["id"]
    record("pass" if r.json().get("rent_cheque_count") == 4 else "fail",
           "rent_cheque_count=4 round-tripped")

    # Filter
    r = client.get(f"{API}/listings",
                   params={"rent_cheque_count": 4, "limit": 20}, headers=headers())
    items = r.json().get("items", [])
    bad = [i for i in items if i.get("rent_cheque_count") != 4]
    record("pass" if r.status_code == 200 and not bad else "fail",
           f"?rent_cheque_count=4 returned {len(items)}",
           None if not bad else f"{len(bad)} mismatches")
    return pid


def t_filter_verified() -> None:
    section("[G] Filter listings by is_verified")
    if not tenant_token:
        return
    r = client.get(f"{API}/listings",
                   params={"is_verified": "true", "limit": 50}, headers=headers())
    if r.status_code != 200:
        record("fail", "?is_verified=true", f"HTTP {r.status_code}")
        return
    items = r.json().get("items", [])
    bad = [i for i in items if i.get("is_verified") is not True]
    record("pass" if not bad else "fail",
           f"verified-only filter returned {len(items)}",
           None if not bad else f"{len(bad)} mismatches")


def t_similar_listings() -> None:
    section("[H] Public similar-listings endpoint")
    # Find an active public listing
    r = client.get(f"{API}/public/sites/{TENANT_SLUG}/listings", params={"page_size": 5})
    if r.status_code != 200 or not r.json().get("items"):
        record("fail", "no active public listings to test against",
               f"HTTP {r.status_code}")
        return
    lid = r.json()["items"][0]["id"]
    r = client.get(f"{API}/public/sites/{TENANT_SLUG}/listings/{lid}/similar",
                   params={"limit": 4})
    if r.status_code != 200:
        record("fail", "GET similar", f"HTTP {r.status_code} {r.text[:200]}")
        return
    items = r.json().get("items", [])
    record("pass", f"similar returned {len(items)} items (cap 4)")
    # Should not include the source listing
    same = [i for i in items if i["id"] == lid]
    record("pass" if not same else "fail",
           "source listing excluded from results")


def t_invalid_prefix_change() -> None:
    section("[I] Tenant prefix validation (via PATCH /tenants/me)")
    if not tenant_token:
        return
    # Too-short prefix
    r = client.patch(f"{API}/tenants/me",
                     json={"property_ref_prefix": "AB"}, headers=headers())
    record("pass" if r.status_code == 422 else "fail",
           "2-char prefix rejected with 422",
           None if r.status_code == 422 else f"got {r.status_code}")
    # Restore original (no-op)
    r = client.patch(f"{API}/tenants/me",
                     json={"property_ref_prefix": EXPECTED_PREFIX}, headers=headers())
    record("pass" if r.status_code == 200 else "fail",
           f"set prefix back to {EXPECTED_PREFIX} → 200",
           None if r.status_code == 200 else f"got {r.status_code}")


def cleanup(prop_ids: list[str | None]) -> None:
    if not tenant_token:
        return
    for pid in prop_ids:
        if pid:
            try:
                client.delete(f"{API}/properties/{pid}", headers=headers())
            except Exception:
                pass


def main() -> int:
    print(f"{BOLD}fh Wave 1 E2E — migration 0040{RESET}")
    auth()
    if not tenant_token:
        return 1
    t_tenant_prefix()
    pid1, lid1 = t_auto_reference()
    t_listing_detail_metrics(lid1)
    t_listing_verify_unverify(lid1)
    pid2 = t_rent_cheques()
    t_filter_verified()
    t_similar_listings()
    t_invalid_prefix_change()
    cleanup([pid1, pid2])
    passed = sum(1 for s, _ in results if s == "pass")
    failed = sum(1 for s, _ in results if s == "fail")
    print(f"\n{BOLD}Summary: {GREEN}{passed} passed{RESET}, {RED}{failed} failed{RESET}"
          f"{BOLD} ({len(results)} total){RESET}\n")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
