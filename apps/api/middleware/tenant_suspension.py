"""Tenant suspension middleware.

Intercepts every request that carries a tenant-user JWT and checks whether
the tenant's status is SUSPENDED.  If so:
- Allow safe read paths: GET /auth/me and GET /tenants/me (exact path match).
- Block every other request with 403 code='tenant_suspended'.

This middleware runs AFTER the security headers and logging middlewares but
BEFORE FastAPI dispatches to route handlers.

Implementation notes:
- We decode the JWT ourselves to avoid importing FastAPI route dependencies
  (which would create a circular import).
- DB query is a single lightweight SELECT — no ORM session factory involved;
  we use asyncpg directly via the same DATABASE_URL to keep the hot path lean.
- Cache the suspension status in request.state so downstream code can read it
  if needed (future use).
"""

import logging

from fastapi import Request
from fastapi.responses import JSONResponse
from jose import JWTError
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from apps.api.auth import decode_token
from apps.api.config import settings
from packages.common.db.session import make_session_factory

_log = logging.getLogger("fh.suspension")

# Paths exempt from the suspension check (tenant-user reads about their own status)
_EXEMPT_PATHS: frozenset[str] = frozenset({
    "/auth/me",
    "/tenants/me",
})

_session_factory = make_session_factory(settings.database_url)


class TenantSuspensionMiddleware(BaseHTTPMiddleware):
    """Block suspended-tenant users from all non-exempt paths."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Only inspect requests that carry a Bearer token for a tenant user
        auth = request.headers.get("authorization", "")
        if not auth.startswith("Bearer "):
            return await call_next(request)

        token = auth.removeprefix("Bearer ").strip()
        try:
            payload = decode_token(token)
        except JWTError:
            return await call_next(request)

        # Only applies to tenant-user tokens (not platform users)
        if payload.get("type") != "access" or payload.get("is_platform"):
            return await call_next(request)

        tenant_id = payload.get("tenant_id")
        if not tenant_id:
            return await call_next(request)

        # Check suspension status
        suspended, reason = await self._is_suspended(tenant_id)
        if not suspended:
            return await call_next(request)

        # Tenant is suspended — allow exempt read paths
        path = request.url.path.rstrip("/")
        if path in _EXEMPT_PATHS and request.method == "GET":
            request.state.tenant_suspended = True
            request.state.suspension_reason = reason
            return await call_next(request)

        # Block everything else
        return JSONResponse(
            status_code=403,
            content={
                "detail": (
                    f"Your account has been suspended. "
                    f"Reason: {reason or 'Contact support for details'}. "
                    f"Contact support to appeal."
                ),
                "code": "tenant_suspended",
            },
        )

    async def _is_suspended(self, tenant_id: str) -> tuple[bool, str | None]:
        """Return (is_suspended, reason) for the given tenant_id string."""
        try:
            async with _session_factory() as session:
                result = await session.execute(
                    text(
                        "SELECT status, suspended_reason FROM tenants WHERE id = :tid"
                    ),
                    {"tid": tenant_id},
                )
                row = result.one_or_none()
        except Exception:
            _log.warning(
                "TenantSuspensionMiddleware: DB lookup failed for tenant_id=%s",
                tenant_id,
                exc_info=True,
            )
            return False, None

        if row is None:
            return False, None
        status, reason = row
        return status == "suspended", reason
