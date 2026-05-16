"""Static amenity catalog — source of truth for property amenity keys.

All keys are snake_case Dubizzle-compatible codes. Labels are human-readable.
applies_to restricts which property types the amenity is relevant for.

§1 Common residential amenities apply to all residential types unless restricted.
§2 Apartment-specific, §3 Villa-specific, §4 Townhouse/Penthouse, §6 Commercial.
§5 Plot attributes are typed columns, not amenities — excluded here.
fit_out_status is a typed column (migration 0039), not an amenity — excluded.
"""

from __future__ import annotations

from pydantic import BaseModel

from apps.api.models.enums import PropertyType

_ALL_RESIDENTIAL = [
    PropertyType.APARTMENT,
    PropertyType.VILLA,
    PropertyType.TOWNHOUSE,
    PropertyType.PENTHOUSE,
    PropertyType.BUILDING,
]
_VILLA_LIKE = [PropertyType.VILLA, PropertyType.TOWNHOUSE, PropertyType.PENTHOUSE]
_APARTMENT_LIKE = [PropertyType.APARTMENT, PropertyType.PENTHOUSE, PropertyType.BUILDING]
_COMMERCIAL = [PropertyType.OFFICE, PropertyType.RETAIL, PropertyType.WAREHOUSE]


class Amenity(BaseModel):
    key: str
    label: str
    applies_to: list[PropertyType]


class AmenityCategory(BaseModel):
    key: str
    label: str
    items: list[Amenity]


# ---------------------------------------------------------------------------
# §1 Common amenities (all residential types)
# ---------------------------------------------------------------------------

_BUILDING_COMMON = AmenityCategory(
    key="building_common",
    label="Building",
    items=[
        Amenity(key="lobby_in_building", label="Lobby in Building",
                applies_to=_APARTMENT_LIKE + [PropertyType.OFFICE, PropertyType.RETAIL]),
        Amenity(key="service_elevators", label="Service Elevators",
                applies_to=_ALL_RESIDENTIAL + [PropertyType.OFFICE, PropertyType.RETAIL]),
        Amenity(key="reception_waiting_room", label="Reception / Waiting Room",
                applies_to=_ALL_RESIDENTIAL + [PropertyType.OFFICE]),
        Amenity(key="prayer_room", label="Prayer Room",
                applies_to=_ALL_RESIDENTIAL + _COMMERCIAL),
        Amenity(key="storage_areas", label="Storage Areas",
                applies_to=_ALL_RESIDENTIAL + _COMMERCIAL),
        Amenity(key="waste_disposal", label="Waste Disposal",
                applies_to=_ALL_RESIDENTIAL + _COMMERCIAL),
    ],
)

_INDOOR_COMMON = AmenityCategory(
    key="indoor_common",
    label="Indoor",
    items=[
        Amenity(key="central_ac", label="Central A/C & Heating", applies_to=_ALL_RESIDENTIAL),
        Amenity(key="double_glazed_windows", label="Double Glazed Windows", applies_to=_ALL_RESIDENTIAL),
        Amenity(key="electricity_backup", label="Electricity Backup",
                applies_to=_ALL_RESIDENTIAL + _COMMERCIAL),
        Amenity(key="built_in_wardrobes", label="Built-in Wardrobes", applies_to=_ALL_RESIDENTIAL),
        Amenity(key="walk_in_closet", label="Walk-in Closet",
                applies_to=[PropertyType.VILLA, PropertyType.TOWNHOUSE, PropertyType.PENTHOUSE,
                            PropertyType.APARTMENT]),
        Amenity(key="built_in_kitchen_appliances", label="Built-in Kitchen Appliances",
                applies_to=_ALL_RESIDENTIAL),
        Amenity(key="laundry_room", label="Laundry Room (in-unit)", applies_to=_ALL_RESIDENTIAL),
        Amenity(key="intercom", label="Intercom", applies_to=_ALL_RESIDENTIAL),
    ],
)

_OUTDOOR_COMMON = AmenityCategory(
    key="outdoor_common",
    label="Outdoor",
    items=[
        Amenity(key="balcony_or_terrace", label="Balcony / Terrace", applies_to=_ALL_RESIDENTIAL),
        Amenity(key="barbeque_area", label="Barbeque Area", applies_to=_ALL_RESIDENTIAL),
        Amenity(key="lawn_or_garden", label="Lawn / Garden", applies_to=_ALL_RESIDENTIAL),
        Amenity(key="kids_play_area", label="Kids Play Area", applies_to=_ALL_RESIDENTIAL),
    ],
)

