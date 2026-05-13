"""ListingDocument model — public-facing documents attached to a listing.

Stored in Cloudflare R2 (public media bucket). storage_key is the R2 object
path; the CDN URL is assembled by the service layer.

kind values (plain text, not a Postgres enum to avoid migration overhead for
new kinds):
  brochure / floor_plan / payment_plan / other

Every download action that should be logged must do so via AuditLog
(service layer responsibility — not enforced here).
"""

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TimestampMixin, UUIDMixin


class ListingDocument(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "listing_documents"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # R2 object key — service assembles the full CDN URL.
    storage_key: Mapped[str] = mapped_column(Text, nullable=False, unique=True)

    # Original filename as uploaded by the user.
    file_name: Mapped[str] = mapped_column(Text, nullable=False)

    mime_type: Mapped[str] = mapped_column(Text, nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)

    # brochure / floor_plan / payment_plan / other
    kind: Mapped[str] = mapped_column(Text, nullable=False)

    uploaded_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
