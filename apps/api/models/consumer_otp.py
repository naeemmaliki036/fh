"""ConsumerOtp model — passwordless OTP codes for consumer login / signup.

email is a plain VARCHAR (not a FK) because OTPs are issued before the
consumer_account row exists (signup) and after it exists (login). Storing
the email directly keeps the lookup simple and avoids FK constraint issues
during the signup handshake.

code_hash stores sha256(otp_code) — plaintext OTP is never persisted.
"""

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Index, SmallInteger, String, Text, func
from sqlalchemy.dialects.postgresql import INET
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, UUIDMixin


class ConsumerOtp(Base, UUIDMixin):
    """One row per issued OTP. Expired/used rows are cleaned by a cron job."""

    __tablename__ = "consumer_otps"

    __table_args__ = (
        Index(
            "idx_consumer_otps_email_created",
            "email",
            "created_at",
        ),
        Index("idx_consumer_otps_expires", "expires_at"),
        CheckConstraint("attempts >= 0", name="ck_consumer_otps_attempts_nonneg"),
    )

    # Not a FK — see module docstring.
    email: Mapped[str] = mapped_column(String(255), nullable=False)

    # sha256 of the OTP code — never store plaintext.
    code_hash: Mapped[str] = mapped_column(String(128), nullable=False)

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    attempts: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=0, server_default="0"
    )

    used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    ip_address: Mapped[str | None] = mapped_column(INET, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)

    # created_at without the full TimestampMixin (no updated_at needed here).
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
