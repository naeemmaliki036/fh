"""Tenant model — the root multi-tenancy anchor.

Tenant deliberately does NOT use TenantMixin; it IS the tenant.
approved_by_id is a soft FK to platform_users.id (no DB-level FK to avoid
circular dependency in migration ordering — the service layer enforces this).
suspended_by_platform_user_id has a DB-level FK to platform_users(id) with
ON DELETE SET NULL (added in 0018).
operating_countries is a Postgres TEXT[] column added in 0017.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TimestampMixin, UUIDMixin

from .enums import PropertiesViewMode, TenantStatus


class Tenant(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "tenants"

    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # URL-safe slug — unique across all tenants, used in subdomains / routes.
    slug: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True,
    )

    status: Mapped[TenantStatus] = mapped_column(
        Enum(TenantStatus, name="tenant_status", create_type=False,
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=TenantStatus.PENDING_APPROVAL,
        server_default=TenantStatus.PENDING_APPROVAL.value,
    )

    # Locale / regional defaults.
    currency: Mapped[str] = mapped_column(
        String(10), nullable=False, default="AED", server_default="AED"
    )
    timezone: Mapped[str] = mapped_column(
        String(64), nullable=False, default="Asia/Dubai", server_default="Asia/Dubai"
    )
    locale: Mapped[str] = mapped_column(
        String(10), nullable=False, default="en", server_default="en"
    )

    # Public company contact details — separate from the owner's personal email.
    contact_email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    contact_phone: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
    )

    # Public site settings — two-gate visibility + branding.
    # Gate 1 (platform): platform admin master switch. When FALSE nothing public
    # works regardless of tenant setting.
    public_site_feature_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    # Gate 2a (tenant): tenant-level on/off toggle.
    public_site_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    # Gate 2b (tenant): fine-grain — when TRUE only listing-detail resolves.
    public_site_direct_links_only: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    public_site_logo_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    public_site_tagline: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    # UI preferences — default view mode for the properties list.
    default_properties_view: Mapped[PropertiesViewMode] = mapped_column(
        Enum(PropertiesViewMode, name="properties_view_mode", create_type=False,
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=PropertiesViewMode.CARD,
        server_default=PropertiesViewMode.CARD.value,
    )

    # Per-tenant public-site customization blob. Schema validation in Pydantic.
    public_site_config: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )

    # ISO 3166-1 alpha-2 country codes the tenant operates in.
    operating_countries: Mapped[list] = mapped_column(
        ARRAY(Text),
        nullable=False,
        server_default=text("ARRAY['AE']::text[]"),
    )

    # Approval trail — nullable until a platform admin approves.
    approved_at: Mapped[datetime | None] = mapped_column(
        nullable=True,
    )
    # Soft reference to platform_users.id; no DB-level FK (see docstring).
    approved_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )

    # Per-tenant media upload caps — platform admins can raise above the floor.
    # Floors are enforced at DB level (CHECK constraints in migration 0030) and
    # at application level (TenantMediaLimitsRequest validators).
    max_images_per_property: Mapped[int] = mapped_column(
        Integer, nullable=False, default=20, server_default="20"
    )
    max_videos_per_property: Mapped[int] = mapped_column(
        Integer, nullable=False, default=2, server_default="2"
    )
    max_image_mb: Mapped[int] = mapped_column(
        Integer, nullable=False, default=10, server_default="10"
    )
    max_video_mb: Mapped[int] = mapped_column(
        Integer, nullable=False, default=25, server_default="25"
    )

    # Suspension audit trail — populated when status transitions to SUSPENDED.
    suspended_at: Mapped[datetime | None] = mapped_column(
        nullable=True,
    )
    suspended_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    suspended_by_platform_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("platform_users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
