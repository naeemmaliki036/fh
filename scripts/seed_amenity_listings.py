#!/usr/bin/env python3
"""Seed 10 listings per active tenant on staging, with the new amenity catalog
and structured attributes populated. Used to validate the migration 0039
end-to-end against staging data.

Usage:
    /Users/mna036/mna-bytes/fh/.venv/bin/python scripts/seed_amenity_listings.py
"""

from __future__ import annotations

import random
import sys
from typing import Any

import httpx

API = "https://fh-staging-api.up.railway.app"
PASSWORD = "Miange@036"
TENANT_OWNERS = [
    ("mna-homes", "devmna036+mnahomes@gmail.com"),
    ("marina-realty", "devmna036+marinarealty@gmail.com"),
    ("palm-estates", "devmna036+palmestates@gmail.com"),
    ("desert-homes", "devmna036+deserthomes@gmail.com"),
]
GREEN, RED, RESET = "\033[92m", "\033[91m", "\033[0m"

# ---------------------------------------------------------------------------
# Per-archetype property recipes — 10 entries per tenant
# ---------------------------------------------------------------------------

CITIES = ["Dubai", "Abu Dhabi", "Sharjah"]
AREAS = {
    "Dubai": ["Marina", "Downtown", "Palm Jumeirah", "JVC", "Business Bay"],
    "Abu Dhabi": ["Saadiyat Island", "Al Reem", "Yas Island"],
    "Sharjah": ["Al Khan", "Al Majaz"],
}

# 10 archetypes — wide spread of types + attribute combos
ARCHETYPES: list[dict[str, Any]] = [
    {
        "title": "Modern 1BR Apartment with Marina View",
        "property_type": "apartment", "bedrooms": 1, "bathrooms": 1,
        "size_sqft": 750, "price": 1_200_000,
        "amenities": [
            "central_ac", "balcony_or_terrace", "built_in_wardrobes",
            "shared_pool", "shared_gym", "covered_parking", "view_of_water",
            "concierge_service", "cctv_security", "lobby_in_building",
        ],
        "furnishing_status": "semi_furnished", "completion_status": "ready",
        "view_orientation": "marina", "ownership_type": "freehold",
        "service_charge_aed_sqft": "18.50", "parking_spaces": 1,
        "floor_level": "mid", "rera_permit_number": "DLD-71-2024-001",
    },
    {
        "title": "Spacious 2BR Apartment in Business Bay",
        "property_type": "apartment", "bedrooms": 2, "bathrooms": 2,
        "size_sqft": 1200, "price": 2_400_000,
        "amenities": [
            "central_ac", "balcony_or_terrace", "built_in_kitchen_appliances",
            "laundry_room", "shared_pool", "shared_gym", "kids_play_area",
            "covered_parking", "security_staff", "maids_room",
        ],
        "furnishing_status": "furnished", "completion_status": "ready",
        "view_orientation": "city", "ownership_type": "freehold",
        "service_charge_aed_sqft": "16.25", "parking_spaces": 2,
        "floor_level": "high",
    },
    {
        "title": "Off-plan Studio Apartment — handover Q4 2027",
        "property_type": "apartment", "bedrooms": 0, "bathrooms": 1,
        "size_sqft": 450, "price": 680_000,
        "amenities": [
            "central_ac", "built_in_wardrobes", "shared_pool", "shared_gym",
            "covered_parking", "lobby_in_building", "cctv_security",
        ],
        "furnishing_status": "unfurnished", "completion_status": "off_plan",
        "view_orientation": "partial", "ownership_type": "freehold",
        "handover_year": 2027, "handover_quarter": 4, "payment_plan": True,
        "parking_spaces": 1,
    },
    {
        "title": "Luxury 4BR Villa with Private Pool",
        "property_type": "villa", "bedrooms": 4, "bathrooms": 5,
        "size_sqft": 4500, "price": 8_500_000,
        "amenities": [
            "central_ac", "private_pool", "private_garden", "maids_room",
            "drivers_room", "study", "family_room", "built_in_wardrobes",
            "built_in_kitchen_appliances", "covered_parking", "barbeque_area",
            "security_staff", "cctv_security",
        ],
        "furnishing_status": "unfurnished", "completion_status": "ready",
        "view_orientation": "garden", "ownership_type": "freehold",
        "plot_area_sqft": 6000, "parking_spaces": 3,
    },
    {
        "title": "5BR Villa on Palm Jumeirah — Beach Access",
        "property_type": "villa", "bedrooms": 5, "bathrooms": 6,
        "size_sqft": 6500, "price": 18_000_000,
        "amenities": [
            "central_ac", "private_pool", "private_garden", "private_gym",
            "maids_room", "drivers_room", "staff_quarters", "study",
            "family_room", "show_kitchen", "private_lift", "rooftop_terrace",
            "view_of_water", "covered_parking", "security_staff",
        ],
        "furnishing_status": "furnished", "completion_status": "ready",
        "view_orientation": "sea", "ownership_type": "freehold",
        "plot_area_sqft": 9500, "parking_spaces": 4,
        "service_charge_aed_sqft": "12.00",
    },
    {
        "title": "3BR Townhouse in Family Community",
        "property_type": "townhouse", "bedrooms": 3, "bathrooms": 4,
        "size_sqft": 2400, "price": 3_200_000,
        "amenities": [
            "central_ac", "private_garden", "maids_room", "built_in_wardrobes",
            "covered_parking", "shared_pool", "kids_play_area", "barbeque_area",
            "security_staff", "pets_allowed",
        ],
        "furnishing_status": "semi_furnished", "completion_status": "ready",
        "view_orientation": "garden", "ownership_type": "freehold",
        "plot_area_sqft": 2800, "parking_spaces": 2,
    },
    {
        "title": "Penthouse with 360 Views — top floor",
        "property_type": "penthouse", "bedrooms": 4, "bathrooms": 5,
        "size_sqft": 5200, "price": 22_000_000,
        "amenities": [
            "central_ac", "private_pool", "private_gym", "rooftop_terrace",
            "walk_in_closet", "study", "maids_room", "show_kitchen",
            "view_of_water", "view_of_landmark", "concierge_service",
            "private_lift", "covered_parking",
        ],
        "furnishing_status": "furnished", "completion_status": "ready",
        "view_orientation": "landmark", "ownership_type": "freehold",
        "floor_level": "high", "parking_spaces": 3,
        "service_charge_aed_sqft": "22.50",
    },
    {
        "title": "Residential Plot — Freehold, ready to build",
        "property_type": "plot", "bedrooms": None, "bathrooms": None,
        "size_sqft": None, "price": 4_500_000,
        "amenities": [],
        "completion_status": "ready", "ownership_type": "freehold",
        "plot_area_sqft": 8000,
    },
    {
        "title": "Fitted Office in DIFC — Grade A tower",
        "property_type": "office", "bedrooms": None, "bathrooms": 2,
        "size_sqft": 1800, "price": 5_400_000,
        "amenities": [
            "central_ac", "covered_parking", "shared_gym", "dining_in_building",
            "retail_in_building", "conference_room", "view_of_landmark",
            "security_staff", "cctv_security", "lobby_in_building",
        ],
        "furnishing_status": "furnished", "completion_status": "ready",
        "view_orientation": "city", "ownership_type": "freehold",
        "fit_out_status": "fitted", "parking_spaces": 3,
        "service_charge_aed_sqft": "28.00",
    },
    {
        "title": "Warehouse with Loading Bay — Al Quoz",
        "property_type": "warehouse", "bedrooms": None, "bathrooms": 1,
        "size_sqft": 12000, "price": 9_800_000,
        "amenities": [
            "covered_parking", "security_staff", "cctv_security",
            "available_networked", "electricity_backup",
        ],
        "completion_status": "ready", "ownership_type": "leasehold",
        "ceiling_height_m": "10.50", "parking_spaces": 8,
        "fit_out_status": "shell_and_core",
    },
]


