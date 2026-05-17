"""Document-request extras.

Changes:
1. Add 'full_name' to the private_document_kind enum (frontend catalog
   already exposes it; backend was rejecting submissions with 422).
2. Add tenants.document_request_default_instructions TEXT NOT NULL with
   a sensible default so every tenant — existing + future — has a
   starting point to edit. Used by the "Load default instructions"
   button on the new-request wizard.
"""

from alembic import op

revision: str = "0051_doc_request_extras"
down_revision: str | None = "0050_customer_source_agent"
branch_labels = None
depends_on = None


_DEFAULT_INSTRUCTIONS = (
    "<p>Hello,</p>"
    "<p>We are requesting the documents listed below to complete the "
    "verification process for your transaction with us. These details "
    "are required by our compliance team and the regulator, and they "
    "help us serve you faster.</p>"
    "<p><strong>Please make sure each document is clear, legible, and "
    "current (not expired).</strong></p>"
    "<p>If you have any questions, reply to the email you received "
    "or contact your agent. Thank you for your cooperation.</p>"
)


def upgrade() -> None:
    # 1. Add 'full_name' value to the private_document_kind enum (idempotent).
    op.execute(
        "ALTER TYPE private_document_kind ADD VALUE IF NOT EXISTS 'full_name'"
    )

    # 2. tenants.document_request_default_instructions
    op.execute(
        "ALTER TABLE tenants "
        "ADD COLUMN IF NOT EXISTS document_request_default_instructions TEXT "
        "NOT NULL DEFAULT %s" % _SQL_LITERAL(_DEFAULT_INSTRUCTIONS)
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE tenants "
        "DROP COLUMN IF EXISTS document_request_default_instructions"
    )
    # PG can't drop enum values cleanly; leave 'full_name' in place.


def _SQL_LITERAL(s: str) -> str:
    """Naive SQL string literal escaping for use in op.execute strings."""
    return "'" + s.replace("'", "''") + "'"
