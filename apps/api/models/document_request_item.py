"""DocumentRequestItem — one requested document within a DocumentRequest.

Each row represents one slot the customer must fill (e.g., "Passport").
uploaded_document_id is set by the backend when the customer uploads the
file, after it has been stored in S3 and a PrivateDocument row created.

kind reuses the existing private_document_kind Postgres enum — no new type.

ordering controls the display sequence on the customer upload page.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, SmallInteger, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TenantMixin, TimestampMixin, UUIDMixin

from .enums import PrivateDocumentKind

_ev = lambda x: [e.value for e in x]  # noqa: E731


class DocumentRequestItem(Base, UUIDMixin, TimestampMixin, TenantMixin):
    __tablename__ = "document_request_items"

    document_request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("document_requests.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Reuses private_document_kind — create_type=False.
    kind: Mapped[PrivateDocumentKind] = mapped_column(
        Enum(PrivateDocumentKind,
             name="private_document_kind",
             create_type=False,
             values_callable=_ev),
        nullable=False,
    )

    label: Mapped[str] = mapped_column(String(255), nullable=False)

    is_required: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )

    # Set after the customer uploads and the PrivateDocument row is created.
    uploaded_document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("private_documents.id", ondelete="SET NULL"),
        nullable=True,
    )

    uploaded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    ordering: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=0, server_default="0"
    )
