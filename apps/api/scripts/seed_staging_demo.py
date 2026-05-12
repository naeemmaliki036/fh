"""Seed 3 demo tenants with 20 listings each on a target Postgres.

Run:
    DATABASE_URL=postgresql://... .venv/bin/python apps/api/scripts/seed_staging_demo.py

Idempotent: re-running skips tenants whose slug already exists.
"""

from __future__ import annotations

import asyncio
import os
import random
import sys
import uuid
from datetime import date, timedelta

import asyncpg

from apps.api.auth import hash_password


PROPERTY_PHOTOS = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1494203484021-3c454daf695d?auto=format&fit=crop&w=1600&q=80",
]

AGENT_PHOTOS = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
]

TENANTS = [
    {
        "name": "Marina Realty Dubai",
        "slug": "marina-realty",
        "tagline": "Waterfront living. Curated for you.",
        "logo_url": "https://ui-avatars.com/api/?name=Marina+Realty&background=1e3a8a&color=fff&size=240&font-size=0.4&bold=true",
        "contact_email": "hello@marinarealty.ae",
        "contact_phone": "+971 4 555 1001",
        "areas": ["Dubai Marina", "JBR", "Bluewaters", "Palm Jumeirah", "Emaar Beachfront"],
        "agents": ["Aisha Khan", "Omar Siddiqui", "Maya Roberts", "Sara Al Falasi", "Ravi Menon"],
        "owner_email": "owner@marinarealty.ae",
        "owner_password": "Marina@2026",
    },
    {
        "name": "Palm Estates UAE",
        "slug": "palm-estates",
        "tagline": "Premium homes on the Palm and beyond.",
        "logo_url": "https://ui-avatars.com/api/?name=Palm+Estates&background=047857&color=fff&size=240&font-size=0.4&bold=true",
        "contact_email": "hello@palmestates.ae",
        "contact_phone": "+971 4 555 2002",
        "areas": ["Palm Jumeirah", "Palm Jebel Ali", "Dubai Hills Estate", "Arabian Ranches", "Damac Hills"],
        "agents": ["Faisal Rahman", "Layla Hussein", "Daniel Cooper", "Noor Al Suwaidi", "Priya Sharma"],
        "owner_email": "owner@palmestates.ae",
        "owner_password": "Palm@2026",
    },
    {
        "name": "Desert Homes Abu Dhabi",
        "slug": "desert-homes",
        "tagline": "The capital's finest addresses.",
        "logo_url": "https://ui-avatars.com/api/?name=Desert+Homes&background=b45309&color=fff&size=240&font-size=0.4&bold=true",
        "contact_email": "hello@deserthomes.ae",
        "contact_phone": "+971 2 555 3003",
        "areas": ["Saadiyat Island", "Yas Island", "Al Reem Island", "Al Raha Beach", "Corniche"],
        "agents": ["Hassan Al Mazrouei", "Fatima Al Hosani", "Marcus Adler", "Yara Khalil", "Ali Al Shamsi"],
        "owner_email": "owner@deserthomes.ae",
        "owner_password": "Desert@2026",
    },
]


PROPERTY_TEMPLATES = [
    ("apartment", "1BR Apartment", 1, 1, (700, 1100), (700_000, 1_400_000)),
    ("apartment", "2BR Apartment", 2, 2, (1100, 1700), (1_300_000, 2_600_000)),
    ("apartment", "3BR Apartment", 3, 3, (1700, 2400), (2_400_000, 4_500_000)),
    ("apartment", "Studio Apartment", 0, 1, (450, 650), (500_000, 950_000)),
    ("villa", "4BR Villa", 4, 5, (3500, 5500), (4_500_000, 9_000_000)),
    ("villa", "5BR Villa", 5, 6, (5500, 7500), (8_000_000, 15_000_000)),
    ("villa", "6BR Signature Villa", 6, 7, (7500, 12000), (15_000_000, 35_000_000)),
    ("townhouse", "3BR Townhouse", 3, 4, (2200, 2800), (2_200_000, 3_500_000)),
    ("townhouse", "4BR Townhouse", 4, 5, (2800, 3600), (3_400_000, 5_500_000)),
    ("penthouse", "Sky Penthouse", 4, 5, (4500, 7000), (12_000_000, 30_000_000)),
    ("office", "Open-Plan Office", 0, 2, (1500, 4000), (1_800_000, 6_500_000)),
    ("plot", "Residential Plot", 0, 0, (5000, 12000), (2_000_000, 8_000_000)),
]


def _money_round(value: float) -> int:
    if value >= 5_000_000:
        return int(round(value / 100_000) * 100_000)
    if value >= 1_000_000:
        return int(round(value / 50_000) * 50_000)
    return int(round(value / 10_000) * 10_000)


def _rent_from_sale(sale_price: int) -> int:
    yearly = sale_price * random.uniform(0.045, 0.07)
    return int(round(yearly / 5_000) * 5_000)


async def _slug_exists(conn: asyncpg.Connection, slug: str) -> bool:
    return bool(await conn.fetchval("SELECT 1 FROM tenants WHERE slug = $1", slug))


