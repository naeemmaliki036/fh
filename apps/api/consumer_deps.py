"""Consumer auth dependency — validates consumer JWTs.

Consumer tokens carry kind="consumer" to distinguish them from tenant tokens.
Tenant tokens are rejected here; consumer tokens are rejected by get_current_user.

Kept separate from dependencies.py to preserve that module's existing Annotated
aliases (CurrentUser, CurrentPlatformUser, etc.) without modification.
"""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.auth import decode_token
from apps.api.models.consumer_account import ConsumerAccount, ConsumerAccountStatus

_bearer = HTTPBearer(auto_error=False)


async def get_current_consumer(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> ConsumerAccount:
    """Decode a consumer Bearer token and return the ConsumerAccount row.

    Validates:
    - Token present and parseable
    - kind == "consumer" claim (rejects tenant tokens)
    - consumer_accounts row exists and status == active
    """
    _401 = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not credentials:
        raise _401

    try:
        payload = decode_token(credentials.credentials)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if payload.get("kind") != "consumer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Consumer token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    consumer_id_raw = payload.get("sub")
    if not consumer_id_raw:
        raise _401

    try:
        consumer_id = UUID(str(consumer_id_raw))
    except ValueError:
        raise _401

    # Open a fresh session — this dependency runs outside the request DbSession.
    from apps.api.config import settings
    from packages.common.db.session import make_session_factory

    factory = make_session_factory(settings.database_url)
    async with factory() as session:
        consumer = await session.get(ConsumerAccount, consumer_id)

    if not consumer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Consumer account not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if consumer.status != ConsumerAccountStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Consumer account is suspended",
        )
    return consumer


# Annotated alias for routers
CurrentConsumer = Annotated[ConsumerAccount, Depends(get_current_consumer)]
