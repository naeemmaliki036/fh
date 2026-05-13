"""EmailTemplate service — CRUD + test-send for transactional email templates."""

import logging
import uuid
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.email_template import EmailTemplate
from apps.api.services.base import BaseService
from apps.api.services.email_render import render_body_html, render_subject
from packages.common.utils.error_handlers import bad_request, not_found

_log = logging.getLogger("fh.email_template")

# Keys that every tenant gets their own editable copy of on approval.
# key/name/variables are locked; subject/body_html/body_text/active are editable.
TENANT_TEMPLATE_KEYS: tuple[str, ...] = (
    "doc_request",    # sent to customer for document collection
    "lead_assigned",  # sent to agent when a lead is assigned
)


class EmailTemplateService(BaseService):
    """Manages platform- and tenant-level email templates."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    # ------------------------------------------------------------------
    # Query helpers
    # ------------------------------------------------------------------

    async def _get_or_404(self, template_id: uuid.UUID) -> EmailTemplate:
        row = await self.session.get(EmailTemplate, template_id)
        if row is None:
            raise not_found("EmailTemplate")
        return row

    # ------------------------------------------------------------------
    # List
    # ------------------------------------------------------------------

    async def list_templates(
        self,
        *,
        scope: str | None = None,       # "platform" | "tenant"
        tenant_id: uuid.UUID | None = None,
        caller_tenant_id: uuid.UUID | None = None,
    ) -> tuple[list[EmailTemplate], int]:
        """Return templates filtered by scope.

        Platform users may pass scope=platform|tenant + optional tenant_id.
        Tenant users always see their own-tenant + platform templates only.
        """
        stmt = select(EmailTemplate)

        if caller_tenant_id is not None:
            # Tenant user: restrict to platform + own tenant
            stmt = stmt.where(
                or_(
                    EmailTemplate.tenant_id.is_(None),
                    EmailTemplate.tenant_id == caller_tenant_id,
                )
            )
        else:
            # Platform user: scope filter
            if scope == "platform":
                stmt = stmt.where(EmailTemplate.tenant_id.is_(None))
            elif scope == "tenant":
                if tenant_id:
                    stmt = stmt.where(EmailTemplate.tenant_id == tenant_id)
                else:
                    stmt = stmt.where(EmailTemplate.tenant_id.is_not(None))

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.session.execute(count_stmt)).scalar_one()

        stmt = stmt.order_by(EmailTemplate.key, EmailTemplate.tenant_id.nulls_first())
        rows = (await self.session.execute(stmt)).scalars().all()
        return list(rows), total

    # ------------------------------------------------------------------
    # Get single
    # ------------------------------------------------------------------

    async def get_template(
        self,
        template_id: uuid.UUID,
        *,
        caller_tenant_id: uuid.UUID | None = None,
    ) -> EmailTemplate:
        row = await self._get_or_404(template_id)
        if caller_tenant_id and row.tenant_id and row.tenant_id != caller_tenant_id:
            raise not_found("EmailTemplate")
        return row

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    async def create_template(self, data: dict[str, Any]) -> EmailTemplate:
        row = EmailTemplate(**data)
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    # ------------------------------------------------------------------
    # Update (partial)
    # ------------------------------------------------------------------

    async def update_template(
        self,
        template_id: uuid.UUID,
        updates: dict[str, Any],
        *,
        caller_tenant_id: uuid.UUID | None = None,
    ) -> EmailTemplate:
        row = await self.get_template(template_id, caller_tenant_id=caller_tenant_id)
        for field, value in updates.items():
            setattr(row, field, value)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    async def delete_template(
        self,
        template_id: uuid.UUID,
        *,
        caller_tenant_id: uuid.UUID | None = None,
    ) -> None:
        row = await self.get_template(template_id, caller_tenant_id=caller_tenant_id)
        await self.session.delete(row)
        await self.session.flush()

    # ------------------------------------------------------------------
    # Tenant template seeding
    # ------------------------------------------------------------------

    async def seed_tenant_templates(self, tenant_id: uuid.UUID) -> int:
        """For each TENANT_TEMPLATE_KEY, create a tenant-scoped copy of the
        platform template if one doesn't already exist. Returns count created.
        Idempotent — safe to call repeatedly. Caller owns the transaction."""
        created = 0
        for key in TENANT_TEMPLATE_KEYS:
            # Check for existing tenant-scoped copy
            existing = (
                await self.session.execute(
                    select(EmailTemplate).where(
                        EmailTemplate.key == key,
                        EmailTemplate.tenant_id == tenant_id,
                    )
                )
            ).scalar_one_or_none()
            if existing is not None:
                continue

            # Find platform-level template
            platform_row = (
                await self.session.execute(
                    select(EmailTemplate).where(
                        EmailTemplate.key == key,
                        EmailTemplate.tenant_id.is_(None),
                    )
                )
            ).scalar_one_or_none()
            if platform_row is None:
                _log.warning("seed_tenant_templates: platform template '%s' not found", key)
                continue

            copy = EmailTemplate(
                tenant_id=tenant_id,
                key=platform_row.key,
                name=platform_row.name,
                subject=platform_row.subject,
                body_html=platform_row.body_html,
                body_text=platform_row.body_text,
                variables=platform_row.variables,
                active=platform_row.active,
            )
            self.session.add(copy)
            created += 1
            _log.info("seed_tenant_templates: created '%s' for tenant %s", key, tenant_id)

        if created:
            await self.session.flush()
        return created

    # ------------------------------------------------------------------
    # Test send — renders + sends immediately, bypassing outbox
    # ------------------------------------------------------------------

    async def test_send(
        self,
        template_id: uuid.UUID,
        to_email: str,
        variables: dict,
        *,
        caller_tenant_id: uuid.UUID | None = None,
    ) -> dict:
        row = await self.get_template(template_id, caller_tenant_id=caller_tenant_id)
        if not row.active:
            raise bad_request("Template is inactive")

        subject = render_subject(row.subject, variables)
        body_html = render_body_html(row.body_html, variables)

        from apps.api.services.email_service import send_email  # noqa: PLC0415
        sent = await send_email(to=to_email, subject=subject, html=body_html)

        return {
            "subject_rendered": subject,
            "body_html_rendered": body_html,
            "sent": sent,
        }
