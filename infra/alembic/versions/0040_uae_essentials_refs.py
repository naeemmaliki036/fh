"""uae_essentials_refs

Revision ID: 0040_uae_essentials
Revises: 0039_property_attrs
Create Date: 2026-05-16 00:00:00.000000

Changes:
1. tenants: property_ref_prefix VARCHAR(3), CHECK, unique index, backfill,
   then drop DEFAULT (application must supply it going forward).
2. properties: latitude NUMERIC(9,6), longitude NUMERIC(9,6), build_year SMALLINT
   + CHECK constraints.
3. listings: rent_cheque_count SMALLINT, trakheesi_permit VARCHAR(64),
   is_verified BOOLEAN NOT NULL DEFAULT false, verified_at TIMESTAMPTZ,
   verified_by_user_id UUID FK users(id) ON DELETE SET NULL.
   Composite index (tenant_id, is_verified).
4. media: is_floor_plan BOOLEAN NOT NULL DEFAULT false.
5. audit_action enum: listing_verified, listing_unverified.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0040_uae_essentials"
down_revision: Union[str, None] = "0039_property_attrs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _add_audit_value(conn: sa.engine.Connection, value: str) -> None:
    conn.execute(sa.text(
        f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{value}'"
    ))


# ---------------------------------------------------------------------------
# Backfill: assign a unique 3-char alphanumeric prefix per tenant from slug.
# Uses a PL/pgSQL DO block with a cursor so the logic is atomic in the DB.
# Falls back to TN<n> suffixes; bails after 100 sequential tries.
# ---------------------------------------------------------------------------
_BACKFILL_DDL = """
DO $$
DECLARE
    r         RECORD;
    base_pre  TEXT;
    candidate TEXT;
    suffix    INTEGER;
BEGIN
    FOR r IN SELECT id, slug FROM tenants ORDER BY created_at LOOP
        -- Strip non-alphanumeric, uppercase, take first 3 chars.
        base_pre := UPPER(REGEXP_REPLACE(r.slug, '[^A-Za-z0-9]', '', 'g'));
        base_pre := LEFT(base_pre, 3);
        -- Pad with 'X' if slug too short after stripping.
        WHILE LENGTH(base_pre) < 3 LOOP
            base_pre := base_pre || 'X';
        END LOOP;

        candidate := base_pre;
        suffix    := 1;

        -- Resolve collisions against already-assigned rows.
        LOOP
            EXIT WHEN NOT EXISTS (
                SELECT 1 FROM tenants
                WHERE UPPER(property_ref_prefix) = candidate
                  AND id != r.id
            );

            IF suffix > 100 THEN
                RAISE EXCEPTION 'Cannot resolve prefix collision for tenant % (slug=%)'
                    , r.id, r.slug;
            END IF;

            -- TN1 … TN99 (2-char prefix + numeric suffix, always 3 chars total)
            candidate := LEFT('TN' || suffix::text || '000', 3);
            -- Ensure exactly 3 chars in case suffix grows past single digit
            candidate := RPAD(LEFT(candidate, 3), 3, '0');
            suffix    := suffix + 1;
        END LOOP;

        UPDATE tenants SET property_ref_prefix = candidate WHERE id = r.id;
    END LOOP;
