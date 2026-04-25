"""Auth router — thin controller, all logic in AuthService."""

from fastapi import APIRouter, Depends

from apps.api.dependencies import (
    CurrentPlatformUser,
    CurrentUser,
    DbSession,
    ReqCtx,
)
from apps.api.schemas.auth import (
    LoginRequest,
    LoginResponse,
    MeResponse,
    PlatformLoginRequest,
    PlatformLoginResponse,
    RefreshRequest,
    RegisterTenantRequest,
    RegisterTenantResponse,
    TenantResponse,
    TokenResponse,
    UserResponse,
)
from apps.api.services.auth_service import AuthService

router = APIRouter()


def _svc(db: DbSession) -> AuthService:
    return AuthService(db)


@router.post("/register-tenant", response_model=RegisterTenantResponse, status_code=201)
async def register_tenant(
    body: RegisterTenantRequest,
    ctx: ReqCtx,
    svc: AuthService = Depends(_svc),
) -> RegisterTenantResponse:
    """Create a new tenant + company_owner. Tenant starts as pending_approval."""
    result = await svc.register_tenant(
        tenant_name=body.tenant_name,
        tenant_slug=body.tenant_slug,
        currency=body.currency,
        timezone_=body.timezone,
        locale=body.locale,
        owner_email=str(body.owner_email),
        owner_password=body.owner_password,
        owner_full_name=body.owner_full_name,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    tenant = result["tenant"]
    user = result["user"]
    return RegisterTenantResponse(
        tenant=TenantResponse(
            id=str(tenant.id),
            name=tenant.name,
            slug=tenant.slug,
            status=tenant.status.value,
            currency=tenant.currency,
            timezone=tenant.timezone,
            locale=tenant.locale,
        ),
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role.value,
            status=user.status.value,
        ),
        message="Tenant registered. Awaiting platform admin approval.",
    )


@router.post("/login", response_model=LoginResponse)
async def login(
    body: LoginRequest,
    ctx: ReqCtx,
    svc: AuthService = Depends(_svc),
) -> LoginResponse:
    """Tenant user login. Returns JWT tokens. Rejects if tenant not active."""
    result = await svc.login(
        str(body.email), body.password,
        ip_address=ctx.ip_address, user_agent=ctx.user_agent,
    )
    user = result["user"]
    return LoginResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        token_type=result["token_type"],
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role.value,
            status=user.status.value,
        ),
    )


@router.post("/platform-login", response_model=PlatformLoginResponse)
async def platform_login(
    body: PlatformLoginRequest,
    ctx: ReqCtx,
    svc: AuthService = Depends(_svc),
) -> PlatformLoginResponse:
    """Platform admin login. Returns JWT with is_platform=true claim."""
    result = await svc.platform_login(
        str(body.email), body.password,
        ip_address=ctx.ip_address, user_agent=ctx.user_agent,
    )
    pu = result["user"]
    return PlatformLoginResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        token_type=result["token_type"],
        user={
            "id": str(pu.id),
            "email": pu.email,
            "full_name": pu.full_name,
            "role": pu.role.value,
            "is_platform": True,
        },
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    body: RefreshRequest,
    svc: AuthService = Depends(_svc),
) -> TokenResponse:
    """Exchange a refresh token for a new access token."""
    result = await svc.refresh(body.refresh_token)
    return TokenResponse(
        access_token=result["access_token"],
        refresh_token=body.refresh_token,
        token_type=result["token_type"],
    )


@router.get("/me", response_model=MeResponse)
async def me_tenant(
    current_user: CurrentUser,
    svc: AuthService = Depends(_svc),
) -> MeResponse:
    """Return current tenant user's profile."""
    user = await svc.get_tenant_user(current_user["id"], current_user["tenant_id"])
    return MeResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        is_platform=False,
        tenant_id=current_user["tenant_id"],
    )


@router.get("/platform/me", response_model=MeResponse)
async def me_platform(
    current_user: CurrentPlatformUser,
    svc: AuthService = Depends(_svc),
) -> MeResponse:
    """Return current platform user's profile."""
    pu = await svc.get_platform_user(current_user["id"])
    return MeResponse(
        id=str(pu.id),
        email=pu.email,
        full_name=pu.full_name,
        role=pu.role.value,
        is_platform=True,
        tenant_id=None,
    )
