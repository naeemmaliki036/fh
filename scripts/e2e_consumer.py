#!/usr/bin/env python3
"""E2E smoke tests for the consumer-accounts API surface (migration 0044
+ backend ae28f31). Hits every new endpoint and reports per-route status.

Usage:
    /Users/mna036/mna-bytes/fh/.venv/bin/python scripts/e2e_consumer.py
"""

from __future__ import annotations

import random
import string
import sys
import time

import httpx

API = "https://af-staging-api.up.railway.app"
EMAIL = f"e2e-consumer-{int(time.time())}@example.com"

GREEN, RED, CYAN, BOLD, RESET = "\033[92m", "\033[91m", "\033[96m", "\033[1m", "\033[0m"
PASS, FAIL = f"{GREEN}✓{RESET}", f"{RED}✗{RESET}"

results: list[tuple[str, str, str]] = []
client = httpx.Client(timeout=30)
ctx: dict = {}  # shared state between sections


def section(s: str) -> None:
    print(f"\n{BOLD}{CYAN}{s}{RESET}")


def record(status: str, label: str, detail: str = "") -> None:
    results.append((status, label, detail))
    sym = PASS if status == "pass" else FAIL
    print(f"  {sym} {label}" + (f" — {detail}" if detail else ""))


def hit(method: str, path: str, *, label: str, expect: int, token: str | None = None,
        json: dict | None = None) -> httpx.Response:
    headers: dict = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = client.request(method, f"{API}{path}", headers=headers, json=json)
    ok = r.status_code == expect
    snippet = (r.text or "")[:140].replace("\n", " ")
    record("pass" if ok else "fail", f"{method} {path} → {expect} ({label})",
           "" if ok else f"got {r.status_code}: {snippet}")
    return r


# ---------------------------------------------------------------------------
# Section 1: OTP request + verify
# ---------------------------------------------------------------------------
def s1_auth() -> None:
    section("[1] OTP signup + login")
    # request OTP for a fresh email
    r = hit("POST", "/consumer/auth/request-otp", label="signup",
            expect=200, json={"email": EMAIL})
    if r.status_code == 200:
        body = r.json()
        ctx["dev_otp"] = body.get("dev_otp")
        record("pass" if ctx["dev_otp"] else "fail",
               f"dev_otp returned: {ctx['dev_otp']!r}")

    # second immediate request -> rate-limit 429
    r = hit("POST", "/consumer/auth/request-otp", label="rate-limit",
            expect=429, json={"email": EMAIL})

    # verify
    r = hit("POST", "/consumer/auth/verify-otp",
            label="verify with full_name + phone", expect=200,
            json={
                "email": EMAIL,
                "code": ctx.get("dev_otp", "123321"),
                "full_name": "E2E Consumer",
                "phone": "+971 50 123 4567",
            })
    if r.status_code == 200:
        body = r.json()
        ctx["token"] = body.get("access_token")
        ctx["consumer"] = body.get("consumer", {})
        record("pass" if ctx["token"] else "fail",
               f"access_token returned, consumer.id={ctx['consumer'].get('id', '')[:8]}")


# ---------------------------------------------------------------------------
# Section 2: GET / PATCH /consumer/me
# ---------------------------------------------------------------------------
def s2_me() -> None:
    section("[2] /consumer/me")
    if not ctx.get("token"):
        record("fail", "skipped — no token")
        return
    r = hit("GET", "/consumer/me", label="fetch", expect=200, token=ctx["token"])
    if r.status_code == 200:
        body = r.json()
        record("pass" if body.get("email") == EMAIL.lower() else "fail",
               f"email matches: {body.get('email')}")

    # patch name
    r = hit("PATCH", "/consumer/me", label="update name", expect=200,
            token=ctx["token"], json={"full_name": "Updated E2E Name"})
    if r.status_code == 200 and r.json().get("full_name") != "Updated E2E Name":
        record("fail", f"name not updated: {r.json().get('full_name')!r}")

    # auth without token -> 401
    hit("GET", "/consumer/me", label="no-auth rejected", expect=401)


# ---------------------------------------------------------------------------
# Section 3: Consumer listings CRUD
# ---------------------------------------------------------------------------
def s3_listings() -> None:
    section("[3] Consumer listing CRUD")
    if not ctx.get("token"):
        record("fail", "skipped — no token")
        return

    # create a basic listing
    payload = {
        "title": "E2E Test Listing — 1BR Marina",
        "description": "Auto-created by e2e_consumer.py",
        "property_type": "apartment",
        "purpose": "sale",
        "price": 1_250_000,
        "currency": "AED",
        "country": "AE",
        "city": "Dubai",
        "area": "Marina",
        "bedrooms": 1,
        "bathrooms": 2,
        "size_sqft": 760,
    }
    r = hit("POST", "/consumer/me/listings", label="create",
            expect=201, token=ctx["token"], json=payload)
    if r.status_code == 201:
        body = r.json()
        ctx["listing_id"] = body.get("id")
        record("pass" if body.get("status") == "active" else "fail",
               f"listing active immediately (status={body.get('status')})")
        record("pass" if body.get("expires_at") else "fail",
               f"expires_at set: {body.get('expires_at')}")

    # list
    r = hit("GET", "/consumer/me/listings?page=1&page_size=10",
            label="list mine", expect=200, token=ctx["token"])
    if r.status_code == 200:
        record("pass", f"total={r.json().get('total')}, "
               f"active_count={r.json().get('active_count')}")

    # update
    if ctx.get("listing_id"):
        r = hit("PATCH", f"/consumer/me/listings/{ctx['listing_id']}",
                label="update price", expect=200, token=ctx["token"],
                json={"price": 1_280_000})

        # mark-status pause -> active
        for new_status in ("paused", "active"):
            hit("POST", f"/consumer/me/listings/{ctx['listing_id']}/mark-status",
                label=f"mark {new_status}", expect=200, token=ctx["token"],
                json={"status": new_status})


