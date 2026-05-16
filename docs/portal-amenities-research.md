# Dubai Real Estate Portal Amenity & Filter Catalog

> Source-of-truth reference for fh's amenity catalog and listing filters.
> Compiled 2026-05-16 from Bayut, Property Finder (PF), and Dubizzle.
> Dubizzle feed codes are the closest thing to an industry-standard taxonomy
> — use them as the canonical mapping when we wire the portal sync layer.

---

## 1. Common amenities (all residential types)

### Building
- `lobby_in_building` — Lobby in Building
- `service_elevators` — Service Elevators
- `reception_waiting_room` — Reception / Waiting Room
- `prayer_room` — Prayer Room
- `storage_areas` — Storage Areas
- `waste_disposal` — Waste Disposal

### Indoor
- `central_ac` — Central A/C & Heating
- `double_glazed_windows` — Double Glazed Windows
- `electricity_backup` — Electricity Backup
- `built_in_wardrobes` — Built-in Wardrobes
- `walk_in_closet` — Walk-in Closet
- `built_in_kitchen_appliances` — Built-in Kitchen Appliances
- `laundry_room` — Laundry Room (in-unit)
- `intercom` — Intercom

### Outdoor
- `balcony_or_terrace` — Balcony / Terrace
- `barbeque_area` — Barbeque Area
- `lawn_or_garden` — Lawn / Garden
- `kids_play_area` — Kids Play Area

### Health & Fitness
- `shared_gym` — Shared Gym
- `shared_pool` — Shared Swimming Pool
- `shared_spa` — Shared Spa
- `jacuzzi` — Jacuzzi
- `sauna` — Sauna
- `steam_room` — Steam Room
- `facilities_for_disabled` — Facilities for Disabled

### Security
- `security_staff` — Security Staff
- `cctv_security` — CCTV Security
- `maintenance_staff` — Maintenance Staff
- `cleaning_services` — Cleaning Services

### Views
- `view_of_water` — View of Water (sea / marina / canal / lake / creek)
- `view_of_landmark` — View of Landmark (Burj Khalifa, etc.)

### Connectivity & Services
- `broadband_internet` — Broadband Internet
- `satellite_cable_tv` — Satellite / Cable TV
- `covered_parking` — Covered Parking
- `pets_allowed` — Pets Allowed
- `day_care_center` — Day Care Center
- `atm_facility` — ATM Facility
- `cafeteria_canteen` — Cafeteria / Canteen
- `concierge_service` — 24h Concierge Service
- `maid_service` — Maid Service (building-level)
- `business_center` — Business Center
- `first_aid_medical_center` — First Aid Medical Center

---

## 2. Apartment-specific amenities

- `maids_room` (also valid for larger apartments)
- `shared_kitchen` — studio / staff buildings
- `laundry_facility` — coin-op in building (distinct from in-unit `laundry_room`)
- `concierge_service` — building desk (towers)
- `lobby_in_building` — expected for towers

---

## 3. Villa-specific amenities

- `private_pool`
- `private_garden`
- `private_gym`
- `private_jacuzzi`
- `maids_room`
- `drivers_room` — common in Dubai villas
- `staff_quarters` — generic catch-all
- `study`
- `family_room` — upstairs sitting area
- `show_kitchen` — luxury villas (prep kitchen)
- `private_lift` — internal elevator
- `rooftop_terrace`

`plot_area_sqft` is a structured attribute, not an amenity (see §7).

---

## 4. Townhouse / penthouse amenities

Townhouses ≈ villa set minus `drivers_room` / `staff_quarters`.

Penthouse additions (no unique codes, just heavier weight):
- `rooftop_terrace`
- `private_pool` (often rooftop)
- `private_gym`
- `walk_in_closet`
- `study`
- `maids_room`

Distinction comes from `floor_level` (top) + larger `size_sqft`.

---

## 5. Plot / land — structured attributes (not amenities)

- `plot_area_sqft`
- `zoning_type` — `residential` / `commercial` / `mixed_use` / `industrial`
- `ownership_type` — `freehold` / `leasehold`
- `gcc_nationals_only` — flag
- `electricity_connected` — bool
- `water_connected` — bool
- `road_access` — bool
- `permit_type` — DLD permit ref
- `gfa_permitted` — Gross Floor Area (sqft)
- `plot_number` — DLD plot number
- `completion_status` — `ready` (serviced) / `unserviced`

---

## 6. Office / retail / warehouse

### Shared commercial amenities
- `covered_parking`
- `available_furnished`
- `available_networked`
- `shared_gym`
- `shared_spa`
- `dining_in_building`
- `retail_in_building`
- `view_of_water`
- `view_of_landmark`
- `conference_room`

### Office attributes
- `fit_out_status` — `fitted` / `shell_and_core` / `partially_fitted`
- `parking_spaces` — count
- `floor_number`
- `open_plan` — bool
- `raised_flooring` — bool
- `server_room` — bool

