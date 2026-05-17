#!/usr/bin/env python3
"""Normalize country/city/area on properties to match the locations catalog.

After switching every form to LocationPicker, existing rows may have stale
or off-catalog values (test data with typos, lowercased labels, ISO mismatches).
This script walks every property + consumer-posted property and rewrites
country/city/area to the canonical catalog value, NULL-ing out anything
that can't be mapped.

Strategy
--------
- country: store the 2-char `code`. Case-insensitive match.
- city/area: store the catalog `label`. Match by lowercased label OR by
  lowercased slug.
- If a value can't be mapped, set it to NULL (data is test-only per user).

Usage
-----
    /Users/mna036/mna-bytes/fh/.venv/bin/python scripts/normalize_property_locations.py [--dry-run]

The --dry-run flag prints the proposed changes without writing.
"""

from __future__ import annotations

import argparse
import asyncio
from collections import defaultdict

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

DSN = (
    "postgresql+asyncpg://postgres:apJqItbDsAJmGjqWTSFaBvgPuhRanOOL"
    "@turntable.proxy.rlwy.net:27501/railway"
)


async def load_catalog(conn):
    """Build lookup maps: country code → canonical code; city key → (canonical label, country_code);
    area key → (canonical label, city_label, country_code).
    """
    countries = await conn.execute(
        text("SELECT id, code, name FROM countries WHERE active = true")
    )
    country_by_code: dict[str, str] = {}
    country_id_to_code: dict[str, str] = {}
    for row in countries.mappings():
        country_by_code[row["code"].upper()] = row["code"]
        country_id_to_code[str(row["id"])] = row["code"]

    cities = await conn.execute(
        text("SELECT id, country_id, slug, label FROM cities WHERE active = true")
    )
    # key = (country_code, lowercased label or slug) → canonical label
    city_lookup: dict[tuple[str, str], str] = {}
    city_id_to_label: dict[str, tuple[str, str]] = {}
    for row in cities.mappings():
        ccode = country_id_to_code.get(str(row["country_id"]))
        if not ccode:
            continue
        canonical = row["label"]
        city_lookup[(ccode, canonical.lower())] = canonical
        city_lookup[(ccode, row["slug"].lower())] = canonical
        city_id_to_label[str(row["id"])] = (canonical, ccode)

    areas = await conn.execute(
        text("SELECT id, city_id, slug, label FROM areas WHERE active = true")
    )
    # key = (country_code, city_label_lower, lowercased label or slug) → canonical label
    area_lookup: dict[tuple[str, str, str], str] = {}
    for row in areas.mappings():
        info = city_id_to_label.get(str(row["city_id"]))
        if not info:
            continue
        city_label, ccode = info
        canonical = row["label"]
        area_lookup[(ccode, city_label.lower(), canonical.lower())] = canonical
        area_lookup[(ccode, city_label.lower(), row["slug"].lower())] = canonical

    return country_by_code, city_lookup, area_lookup


def resolve(
    raw_country: str | None,
    raw_city: str | None,
    raw_area: str | None,
    country_by_code: dict[str, str],
    city_lookup: dict[tuple[str, str], str],
    area_lookup: dict[tuple[str, str, str], str],
) -> tuple[str | None, str | None, str | None]:
    """Return (country_code, city_label, area_label) — any unmatched piece is None."""
    country_code: str | None = None
    if raw_country:
        country_code = country_by_code.get(raw_country.strip().upper())

    city_label: str | None = None
    if country_code and raw_city:
        city_label = city_lookup.get((country_code, raw_city.strip().lower()))

    area_label: str | None = None
    if country_code and city_label and raw_area:
        area_label = area_lookup.get(
            (country_code, city_label.lower(), raw_area.strip().lower())
        )

    return country_code, city_label, area_label


async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Show changes, don't write.")
    args = parser.parse_args()

    engine = create_async_engine(DSN)
    async with engine.begin() as conn:
        country_by_code, city_lookup, area_lookup = await load_catalog(conn)

        props = await conn.execute(
            text(
                "SELECT id, country, city, area FROM properties "
                "WHERE country IS NOT NULL OR city IS NOT NULL OR area IS NOT NULL"
            )
        )
        rows = list(props.mappings())

    print(f"Scanning {len(rows)} property rows with at least one location value")
    print(f"Catalog: {len(country_by_code)} countries, {len(city_lookup)//2} cities, {len(area_lookup)//2} areas")
    print()

    changes: list[tuple[str, dict[str, str | None], dict[str, str | None]]] = []
    stats = defaultdict(int)

    for row in rows:
        raw = {
            "country": row["country"],
            "city": row["city"],
            "area": row["area"],
        }
        ccode, clabel, alabel = resolve(
            row["country"], row["city"], row["area"],
            country_by_code, city_lookup, area_lookup,
        )
        canonical = {"country": ccode, "city": clabel, "area": alabel}
        if raw != canonical:
            changes.append((str(row["id"]), raw, canonical))
            for field in ("country", "city", "area"):
                if raw[field] != canonical[field]:
                    if canonical[field] is None and raw[field] is not None:
                        stats[f"{field}_nulled"] += 1
                    else:
                        stats[f"{field}_normalized"] += 1

    print(f"{len(changes)} properties need updates")
    for k, v in sorted(stats.items()):
        print(f"  {k}: {v}")

    if not changes:
        print("Nothing to do.")
        return 0

    print()
    print("First 10 changes:")
    for pid, raw, canon in changes[:10]:
        print(f"  {pid[:8]}  {raw}  →  {canon}")

    if args.dry_run:
        print()
        print("Dry run — no writes. Re-run without --dry-run to apply.")
        return 0

    print()
    print(f"Applying {len(changes)} updates…")
    async with engine.begin() as conn:
        for pid, _raw, canon in changes:
            await conn.execute(
                text(
                    "UPDATE properties SET country = :c, city = :ci, area = :a, "
                    "updated_at = NOW() WHERE id = :pid"
                ),
                {"c": canon["country"], "ci": canon["city"], "a": canon["area"], "pid": pid},
            )
    print(f"Updated {len(changes)} rows.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
