#!/usr/bin/env python3
"""Backfill internal_reference for existing properties on staging.

Uses the same generator format as the live backend service:
    <PREFIX>-<TT>-<6 alphanumeric>

Format examples: MAR-AP-K8X3DQ, DES-VI-9TB5V6

Usage:
    /Users/mna036/mna-bytes/fh/.venv/bin/python scripts/backfill_property_refs.py
"""

from __future__ import annotations

import asyncio
import random
import string
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

DSN = (
    "postgresql+asyncpg://postgres:apJqItbDsAJmGjqWTSFaBvgPuhRanOOL"
    "@turntable.proxy.rlwy.net:27501/railway"
)

ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no I/O/0/1

PROPERTY_TYPE_ABBR = {
    "apartment": "AP", "villa": "VI", "townhouse": "TH", "penthouse": "PH",
    "plot": "PL", "office": "OF", "retail": "RT", "warehouse": "WH",
    "building": "BD", "other": "OT",
}


def random_suffix(length: int = 6) -> str:
    return "".join(random.choices(ALPHABET, k=length))


async def main() -> int:
    random.seed()
    eng = create_async_engine(DSN)
    backfilled = 0
    skipped = 0
    async with eng.connect() as conn:
        rows = (await conn.execute(text("""
            SELECT p.id, p.property_type, p.tenant_id, t.property_ref_prefix
            FROM properties p
            JOIN tenants t ON t.id = p.tenant_id
            WHERE p.internal_reference IS NULL OR p.internal_reference = ''
            ORDER BY p.created_at
        """))).all()
        print(f"Found {len(rows)} properties without internal_reference")

        # Track used refs per tenant to avoid in-batch collisions
        used: dict[str, set[str]] = {}
        existing_rows = (await conn.execute(text(
            "SELECT tenant_id, internal_reference FROM properties "
            "WHERE internal_reference IS NOT NULL"
        ))).all()
        for r in existing_rows:
            used.setdefault(str(r[0]), set()).add(r[1])

        for row in rows:
            pid = row[0]
            ptype = row[1]
            tenant_id = str(row[2])
            prefix = row[3] or "TMP"
            abbr = PROPERTY_TYPE_ABBR.get(ptype, "OT")
            ref: str | None = None
            for _ in range(20):
                candidate = f"{prefix}-{abbr}-{random_suffix(6)}"
                if candidate not in used.setdefault(tenant_id, set()):
                    used[tenant_id].add(candidate)
                    ref = candidate
                    break
            if not ref:
                print(f"  ! could not generate ref for {pid}", file=sys.stderr)
                skipped += 1
                continue
            await conn.execute(
                text("UPDATE properties SET internal_reference = :ref WHERE id = :pid"),
                {"ref": ref, "pid": pid},
            )
            backfilled += 1
        await conn.commit()

        # Verify a sample
        sample = (await conn.execute(text(
            "SELECT t.slug, p.property_type, p.internal_reference "
            "FROM properties p JOIN tenants t ON t.id = p.tenant_id "
            "WHERE p.internal_reference IS NOT NULL "
            "ORDER BY p.updated_at DESC LIMIT 5"
        ))).all()
        print("\nSample refs:")
        for s in sample:
            print(f"  {s[0]:18s} {s[1]:10s} {s[2]}")

    await eng.dispose()
    print(f"\nBackfilled: {backfilled} | Skipped: {skipped}")
    return 0 if skipped == 0 else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
