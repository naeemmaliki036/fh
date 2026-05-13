"""Interactive bootstrap — creates a super_admin platform user.

Credentials are **never** sourced from env vars or config — they are entered
interactively and written straight to the database. Run this once per
environment to bootstrap your first super_admin; thereafter manage the
platform_users table directly via SQL.

Usage:
    python -m apps.api.scripts.create_superadmin
    # or: make create-superadmin
"""

import asyncio
import getpass
import logging
import re
import sys

from sqlalchemy import func, select

from apps.api.auth import hash_password
from apps.api.config import settings
from apps.api.models.enums import PlatformRole
from apps.api.models.platform_user import PlatformUser
from packages.common.db.session import make_session_factory

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger("fh.create_superadmin")

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _prompt_email() -> str:
    while True:
        email = input("Super admin email: ").strip().lower()
        if _EMAIL_RE.match(email):
            return email
        print("  ✗ not a valid email — try again")


def _prompt_password() -> str:
    while True:
        pw = getpass.getpass("Password (min 12 chars): ")
        if len(pw) < 12:
            print("  ✗ too short — try again")
            continue
        confirm = getpass.getpass("Confirm password: ")
        if pw != confirm:
            print("  ✗ mismatch — try again")
            continue
        return pw


def _prompt_name() -> str:
    name = input("Full name [Super Admin]: ").strip()
    return name or "Super Admin"


async def create() -> None:
    print("\n── Create platform super_admin ──\n")
    email = _prompt_email()
    password = _prompt_password()
    full_name = _prompt_name()

    factory = make_session_factory(settings.database_url)
    async with factory() as session:
        existing = await session.execute(
            select(PlatformUser).where(
                func.lower(PlatformUser.email) == email.lower()
            )
        )
        if existing.scalar_one_or_none():
            log.error("A platform user with that email already exists.")
            sys.exit(1)

        pu = PlatformUser(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role=PlatformRole.SUPER_ADMIN,
        )
        session.add(pu)
        await session.commit()
        log.info("Created super_admin %s (id=%s)", email, pu.id)


if __name__ == "__main__":
    asyncio.run(create())