def auth(client: httpx.Client, email: str) -> str | None:
    r = client.post(f"{API}/auth/login", json={"email": email, "password": PASSWORD})
    if r.status_code != 200:
        print(f"  {RED}✗ login {email} → {r.status_code} {r.text[:150]}{RESET}")
        return None
    return r.json().get("access_token")


def create_property(client: httpx.Client, token: str, recipe: dict, idx: int) -> str | None:
    city = random.choice(CITIES)
    area = random.choice(AREAS[city])
    payload = {
        "title": recipe["title"],
        "property_type": recipe["property_type"],
        "price": recipe["price"],
        "currency": "AED",
        "city": city,
        "country": "AE",
        "area": area,
        "description": f"Auto-seeded test listing #{idx + 1} — exercises the migration 0039 amenity + attribute schema.",
    }
    for k in ("bedrooms", "bathrooms", "size_sqft", "amenities", "furnishing_status",
             "completion_status", "ownership_type", "view_orientation",
             "service_charge_aed_sqft", "rera_permit_number", "plot_area_sqft",
             "parking_spaces", "floor_level", "fit_out_status", "ceiling_height_m",
             "handover_year", "handover_quarter", "payment_plan"):
        if recipe.get(k) is not None:
            payload[k] = recipe[k]
    r = client.post(f"{API}/properties", json=payload,
                    headers={"Authorization": f"Bearer {token}"})
    if r.status_code != 201:
        print(f"  {RED}✗ property #{idx + 1} → {r.status_code} {r.text[:200]}{RESET}")
        return None
    return str(r.json()["id"])


def create_listing(client: httpx.Client, token: str, prop_id: str, recipe: dict) -> str | None:
    purpose = "rent_long" if "Apartment" in recipe["title"] and recipe.get("bedrooms") == 1 else "sale"
    price = recipe["price"] if purpose == "sale" else max(40_000, recipe["price"] // 20)
    payload: dict[str, Any] = {
        "title": recipe["title"],
        "purpose": purpose,
        "price": price,
        "currency": "AED",
        "status": "draft",
    }
    if purpose.startswith("rent_"):
        payload["rent_period"] = "yearly"
    r = client.post(f"{API}/properties/{prop_id}/listings", json=payload,
                    headers={"Authorization": f"Bearer {token}"})
    if r.status_code != 201:
        print(f"  {RED}✗ listing for {prop_id} → {r.status_code} {r.text[:200]}{RESET}")
        return None
    return str(r.json()["id"])


def main() -> int:
    random.seed(20260516)
    client = httpx.Client(timeout=60)
    total_props = 0
    total_listings = 0
    for slug, email in TENANT_OWNERS:
        print(f"\n=== {slug} ({email}) ===")
        token = auth(client, email)
        if not token:
            continue
        for idx, recipe in enumerate(ARCHETYPES):
            pid = create_property(client, token, recipe, idx)
            if not pid:
                continue
            total_props += 1
            lid = create_listing(client, token, pid, recipe)
            if lid:
                total_listings += 1
                print(f"  {GREEN}✓{RESET} {recipe['property_type']:10s} {recipe['title'][:50]:50s} prop={pid[:8]} listing={lid[:8]}")
    print(f"\n{GREEN}Seeded {total_props} properties + {total_listings} listings across {len(TENANT_OWNERS)} tenants.{RESET}")
    return 0 if total_listings == len(TENANT_OWNERS) * 10 else 1


if __name__ == "__main__":
    sys.exit(main())
