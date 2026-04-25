"""property_listing_media

Revision ID: 0005_property_listing_media
Revises: 0004_customer
Create Date: 2026-04-25 00:00:04.000000

Hand-written migration:
  - 7 Postgres enum types.
  - 4 tables in dependency order: properties → property_agents → listings → media.
  - All indexes including two partial indexes:
      * (tenant_id, internal_reference) WHERE internal_reference IS NOT NULL
      * (property_id) WHERE is_primary = true  [on property_agents]
  - RLS on all 4 tables with the standard tenant_isolation policy.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0005_property_listing_media"
down_revision: Union[str, None] = "0004_customer"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ------------------------------------------------------------------
    # 1. Enum types
    # ------------------------------------------------------------------
    conn.execute(sa.text(
        "CREATE TYPE property_type AS ENUM "
        "('apartment','villa','townhouse','penthouse','office',"
        "'retail','warehouse','plot','building','other')"
    ))
    conn.execute(sa.text(
        "CREATE TYPE property_status AS ENUM "
        "('draft','available','reserved','sold','rented','off_market')"
    ))
    conn.execute(sa.text(
        "CREATE TYPE listing_purpose AS ENUM "
        "('sale','rent_short','rent_long')"
    ))
    conn.execute(sa.text(
        "CREATE TYPE rent_period AS ENUM "
        "('daily','weekly','monthly','yearly')"
    ))
    conn.execute(sa.text(
        "CREATE TYPE listing_status AS ENUM "
        "('draft','active','paused','expired','archived')"
    ))
    conn.execute(sa.text(
        "CREATE TYPE listing_tier AS ENUM "
        "('standard','premium','featured')"
    ))
    conn.execute(sa.text(
        "CREATE TYPE media_kind AS ENUM "
        "('image','video','floorplan','brochure')"
    ))

    # ------------------------------------------------------------------
    # 2. properties
    # ------------------------------------------------------------------
    conn.execute(sa.text("""
        CREATE TABLE properties (
            id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id           UUID            NOT NULL
                                                REFERENCES tenants(id) ON DELETE CASCADE,
            internal_reference  VARCHAR(64),
            title               VARCHAR(255)    NOT NULL,
            description         TEXT,
            property_type       property_type   NOT NULL,
            bedrooms            SMALLINT,
            bathrooms           SMALLINT,
            size_sqft           NUMERIC(12,2),
            price               NUMERIC(14,2),
            currency            VARCHAR(8),
            address_line        VARCHAR(512),
            city                VARCHAR(128),
            area                VARCHAR(128),
            country             VARCHAR(8),
            latitude            NUMERIC(9,6),
            longitude           NUMERIC(9,6),
            amenities           JSONB           DEFAULT '[]'::jsonb,
            status              property_status NOT NULL DEFAULT 'draft',
            created_by_user_id  UUID            REFERENCES users(id) ON DELETE SET NULL,
            created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
            updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
        )
    """))
    conn.execute(sa.text(
        "CREATE INDEX ix_properties_tenant_id ON properties (tenant_id)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_properties_tenant_status ON properties (tenant_id, status)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_properties_tenant_type ON properties (tenant_id, property_type)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_properties_tenant_city ON properties (tenant_id, city)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_properties_tenant_created ON properties (tenant_id, created_at DESC)"
    ))
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX uq_properties_tenant_ref "
        "ON properties (tenant_id, internal_reference) "
        "WHERE internal_reference IS NOT NULL"
    ))
    conn.execute(sa.text("ALTER TABLE properties ENABLE ROW LEVEL SECURITY"))
    conn.execute(sa.text("""
        CREATE POLICY tenant_isolation ON properties
            USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid)
    """))

    # ------------------------------------------------------------------
    # 3. property_agents (M2M, composite PK)
    # ------------------------------------------------------------------
    conn.execute(sa.text("""
        CREATE TABLE property_agents (
            property_id  UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
            agent_id     UUID        NOT NULL REFERENCES agents(id)     ON DELETE CASCADE,
            tenant_id    UUID        NOT NULL REFERENCES tenants(id)    ON DELETE CASCADE,
            is_primary   BOOLEAN     NOT NULL DEFAULT false,
            assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (property_id, agent_id)
        )
    """))
    conn.execute(sa.text(
        "CREATE INDEX ix_property_agents_tenant_agent "
        "ON property_agents (tenant_id, agent_id)"
    ))
    # At most one primary agent per property.
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX uq_property_agents_primary "
        "ON property_agents (property_id) WHERE is_primary = true"
    ))
    conn.execute(sa.text(
        "ALTER TABLE property_agents ENABLE ROW LEVEL SECURITY"
    ))
    conn.execute(sa.text("""
        CREATE POLICY tenant_isolation ON property_agents
            USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid)
    """))

    # ------------------------------------------------------------------
    # 4. listings
    # ------------------------------------------------------------------
    conn.execute(sa.text("""
        CREATE TABLE listings (
            id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id           UUID            NOT NULL
                                                REFERENCES tenants(id)     ON DELETE CASCADE,
            property_id         UUID            NOT NULL
                                                REFERENCES properties(id)  ON DELETE CASCADE,
            purpose             listing_purpose NOT NULL,
            title               VARCHAR(255)    NOT NULL,
            description         TEXT,
            price               NUMERIC(14,2)   NOT NULL,
            currency            VARCHAR(8)      NOT NULL,
            rent_period         rent_period,
            status              listing_status  NOT NULL DEFAULT 'draft',
            listing_tier        listing_tier    NOT NULL DEFAULT 'standard',
            valid_from          DATE,
            valid_until         DATE,
            portal_sync_enabled BOOLEAN         NOT NULL DEFAULT false,
            created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
            updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
        )
    """))
    conn.execute(sa.text(
        "CREATE INDEX ix_listings_tenant_id ON listings (tenant_id)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_listings_tenant_status ON listings (tenant_id, status)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_listings_tenant_property ON listings (tenant_id, property_id)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_listings_tenant_purpose_status "
        "ON listings (tenant_id, purpose, status)"
    ))
    conn.execute(sa.text("ALTER TABLE listings ENABLE ROW LEVEL SECURITY"))
    conn.execute(sa.text("""
        CREATE POLICY tenant_isolation ON listings
            USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid)
    """))

    # ------------------------------------------------------------------
    # 5. media
    # ------------------------------------------------------------------
    conn.execute(sa.text("""
        CREATE TABLE media (
            id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id            UUID        NOT NULL
                                             REFERENCES tenants(id)     ON DELETE CASCADE,
            property_id          UUID        NOT NULL
                                             REFERENCES properties(id)  ON DELETE CASCADE,
            kind                 media_kind  NOT NULL,
            storage_key          VARCHAR(1024) NOT NULL,
            variants             JSONB,
            mime_type            VARCHAR(128)  NOT NULL,
            size_bytes           BIGINT        NOT NULL,
            width                INTEGER,
            height               INTEGER,
            ordering             SMALLINT      NOT NULL DEFAULT 0,
            alt_text             VARCHAR(255),
            uploaded_by_user_id  UUID        REFERENCES users(id) ON DELETE SET NULL,
            created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """))
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX uq_media_storage_key ON media (storage_key)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_media_tenant_id ON media (tenant_id)"
    ))
    # Primary read: ordered gallery for a property.
    conn.execute(sa.text(
        "CREATE INDEX ix_media_tenant_property_ordering "
        "ON media (tenant_id, property_id, ordering)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_media_tenant_kind ON media (tenant_id, kind)"
    ))
    conn.execute(sa.text("ALTER TABLE media ENABLE ROW LEVEL SECURITY"))
    conn.execute(sa.text("""
        CREATE POLICY tenant_isolation ON media
            USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid)
    """))


def downgrade() -> None:
    conn = op.get_bind()

    for table in ("media", "listings", "property_agents", "properties"):
        conn.execute(sa.text(
            f"DROP POLICY IF EXISTS tenant_isolation ON {table}"
        ))
        conn.execute(sa.text(
            f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY"
        ))
    conn.execute(sa.text("DROP TABLE IF EXISTS media"))
    conn.execute(sa.text("DROP TABLE IF EXISTS listings"))
    conn.execute(sa.text("DROP TABLE IF EXISTS property_agents"))
    conn.execute(sa.text("DROP TABLE IF EXISTS properties"))

    for t in ("media_kind", "listing_tier", "listing_status",
              "rent_period", "listing_purpose", "property_status", "property_type"):
        conn.execute(sa.text(f"DROP TYPE IF EXISTS {t}"))
