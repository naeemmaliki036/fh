"""Backfill tenant email templates for all existing tenants — idempotent.

For every tenant in the database, calls seed_tenant_templates which inserts
a tenant-scoped copy of each TENANT_TEMPLATE_KEY if one doesn't already exist.
Safe to re-run; rows that already exist are skipped.

Usage:
    python -m apps.api.scripts.seed_existing_tenants_templates
    # or: make seed-tenant-templates
"""

import asyncio
import logging

from sqlalchemy import select

from apps.api.config import settings
from apps.api.models.tenant import Tenant
from apps.api.services.email_template_service import EmailTemplateService
from packages.common.db.session import make_session_factory

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger("fh.seed_tenant_templates")


async def run() -> None:
    factory = make_session_factory(settings.database_url)
    async with factory() as session:
        tenants = list(
            (await session.execute(select(Tenant).order_by(Tenant.created_at))).scalars().all()
        )
        log.info("Found %d tenant(s) to process", len(tenants))
        total_created = 0
        svc = EmailTemplateService(session)
        for tenant in tenants:
            count = await svc.seed_tenant_templates(tenant.id)
            log.info("Tenant %-40s — created %d template(s)", f"{tenant.name} ({tenant.id})", count)
            total_created += count
        await session.commit()
    log.info("Done — %d template row(s) created across %d tenant(s).", total_created, len(tenants))


if __name__ == "__main__":
    asyncio.run(run())
