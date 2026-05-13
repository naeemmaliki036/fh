"""Platform RBAC helpers — factory for role-gated FastAPI dependencies.

Usage in routers:
    from apps.api.security.platform_roles import require_platform_role
    from apps.api.models.enums import PlatformRole

    @router.get("/tenants")
    async def list_tenants(
        _: Annotated[dict, Depends(require_platform_role(
            PlatformRole.SUPER_ADMIN,
            PlatformRole.OPERATIONS_ADMIN,
            PlatformRole.FINANCE_ADMIN,
            PlatformRole.SUPPORT_ADMIN,
        ))],
        ...
    ): ...
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status

from apps.api.dependencies import get_current_platform_user
from apps.api.models.enums import PlatformRole

# ---------------------------------------------------------------------------
# Role sets — shared constants so routers stay DRY
# ---------------------------------------------------------------------------

ALL_PLATFORM_ROLES = (
    PlatformRole.SUPER_ADMIN,
    PlatformRole.OPERATIONS_ADMIN,
    PlatformRole.FINANCE_ADMIN,
    PlatformRole.SUPPORT_ADMIN,
)

OPS_AND_ABOVE = (
    PlatformRole.SUPER_ADMIN,
    PlatformRole.OPERATIONS_ADMIN,
)

SUPER_ONLY = (PlatformRole.SUPER_ADMIN,)


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------


def require_platform_role(*allowed_roles: PlatformRole):
    """Return a FastAPI dependency that enforces platform role membership.

    The dependency resolves the current platform user (401 if not a platform
    JWT) then checks that their role is in *allowed_roles* (403 if not).
    Returns the claims dict so callers can access id/email/role without a
    second dependency.
    """

    async def _check(
        platform_user: Annotated[dict, Depends(get_current_platform_user)],
    ) -> dict:
        role_value = platform_user.get("role")
        allowed_values = {r.value for r in allowed_roles}
        if role_value not in allowed_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Role '{role_value}' is not permitted for this operation. "
                    f"Required: {sorted(allowed_values)}"
                ),
            )
        return platform_user

    return _check
