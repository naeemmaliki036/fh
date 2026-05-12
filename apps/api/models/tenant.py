"""Tenant model — the root multi-tenancy anchor.

Tenant deliberately does NOT use TenantMixin; it IS the tenant.
approved_by_id is a soft FK to platform_users.id (no DB-level FK to avoid
circular dependency in migration ordering — the service layer enforces this).
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TimestampMixin, UUIDMixin

from .enums import TenantStatus


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

    # Public site settings — master toggle + branding.
    public_site_enabled: Mapped[bool] = mapped_column(
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

    # Approval trail — nullable until a platform admin approves.
    approved_at: Mapped[datetime | None] = mapped_column(
        nullable=True,
    )
    # Soft reference to platform_users.id; no DB-level FK (see docstring).
    approved_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )
