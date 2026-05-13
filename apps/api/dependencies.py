"""FastAPI dependency injection: sessions, current users, tenant context."""

from collections.abc import AsyncGenerator
from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.auth import decode_token
from apps.api.config import settings
from packages.common.db.session import make_session_factory

# ---------------------------------------------------------------------------
# Session factory — created once at import time from config
# ---------------------------------------------------------------------------

_session_factory = make_session_factory(settings.database_url)

_bearer = HTTPBearer(auto_error=False)

# ---------------------------------------------------------------------------
# DB session dependency
# ---------------------------------------------------------------------------


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async session per request.

    If a tenant_id is stored in the session's info dict (set by auth deps)
    the RLS GUC is propagated to PostgreSQL before yielding.
    """
    async with _session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise



DbSession = Annotated[AsyncSession, Depends(get_db)]

# ---------------------------------------------------------------------------
# Auth dependencies
# ---------------------------------------------------------------------------


def _extract_payload(credentials: HTTPAuthorizationCredentials | None) -> dict:
    """Decode Bearer token or raise 401."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return decode_token(credentials.credentials)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> dict:
    """Return tenant user claims dict from JWT.

    Raises 401 if token missing/invalid, or if token belongs to platform user.
    Returns: {id, tenant_id, email, role, is_platform=False}
    """
    payload = _extract_payload(credentials)
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if payload.get("is_platform"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Use platform login endpoint",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {
        "id": payload["sub"],
        "tenant_id": payload.get("tenant_id"),
        "email": payload.get("email", ""),
        "role": payload.get("role"),
        "is_platform": False,
    }


async def get_current_platform_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> dict:
    """Return platform user claims dict from JWT.

    Raises 401 if not a platform token.
    Returns: {id, email, role, is_platform=True}
    """
    payload = _extract_payload(credentials)
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not payload.get("is_platform"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Platform credentials required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {
        "id": payload["sub"],
        "email": payload.get("email", ""),
        "role": payload.get("role"),
        "is_platform": True,
    }


async def get_tenant_context(
    current_user: Annotated[dict, Depends(get_current_user)],
) -> UUID:
    """Extract tenant_id UUID from the current tenant user token."""
    tid = current_user.get("tenant_id")
    if not tid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tenant context in token",
        )
    return UUID(tid)


# ---------------------------------------------------------------------------
# Request context (IP + User-Agent) for audit logging
# ---------------------------------------------------------------------------


@dataclass
class RequestContext:
    """Thin wrapper around request metadata needed by audit service."""

    ip_address: str | None
    user_agent: str | None


async def get_request_context(request: Request) -> RequestContext:
    """Extract IP address and User-Agent from the incoming request."""
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    return RequestContext(ip_address=ip, user_agent=ua)


async def get_any_authenticated_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> dict:
    """Accept both platform and tenant tokens.

    Returns the same shape as get_current_user / get_current_platform_user with
    is_platform flag set appropriately. Use where an endpoint must serve both
    platform admins and tenant users (e.g. shared admin panels).
    """
    payload = _extract_payload(credentials)
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    is_platform = bool(payload.get("is_platform"))
    return {
        "id": payload["sub"],
        "tenant_id": payload.get("tenant_id"),
        "email": payload.get("email", ""),
        "role": payload.get("role"),
        "is_platform": is_platform,
    }


# Annotated aliases for routers
CurrentUser = Annotated[dict, Depends(get_current_user)]
CurrentPlatformUser = Annotated[dict, Depends(get_current_platform_user)]
AnyAuthUser = Annotated[dict, Depends(get_any_authenticated_user)]
TenantContext = Annotated[UUID, Depends(get_tenant_context)]
ReqCtx = Annotated[RequestContext, Depends(get_request_context)]
