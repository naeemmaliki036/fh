"""doc_request_enhancements

Revision ID: 0034_doc_request_enhancements
Revises: 0033_off_market_reasons
Create Date: 2026-05-14 00:00:00.000000

* document_requests: ADD property_id, agent_note
* PrivateDocumentKind enum: expand with visa, financial, and identity items
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0034_doc_request_enhancements"
down_revision: Union[str, None] = "0033_off_market_reasons"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_NEW_DOC_KINDS = [
    # Pseudo-field items (text-type document items for UI)
    "date_of_birth",
    "nationality",
    "phone",
    "email",
    # Identity / travel
    "visa",
    "residence_visa",
    "drivers_license",
    "national_id",
    # Financial
    "salary_certificate",
    "bank_statement",
    "source_of_funds",
    "mortgage_approval",
    # Property
    "ejari",
    "makani",
    "title_deed",
]


def upgrade() -> None:
    # --- PrivateDocumentKind enum expansion ---
    for value in _NEW_DOC_KINDS:
        op.execute(
            f"ALTER TYPE private_document_kind ADD VALUE IF NOT EXISTS '{value}'"
        )

    # --- document_requests: new columns ---
    op.add_column(
        "document_requests",
        sa.Column(
            "property_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("properties.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "document_requests",
        sa.Column("agent_note", sa.Text, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("document_requests", "agent_note")
    op.drop_column("document_requests", "property_id")
    # Cannot remove enum values from Postgres without type recreation
