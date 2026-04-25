"""Async SQLAlchemy engine and session factory.

The get_db dependency stub is defined here so backend-dev can wire it into
FastAPI's DI system (apps/api/dependencies.py) without touching this file.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)


# Imported lazily to avoid circular imports at module load time.
# Backend-dev must set DATABASE_URL in config and pass it here.
def _make_engine(database_url: str):
    return create_async_engine(
        database_url,
        echo=False,
        pool_size=20,
        max_overflow=10,
    )


def make_session_factory(database_url: str) -> async_sessionmaker[AsyncSession]:
    engine = _make_engine(database_url)
    return async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


# ---------------------------------------------------------------------------
# Dependency stub — backend-dev wires this into FastAPI via dependencies.py.
# Replace the placeholder below with the real session factory once config
# is available (see apps/api/config.py, which backend-dev creates).
# ---------------------------------------------------------------------------
async def get_db() -> AsyncGenerator[AsyncSession, None]:  # pragma: no cover
    """
    FastAPI dependency stub.  Backend-dev owns the real implementation:

        from apps.api.config import settings
        from packages.common.db.session import make_session_factory

        _factory = make_session_factory(settings.database_url)

        async def get_db():
            async with _factory() as session:
                try:
                    yield session
                    await session.commit()
                except Exception:
                    await session.rollback()
                    raise
    """
    raise NotImplementedError("get_db must be implemented in apps/api/dependencies.py")