# ---------------------------------------------------------------------------
# Section 4: Favorites
# ---------------------------------------------------------------------------
def s4_favorites() -> None:
    section("[4] Favorites")
    if not ctx.get("token") or not ctx.get("listing_id"):
        record("fail", "skipped — no listing")
        return

    # toggle on
    r = hit("POST", f"/consumer/me/favorites/{ctx['listing_id']}",
            label="toggle on", expect=200, token=ctx["token"])
    if r.status_code == 200 and not r.json().get("favorited"):
        record("fail", f"favorited=false but expected true")

    # list shows the listing
    r = hit("GET", "/consumer/me/favorites?page=1&page_size=10",
            label="list", expect=200, token=ctx["token"])
    if r.status_code == 200:
        items = r.json().get("items", [])
        ours = [i for i in items if i.get("id") == ctx["listing_id"]]
        record("pass" if ours else "fail",
               f"favorited listing in list ({len(items)} total)")

    # toggle off
    r = hit("POST", f"/consumer/me/favorites/{ctx['listing_id']}",
            label="toggle off", expect=200, token=ctx["token"])
    if r.status_code == 200 and r.json().get("favorited"):
        record("fail", f"favorited=true but expected false")


# ---------------------------------------------------------------------------
# Section 5: Public consumer-inquiry (hybrid lead)
# ---------------------------------------------------------------------------
def s5_inquiry() -> None:
    section("[5] Public consumer-inquiry (hybrid lead)")
    if not ctx.get("listing_id"):
        record("fail", "skipped — no listing")
        return

    # submit lead (no auth header)
    r = hit("POST",
            f"/public/listings/{ctx['listing_id']}/consumer-inquiry",
            label="submit", expect=200,
            json={
                "buyer_name": "Curious Buyer",
                "buyer_email": "buyer-e2e@example.com",
                "buyer_phone": "+971 50 999 8888",
                "buyer_message": "Is this still available?",
            })
    if r.status_code == 200:
        body = r.json()
        contact = body.get("seller_contact", {})
        record("pass" if contact.get("email") else "fail",
               f"seller_contact revealed: email={contact.get('email')}, phone={contact.get('phone')}")


# ---------------------------------------------------------------------------
# Section 6: Google sign-in (stub)
# ---------------------------------------------------------------------------
def s6_google() -> None:
    section("[6] Google sign-in stub")
    hit("POST", "/consumer/auth/google", label="stub returns 501",
        expect=501, json={"id_token": "fake"})


# ---------------------------------------------------------------------------
# Section 7: Marketplace listing now exposes consumer fields
# ---------------------------------------------------------------------------
def s7_marketplace_surface() -> None:
    section("[7] Marketplace surfaces consumer listings")
    if not ctx.get("listing_id"):
        record("fail", "skipped — no listing")
        return
    # The marketplace listing list should now include is_consumer_listing / owner_display_name
    r = client.get(f"{API}/marketplace/listings?page_size=50")
    if r.status_code != 200:
        record("fail", f"marketplace/listings returned {r.status_code}")
        return
    items = r.json().get("items", [])
    ours = next((i for i in items if i.get("id") == ctx["listing_id"]), None)
    record("pass" if ours else "fail",
           f"our listing appears in marketplace ({len(items)} total)")
    if ours:
        record("pass" if ours.get("is_consumer_listing") is True else "fail",
               f"is_consumer_listing={ours.get('is_consumer_listing')}")
        record("pass" if ours.get("owner_display_name") == "Updated E2E Name" else "fail",
               f"owner_display_name={ours.get('owner_display_name')!r}")


# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------
def cleanup() -> None:
    if ctx.get("token") and ctx.get("listing_id"):
        client.delete(f"{API}/consumer/me/listings/{ctx['listing_id']}",
                      headers={"Authorization": f"Bearer {ctx['token']}"})


def main() -> int:
    print(f"{BOLD}fh consumer-accounts E2E{RESET} — {EMAIL}")
    s1_auth()
    s2_me()
    s3_listings()
    s4_favorites()
    s5_inquiry()
    s6_google()
    s7_marketplace_surface()
    cleanup()
    passed = sum(1 for s, *_ in results if s == "pass")
    failed = sum(1 for s, *_ in results if s == "fail")
    print(f"\n{BOLD}Summary: {GREEN}{passed} passed{RESET}, "
          f"{RED}{failed} failed{RESET}{BOLD} ({len(results)} total){RESET}\n")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
