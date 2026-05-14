"""locations — countries, cities, areas + seed from TS constants

Revision ID: 0035_locations
Revises: 0034_doc_request_enhancements
Create Date: 2026-05-14 00:00:00.000000

* New tables: countries, cities, areas
* New audit_action enum values: location_created, location_updated, location_deleted
* Seed: AE (8 cities, 281 areas) + SA (12 cities, 0 areas)
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0035_locations"
down_revision: Union[str, None] = "0034_doc_request_enhancements"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# ---------------------------------------------------------------------------
# Seed data (embedded from TS constants at migration-write time)
# ---------------------------------------------------------------------------

_COUNTRIES = [
    {"code": "AE", "name": "United Arab Emirates", "currency": "AED", "flag_emoji": "\U0001f1e6\U0001f1ea", "ordering": 0},
    {"code": "SA", "name": "Saudi Arabia", "currency": "SAR", "flag_emoji": "\U0001f1f8\U0001f1e6", "ordering": 1},
]

_CITIES_AE = [
    {"slug": "abu-dhabi", "label": "Abu Dhabi", "ordering": 0},
    {"slug": "ajman", "label": "Ajman", "ordering": 1},
    {"slug": "al-ain", "label": "Al Ain", "ordering": 2},
    {"slug": "dubai", "label": "Dubai", "ordering": 3},
    {"slug": "fujairah", "label": "Fujairah", "ordering": 4},
    {"slug": "ras-al-khaimah", "label": "Ras Al Khaimah", "ordering": 5},
    {"slug": "sharjah", "label": "Sharjah", "ordering": 6},
    {"slug": "umm-al-quwain", "label": "Umm Al Quwain", "ordering": 7},
]

_CITIES_SA = [
    {"slug": "abha", "label": "Abha", "ordering": 0},
    {"slug": "dammam", "label": "Dammam", "ordering": 1},
    {"slug": "hail", "label": "Hail", "ordering": 2},
    {"slug": "jeddah", "label": "Jeddah", "ordering": 3},
    {"slug": "jubail", "label": "Jubail", "ordering": 4},
    {"slug": "khobar", "label": "Khobar", "ordering": 5},
    {"slug": "mecca", "label": "Mecca", "ordering": 6},
    {"slug": "medina", "label": "Medina", "ordering": 7},
    {"slug": "riyadh", "label": "Riyadh", "ordering": 8},
    {"slug": "tabuk", "label": "Tabuk", "ordering": 9},
    {"slug": "taif", "label": "Taif", "ordering": 10},
    {"slug": "yanbu", "label": "Yanbu", "ordering": 11},
]

_AREAS_BY_CITY_SLUG = {
    "abu-dhabi": [
        ("airport-street", "Airport Street"), ("al-bahia", "Al Bahia"),
        ("al-bateen", "Al Bateen"), ("al-danah", "Al Danah"),
        ("al-falah-street", "Al Falah Street"), ("al-ghadeer", "Al Ghadeer"),
        ("al-jubail-island", "Al Jubail Island"), ("al-karamah", "Al Karamah"),
        ("al-khalidiyah", "Al Khalidiyah"), ("al-khubeirah", "Al Khubeirah"),
        ("al-manaseer", "Al Manaseer"), ("al-maqtaa", "Al Maqtaa"),
        ("al-markaziya", "Al Markaziya"), ("al-maryah-island", "Al Maryah Island"),
        ("al-muntazah", "Al Muntazah"), ("al-muroor", "Al Muroor"),
        ("al-mushrif", "Al Mushrif"), ("al-nahyan", "Al Nahyan"),
        ("al-raha-beach", "Al Raha Beach"), ("al-raha-gardens", "Al Raha Gardens"),
        ("al-rawdah", "Al Rawdah"), ("al-reef", "Al Reef"),
        ("al-reem-island", "Al Reem Island"), ("al-shamkha", "Al Shamkha"),
        ("al-zahiyah", "Al Zahiyah"), ("baniyas", "Baniyas"),
        ("between-two-bridges", "Between Two Bridges"), ("capital-centre", "Capital Centre"),
        ("corniche-area", "Corniche Area"), ("danet-abu-dhabi", "Danet Abu Dhabi"),
        ("hamdan-street", "Hamdan Street"), ("hydra-village", "Hydra Village"),
        ("khalifa-city", "Khalifa City"), ("madinat-zayed", "Madinat Zayed"),
        ("masdar-city", "Masdar City"), ("mina-zayed", "Mina Zayed"),
        ("mohamed-bin-zayed-city", "Mohamed Bin Zayed City"), ("mussafah", "Mussafah"),
        ("rawdhat-abu-dhabi", "Rawdhat Abu Dhabi"), ("saadiyat-island", "Saadiyat Island"),
        ("shakhbout-city", "Shakhbout City"), ("the-marina", "The Marina"),
        ("tourist-club-area", "Tourist Club Area"), ("yas-island", "Yas Island"),
        ("zayed-city", "Zayed City"), ("zayed-sports-city", "Zayed Sports City"),
    ],
    "ajman": [
        ("ain-ajman", "Ain Ajman"), ("ajman-corniche", "Ajman Corniche"),
        ("ajman-downtown", "Ajman Downtown"), ("ajman-marina", "Ajman Marina"),
        ("ajman-uptown", "Ajman Uptown"), ("al-alia", "Al Alia"),
        ("al-amerah", "Al Amerah"), ("al-bahia", "Al Bahia"),
        ("al-bustan", "Al Bustan"), ("al-hamidiyah", "Al Hamidiyah"),
        ("al-helio", "Al Helio"), ("al-humaid-city", "Al Humaid City"),
        ("al-jurf", "Al Jurf"), ("al-mowaihat", "Al Mowaihat"),
        ("al-nakhil", "Al Nakhil"), ("al-nuaimiya", "Al Nuaimiya"),
        ("al-rashidiya", "Al Rashidiya"), ("al-rawda", "Al Rawda"),
        ("al-rumaila", "Al Rumaila"), ("al-sawan", "Al Sawan"),
        ("al-tallah-1", "Al Tallah 1"), ("al-tallah-2", "Al Tallah 2"),
        ("al-yasmeen", "Al Yasmeen"), ("al-zahya", "Al Zahya"),
        ("al-zorah", "Al Zorah"), ("emirates-city", "Emirates City"),
        ("garden-city", "Garden City"), ("liwara-1", "Liwara 1"),
    ],
    "al-ain": [
        ("al-bateen", "Al Bateen"), ("al-fou-ah", "Al Fou'ah"),
        ("al-jahili", "Al Jahili"), ("al-jimi", "Al Jimi"),
        ("al-khibeesi", "Al Khibeesi"), ("al-maqam", "Al Maqam"),
        ("al-markhaniyyah", "Al Markhaniyyah"), ("al-mutarad", "Al Mutarad"),
        ("al-muwaiji", "Al Muwaiji"), ("al-qattara", "Al Qattara"),
        ("al-rawdah-al-sharqiyah", "Al Rawdah Al Sharqiyah"), ("al-sarouj", "Al Sarouj"),
        ("al-tiwayya", "Al Tiwayya"), ("asharij", "Asharij"),
        ("central-district", "Central District"), ("falaj-hazzaa", "Falaj Hazzaa"),
        ("ghnaymah", "Ghnaymah"), ("hili", "Hili"),
        ("ni-mah", "Ni'mah"), ("shiab-al-ashkhar", "Shiab Al Ashkhar"),
        ("sheibat-al-watah", "Sheibat Al Watah"), ("zakhir", "Zakhir"),
    ],
    "dubai": [
        ("al-awir", "Al Awir"), ("al-badaa", "Al Badaa"),
        ("al-barari", "Al Barari"), ("al-barsha", "Al Barsha"),
        ("al-furjan", "Al Furjan"), ("al-garhoud", "Al Garhoud"),
        ("al-jaddaf", "Al Jaddaf"), ("al-karama", "Al Karama"),
        ("al-khawaneej", "Al Khawaneej"), ("al-mamzar", "Al Mamzar"),
        ("al-manara", "Al Manara"), ("al-mina", "Al Mina"),
        ("al-mizhar", "Al Mizhar"), ("al-nahda", "Al Nahda"),
        ("al-quoz", "Al Quoz"), ("al-qusais", "Al Qusais"),
        ("al-rashidiya", "Al Rashidiya"), ("al-safa", "Al Safa"),
        ("al-satwa", "Al Satwa"), ("al-sufouh", "Al Sufouh"),
        ("al-warqaa", "Al Warqaa"), ("al-wasl", "Al Wasl"),
        ("arabian-ranches", "Arabian Ranches"), ("arabian-ranches-2", "Arabian Ranches 2"),
        ("arabian-ranches-3", "Arabian Ranches 3"), ("arjan", "Arjan"),
        ("barsha-heights", "Barsha Heights (Tecom)"), ("bluewaters-island", "Bluewaters Island"),
        ("bur-dubai", "Bur Dubai"), ("business-bay", "Business Bay"),
        ("culture-village", "Culture Village"), ("damac-hills", "Damac Hills"),
        ("damac-hills-2", "Damac Hills 2"), ("damac-lagoons", "Damac Lagoons"),
        ("deira", "Deira"), ("difc", "DIFC"),
        ("discovery-gardens", "Discovery Gardens"), ("downtown-dubai", "Downtown Dubai"),
        ("dubai-creek-harbour", "Dubai Creek Harbour"), ("dubai-festival-city", "Dubai Festival City"),
        ("dubai-harbour", "Dubai Harbour"), ("dubai-hills-estate", "Dubai Hills Estate"),
        ("dubai-internet-city", "Dubai Internet City"), ("dubai-investment-park", "Dubai Investment Park"),
        ("dubai-islands", "Dubai Islands"), ("dubai-marina", "Dubai Marina"),
        ("dubai-media-city", "Dubai Media City"), ("dubai-science-park", "Dubai Science Park"),
        ("dubai-silicon-oasis", "Dubai Silicon Oasis"), ("dubai-south", "Dubai South"),
        ("dubai-sports-city", "Dubai Sports City"), ("dubai-studio-city", "Dubai Studio City"),
        ("dubailand", "Dubailand"), ("emirates-hills", "Emirates Hills"),
        ("expo-city", "Expo City"), ("international-city", "International City"),
        ("jebel-ali", "Jebel Ali"), ("jlt", "Jumeirah Lake Towers"),
        ("jbr", "Jumeirah Beach Residence"), ("jvc", "Jumeirah Village Circle"),
        ("jvt", "Jumeirah Village Triangle"), ("jumeirah", "Jumeirah"),
        ("jumeirah-golf-estates", "Jumeirah Golf Estates"), ("jumeirah-islands", "Jumeirah Islands"),
        ("jumeirah-park", "Jumeirah Park"), ("la-mer", "La Mer"),
        ("meydan", "Meydan"), ("mirdif", "Mirdif"),
        ("mohammed-bin-rashid-city", "Mohammed Bin Rashid City"), ("motor-city", "Motor City"),
        ("mudon", "Mudon"), ("nad-al-sheba", "Nad Al Sheba"),
        ("palm-jumeirah", "Palm Jumeirah"), ("pearl-jumeirah", "Pearl Jumeirah"),
        ("production-city", "Dubai Production City"), ("ras-al-khor", "Ras Al Khor"),
        ("reem", "Reem"), ("remraam", "Remraam"),
        ("serena", "Serena"), ("sheikh-zayed-road", "Sheikh Zayed Road"),
        ("sobha-hartland", "Sobha Hartland"), ("the-greens", "The Greens"),
        ("the-lakes", "The Lakes"), ("the-meadows", "The Meadows"),
        ("the-springs", "The Springs"), ("the-sustainable-city", "The Sustainable City"),
        ("the-valley", "The Valley"), ("the-views", "The Views"),
        ("the-villa", "The Villa"), ("tilal-al-ghaf", "Tilal Al Ghaf"),
        ("town-square", "Town Square"), ("umm-suqeim", "Umm Suqeim"),
        ("wasl-gate", "Wasl Gate"), ("za-abeel", "Za'abeel"),
    ],
    "fujairah": [
        ("al-dana-island", "Al Dana Island"), ("al-faseel-area", "Al Faseel Area"),
        ("al-hayl", "Al Hayl"), ("al-mahatta", "Al Mahatta"),
        ("al-suda", "Al Suda"), ("corniche-al-fujairah", "Corniche Al Fujairah"),
        ("gurfah-area", "Gurfah Area"), ("hamad-bin-abdullah-road", "Hamad Bin Abdullah Road"),
        ("merashid-area", "Merashid Area"), ("mina-al-fajer", "Mina Al Fajer"),
        ("mirbah", "Mirbah"), ("sakamkam", "Sakamkam"),
        ("town-centre", "Town Centre"),
    ],
    "ras-al-khaimah": [
        ("al-dhait", "Al Dhait"), ("al-hail", "Al Hail"),
        ("al-hamra-village", "Al Hamra Village"), ("al-hudaibah", "Al Hudaibah"),
        ("al-kharran", "Al Kharran"), ("al-mairid", "Al Mairid"),
        ("al-marjan-island", "Al Marjan Island"), ("al-nakheel", "Al Nakheel"),
        ("al-qurm", "Al Qurm"), ("al-rams", "Al Rams"),
        ("al-refaa", "Al Refaa"), ("aljazeera-al-hamra", "Aljazeera Al Hamra"),
        ("corniche-ras-al-khaimah", "Corniche Ras Al Khaimah"),
        ("dafan-al-nakheel", "Dafan Al Nakheel"), ("julfar", "Julfar"),
        ("khuzam", "Khuzam"), ("mina-al-arab", "Mina Al Arab"),
        ("rak-city", "RAK City"), ("shamal-julphar", "Shamal Julphar"),
        ("sheikh-khalifa-city", "Sheikh Khalifa City"), ("sheikh-saqr-city", "Sheikh Saqr City"),
        ("yasmin-village", "Yasmin Village"),
    ],
    "sharjah": [
        ("abu-shagara", "Abu Shagara"), ("al-azra", "Al Azra"),
        ("al-ghuwair", "Al Ghuwair"), ("al-hamriyah", "Al Hamriyah"),
        ("al-jazzat", "Al Jazzat"), ("al-jubail", "Al Jubail"),
        ("al-khan", "Al Khan"), ("al-khaledia-suburb", "Al Khaledia Suburb"),
        ("al-mahatah", "Al Mahatah"), ("al-majaz", "Al Majaz"),
        ("al-mamzar", "Al Mamzar"), ("al-manakh", "Al Manakh"),
        ("al-mujarrah", "Al Mujarrah"), ("al-musalla", "Al Musalla"),
        ("al-nabba", "Al Nabba"), ("al-nahda-sharjah", "Al Nahda (Sharjah)"),
        ("al-nasserya", "Al Nasserya"), ("al-qasba", "Al Qasba"),
        ("al-qasimia", "Al Qasimia"), ("al-qulayaah", "Al Qulayaah"),
        ("al-rahmaniya", "Al Rahmaniya"), ("al-rifah", "Al Rifah"),
        ("al-sajaa", "Al Sajaa"), ("al-shahba", "Al Shahba"),
        ("al-shuwaihean", "Al Shuwaihean"), ("al-soor", "Al Soor"),
        ("al-tai", "Al Tai"), ("al-taawun", "Al Taawun"),
        ("al-zahia", "Al Zahia"), ("aljada", "Aljada"),
        ("bu-tina", "Bu Tina"), ("corniche-al-buhaira", "Corniche Al Buhaira"),
        ("hoshi", "Hoshi"), ("muwaileh", "Muwaileh"),
        ("rolla-area", "Rolla Area"), ("sharjah-university-city", "Sharjah University City"),
        ("tilal-city", "Tilal City"),
    ],
    "umm-al-quwain": [
        ("al-abraq-1", "Al Abraq 1"), ("al-butain", "Al Butain"),
        ("al-dar-al-baida", "Al Dar Al Baida"), ("al-haditha", "Al Haditha"),
        ("al-hawiyah", "Al Hawiyah"), ("al-humrah", "Al Humrah"),
        ("al-maqtaa", "Al Maqtaa"), ("al-qarayen", "Al Qarayen"),
        ("al-ramlah", "Al Ramlah"), ("al-rashidiya", "Al Rashidiya"),
        ("al-rass", "Al Rass"), ("al-raudah", "Al Raudah"),
        ("al-riqqah", "Al Riqqah"), ("al-salamah", "Al Salamah"),
        ("al-salam-city", "Al Salam City"), ("falaj-al-mualla", "Falaj Al Mualla"),
        ("green-belt", "Green Belt"), ("umm-al-quwain-marina", "Umm Al Quwain Marina"),
        ("umm-al-thuoob", "Umm Al Thuoob"),
    ],
}


def upgrade() -> None:
    # -----------------------------------------------------------------------
    # 1. New audit_action enum values
    # -----------------------------------------------------------------------
    for val in ("location_created", "location_updated", "location_deleted"):
        op.execute(f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{val}'")

    # -----------------------------------------------------------------------
    # 2. countries table
    # -----------------------------------------------------------------------
    op.create_table(
        "countries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("code", sa.CHAR(2), nullable=False),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("currency", sa.CHAR(3), nullable=True),
        sa.Column("flag_emoji", sa.Text, nullable=True),
        sa.Column("active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("ordering", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("code", name="uq_countries_code"),
    )

    # -----------------------------------------------------------------------
    # 3. cities table
    # -----------------------------------------------------------------------
    op.create_table(
        "cities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("country_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("countries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("slug", sa.Text, nullable=False),
        sa.Column("label", sa.Text, nullable=False),
        sa.Column("active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("ordering", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("country_id", "slug", name="uq_cities_country_slug"),
    )
    op.create_index("ix_cities_country_ordering", "cities", ["country_id", "ordering"])

    # -----------------------------------------------------------------------
    # 4. areas table
    # -----------------------------------------------------------------------
    op.create_table(
        "areas",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("city_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("cities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("slug", sa.Text, nullable=False),
        sa.Column("label", sa.Text, nullable=False),
        sa.Column("active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("ordering", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("city_id", "slug", name="uq_areas_city_slug"),
    )
    op.create_index("ix_areas_city_ordering", "areas", ["city_id", "ordering"])

    # -----------------------------------------------------------------------
    # 5. Seed via raw SQL (idempotent)
    # -----------------------------------------------------------------------
    conn = op.get_bind()

    for c in _COUNTRIES:
        conn.execute(sa.text(
            "INSERT INTO countries (code, name, currency, flag_emoji, ordering) "
            "VALUES (:code, :name, :currency, :flag_emoji, :ordering) "
            "ON CONFLICT (code) DO NOTHING"
        ), c)

    # Seed AE cities
    ae_id = conn.execute(sa.text("SELECT id FROM countries WHERE code = 'AE'")).scalar()
    for city in _CITIES_AE:
        conn.execute(sa.text(
            "INSERT INTO cities (country_id, slug, label, ordering) "
            "VALUES (:country_id, :slug, :label, :ordering) "
            "ON CONFLICT (country_id, slug) DO NOTHING"
        ), {"country_id": ae_id, **city})

    # Seed SA cities
    sa_id = conn.execute(sa.text("SELECT id FROM countries WHERE code = 'SA'")).scalar()
    for city in _CITIES_SA:
        conn.execute(sa.text(
            "INSERT INTO cities (country_id, slug, label, ordering) "
            "VALUES (:country_id, :slug, :label, :ordering) "
            "ON CONFLICT (country_id, slug) DO NOTHING"
        ), {"country_id": sa_id, **city})

    # Seed areas (UAE only)
    for city_slug, areas in _AREAS_BY_CITY_SLUG.items():
        city_id = conn.execute(
            sa.text("SELECT id FROM cities WHERE country_id = :cid AND slug = :slug"),
            {"cid": ae_id, "slug": city_slug},
        ).scalar()
        if city_id is None:
            continue
        for i, (slug, label) in enumerate(areas):
            conn.execute(sa.text(
                "INSERT INTO areas (city_id, slug, label, ordering) "
                "VALUES (:city_id, :slug, :label, :ordering) "
                "ON CONFLICT (city_id, slug) DO NOTHING"
            ), {"city_id": city_id, "slug": slug, "label": label, "ordering": i})


def downgrade() -> None:
    op.drop_index("ix_areas_city_ordering", table_name="areas")
    op.drop_table("areas")
    op.drop_index("ix_cities_country_ordering", table_name="cities")
    op.drop_table("cities")
    op.drop_table("countries")
    # Cannot remove enum values from Postgres without type recreation