END $$;
"""


def upgrade() -> None:
    conn = op.get_bind()

    # ------------------------------------------------------------------
    # 1. tenants — property_ref_prefix
    # ------------------------------------------------------------------

    # Add as nullable first so existing rows don't violate NOT NULL.
    op.add_column("tenants", sa.Column(
        "property_ref_prefix", sa.String(3), nullable=True,
    ))

    # Temporary DEFAULT 'TMP' so the column is valid during backfill window.
    conn.execute(sa.text(
        "ALTER TABLE tenants "
        "ALTER COLUMN property_ref_prefix SET DEFAULT 'TMP'"
    ))

    # CHECK: must be exactly 3 uppercase alphanumeric chars.
    op.create_check_constraint(
        "ck_tenants_ref_prefix_format",
        "tenants",
        "property_ref_prefix ~ '^[A-Z0-9]{3}$'",
    )

    # Backfill existing tenants via PL/pgSQL cursor.
    conn.execute(sa.text(_BACKFILL_DDL))

    # Make NOT NULL now that every row has a value.
    op.alter_column(
        "tenants", "property_ref_prefix",
        existing_type=sa.String(3),
        nullable=False,
    )

    # Case-insensitive unique index: UPPER(property_ref_prefix).
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_ref_prefix "
        "ON tenants (UPPER(property_ref_prefix))"
    ))

    # Drop the DEFAULT — application must supply the value going forward.
    conn.execute(sa.text(
        "ALTER TABLE tenants "
        "ALTER COLUMN property_ref_prefix DROP DEFAULT"
    ))

    # ------------------------------------------------------------------
    # 2. properties — latitude, longitude, build_year
    # latitude/longitude may already exist on databases where the columns
    # were added outside the migration history.  Guard with IF NOT EXISTS.
    # ------------------------------------------------------------------

    conn.execute(sa.text(
        "ALTER TABLE properties "
        "ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6) NULL"
    ))
    conn.execute(sa.text(
        "ALTER TABLE properties "
        "ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6) NULL"
    ))

    # CHECK constraints — add only if not already present.
    conn.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'ck_properties_latitude_range'
                  AND conrelid = 'properties'::regclass
            ) THEN
                ALTER TABLE properties ADD CONSTRAINT ck_properties_latitude_range
                CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));
            END IF;
        END $$;
    """))
    conn.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'ck_properties_longitude_range'
                  AND conrelid = 'properties'::regclass
            ) THEN
                ALTER TABLE properties ADD CONSTRAINT ck_properties_longitude_range
                CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));
            END IF;
        END $$;
    """))

    op.add_column("properties", sa.Column(
        "build_year", sa.SmallInteger, nullable=True,
    ))
    op.create_check_constraint(
        "ck_properties_build_year_range",
        "properties",
        "build_year IS NULL OR (build_year >= 1900 AND build_year <= 2100)",
    )

    # ------------------------------------------------------------------
    # 3. listings — UAE market fields + verification workflow
    # ------------------------------------------------------------------

    op.add_column("listings", sa.Column(
        "rent_cheque_count", sa.SmallInteger, nullable=True,
    ))
    op.create_check_constraint(
        "ck_listings_rent_cheque_count",
        "listings",
        "rent_cheque_count IS NULL "
        "OR rent_cheque_count IN (1, 2, 4, 6, 12)",
    )

    op.add_column("listings", sa.Column(
        "trakheesi_permit", sa.String(64), nullable=True,
    ))

    # is_verified: NOT NULL default false — backfill existing rows first.
    op.add_column("listings", sa.Column(
        "is_verified", sa.Boolean, nullable=True,
    ))
    conn.execute(sa.text(
        "UPDATE listings SET is_verified = false WHERE is_verified IS NULL"
    ))
    op.alter_column(
        "listings", "is_verified",
        existing_type=sa.Boolean,
        nullable=False,
        server_default=sa.text("false"),
    )

    op.add_column("listings", sa.Column(
        "verified_at", sa.DateTime(timezone=True), nullable=True,
    ))
    op.add_column("listings", sa.Column(
        "verified_by_user_id",
        postgresql.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    ))

    # Composite index for verified-first sort/filter per tenant.
    op.create_index(
        "idx_listings_tenant_verified",
        "listings", ["tenant_id", "is_verified"],
    )

    # ------------------------------------------------------------------
    # 4. media — is_floor_plan
    # ------------------------------------------------------------------

    op.add_column("media", sa.Column(
        "is_floor_plan", sa.Boolean, nullable=True,
    ))
    conn.execute(sa.text(
        "UPDATE media SET is_floor_plan = false WHERE is_floor_plan IS NULL"
    ))
    op.alter_column(
        "media", "is_floor_plan",
        existing_type=sa.Boolean,
        nullable=False,
        server_default=sa.text("false"),
    )

    # ------------------------------------------------------------------
    # 5. audit_action enum — new values
    # ADD VALUE cannot run inside a transaction block in older PG; the
    # IF NOT EXISTS guard makes it safe on repeated runs.
    # ------------------------------------------------------------------
    _add_audit_value(conn, "listing_verified")
    _add_audit_value(conn, "listing_unverified")


def downgrade() -> None:
    conn = op.get_bind()

    # 5. audit_action: enum values cannot be removed — no-op (project pattern).

    # 4. media
    op.drop_column("media", "is_floor_plan")

    # 3. listings (reverse order)
    op.drop_index("idx_listings_tenant_verified", table_name="listings")
    op.drop_column("listings", "verified_by_user_id")
    op.drop_column("listings", "verified_at")
    op.drop_column("listings", "is_verified")
    op.drop_column("listings", "trakheesi_permit")
    op.drop_constraint("ck_listings_rent_cheque_count", "listings", type_="check")
    op.drop_column("listings", "rent_cheque_count")

    # 2. properties (reverse order)
    op.drop_constraint("ck_properties_build_year_range", "properties", type_="check")
    op.drop_column("properties", "build_year")
    conn.execute(sa.text(
        "ALTER TABLE properties "
        "DROP CONSTRAINT IF EXISTS ck_properties_longitude_range"
    ))
    conn.execute(sa.text(
        "ALTER TABLE properties "
        "DROP CONSTRAINT IF EXISTS ck_properties_latitude_range"
    ))
    # latitude/longitude may have pre-existed — do not drop them on downgrade.

    # 1. tenants (reverse order)
    conn.execute(sa.text(
        "DROP INDEX IF EXISTS idx_tenants_ref_prefix"
    ))
    op.drop_constraint("ck_tenants_ref_prefix_format", "tenants", type_="check")
    op.drop_column("tenants", "property_ref_prefix")
