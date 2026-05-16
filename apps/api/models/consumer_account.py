"""ConsumerAccount model — platform-global marketplace end-users.

Consumers are individuals who post their own property listings directly on
PropertyPoint without going through an agency. Authentication is passwordless
(OTP only). Completely separate from `users` (tenant staff with RBAC).

No TenantMixin — this entity is platform-global, not tenant-scoped.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TimestampMixin, UUIDMixin


class ConsumerAccountStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"


_ev = lambda x: [e.value for e in x]  # noqa: E731


class ConsumerAccount(Base, UUIDMixin, TimestampMixin):
    """One row per marketplace consumer (buyer / owner-lister).

    Login identity is email. google_sub is populated when a consumer
    authenticates via Google OAuth (Phase 2 — column is reserved now).
    """

    __tablename__ = "consumer_accounts"

    email: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True
    )

    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)

    status: Mapped[ConsumerAccountStatus] = mapped_column(
        Enum(
            ConsumerAccountStatus,
            name="consumer_account_status",
            create_type=False,
            values_callable=_ev,
        ),
        nullable=False,
        default=ConsumerAccountStatus.ACTIVE,
        server_default=ConsumerAccountStatus.ACTIVE.value,
    )

    # Populated when consumer signs in with Google (Phase 2).
    google_sub: Mapped[str | None] = mapped_column(
        String(255), nullable=True, unique=True
    )

    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
