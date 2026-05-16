"""consumer_accounts

Revision ID: 0044_consumer_accounts
Revises: 0043_mp_countries
Create Date: 2026-05-17 00:00:00.000000

Changes:
1. Enum: consumer_account_status (active, suspended) — idempotent DO block.
2. Table: consumer_accounts — platform-global marketplace end-users.
3. Table: consumer_otps — passwordless OTP codes (sha256-hashed).
4. Table: consumer_favorites — (consumer, listing) saved pairs.
5. Table: consumer_listing_leads — buyer inquiries on consumer-posted listings.
6. Column: properties.consumer_account_id (FK → consumer_accounts, SET NULL).
7. Column: listings.consumer_account_id (FK → consumer_accounts, SET NULL).
8. Column: listings.expires_at (TIMESTAMPTZ NULL) — auto-expire for consumer listings.
9. Seed: platform-owned tenant 'propertypoint-direct' (ON CONFLICT DO NOTHING).
10. audit_action enum: 7 new consumer-related values.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0044_consumer_accounts"
down_revision: Union[str, None] = "0043_mp_countries"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _add_audit_value(conn: sa.engine.Connection, value: str) -> None:
    conn.execute(sa.text(
        f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{value}'"
    ))


def upgrade() -> None:
    conn = op.get_bind()

    # ------------------------------------------------------------------
    # 1 + 2. consumer_accounts (enum created by create_table)
    # ------------------------------------------------------------------
    op.create_table(
        "consumer_accounts",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(32), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "active", "suspended",
                name="consumer_account_status",
            ),
            nullable=False,
            server_default="active",
        ),
        sa.Column("google_sub", sa.String(255), nullable=True),
        sa.Column(
            "last_login_at",
            sa.TIMESTAMP(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("email", name="uq_consumer_accounts_email"),
        sa.UniqueConstraint("google_sub", name="uq_consumer_accounts_google_sub"),
    )

    # Case-insensitive email index for login lookups.
    op.create_index(
        "idx_consumer_accounts_email_lower",
        "consumer_accounts",
        [sa.text("LOWER(email)")],
        unique=True,
    )

    # ------------------------------------------------------------------
    # 3. consumer_otps (no enum column)
    # ------------------------------------------------------------------
    op.create_table(
        "consumer_otps",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        # Plain VARCHAR — not a FK. See model docstring.
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("code_hash", sa.String(128), nullable=False),
        sa.Column(
            "expires_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "attempts",
            sa.SmallInteger(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "used_at",
            sa.TIMESTAMP(timezone=True),
            nullable=True,
        ),
        sa.Column("ip_address", postgresql.INET(), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint("attempts >= 0", name="ck_consumer_otps_attempts_nonneg"),
    )

    # Per-minute rate-limit query: LOWER(email) + created_at DESC.
    op.create_index(
        "idx_consumer_otps_email_created",
        "consumer_otps",
        [sa.text("LOWER(email)"), sa.text("created_at DESC")],
    )

    # Cleanup job scans by expires_at.
    op.create_index(
        "idx_consumer_otps_expires",
        "consumer_otps",
        ["expires_at"],
    )

    # ------------------------------------------------------------------
    # 4. consumer_favorites
    # ------------------------------------------------------------------
    op.create_table(
        "consumer_favorites",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "consumer_account_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("consumer_accounts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "listing_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("listings.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint(
            "consumer_account_id",
            "listing_id",
            name="uq_consumer_favorites_consumer_listing",
        ),
    )

    # Fast favorite-count per listing.
    op.create_index(
        "idx_consumer_favorites_listing",
        "consumer_favorites",
        ["listing_id"],
    )

    # ------------------------------------------------------------------
    # 5. consumer_listing_leads
    # ------------------------------------------------------------------
    op.create_table(
        "consumer_listing_leads",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "listing_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("listings.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "consumer_account_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("consumer_accounts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("buyer_name", sa.String(255), nullable=False),
        sa.Column("buyer_email", sa.String(255), nullable=False),
        sa.Column("buyer_phone", sa.String(32), nullable=True),
        sa.Column("buyer_message", sa.Text(), nullable=True),
        sa.Column(
            "contact_revealed_at",
            sa.TIMESTAMP(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "seller_notified_at",
            sa.TIMESTAMP(timezone=True),
            nullable=True,
        ),
        sa.Column("ip_address", postgresql.INET(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # FK index on listing_id (FK columns always get an index).
    op.create_index(
        "idx_consumer_listing_leads_listing",
        "consumer_listing_leads",
        ["listing_id"],
    )

    # "My leads" query for a consumer (listing owner).
    op.create_index(
        "idx_consumer_listing_leads_consumer",
        "consumer_listing_leads",
        ["consumer_account_id", "created_at"],
    )

    # ------------------------------------------------------------------
    # 6. properties.consumer_account_id
    # ------------------------------------------------------------------
    op.add_column(
        "properties",
        sa.Column(
            "consumer_account_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )
    op.create_foreign_key(
        "fk_properties_consumer_account",
        "properties",
        "consumer_accounts",
        ["consumer_account_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "idx_properties_consumer_account",
        "properties",
        ["consumer_account_id"],
    )

    # ------------------------------------------------------------------
    # 7 & 8. listings.consumer_account_id + listings.expires_at
    # ------------------------------------------------------------------
    op.add_column(
        "listings",
        sa.Column(
            "consumer_account_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )
    op.create_foreign_key(
        "fk_listings_consumer_account",
        "listings",
        "consumer_accounts",
        ["consumer_account_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "idx_listings_consumer_account",
        "listings",
        ["consumer_account_id"],
    )

    op.add_column(
        "listings",
        sa.Column(
            "expires_at",
            sa.TIMESTAMP(timezone=True),
            nullable=True,
        ),
    )
    op.create_index(
        "idx_listings_expires_at",
        "listings",
        ["expires_at"],
    )

    # ------------------------------------------------------------------
    # 9. Seed: platform-owned tenant 'propertypoint-direct'
    # ------------------------------------------------------------------
    op.execute(sa.text("""
        INSERT INTO tenants (
            id,
            name,
            slug,
            status,
            contact_email,
            contact_phone,
            currency,
            timezone,
            locale,
            default_properties_view,
            operating_countries,
            public_site_enabled,
            public_site_feature_enabled,
            aggregator_enabled,
            property_ref_prefix
        )
        VALUES (
            gen_random_uuid(),
            'PropertyPoint Direct',
            'propertypoint-direct',
            'active',
            'direct@propertypoint.local',
            '+0 000 000 0000',
            'AED',
            'Asia/Dubai',
            'en',
            'card',
            ARRAY['AE','SA','QA','BH','KW']::text[],
            -- public_site_enabled: TRUE so consumer listings clear the
            -- marketplace tenant gate. We don't actually serve a /p/{slug}
            -- page for this tenant; the flag is just the gate.
            true,
            false,
            true,
            'PPD'
        )
        ON CONFLICT (slug) DO NOTHING
    """))

    # ------------------------------------------------------------------
    # 10. audit_action enum additions
    # ------------------------------------------------------------------
    _add_audit_value(conn, "consumer_account_created")
    _add_audit_value(conn, "consumer_account_updated")
    _add_audit_value(conn, "consumer_account_suspended")
    _add_audit_value(conn, "consumer_listing_published")
    _add_audit_value(conn, "consumer_listing_expired")
    _add_audit_value(conn, "consumer_favorite_added")
    _add_audit_value(conn, "consumer_listing_lead_submitted")


def downgrade() -> None:
    # Reverse FK indexes and columns on existing tables first.
    op.drop_index("idx_listings_expires_at", table_name="listings")
    op.drop_column("listings", "expires_at")

    op.drop_index("idx_listings_consumer_account", table_name="listings")
    op.drop_constraint("fk_listings_consumer_account", "listings", type_="foreignkey")
    op.drop_column("listings", "consumer_account_id")

    op.drop_index("idx_properties_consumer_account", table_name="properties")
    op.drop_constraint(
        "fk_properties_consumer_account", "properties", type_="foreignkey"
    )
    op.drop_column("properties", "consumer_account_id")

    # Drop tables in reverse FK order.
    op.drop_index(
        "idx_consumer_listing_leads_consumer", table_name="consumer_listing_leads"
    )
    op.drop_index(
        "idx_consumer_listing_leads_listing", table_name="consumer_listing_leads"
    )
    op.drop_table("consumer_listing_leads")

    op.drop_index("idx_consumer_favorites_listing", table_name="consumer_favorites")
    op.drop_table("consumer_favorites")

    op.drop_index("idx_consumer_otps_expires", table_name="consumer_otps")
    op.drop_index("idx_consumer_otps_email_created", table_name="consumer_otps")
    op.drop_table("consumer_otps")

    op.drop_index(
        "idx_consumer_accounts_email_lower", table_name="consumer_accounts"
    )
    op.drop_table("consumer_accounts")

    op.execute(sa.text("DROP TYPE IF EXISTS consumer_account_status"))

    # audit_action values left in place (project convention).
    # Seed tenant left in place — safe to remove manually if needed.