_HEALTH_FITNESS = AmenityCategory(
    key="health_fitness",
    label="Health & Fitness",
    items=[
        Amenity(key="shared_gym", label="Shared Gym",
                applies_to=_ALL_RESIDENTIAL + [PropertyType.OFFICE]),
        Amenity(key="shared_pool", label="Shared Swimming Pool",
                applies_to=[PropertyType.APARTMENT, PropertyType.PENTHOUSE, PropertyType.TOWNHOUSE,
                            PropertyType.BUILDING]),
        Amenity(key="shared_spa", label="Shared Spa",
                applies_to=_ALL_RESIDENTIAL + [PropertyType.OFFICE]),
        Amenity(key="jacuzzi", label="Jacuzzi", applies_to=_ALL_RESIDENTIAL),
        Amenity(key="sauna", label="Sauna", applies_to=_ALL_RESIDENTIAL),
        Amenity(key="steam_room", label="Steam Room", applies_to=_ALL_RESIDENTIAL),
        Amenity(key="facilities_for_disabled", label="Facilities for Disabled",
                applies_to=_ALL_RESIDENTIAL + _COMMERCIAL),
    ],
)

_SECURITY = AmenityCategory(
    key="security",
    label="Security",
    items=[
        Amenity(key="security_staff", label="Security Staff",
                applies_to=_ALL_RESIDENTIAL + _COMMERCIAL),
        Amenity(key="cctv_security", label="CCTV Security",
                applies_to=_ALL_RESIDENTIAL + _COMMERCIAL),
        Amenity(key="maintenance_staff", label="Maintenance Staff",
                applies_to=_ALL_RESIDENTIAL + _COMMERCIAL),
        Amenity(key="cleaning_services", label="Cleaning Services",
                applies_to=_ALL_RESIDENTIAL + _COMMERCIAL),
    ],
)

_VIEWS = AmenityCategory(
    key="views",
    label="Views",
    items=[
        Amenity(key="view_of_water", label="View of Water",
                applies_to=_ALL_RESIDENTIAL + _COMMERCIAL),
        Amenity(key="view_of_landmark", label="View of Landmark",
                applies_to=_ALL_RESIDENTIAL + _COMMERCIAL),
    ],
)

_CONNECTIVITY = AmenityCategory(
    key="connectivity_services",
    label="Connectivity & Services",
    items=[
        Amenity(key="broadband_internet", label="Broadband Internet",
                applies_to=_ALL_RESIDENTIAL + _COMMERCIAL),
        Amenity(key="satellite_cable_tv", label="Satellite / Cable TV", applies_to=_ALL_RESIDENTIAL),
        Amenity(key="covered_parking", label="Covered Parking",
                applies_to=_ALL_RESIDENTIAL + _COMMERCIAL),
        Amenity(key="pets_allowed", label="Pets Allowed", applies_to=_ALL_RESIDENTIAL),
        Amenity(key="day_care_center", label="Day Care Center", applies_to=_ALL_RESIDENTIAL),
        Amenity(key="atm_facility", label="ATM Facility",
                applies_to=_ALL_RESIDENTIAL + _COMMERCIAL),
        Amenity(key="cafeteria_canteen", label="Cafeteria / Canteen",
                applies_to=_ALL_RESIDENTIAL + _COMMERCIAL),
        Amenity(key="concierge_service", label="24h Concierge Service",
                applies_to=_APARTMENT_LIKE + [PropertyType.OFFICE]),
        Amenity(key="maid_service", label="Maid Service",
                applies_to=_ALL_RESIDENTIAL),
        Amenity(key="business_center", label="Business Center",
                applies_to=_ALL_RESIDENTIAL + [PropertyType.OFFICE]),
        Amenity(key="first_aid_medical_center", label="First Aid Medical Center",
                applies_to=_ALL_RESIDENTIAL + _COMMERCIAL),
    ],
)

# ---------------------------------------------------------------------------
# §2 Apartment-specific amenities
# ---------------------------------------------------------------------------

_APARTMENT_SPECIFIC = AmenityCategory(
    key="apartment_specific",
    label="Apartment",
    items=[
        Amenity(key="maids_room", label="Maids Room",
                applies_to=[PropertyType.APARTMENT, PropertyType.VILLA, PropertyType.TOWNHOUSE,
                            PropertyType.PENTHOUSE, PropertyType.BUILDING]),
        Amenity(key="shared_kitchen", label="Shared Kitchen",
                applies_to=[PropertyType.APARTMENT, PropertyType.BUILDING]),
        Amenity(key="laundry_facility", label="Laundry Facility (coin-op)",
                applies_to=[PropertyType.APARTMENT, PropertyType.BUILDING]),
    ],
)

