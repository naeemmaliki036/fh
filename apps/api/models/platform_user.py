"""PlatformUser model — cross-tenant platform operators.

These users (Super Admin, Operations Admin, Finance Admin) are NOT scoped to
any tenant and therefore do NOT use TenantMixin.  They are stored in the
platform_users table, separate from the tenant users table.
"""

from datetime import datetime

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TimestampMixin, UUIDMixin

from .enums import PlatformRole, UserStatus


class PlatformUser(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "platform_users"

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )

    # Hashing is backend-dev's responsibility; column stores bcrypt output.
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)

    role: Mapped[PlatformRole] = mapped_column(
        Enum(PlatformRole, name="platform_role", create_type=False,
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
