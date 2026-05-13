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
    {
        "key": "marketing_demo_request",
        "name": "Marketing — Inbound Demo Request",
        "subject": "New demo request from {full_name} ({company_name})",
        "body_html": """<h2>New Demo Request</h2>
<p>A visitor requested a demo from the AqarFlow marketing site.</p>
<ul>
  <li><strong>Name:</strong> {full_name}</li>
  <li><strong>Company:</strong> {company_name}</li>
  <li><strong>Email:</strong> {email}</li>
  <li><strong>Phone:</strong> {phone}</li>
  <li><strong>Country:</strong> {country}</li>
  <li><strong>Team size:</strong> {team_size}</li>
</ul>
<p><strong>Message:</strong></p>
<blockquote>{message}</blockquote>
<p>Follow up within one business day.</p>""",
        "body_text": (
            "New demo request: {full_name} ({company_name}, {country}, team {team_size}). "
            "Email: {email}, Phone: {phone}. Message: {message}"
        ),
        "variables": [
            "full_name",
            "company_name",
            "email",
            "phone",
            "country",
            "team_size",
            "message",
        ],
    },
    {
        "key": "marketing_waitlist",
        "name": "Marketing — Pricing Waitlist Signup",
        "subject": "New pricing-waitlist signup: {email}",
        "body_html": """<h2>New Waitlist Signup</h2>
<p>A visitor joined the AqarFlow pricing waitlist.</p>
<p><strong>Email:</strong> {email}</p>""",
        "body_text": "New pricing-waitlist signup: {email}",
        "variables": ["email"],
    },
    {
        "key": "payment_received",
        "name": "Payment Received",
        "subject": "Payment received: {amount} {currency}",
        "body_html": """<h2>Payment Received</h2>
<p>Hi {tenant_name},</p>
<p>We've received your payment of <strong>{amount} {currency}</strong> for invoice {invoice_id}.</p>
<p>Paid at: {paid_at}.</p>
<p>Thank you,<br>The AqarFlow Team</p>""",
        "body_text": "Payment received: {amount} {currency} for invoice {invoice_id} at {paid_at}.",
        "variables": ["tenant_name", "amount", "currency", "invoice_id", "paid_at"],
    },
    {
        "key": "payment_failed",
        "name": "Payment Failed",
        "subject": "Payment failed for {tenant_name}",
        "body_html": """<h2>Payment Failed</h2>
<p>Hi {tenant_name},</p>
<p>We were unable to process your payment of <strong>{amount} {currency}</strong> for invoice {invoice_id}.</p>
<p><strong>Reason:</strong> {failure_reason}</p>
<p>Please update your payment method: <a href="{retry_url}">{retry_url}</a></p>""",
        "body_text": "Payment failed: {amount} {currency} for {invoice_id}. Reason: {failure_reason}. Retry: {retry_url}",
        "variables": ["tenant_name", "amount", "currency", "invoice_id", "failure_reason", "retry_url"],
    },
    {
        "key": "payment_due",
        "name": "Payment Due",
        "subject": "Payment due in {days_until_due} days",
        "body_html": """<h2>Payment Due Soon</h2>
<p>Hi {tenant_name},</p>
<p>Your invoice {invoice_id} for <strong>{amount} {currency}</strong> is due on {due_at}.</p>""",
        "body_text": "Invoice {invoice_id} ({amount} {currency}) due on {due_at}.",
        "variables": ["tenant_name", "amount", "currency", "invoice_id", "due_at", "days_until_due"],
    },
    {
        "key": "payment_overdue",
        "name": "Payment Overdue",
        "subject": "Payment overdue: {amount} {currency}",
        "body_html": """<h2>Payment Overdue</h2>
<p>Hi {tenant_name},</p>
<p>Invoice {invoice_id} for <strong>{amount} {currency}</strong> was due on {due_at} ({days_overdue} days ago).</p>
<p>Please settle your account to avoid service interruption.</p>""",
        "body_text": "Overdue invoice {invoice_id} ({amount} {currency}), {days_overdue} days past due.",
        "variables": ["tenant_name", "amount", "currency", "invoice_id", "due_at", "days_overdue"],
    },
    {
        "key": "agent_limit_increased",
        "name": "Agent Limit Increased",
        "subject": "Your agent limit was increased to {new_limit}",
        "body_html": """<h2>Agent Limit Increased</h2>
<p>Hi {owner_name},</p>
<p>The agent limit for <strong>{tenant_name}</strong> has been increased from {previous_limit} to <strong>{new_limit}</strong>, effective {effective_date}.</p>
<p>You can now add more agents from your team management dashboard.</p>
<p>Regards,<br>{platform_admin_name}</p>""",
        "body_text": "Agent limit increased from {previous_limit} to {new_limit} effective {effective_date}.",
        "variables": ["tenant_name", "owner_name", "new_limit", "previous_limit", "effective_date", "platform_admin_name"],
    },
    {
        "key": "agent_limit_decreased",
        "name": "Agent Limit Decreased",
        "subject": "Your agent limit was decreased to {new_limit}",
        "body_html": """<h2>Agent Limit Decreased</h2>
<p>Hi {owner_name},</p>
<p>The agent limit for <strong>{tenant_name}</strong> has been decreased from {previous_limit} to <strong>{new_limit}</strong>, effective {effective_date}.</p>
<p><strong>Reason:</strong> {reason}</p>
<p>If you have questions, reply to this email.</p>
<p>Regards,<br>{platform_admin_name}</p>""",
        "body_text": "Agent limit decreased from {previous_limit} to {new_limit} effective {effective_date}. Reason: {reason}",
        "variables": ["tenant_name", "owner_name", "new_limit", "previous_limit", "effective_date", "reason", "platform_admin_name"],
    },
    {
        "key": "listing_limit_changed",
        "name": "Listing Limit Changed",
        "subject": "Your listing limit changed to {new_limit}",
        "body_html": """<h2>Listing Limit Updated</h2>
<p>Hi {tenant_name},</p>
<p>Your listing limit has changed from {previous_limit} to <strong>{new_limit}</strong>, effective {effective_date}.</p>
<p><strong>Reason:</strong> {reason}</p>""",
        "body_text": "Listing limit changed from {previous_limit} to {new_limit} effective {effective_date}. Reason: {reason}",
        "variables": ["tenant_name", "new_limit", "previous_limit", "effective_date", "reason"],
    },
    {
        "key": "subscription_upgraded",
        "name": "Subscription Upgraded",
        "subject": "Welcome to {new_plan}",
        "body_html": """<h2>Subscription Upgraded</h2>
<p>Hi {tenant_name},</p>
<p>Welcome to <strong>{new_plan}</strong>! Your previous plan was {previous_plan}.</p>
<p>New monthly rate: <strong>{monthly_amount} {currency}</strong>, effective {effective_date}.</p>""",
        "body_text": "Upgraded from {previous_plan} to {new_plan} at {monthly_amount} {currency}/mo effective {effective_date}.",
        "variables": ["tenant_name", "new_plan", "previous_plan", "effective_date", "monthly_amount", "currency"],
    },
    {
        "key": "subscription_downgraded",
        "name": "Subscription Downgraded",
        "subject": "Your plan was changed to {new_plan}",
        "body_html": """<h2>Plan Change</h2>
<p>Hi {tenant_name},</p>
<p>Your plan has been changed from {previous_plan} to <strong>{new_plan}</strong>.</p>
<p>New monthly rate: <strong>{monthly_amount} {currency}</strong>, effective {effective_date}.</p>""",
        "body_text": "Plan changed from {previous_plan} to {new_plan} at {monthly_amount} {currency}/mo effective {effective_date}.",
        "variables": ["tenant_name", "new_plan", "previous_plan", "effective_date", "monthly_amount", "currency"],
    },
    {
        "key": "subscription_canceled",
        "name": "Subscription Canceled",
        "subject": "Your subscription was canceled",
        "body_html": """<h2>Subscription Canceled</h2>
<p>Hi {owner_name},</p>
<p>Your subscription for <strong>{tenant_name}</strong> has been canceled, effective {effective_date}.</p>
<p><strong>Reason:</strong> {reason}</p>
<p>If this was a mistake, contact us to reactivate.</p>""",
        "body_text": "Subscription for {tenant_name} canceled effective {effective_date}. Reason: {reason}",
        "variables": ["tenant_name", "owner_name", "effective_date", "reason"],
    },
    {
        "key": "billing_invoice_generated",
        "name": "Billing — Invoice Generated",
        "subject": "Invoice {invoice_id} — {amount} {currency}",
        "body_html": """<h2>New Invoice</h2>
<p>Hi {tenant_name},</p>
<p>Invoice <strong>{invoice_id}</strong> for <strong>{amount} {currency}</strong> has been generated and is due on {due_at}.</p>
<p>View invoice: <a href="{invoice_url}">{invoice_url}</a></p>""",
        "body_text": "Invoice {invoice_id} for {amount} {currency} due {due_at}. View: {invoice_url}",
        "variables": ["tenant_name", "invoice_id", "amount", "currency", "due_at", "invoice_url"],
    },
    {
        "key": "billing_invoice_paid",
        "name": "Billing — Invoice Paid",
        "subject": "Invoice {invoice_id} paid",
        "body_html": """<h2>Invoice Paid</h2>
<p>Hi {tenant_name},</p>
<p>We've recorded payment of <strong>{amount} {currency}</strong> for invoice {invoice_id} on {paid_at}.</p>
<p>Thank you!</p>""",
        "body_text": "Invoice {invoice_id} paid: {amount} {currency} on {paid_at}.",
        "variables": ["tenant_name", "invoice_id", "amount", "currency", "paid_at"],
    },
    {
        "key": "tenant_custom_message",
        "name": "Custom Message from Platform Admin",
        "subject": "{subject}",
        "body_html": """<p>Hi {owner_name},</p>
<p>{body_text}</p>
<p>—<br>{platform_admin_name}<br>AqarFlow Team</p>""",
        "body_text": "Hi {owner_name},\n\n{body_text}\n\n—\n{platform_admin_name}\nAqarFlow Team",
        "variables": ["tenant_name", "owner_name", "subject", "body_text", "platform_admin_name"],
    },
    {
        "key": "new_feature_announcement",
        "name": "New Feature Announcement",
        "subject": "New: {feature_title}",
        "body_html": """<h2>{feature_title}</h2>
<p>Hi {tenant_name},</p>
<p>{feature_summary}</p>
<p><a href="{learn_more_url}">Learn more →</a></p>""",
        "body_text": "{feature_title}: {feature_summary}. Learn more: {learn_more_url}",
        "variables": ["tenant_name", "feature_title", "feature_summary", "learn_more_url"],
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
