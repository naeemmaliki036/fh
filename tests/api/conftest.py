"""Shared pytest fixtures for the fh API test suite.

Design choices:
- NullPool on the test engine: each request gets a fresh connection, avoiding
  pool-state issues between tests that truncate the DB.
- Per-test truncation via raw asyncpg (separate connection from SA pool).
- The app's shared _session_factory also needs NullPool to avoid stale connections;
  we achieve this by monkeypatching it in the session fixture.
"""

import uuid
from collections.abc import AsyncGenerator

import asyncpg
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import NullPool, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from apps.api.auth import hash_password, make_token_pair
from apps.api.main import app
from apps.api.models.enums import PlatformRole, TenantRole, TenantStatus
from apps.api.models.platform_user import PlatformUser
from apps.api.models.tenant import Tenant
from apps.api.models.user import User

_DB_URL = "postgresql+asyncpg://fh:fh_dev_password@localhost:5433/fh"
_ASYNCPG_DSN = "postgresql://fh:fh_dev_password@localhost:5433/fh"

_TRUNCATE_TABLES = [
    "audit_logs",
    "document_request_items",
    "document_requests",
    "lead_activities",
    "deals",
    "leads",
    "media",
    "listings",
    "property_agents",
    "agents",
    "properties",
    "customers",
    "users",
    "platform_users",
    "tenants",
]


# ---------------------------------------------------------------------------
# Replace the app's shared session factory with one using NullPool at session start
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session", autouse=True)
def patch_app_session_factory():
    """Replace the app's module-level session factory with a NullPool version.

    This prevents the app from reusing connections across tests (which causes
    'operation in progress' errors after table truncation).
    """
    import apps.api.dependencies as deps

    null_engine = create_async_engine(_DB_URL, poolclass=NullPool)
    null_factory = async_sessionmaker(null_engine, class_=AsyncSession, expire_on_commit=False)
    original = deps._session_factory
    deps._session_factory = null_factory
    yield
    deps._session_factory = original


# ---------------------------------------------------------------------------
# Per-test truncation (raw asyncpg, not SA pool)
# ---------------------------------------------------------------------------

async def _truncate_all() -> None:
    conn = await asyncpg.connect(_ASYNCPG_DSN)
    try:
        tables = ", ".join(_TRUNCATE_TABLES)
        await conn.execute(f"TRUNCATE {tables} RESTART IDENTITY CASCADE")
    finally:
        await conn.close()


@pytest_asyncio.fixture
async def clean_db() -> AsyncGenerator[None, None]:
    await _truncate_all()
    yield


# ---------------------------------------------------------------------------
# Per-test SA session (NullPool — fresh connection each time)
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def db(clean_db) -> AsyncGenerator[AsyncSession, None]:  # noqa: ARG001
    engine = create_async_engine(_DB_URL, poolclass=NullPool)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session
    await engine.dispose()


# ---------------------------------------------------------------------------
# HTTP test client (depends on clean_db)
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def client(clean_db) -> AsyncGenerator[AsyncClient, None]:  # noqa: ARG001
    transport = ASGITransport(app=app)  # type: ignore[arg-type]
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


# ---------------------------------------------------------------------------
# Platform admin factory
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def platform_admin_factory(db: AsyncSession):
    async def _make(
        email: str | None = None,
        role: PlatformRole = PlatformRole.SUPER_ADMIN,
        password: str = "TestPass123!",
    ) -> dict:
        email = email or f"admin-{uuid.uuid4().hex[:6]}@platform.example.com"
        pu = PlatformUser(
            email=email,
            password_hash=hash_password(password),
            full_name="Platform Admin",
            role=role,
        )
        db.add(pu)
        await db.flush()
        await db.commit()
        await db.refresh(pu)
        tokens = make_token_pair({
            "sub": str(pu.id),
            "email": pu.email,
            "role": pu.role.value,
            "is_platform": True,
            "tenant_id": None,
        })
        return {"user": pu, **tokens}

    return _make


# ---------------------------------------------------------------------------
# Tenant factory
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def tenant_factory(db: AsyncSession):
    async def _make(
        slug: str | None = None,
        owner_email: str | None = None,
        password: str = "TenantPass123!",
        role: TenantRole = TenantRole.COMPANY_OWNER,
    ) -> dict:
        slug = slug or f"tenant-{uuid.uuid4().hex[:8]}"
        owner_email = owner_email or f"owner-{uuid.uuid4().hex[:6]}@example.com"

        tenant = Tenant(
            name=f"Test Co {slug}",
            slug=slug,
            status=TenantStatus.ACTIVE,
        )
        db.add(tenant)
        await db.flush()

        # Users table has RLS — needs the GUC set within the same transaction
        await db.execute(text(f"SET LOCAL app.tenant_id = '{tenant.id}'"))

        user = User(
            tenant_id=tenant.id,
            email=owner_email,
            password_hash=hash_password(password),
            full_name="Tenant Owner",
            role=role,
        )
        db.add(user)
        await db.flush()
        await db.commit()
        await db.refresh(tenant)
        await db.refresh(user)

        tokens = make_token_pair({
            "sub": str(user.id),
            "tenant_id": str(tenant.id),
            "email": user.email,
            "role": user.role.value,
            "is_platform": False,
        })
        return {"tenant": tenant, "user": user, **tokens}

    return _make