# ---------------------------------------------------------------------------
# §3 + §4 Villa / Townhouse / Penthouse amenities
# ---------------------------------------------------------------------------

_VILLA_SPECIFIC = AmenityCategory(
    key="villa_specific",
    label="Villa / Townhouse / Penthouse",
    items=[
        Amenity(key="private_pool", label="Private Pool",
                applies_to=[PropertyType.VILLA, PropertyType.TOWNHOUSE, PropertyType.PENTHOUSE]),
        Amenity(key="private_garden", label="Private Garden",
                applies_to=[PropertyType.VILLA, PropertyType.TOWNHOUSE]),
        Amenity(key="private_gym", label="Private Gym",
                applies_to=_VILLA_LIKE),
        Amenity(key="private_jacuzzi", label="Private Jacuzzi",
                applies_to=_VILLA_LIKE),
        Amenity(key="drivers_room", label="Driver's Room",
                applies_to=[PropertyType.VILLA]),
        Amenity(key="staff_quarters", label="Staff Quarters",
                applies_to=[PropertyType.VILLA, PropertyType.TOWNHOUSE]),
        Amenity(key="study", label="Study",
                applies_to=_VILLA_LIKE + [PropertyType.APARTMENT]),
        Amenity(key="family_room", label="Family Room",
                applies_to=[PropertyType.VILLA, PropertyType.TOWNHOUSE]),
        Amenity(key="show_kitchen", label="Show Kitchen",
                applies_to=[PropertyType.VILLA, PropertyType.PENTHOUSE]),
        Amenity(key="private_lift", label="Private Lift",
                applies_to=[PropertyType.VILLA, PropertyType.PENTHOUSE]),
        Amenity(key="rooftop_terrace", label="Rooftop Terrace",
                applies_to=_VILLA_LIKE),
    ],
)

# ---------------------------------------------------------------------------
# §6 Commercial amenities (Office / Retail / Warehouse)
# ---------------------------------------------------------------------------

_COMMERCIAL_AMENITIES = AmenityCategory(
    key="commercial",
    label="Commercial",
    items=[
        Amenity(key="available_furnished", label="Available Furnished",
                applies_to=[PropertyType.OFFICE, PropertyType.RETAIL]),
        Amenity(key="available_networked", label="Available Networked",
                applies_to=[PropertyType.OFFICE]),
        Amenity(key="dining_in_building", label="Dining in Building",
                applies_to=_COMMERCIAL),
        Amenity(key="retail_in_building", label="Retail in Building",
                applies_to=[PropertyType.OFFICE]),
        Amenity(key="conference_room", label="Conference Room",
                applies_to=[PropertyType.OFFICE]),
        Amenity(key="open_plan", label="Open Plan",
                applies_to=[PropertyType.OFFICE]),
        Amenity(key="raised_flooring", label="Raised Flooring",
                applies_to=[PropertyType.OFFICE]),
        Amenity(key="server_room", label="Server Room",
                applies_to=[PropertyType.OFFICE]),
        Amenity(key="loading_bay", label="Loading Bay",
                applies_to=[PropertyType.WAREHOUSE]),
        Amenity(key="cold_storage", label="Cold Storage",
                applies_to=[PropertyType.WAREHOUSE]),
        Amenity(key="dock_leveller", label="Dock Leveller",
                applies_to=[PropertyType.WAREHOUSE]),
        Amenity(key="mezzanine_floor", label="Mezzanine Floor",
                applies_to=[PropertyType.WAREHOUSE, PropertyType.RETAIL]),
        Amenity(key="ground_floor", label="Ground Floor Unit",
                applies_to=[PropertyType.RETAIL]),
        Amenity(key="corner_unit", label="Corner Unit",
                applies_to=[PropertyType.RETAIL]),
    ],
)

# ---------------------------------------------------------------------------
# Full catalog
# ---------------------------------------------------------------------------

AMENITY_CATALOG: list[AmenityCategory] = [
    _BUILDING_COMMON,
    _INDOOR_COMMON,
    _OUTDOOR_COMMON,
    _HEALTH_FITNESS,
    _SECURITY,
    _VIEWS,
    _CONNECTIVITY,
    _APARTMENT_SPECIFIC,
    _VILLA_SPECIFIC,
    _COMMERCIAL_AMENITIES,
]

# Flat set of all valid keys — used for O(1) validation.
VALID_AMENITY_KEYS: frozenset[str] = frozenset(
    amenity.key
    for category in AMENITY_CATALOG
    for amenity in category.items
)
