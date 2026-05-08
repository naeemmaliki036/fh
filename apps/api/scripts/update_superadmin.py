"""One-off: update an existing super admin's email + password.

Reads the *new* email / password from SEED_SUPERADMIN_EMAIL and
SEED_SUPERADMIN_PASSWORD. Pass the previous email as argv[1].

Usage (inside container):
    python -m apps.api.scripts.update_superadmin <old_email>

Idempotent: prints "no rows updated" if no row matches the old email.
"""

import asyncio
import logging
import sys

from sqlalchemy import update

from apps.api.auth import hash_password
from apps.api.config import settings
from apps.api.models.platform_user import PlatformUser
from packages.common.db.session import make_session_factory

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger("fh.update_superadmin")


async def run() -> None:
    if len(sys.argv) < 2:
        log.error("missing argv[1] — old email to match on")
        sys.exit(1)

    old_email = sys.argv[1].lower()
    new_email = settings.seed_superadmin_email.lower()
    new_password = settings.seed_superadmin_password

    if not new_email or not new_password:
        log.error("SEED_SUPERADMIN_EMAIL and SEED_SUPERADMIN_PASSWORD must be set")
        sys.exit(1)

    factory = make_session_factory(settings.database_url)

    async with factory() as session:
        result = await session.execute(
            update(PlatformUser)
            .where(PlatformUser.email == old_email)
            .values(email=new_email, password_hash=hash_password(new_password))
        )
        await session.commit()
        log.info("rows updated: %d", result.rowcount)


if __name__ == "__main__":
    asyncio.run(run())
