"""Bootstrap seed script — creates the first super_admin platform user.

Idempotent: skips creation if the email already exists.

Usage:
    python -m apps.api.scripts.seed
    # or via Makefile:
    make db-seed
"""

import asyncio
import logging
import sys

from sqlalchemy import func, select

from apps.api.auth import hash_password
from apps.api.config import settings
from apps.api.models.enums import PlatformRole
from apps.api.models.platform_user import PlatformUser
from packages.common.db.session import make_session_factory

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger("fh.seed")


async def seed() -> None:
    email = settings.seed_superadmin_email
    password = settings.seed_superadmin_password
    full_name = settings.seed_superadmin_name

    if not email or not password:
        log.error(
            "SEED_SUPERADMIN_EMAIL and SEED_SUPERADMIN_PASSWORD must be set"
        )
        sys.exit(1)

    factory = make_session_factory(settings.database_url)

    async with factory() as session:
        # Check existence
        stmt = select(PlatformUser).where(
            func.lower(PlatformUser.email) == email.lower()
        )
        result = await session.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            log.info("Super admin already exists: %s — skipping", email)
            return

        pu = PlatformUser(
            email=email.lower(),
            password_hash=hash_password(password),
            full_name=full_name,
            role=PlatformRole.SUPER_ADMIN,
        )
        session.add(pu)
        await session.commit()
        log.info("Super admin created: %s (id=%s)", email, pu.id)


if __name__ == "__main__":
    asyncio.run(seed())
