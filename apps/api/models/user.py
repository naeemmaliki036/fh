"""User model — tenant-scoped users.

Uses TenantMixin for tenant_id FK + index.
Unique constraint is (tenant_id, email) — same email can exist across tenants.
RLS policy on this table filters by current_setting('app.tenant_id')::uuid.
"""

from datetime import datetime

from sqlalchemy import Boolean, Enum, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TenantMixin, TimestampMixin, UUIDMixin

from .enums import TenantRole, UserStatus


class User(Base, UUIDMixin, TimestampMixin, TenantMixin):
    __tablename__ = "users"

    __table_args__ = (
        UniqueConstraint("tenant_id", "email", name="uq_users_tenant_email"),
    )

    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    # Hashing is backend-dev's responsibility; column stores bcrypt output.
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)

    role: Mapped[TenantRole] = mapped_column(
        Enum(TenantRole, name="tenant_role", create_type=False,
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )

    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="user_status", create_type=False,
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=UserStatus.ACTIVE,
        server_default=UserStatus.ACTIVE.value,
    )

    email_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    last_login_at: Mapped[datetime | None] = mapped_column(nullable=True)

    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
