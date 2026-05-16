#!/usr/bin/env python3
"""E2E checks for the amenity catalog + structured property attributes
(migration 0039). Runs against staging using one of the seeded tenant owners.

Usage:
    /Users/mna036/mna-bytes/fh/.venv/bin/python scripts/e2e_amenities.py
"""

from __future__ import annotations

import sys
from typing import Any

import httpx

API = "https://fh-staging-api.up.railway.app"
TENANT_EMAIL = "devmna036+marinarealty@gmail.com"
TENANT_PASSWORD = "Miange@036"
TENANT_SLUG = "marina-realty"

GREEN, RED, YELLOW, CYAN, BOLD, RESET = (
    "\033[92m", "\033[91m", "\033[93m", "\033[96m", "\033[1m", "\033[0m",
)
PASS, FAIL = f"{GREEN}✓{RESET}", f"{RED}✗{RESET}"
results: list[tuple[str, str, str | None]] = []
client = httpx.Client(timeout=60)
tenant_token: str | None = None


def section(s: str) -> None:
    print(f"\n{BOLD}{CYAN}{s}{RESET}")


def record(status: str, label: str, detail: str | None = None) -> None:
    results.append((status, label, detail))
    sym = PASS if status == "pass" else FAIL
    suffix = f" — {detail}" if detail else ""
    print(f"  {sym} {label}{suffix}")


def auth_tenant() -> None:
    global tenant_token
    section("[A] Tenant auth")
    r = client.post(
        f"{API}/auth/login",
        json={"email": TENANT_EMAIL, "password": TENANT_PASSWORD},
    )
    if r.status_code != 200:
        record("fail", "login", f"HTTP {r.status_code}")
        return
    tenant_token = r.json().get("access_token")
    record("pass" if tenant_token else "fail", "tenant token received")


def headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {tenant_token}"}


def t_catalog() -> set[str] | None:
    section("[B] Amenity catalog")
    r = client.get(f"{API}/properties/amenity-catalog")
    if r.status_code != 200:
        record("fail", "GET /properties/amenity-catalog", f"HTTP {r.status_code}")
        return None
    categories = r.json()
    record(
        "pass" if len(categories) >= 6 else "fail",
        f"catalog has {len(categories)} categories",
    )
    all_keys: set[str] = set()
    for cat in categories:
        for item in cat.get("items", []):
            all_keys.add(item["key"])
    record(
        "pass" if len(all_keys) >= 50 else "fail",
        f"catalog has {len(all_keys)} unique amenity keys",
    )
    for required in ("private_pool", "maids_room", "central_ac", "shared_pool",
                     "loading_bay", "covered_parking"):
        if required in all_keys:
            record("pass", f"catalog includes {required!r}")
        else:
            record("fail", f"catalog missing {required!r}")
    # No auth header should still work
    r2 = client.get(f"{API}/properties/amenity-catalog")
    record(
        "pass" if r2.status_code == 200 else "fail",
        "catalog endpoint is public (no auth needed)",
    )
    return all_keys


def t_invalid_amenity_key() -> None:
    section("[C] Property create rejects unknown amenity key")
    if not tenant_token:
        return
    body: dict[str, Any] = {
        "title": "[E2E AMENITY] bad amenity test",
        "property_type": "apartment",
        "price": 1_000_000,
        "currency": "AED",
        "city": "Dubai",
        "country": "AE",
        "amenities": ["this_is_not_a_real_amenity", "central_ac"],
    }
    r = client.post(f"{API}/properties", json=body, headers=headers())
    if r.status_code == 422 and "this_is_not_a_real_amenity" in r.text:
        record("pass", "unknown amenity key → 422 listing offender")
    else:
        record("fail", "bad amenity → expected 422", f"HTTP {r.status_code} {r.text[:200]}")


def t_property_create_with_attrs() -> str | None:
    section("[D] Property create with full amenity + attribute payload")
    if not tenant_token:
        return None
    body: dict[str, Any] = {
        "title": "[E2E AMENITY] Villa with private pool — full attr test",
        "property_type": "villa",
        "price": 7_500_000,
        "currency": "AED",
        "city": "Dubai",
        "country": "AE",
        "area": "Palm Jumeirah",
        "bedrooms": 4,
        "bathrooms": 5,
        "size_sqft": 4200,
        "amenities": ["private_pool", "private_garden", "maids_room", "central_ac",
                      "covered_parking", "security_staff"],
        "furnishing_status": "semi_furnished",
        "completion_status": "ready",
        "ownership_type": "freehold",
        "view_orientation": "sea",
        "service_charge_aed_sqft": "14.50",
        "rera_permit_number": "DLD-E2E-TEST-001",
        "plot_area_sqft": 5500,
        "parking_spaces": 3,
        "floor_level": "low",
    }
    r = client.post(f"{API}/properties", json=body, headers=headers())
    if r.status_code != 201:
        record("fail", "POST /properties full attr", f"HTTP {r.status_code} {r.text[:200]}")
        return None
    data = r.json()
    record("pass", f"property created id={data['id'][:8]}")

    for field, expected in (
        ("furnishing_status", "semi_furnished"),
        ("completion_status", "ready"),
        ("ownership_type", "freehold"),
        ("view_orientation", "sea"),
        ("plot_area_sqft", 5500),
        ("parking_spaces", 3),
        ("rera_permit_number", "DLD-E2E-TEST-001"),
    ):
        got = data.get(field)
        record(
            "pass" if got == expected else "fail",
            f"property.{field} = {expected!r}",
            None if got == expected else f"got {got!r}",
        )

    amenities = data.get("amenities") or []
    has_pool = "private_pool" in amenities
    has_maids = "maids_room" in amenities
    record(
        "pass" if has_pool and has_maids else "fail",
        f"amenities round-tripped ({len(amenities)} items)",
    )
    return str(data["id"])


def t_filter_by_amenity() -> None:
    section("[E] Filter properties by amenity (AND containment)")
    if not tenant_token:
        return
    r = client.get(
        f"{API}/properties",
        params={"amenities": "private_pool", "limit": 50},
        headers=headers(),
    )
    if r.status_code != 200:
        record("fail", "GET /properties?amenities=private_pool", f"HTTP {r.status_code}")
        return
    items = r.json().get("items", [])
    bad = [p for p in items if "private_pool" not in (p.get("amenities") or [])]
    record(
        "pass" if not bad else "fail",
        f"filter by single amenity returned {len(items)} matches, all have private_pool",
        None if not bad else f"{len(bad)} mismatches",
    )

    r = client.get(
        f"{API}/properties",
        params={"amenities": "private_pool,maids_room", "limit": 50},
        headers=headers(),
    )
    if r.status_code != 200:
        record("fail", "GET /properties?amenities=private_pool,maids_room", f"HTTP {r.status_code}")
        return
    items = r.json().get("items", [])
    bad = [p for p in items
           if not {"private_pool", "maids_room"}.issubset(set(p.get("amenities") or []))]
    record(
        "pass" if not bad else "fail",
        f"filter by two amenities (AND) returned {len(items)} matches",
        None if not bad else f"{len(bad)} mismatches",
    )


def t_filter_by_attribute() -> None:
    section("[F] Filter properties by structured attribute")
    if not tenant_token:
        return
    r = client.get(
        f"{API}/properties",
        params={"furnishing_status": "semi_furnished", "limit": 50},
        headers=headers(),
    )
    if r.status_code != 200:
        record("fail", "GET /properties?furnishing_status", f"HTTP {r.status_code}")
        return
    items = r.json().get("items", [])
    bad = [p for p in items if p.get("furnishing_status") != "semi_furnished"]
    record(
        "pass" if not bad else "fail",
        f"furnishing_status=semi_furnished returned {len(items)}",
        None if not bad else f"{len(bad)} mismatches",
    )

    r = client.get(
        f"{API}/properties",
        params={"completion_status": "off_plan", "limit": 50},
        headers=headers(),
    )
    items = r.json().get("items", [])
    bad = [p for p in items if p.get("completion_status") != "off_plan"]
    record(
        "pass" if not bad else "fail",
        f"completion_status=off_plan returned {len(items)}",
        None if not bad else f"{len(bad)} mismatches",
    )

    r = client.get(
        f"{API}/properties",
        params={"min_parking_spaces": 3, "limit": 50},
        headers=headers(),
    )
    items = r.json().get("items", [])
    bad = [p for p in items if (p.get("parking_spaces") or 0) < 3]
    record(
        "pass" if not bad else "fail",
        f"min_parking_spaces=3 returned {len(items)}",
        None if not bad else f"{len(bad)} mismatches",
    )


def t_public_filter() -> None:
    section("[G] Public site listings filter by amenity")
    r = client.get(
        f"{API}/public/sites/{TENANT_SLUG}/listings",
        params={"amenities": "private_pool", "page_size": 50},
    )
    if r.status_code != 200:
        record("fail", "public listings ?amenities", f"HTTP {r.status_code}")
        return
    data = r.json()
    items = data.get("items", [])
    record("pass", f"public listings ?amenities=private_pool returned {len(items)}")

    r = client.get(
        f"{API}/public/sites/{TENANT_SLUG}/listings",
        params={"furnishing_status": "furnished", "page_size": 50},
    )
    record(
        "pass" if r.status_code == 200 else "fail",
        f"public listings ?furnishing_status=furnished → {r.status_code}",
    )


def cleanup(prop_id: str | None) -> None:
    if prop_id and tenant_token:
        client.delete(f"{API}/properties/{prop_id}", headers=headers())


def main() -> int:
    print(f"{BOLD}fh amenity E2E (migration 0039){RESET}")
    auth_tenant()
    if not tenant_token:
        print("aborted: no tenant token")
        return 1
    t_catalog()
    t_invalid_amenity_key()
    pid = t_property_create_with_attrs()
    t_filter_by_amenity()
    t_filter_by_attribute()
    t_public_filter()
    cleanup(pid)
    passed = sum(1 for s, *_ in results if s == "pass")
    failed = sum(1 for s, *_ in results if s == "fail")
    print(f"\n{BOLD}Summary: {GREEN}{passed} passed{RESET}, {RED}{failed} failed{RESET}{BOLD}"
          f" ({len(results)} total){RESET}\n")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
