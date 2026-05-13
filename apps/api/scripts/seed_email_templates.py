"""Seed default platform-level email templates — idempotent.

Inserts platform templates (tenant_id=NULL) for all standard keys.
Existing rows are updated in-place to keep copy fresh without duplicating.

Usage:
    python -m apps.api.scripts.seed_email_templates
    # or: make seed-email-templates
"""

import asyncio
import logging

from sqlalchemy import select

from apps.api.config import settings
from apps.api.models.email_template import EmailTemplate
from packages.common.db.session import make_session_factory

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger("fh.seed_email_templates")

# ---------------------------------------------------------------------------
# Template definitions
# ---------------------------------------------------------------------------

_TEMPLATES: list[dict] = [
    {
        "key": "welcome",
        "name": "Welcome (Tenant Approved)",
        "subject": "Welcome to {platform_name}, {owner_name}!",
        "body_html": """<h2>Welcome, {owner_name}!</h2>
<p>Your company <strong>{tenant_name}</strong> has been approved and is now active on {platform_name}.</p>
<p>You can log in at <a href="{login_url}">{login_url}</a> to get started.</p>
<p>If you have any questions, reply to this email and we'll be happy to help.</p>
<p>Best regards,<br>The {platform_name} Team</p>""",
        "body_text": "Welcome, {owner_name}! Your company {tenant_name} has been approved. Log in at {login_url}.",
        "variables": ["platform_name", "owner_name", "tenant_name", "login_url"],
    },
    {
        "key": "tenant_approved",
        "name": "Tenant Approved",
        "subject": "Your account for {tenant_name} is approved",
        "body_html": """<h2>Account Approved</h2>
<p>Hi {owner_name},</p>
<p>Your company account <strong>{tenant_name}</strong> has been reviewed and approved.</p>
<p>Log in here: <a href="{login_url}">{login_url}</a></p>
<p>Best regards,<br>The {platform_name} Team</p>""",
        "body_text": "Hi {owner_name}, your company {tenant_name} has been approved. Log in at {login_url}.",
        "variables": ["platform_name", "owner_name", "tenant_name", "login_url"],
    },
    {
        "key": "tenant_rejected",
        "name": "Tenant Registration Rejected",
        "subject": "Update on your {platform_name} application",
        "body_html": """<h2>Application Update</h2>
<p>Hi {owner_name},</p>
<p>Unfortunately, we were unable to approve the registration for <strong>{tenant_name}</strong>.</p>
<p><strong>Reason:</strong> {reason}</p>
<p>If you believe this is an error, please contact us at <a href="{appeal_url}">{appeal_url}</a>.</p>
<p>Best regards,<br>The {platform_name} Team</p>""",
        "body_text": "Hi {owner_name}, your application for {tenant_name} was not approved. Reason: {reason}. Contact us: {appeal_url}.",
        "variables": ["platform_name", "owner_name", "tenant_name", "reason", "appeal_url"],
    },
    {
        "key": "tenant_suspended",
        "name": "Tenant Account Suspended",
        "subject": "Your {platform_name} account has been suspended",
        "body_html": """<h2>Account Suspended</h2>
<p>Hi {owner_name},</p>
<p>Your company account <strong>{tenant_name}</strong> has been suspended.</p>
<p><strong>Reason:</strong> {reason}</p>
<p>To appeal this decision, please visit <a href="{appeal_url}">{appeal_url}</a>.</p>
<p>Best regards,<br>The {platform_name} Team</p>""",
        "body_text": "Hi {owner_name}, your account {tenant_name} has been suspended. Reason: {reason}. Appeal: {appeal_url}.",
        "variables": ["platform_name", "owner_name", "tenant_name", "reason", "appeal_url"],
    },
    {
        "key": "tenant_reactivated",
        "name": "Tenant Account Reactivated",
        "subject": "Your {platform_name} account is active again",
        "body_html": """<h2>Account Reactivated</h2>
<p>Hi {owner_name},</p>
<p>Great news — your company account <strong>{tenant_name}</strong> has been reactivated and is fully operational.</p>
<p>Log in at <a href="{login_url}">{login_url}</a>.</p>
<p>Best regards,<br>The {platform_name} Team</p>""",
        "body_text": "Hi {owner_name}, your account {tenant_name} has been reactivated. Log in at {login_url}.",
        "variables": ["platform_name", "owner_name", "tenant_name", "login_url"],
    },
    {
        "key": "password_reset",
        "name": "Password Reset",
        "subject": "Reset your {platform_name} password",
        "body_html": """<h2>Password Reset Request</h2>
<p>Hi {user_name},</p>
<p>We received a request to reset your password. Click the link below to set a new one:</p>
<p><a href="{reset_url}">{reset_url}</a></p>
<p>This link expires in {expires_in}. If you didn't request this, you can safely ignore this email.</p>
<p>Best regards,<br>The {platform_name} Team</p>""",
        "body_text": "Hi {user_name}, reset your password: {reset_url} (expires in {expires_in}).",
        "variables": ["platform_name", "user_name", "reset_url", "expires_in"],
    },
    {
        "key": "doc_request",
        "name": "Document Request",
        "subject": "Action required: documents requested by {tenant_name}",
        "body_html": """<h2>Document Submission Request</h2>
<p>Hi {customer_name},</p>
<p><strong>{tenant_name}</strong> has requested the following documents from you:</p>
<p>{document_list}</p>
<p>Please submit your documents securely using the link below:</p>
<p><a href="{doc_request_url}">{doc_request_url}</a></p>
<p>Your verification code is: <strong>{verification_code}</strong></p>
<p>This link expires on {expiry_date}.</p>
<p>Best regards,<br>{tenant_name}</p>""",
        "body_text": "Hi {customer_name}, {tenant_name} requests documents from you. Submit at {doc_request_url} using code {verification_code} (expires {expiry_date}).",
        "variables": [
            "customer_name",
            "tenant_name",
            "document_list",
            "doc_request_url",
            "verification_code",
            "expiry_date",
        ],
    },
    {
        "key": "lead_assigned",
        "name": "Lead Assigned to Agent",
        "subject": "New lead assigned: {lead_name}",
        "body_html": """<h2>New Lead Assigned to You</h2>
<p>Hi {agent_name},</p>
<p>A new lead has been assigned to you:</p>
<ul>
  <li><strong>Name:</strong> {lead_name}</li>
  <li><strong>Source:</strong> {lead_source}</li>
  <li><strong>Notes:</strong> {notes}</li>
</ul>
<p>View the lead in your dashboard: <a href="{lead_url}">{lead_url}</a></p>
<p>Best regards,<br>{tenant_name}</p>""",
        "body_text": "Hi {agent_name}, new lead assigned: {lead_name} (source: {lead_source}). View at {lead_url}.",
        "variables": [
            "agent_name",
            "lead_name",
            "lead_source",
            "notes",
            "lead_url",
            "tenant_name",
        ],
    },
]


# ---------------------------------------------------------------------------
# Seed runner
# ---------------------------------------------------------------------------


async def seed() -> None:
    factory = make_session_factory(settings.database_url)
    async with factory() as session:
        for tmpl_data in _TEMPLATES:
            key = tmpl_data["key"]
            result = await session.execute(
                select(EmailTemplate).where(
                    EmailTemplate.key == key,
                    EmailTemplate.tenant_id.is_(None),
                )
            )
            existing = result.scalar_one_or_none()

            if existing:
                for field, value in tmpl_data.items():
                    setattr(existing, field, value)
                log.info("Updated template: %s", key)
            else:
                row = EmailTemplate(tenant_id=None, active=True, **tmpl_data)
                session.add(row)
                log.info("Inserted template: %s", key)

        await session.commit()
    log.info("Done — %d templates seeded.", len(_TEMPLATES))


if __name__ == "__main__":
    asyncio.run(seed())
