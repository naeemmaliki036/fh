"""Customer model — tenant-scoped contact record.

Phone deduplication strategy
-----------------------------
`phone` stores the raw value as entered (display / audit).
`phone_normalized` stores the E.164 result (e.g. +971501234567); backend-dev
normalises via phonenumbers library before insert/update.
A partial unique index on (tenant_id, phone_normalized) WHERE phone_normalized
IS NOT NULL prevents duplicate contacts while allowing rows with no phone.

Email is deliberately non-unique: emails are unreliable for dedup across
portal leads — different portals may submit the same customer with slightly
different email variants. Phone is the source of truth.

assigned_agent_id is the primary account owner. Leads and deals may have
their own agent assignments that diverge over time.

Customer type semantics
-----------------------
customer_type distinguishes individual persons from corporate entities.

For INDIVIDUAL:
  - full_name is the person's full legal name.
  - phone / email are the person's direct contact details.
  - company_trade_license, contact_person_name, contact_person_designation
    are unused (NULL).

For COMPANY:
  - full_name is the legal entity / company name.
  - phone / email are the primary contact — typically the contact person's
    details (enforced at service layer, not DB level).
  - company_trade_license holds the DTCD / trade license number.
  - contact_person_name is required at service layer when type=company.
  - contact_person_designation is optional (e.g. "Managing Director").
"""

import uuid

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TenantMixin, TimestampMixin, UUIDMixin

from .enums import CustomerSource, CustomerStatus, CustomerType

_ev = lambda x: [e.value for e in x]  # noqa: E731


class Customer(Base, UUIDMixin, TimestampMixin, TenantMixin):
    __tablename__ = "customers"

    # No ORM-level UniqueConstraint for phone_normalized — it's a partial
    # unique index (WHERE phone_normalized IS NOT NULL), which SQLAlchemy
    # UniqueConstraint cannot express. Defined in the migration instead.

    customer_type: Mapped[CustomerType] = mapped_column(
        PG_ENUM(
            *[e.value for e in CustomerType],
            name="customer_type",
            create_type=False,
        ),
        nullable=False,
        default=CustomerType.INDIVIDUAL,
        server_default=CustomerType.INDIVIDUAL.value,
    )

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Email kept for display / contact; not used for dedup.
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Raw phone as entered — preserved for display and audit.
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # E.164 normalised phone — used for dedup; partial unique index in DB.
    phone_normalized: Mapped[str | None] = mapped_column(
        String(32), nullable=True
    )

    # ISO 3166-1 alpha-2 (e.g. "AE", "IN").
    nationality: Mapped[str | None] = mapped_column(String(8), nullable=True)

    # BCP-47 language tag (e.g. "en", "ar").
    language: Mapped[str | None] = mapped_column(String(8), nullable=True)

    preferred_currency: Mapped[str | None] = mapped_column(
        String(8), nullable=True
    )

    source: Mapped[CustomerSource] = mapped_column(
        Enum(CustomerSource, name="customer_source", create_type=False,
             values_callable=_ev),
        nullable=False,
        default=CustomerSource.MANUAL,
        server_default=CustomerSource.MANUAL.value,
    )

    status: Mapped[CustomerStatus] = mapped_column(
        Enum(CustomerStatus, name="customer_status", create_type=False,
             values_callable=_ev),
        nullable=False,
        default=CustomerStatus.ACTIVE,
        server_default=CustomerStatus.ACTIVE.value,
    )

    # Company-type fields — NULL for individual customers.
    # company_trade_license: DTCD / trade license number.
    company_trade_license: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )
    # Contact person for corporate customers (required at service layer when
    # customer_type=company).
    contact_person_name: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    # e.g. "Managing Director", "Sales Manager".
    contact_person_designation: Mapped[str | None] = mapped_column(
        String(128), nullable=True
    )

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Primary account-managing agent; may differ from lead/deal assignments.
    assigned_agent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agents.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Who entered this customer into the system.
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
