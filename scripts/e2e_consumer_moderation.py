#!/usr/bin/env python3
"""E2E smoke test for the consumer-listing moderation flow.

Hits staging end-to-end:
  1. Consumer signs up via OTP (dev override 123321)
  2. Creates a draft listing → expects status=draft, no expires_at
  3. Uploads a small fake image to media
  4. Submits draft for review → expects status=pending_review, submitted_at set
  5. Platform admin lists the queue → expects the new listing
  6. Admin approves → expects status=active, reviewed_at + expires_at set
  7. Verifies email_outbox row exists for the approval
  8. Tests request-changes path on a second listing

Usage:
    /Users/mna036/mna-bytes/fh/.venv/bin/python scripts/e2e_consumer_moderation.py
"""

from __future__ import annotations

import asyncio
import io
import sys
import time

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

API = "https://af-staging-api.up.railway.app"
DSN = (
    "postgresql+asyncpg://postgres:apJqItbDsAJmGjqWTSFaBvgPuhRanOOL"
    "@turntable.proxy.rlwy.net:27501/railway"
)
EMAIL = f"e2e-mod-{int(time.time())}@example.com"
ADMIN_EMAIL = "devmna036+admin@gmail.com"
ADMIN_PASSWORD = "Miange@036"

GREEN, RED, CYAN, BOLD, RESET = "\033[92m", "\033[91m", "\033[96m", "\033[1m", "\033[0m"
PASS, FAIL = f"{GREEN}OK{RESET}", f"{RED}FAIL{RESET}"

ctx: dict = {}
client = httpx.Client(timeout=30)


def section(s: str) -> None:
    print(f"\n{BOLD}{CYAN}{s}{RESET}")


def expect(cond: bool, label: str, detail: str = "") -> None:
    sym = PASS if cond else FAIL
    print(f"  {sym} {label}" + (f" — {detail}" if detail else ""))
    if not cond:
        ctx["failed"] = ctx.get("failed", 0) + 1


def hit(method: str, path: str, *, expect_code: int, token: str | None = None,
        json: dict | None = None, files=None, label: str = "") -> httpx.Response:
    headers: dict = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    kwargs: dict = {"headers": headers}
    if json is not None:
        kwargs["json"] = json
    if files is not None:
        kwargs["files"] = files
    r = client.request(method, f"{API}{path}", **kwargs)
    ok = r.status_code == expect_code
    snippet = (r.text or "")[:160].replace("\n", " ")
    expect(ok, f"{method} {path} -> {expect_code}{' ' + label if label else ''}",
           "" if ok else f"got {r.status_code}: {snippet}")
    return r


def fake_jpeg() -> bytes:
    """Smallest valid JPEG body (1x1 black pixel)."""
    return bytes.fromhex(
        "ffd8ffe000104a46494600010100000100010000ffdb004300080606070605"
        "08070707090908080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c2024"
        "2e2723202c231c1c2837292c30313434341f27393d38323c2e333432ffc000"
        "0b080001000101011100ffc40014000100000000000000000000000000000a"
        "ffc40014100100000000000000000000000000000000ffda0008010100003f"
        "0073afffd9"
    )


# ---------------------------------------------------------------------------
# Step 1: Consumer auth
# ---------------------------------------------------------------------------
def consumer_auth() -> None:
    section("[1] Consumer signup via OTP")
    r = hit("POST", "/consumer/auth/request-otp", expect_code=200,
            json={"email": EMAIL})
    body = r.json() if r.status_code == 200 else {}
    dev_otp = body.get("dev_otp") or "123321"

    r = hit("POST", "/consumer/auth/verify-otp", expect_code=200,
            json={"email": EMAIL, "code": dev_otp,
                  "full_name": "E2E Moderation",
                  "phone": "+971 50 999 0001"})
    if r.status_code == 200:
        ctx["token"] = r.json().get("access_token")
        ctx["consumer_id"] = r.json().get("consumer", {}).get("id")
        expect(bool(ctx.get("token")), "consumer access_token obtained")


