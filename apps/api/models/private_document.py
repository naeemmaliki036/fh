"""PrivateDocument model — shared polymorphic table for all private files.

All private files (agent RERA IDs, passports, contracts, KYC) land here
regardless of which domain owns them. The entity_type + entity_id pair acts
as a soft polymorphic FK; the application layer validates referential
integrity because a DB FK across multiple tables is not feasible.

Storage key convention (enforced by backend-dev upload service):
    private/{tenant_id}/{entity_type}/{entity_id}/{uuid}-{sanitised_filename}

This keeps keys deterministically tenant-scoped so IAM policies on S3 can
also enforce isolation (e.g. bucket policy matching key prefix).

Access control:
- Every read must produce a signed URL — never the raw S3 key.
- Every access must create an AuditLog entry with action=DOCUMENT_ACCESSED.
Both rules are enforced by the service layer (backend-dev's territory).
"""

import uuid

from sqlalchemy import BigInteger, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TenantMixin, TimestampMixin, UUIDMixin

from .enums import PrivateDocumentEntityType, PrivateDocumentKind

_ev = lambda x: [e.value for e in x]  # noqa: E731


class PrivateDocument(Base, UUIDMixin, TimestampMixin, TenantMixin):
    __tablename__ = "private_documents"

    __table_args__ = (
        # storage_key uniqueness handled via CREATE UNIQUE INDEX in migration;
        # declaring it here keeps the ORM constraint map consistent.
        UniqueConstraint("storage_key", name="uq_private_documents_storage_key"),
    )

    # Which domain entity owns this document.
    entity_type: Mapped[PrivateDocumentEntityType] = mapped_column(
        Enum(PrivateDocumentEntityType,
             name="private_document_entity_type",
             create_type=False,
             values_callable=_ev),
        nullable=False,
    )

    # Polymorphic PK of the owning entity — no DB-level FK.
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )

    # Document classification for UI rendering and access-control rules.
    kind: Mapped[PrivateDocumentKind] = mapped_column(
        Enum(PrivateDocumentKind,
             name="private_document_kind",
             create_type=False,
             values_callable=_ev),
        nullable=False,
    )

    # S3 object key — unique globally; tenant-prefixed by convention.
    storage_key: Mapped[str] = mapped_column(String(1024), nullable=False)

    original_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(128), nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)

    # Uploader — tenant user XOR platform admin; both nullable = system upload.
    uploaded_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    uploaded_by_platform_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("platform_users.id", ondelete="SET NULL"),
        nullable=True,
    )