### Warehouse attributes
- `loading_bay` — bool
- `ceiling_height_m` — clear ceiling, m
- `power_supply_kva`
- `mezzanine_floor` — bool + sqft
- `cold_storage` — bool
- `dock_leveller` — bool

### Retail attributes
- `shop_frontage_m`
- `ground_floor` — bool
- `corner_unit` — bool

---

## 7. Property-level attributes (filterable, not amenities)

- `furnishing_status` — `furnished` / `semi_furnished` / `unfurnished`
- `completion_status` — `ready` / `off_plan`
- `ownership_type` — `freehold` / `leasehold`
- `gcc_nationals_eligible` — bool
- `service_charge_aed_sqft` — AED / sqft / year
- `property_age_years`
- `rera_permit_number` — mandatory in Dubai
- `view_orientation` — `sea` / `city` / `garden` / `pool` / `golf` / `landmark` / `partial` / `none`
- `floor_level` — `low` / `mid` / `high` (or numeric)
- `payment_plan` — bool (off-plan)
- `payment_plan_split` — e.g. "80/20"
- `handover_date` — Q + Y (off-plan)
- `trucheck_verified` — Bayut TruCheck (bool)
- `verified_listing` — PF Verified (bool)
- `trakheesi_permit` — DTCM (short-term rentals)
- `rent_payment_frequency` — `yearly` / `bi_yearly` / `quarterly` / `monthly`
- `short_term_available` — bool

---

## 8. Full filter criteria exposed by portals

| Filter | Type | Notes |
|---|---|---|
| `transaction_type` | enum | `sale` / `rent` |
| `property_type` | multi-enum | apartment, villa, townhouse, penthouse, villa_compound, residential_building, residential_floor, residential_plot, office, retail, warehouse, showroom, factory, commercial_villa, commercial_floor, commercial_plot, land, mixed_use_land, staff_accommodation, shop |
| `location` | hierarchical | city → community → sub-community |
| `price_min` / `price_max` | numeric | AED |
| `bedrooms` | multi-select | studio, 1, 2, 3, 4, 5, 6, 7+ |
| `bathrooms` | multi-select | 1, 2, 3, 4, 5+ |
| `area_min` / `area_max` | numeric | sqft |
| `furnishing_status` | multi-enum | furnished, semi_furnished, unfurnished |
| `completion_status` | enum | ready, off_plan |
| `ownership_type` | enum | freehold, leasehold |
| `amenities` | multi-checkbox | full set from §1–§6 |
| `rent_frequency` | enum | yearly, quarterly, monthly |
| `keyword` | text | title + description |
| `agent_verified` | bool | PF Verified / Bayut TruCheck |
| `has_floor_plan` | bool | Bayut |
| `with_photos` | bool | implicit |
| `posted_since` | enum | today, week, month |
| `sort_by` | enum | price_asc, price_desc, date_newest, popularity, area_asc, area_desc |
| `agency_id` | id | brokerage filter |
| `developer` | text/id | off-plan |
| `handover_year` | numeric | off-plan |
| `payment_plan` | bool | off-plan |
| `view_type` | multi-enum | sea, marina, canal, lake, garden, pool, golf, landmark, city, burj_khalifa |
| `short_term` | bool | monthly / holiday |

---

## 9. fh build notes

1. **Canonical key set** — use Dubizzle codes (mapped above) as fh's internal amenity keys; the portal sync layer can translate per-portal labels back to ours.
2. **JSONB vs columns** — keep `properties.amenities` as JSONB for the open-ended list; promote the high-signal *attributes* in §7 to typed columns (filterable, indexable).
3. **Counted rooms** — `maids_room`, `drivers_room`, `study` can be > 1 in luxury villas. Store as `smallint`, not bool. (Phase 2 — Phase 1 keep as bool/in-amenities for simplicity.)
4. **View sub-type** — `view_of_water` should pair with a `view_orientation` enum (sea / marina / canal / lake / creek).
5. **Service charge** — annual AED/sqft. Store `Numeric(8,2)`.
6. **Commercial fit-out** — `fit_out_status` is the #1 commercial filter. Mandatory field for office/retail listings.
7. **Type-aware UI** — amenity picker should hide irrelevant groups (no `private_pool` on a plot listing).

---

## 10. fh current state (audit, 2026-05-16)

- `properties.amenities` JSONB exists (migration 0005) — never queried, never input via UI.
- Property form has zero amenity input today.
- Public site filters: city / area / purpose / property_type / beds / min_price / max_price.
- Internal /properties filter: status, type, country, city, area, agent, price range, bedrooms range, has_listing.
- Internal /listings filter: status, purpose, tier, agent, price range, country, city.
- Backend `GET /properties` accepts a `tags` CSV but no amenity filter.
- Backend `GET /listings` and public `GET /listings` have no amenity filter.

**Gap fixed in migration 0039**: structured columns added + amenity catalog endpoint + amenities filter on all three listing endpoints + amenity picker UI + rich filter bars (internal + public).