async def _seed_tenant(conn: asyncpg.Connection, t: dict) -> dict:
    if await _slug_exists(conn, t["slug"]):
        print(f"  [skip] tenant slug={t['slug']} already exists")
        return {"slug": t["slug"], "skipped": True}

    rng = random.Random(t["slug"])

    async with conn.transaction():
        tenant_id = await conn.fetchval(
            """
            INSERT INTO tenants (
                name, slug, status, currency, timezone, locale,
                contact_email, contact_phone,
                public_site_enabled, public_site_logo_url, public_site_tagline,
                approved_at
            ) VALUES ($1,$2,'active','AED','Asia/Dubai','en',$3,$4,true,$5,$6, now())
            RETURNING id
            """,
            t["name"], t["slug"], t["contact_email"], t["contact_phone"],
            t["logo_url"], t["tagline"],
        )

        owner_id = await conn.fetchval(
            """
            INSERT INTO users (tenant_id, email, password_hash, full_name, role, status, email_verified)
            VALUES ($1, $2, $3, $4, 'company_owner', 'active', true)
            RETURNING id
            """,
            tenant_id, t["owner_email"], hash_password(t["owner_password"]),
            t["name"] + " Owner",
        )

        agent_ids: list[uuid.UUID] = []
        for i, name in enumerate(t["agents"]):
            slug_part = name.lower().replace(" ", ".")
            agent_id = await conn.fetchval(
                """
                INSERT INTO agents (
                    tenant_id, full_name, email, phone, photo_key,
                    license_id, license_expiry_at, status,
                    default_commission_type, default_commission_value
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,'active','percentage',2.0)
                RETURNING id
                """,
                tenant_id, name, f"{slug_part}@{t['slug']}.ae",
                f"+971 5{rng.randint(0,9)} {rng.randint(1000000, 9999999)}",
                AGENT_PHOTOS[i % len(AGENT_PHOTOS)],
                f"RERA-{rng.randint(10000, 99999)}",
                date.today() + timedelta(days=rng.randint(180, 730)),
            )
            agent_ids.append(agent_id)

        for n in range(20):
            ptype, title_base, beds, baths, size_range, price_range = rng.choice(PROPERTY_TEMPLATES)
            area = rng.choice(t["areas"])
            size = rng.randint(*size_range)
            sale_price = _money_round(rng.uniform(*price_range))
            address_no = rng.randint(1, 99)
            ref = f"{t['slug'][:3].upper()}-{n+1:03d}"
            title = f"{title_base} in {area}"
            description = (
                f"A {title_base.lower()} located in the heart of {area}. "
                f"Bright, well-laid-out interiors, premium finishes, and easy access to amenities. "
                f"Ideal for {'investors' if rng.random() < 0.4 else 'end-users'}."
            )

            prop_id = await conn.fetchval(
                """
                INSERT INTO properties (
                    tenant_id, internal_reference, title, description, property_type,
                    bedrooms, bathrooms, size_sqft, price, currency,
                    address_line, city, area, country, amenities, status, created_by_user_id
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,'AED',$10,$11,$12,'AE',$13::jsonb,'available',$14
                ) RETURNING id
                """,
                tenant_id, ref, title, description, ptype,
                beds if beds > 0 else None, baths if baths > 0 else None,
                size, sale_price,
                f"{address_no} {area} Avenue", "Dubai" if "Dubai" in area or area in ("JBR", "Bluewaters") else "Abu Dhabi",
                area, '["Pool","Gym","Covered Parking","24/7 Security","Built-in Wardrobes"]',
                owner_id,
            )

            await conn.execute(
                "INSERT INTO property_agents (property_id, agent_id, tenant_id, is_primary) VALUES ($1,$2,$3,true)",
                prop_id, rng.choice(agent_ids), tenant_id,
            )

            purpose = "sale" if rng.random() < 0.7 else ("rent_long" if rng.random() < 0.8 else "rent_short")
            if purpose == "sale":
                list_price, rent_period = sale_price, None
            elif purpose == "rent_long":
                list_price, rent_period = _rent_from_sale(sale_price), "yearly"
            else:
                list_price, rent_period = max(800, int(_rent_from_sale(sale_price) / 250)), "weekly"

            await conn.execute(
                """
                INSERT INTO listings (
                    tenant_id, property_id, purpose, title, description, price, currency,
                    rent_period, status, listing_tier, valid_from, valid_until, portal_sync_enabled
                ) VALUES ($1,$2,$3,$4,$5,$6,'AED',$7,'active',$8, CURRENT_DATE, CURRENT_DATE + interval '90 days', false)
                """,
                tenant_id, prop_id, purpose, title, description, list_price, rent_period,
                "featured" if n < 3 else ("premium" if n < 7 else "standard"),
            )

            photo_count = rng.randint(3, 5)
            chosen = rng.sample(PROPERTY_PHOTOS, photo_count)
            for i, url in enumerate(chosen):
                unique_url = f"{url}&sk={uuid.uuid4().hex[:12]}"
                await conn.execute(
                    """
                    INSERT INTO media (
                        tenant_id, property_id, kind, storage_key,
                        mime_type, size_bytes, width, height, ordering, alt_text
                    ) VALUES ($1,$2,'image',$3,'image/jpeg',$4,$5,$6,$7,$8)
                    """,
                    tenant_id, prop_id, unique_url,
                    rng.randint(150_000, 900_000), 1600, 1067, i,
                    f"{title} photo {i+1}",
                )

    return {"slug": t["slug"], "skipped": False, "owner_email": t["owner_email"], "owner_password": t["owner_password"]}


async def main() -> None:
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        print("DATABASE_URL is required", file=sys.stderr)
        sys.exit(1)

    # asyncpg wants the raw scheme, strip +asyncpg if present
    dsn = dsn.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        results = []
        for t in TENANTS:
            print(f"Seeding {t['name']} ({t['slug']})...")
            results.append(await _seed_tenant(conn, t))

        print()
        print("=" * 60)
        print("DEMO LOGIN CREDENTIALS")
        print("=" * 60)
        for r in results:
            if r["skipped"]:
                print(f"  {r['slug']:20} (already existed — skipped)")
            else:
                print(f"  {r['slug']:20} {r['owner_email']:35} {r['owner_password']}")
        print()
        print("Public sites (after API redeploy):")
        for r in results:
            print(f"  /p/{r['slug']}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