# ---------------------------------------------------------------------------
# Step 2: Create draft listing
# ---------------------------------------------------------------------------
def create_draft() -> None:
    section("[2] Create draft listing")
    payload = {
        "purpose": "sale",
        "price": 1500000,
        "currency": "AED",
        "title": "E2E moderation test villa",
        "description": "Test description from automated e2e",
        "property_type": "villa",
        "country": "AE",
        "city": "Dubai",
        "area": "Dubai Marina",
        "bedrooms": 3,
        "bathrooms": 2,
        "size_sqft": 2200,
    }
    r = hit("POST", "/consumer/me/listings", expect_code=201,
            token=ctx["token"], json=payload, label="(creates draft)")
    if r.status_code == 201:
        b = r.json()
        ctx["listing_id"] = b["id"]
        expect(b.get("status") == "draft", "status is draft",
               f"got {b.get('status')!r}")
        expect(b.get("expires_at") is None, "expires_at is None (no clock yet)",
               f"got {b.get('expires_at')!r}")


# ---------------------------------------------------------------------------
# Step 3: Upload media
# ---------------------------------------------------------------------------
def upload_media() -> None:
    section("[3] Upload media to draft")
    if not ctx.get("listing_id"):
        expect(False, "no listing_id, skipping")
        return
    files = {"file": ("test.jpg", io.BytesIO(fake_jpeg()), "image/jpeg")}
    r = hit("POST", f"/consumer/me/listings/{ctx['listing_id']}/media",
            expect_code=201, token=ctx["token"], files=files)
    if r.status_code == 201:
        ctx["media_id"] = r.json().get("id")

    r = hit("GET", f"/consumer/me/listings/{ctx['listing_id']}/media",
            expect_code=200, token=ctx["token"])
    if r.status_code == 200:
        items = r.json().get("items", [])
        expect(len(items) >= 1, f"media list has at least 1 item (got {len(items)})")


# ---------------------------------------------------------------------------
# Step 4: Submit for review
# ---------------------------------------------------------------------------
def submit_for_review() -> None:
    section("[4] Submit draft for review")
    if not ctx.get("listing_id"):
        return
    r = hit("POST", f"/consumer/me/listings/{ctx['listing_id']}/submit",
            expect_code=200, token=ctx["token"], label="(draft -> pending_review)")
    if r.status_code == 200:
        b = r.json()
        expect(b.get("status") == "pending_review", "status is pending_review",
               f"got {b.get('status')!r}")
        expect(b.get("submitted_at") is not None, "submitted_at is set")


# ---------------------------------------------------------------------------
# Step 5: Platform admin login + queue
# ---------------------------------------------------------------------------
def admin_login() -> None:
    section("[5] Platform admin login")
    r = hit("POST", "/auth/platform-login", expect_code=200,
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code == 200:
        ctx["admin_token"] = r.json().get("access_token")
        expect(bool(ctx.get("admin_token")), "admin access_token obtained")


def admin_queue() -> None:
    section("[6] Admin lists moderation queue")
    r = hit("GET", "/platform-admin/consumer-listings?status=pending_review",
            expect_code=200, token=ctx.get("admin_token"))
    if r.status_code == 200:
        items = r.json().get("items", [])
        ids = [it.get("id") for it in items]
        expect(ctx.get("listing_id") in ids,
               f"our listing is in the queue ({len(items)} pending total)")


# ---------------------------------------------------------------------------
# Step 6: Approve
# ---------------------------------------------------------------------------
def approve_listing() -> None:
    section("[7] Admin approves listing")
    if not ctx.get("listing_id") or not ctx.get("admin_token"):
        return
    r = hit("POST",
            f"/platform-admin/consumer-listings/{ctx['listing_id']}/approve",
            expect_code=200, token=ctx["admin_token"])
    if r.status_code == 200:
        expect(r.json().get("status") == "active", "status flipped to active",
               f"got {r.json().get('status')!r}")

    # Re-fetch as the owner to confirm expires_at is now set
    r = hit("GET", f"/consumer/me/listings/{ctx['listing_id']}",
            expect_code=200, token=ctx["token"])
    if r.status_code == 200:
        b = r.json()
        expect(b.get("expires_at") is not None,
               "expires_at populated on first approval",
               f"got {b.get('expires_at')!r}")
        expect(b.get("reviewed_at") is not None, "reviewed_at populated")


# ---------------------------------------------------------------------------
# Step 7: Verify email queued
# ---------------------------------------------------------------------------
async def verify_email_queued() -> None:
    section("[8] Verify approval email in outbox (DB check)")
    if not ctx.get("consumer_id"):
        expect(False, "no consumer_id, skipping")
        return
    engine = create_async_engine(DSN)
    async with engine.connect() as conn:
        r = await conn.execute(text(
            "SELECT template_key, recipient_email, status, queued_at FROM email_outbox "
            "WHERE recipient_email = :email AND template_key LIKE 'consumer_listing%' "
            "ORDER BY queued_at DESC LIMIT 5"
        ), {"email": EMAIL})
        rows = list(r.mappings())
    expect(len(rows) >= 1, f"found {len(rows)} outbox row(s) for {EMAIL}")
    for row in rows:
        print(f"      template={row['template_key']} status={row['status']} at={row['queued_at']}")


# ---------------------------------------------------------------------------
# Step 8: Request changes path on second listing
# ---------------------------------------------------------------------------
def test_request_changes() -> None:
    section("[9] Request-changes path on a second listing")
    payload = {
        "purpose": "rent_long",
        "price": 80000,
        "currency": "AED",
        "title": "E2E rejection test apartment",
        "description": "Will be rejected by admin",
        "property_type": "apartment",
        "country": "AE",
        "city": "Dubai",
        "area": "Downtown Dubai",
        "bedrooms": 2,
        "bathrooms": 2,
        "size_sqft": 1100,
    }
    r = hit("POST", "/consumer/me/listings", expect_code=201,
            token=ctx["token"], json=payload)
    if r.status_code != 201:
        return
    lid = r.json()["id"]
    hit("POST", f"/consumer/me/listings/{lid}/submit",
        expect_code=200, token=ctx["token"], label="submit")
    r = hit("POST",
            f"/platform-admin/consumer-listings/{lid}/request-changes",
            expect_code=200, token=ctx["admin_token"],
            json={"notes": "Test rejection: needs better photos and description detail."})
    if r.status_code == 200:
        b = r.json()
        expect(b.get("status") == "changes_requested", "status is changes_requested",
               f"got {b.get('status')!r}")
        expect(b.get("review_notes") is not None and "Test rejection" in b["review_notes"],
               "review_notes saved")

    # Verify the user can edit + resubmit
    r = hit("PATCH", f"/consumer/me/listings/{lid}",
            expect_code=200, token=ctx["token"],
            json={"description": "Updated description after admin feedback"})
    if r.status_code == 200:
        expect(r.json().get("status") == "pending_review",
               "edit auto-flipped to pending_review",
               f"got {r.json().get('status')!r}")


def main() -> int:
    print(f"{BOLD}Consumer moderation E2E - {API}{RESET}")
    print(f"Test consumer email: {EMAIL}")

    consumer_auth()
    if not ctx.get("token"):
        print(f"\n{RED}Auth failed - aborting{RESET}")
        return 1

    create_draft()
    upload_media()
    submit_for_review()
    admin_login()
    if not ctx.get("admin_token"):
        print(f"\n{RED}Admin login failed - aborting remaining steps{RESET}")
        return 1
    admin_queue()
    approve_listing()
    asyncio.run(verify_email_queued())
    test_request_changes()

    failed = ctx.get("failed", 0)
    print(f"\n{BOLD}Summary: {failed} failure(s){RESET}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
