"""Auth scoping tests.

Covers:
- Tenant token cannot access /tenants list (platform-only) → 401
- Platform token cannot access /users (tenant-only) → 401
- doc_request JWT rejected by /auth/me → 401
- Refresh token rejected on /auth/me → 401
- Login while tenant pending → 403
"""

import uuid

from apps.api.auth import encode_doc_request_token


async def test_tenant_token_cannot_list_tenants(client, tenant_factory) -> None:
    """GET /tenants requires a platform token; tenant token → 401."""
    info = await tenant_factory()
    headers = {"Authorization": f"Bearer {info['access_token']}"}
    resp = await client.get("/tenants", headers=headers)
    assert resp.status_code == 401


async def test_platform_token_cannot_access_users(client, platform_admin_factory) -> None:
    """GET /users requires a tenant token; platform token → 401."""
    info = await platform_admin_factory()
    headers = {"Authorization": f"Bearer {info['access_token']}"}
    resp = await client.get("/users", headers=headers)
    assert resp.status_code == 401


async def test_doc_request_token_rejected_on_auth_me(client) -> None:
    """A doc_request scoped JWT must be rejected by /auth/me → 401."""
    doc_token = encode_doc_request_token(str(uuid.uuid4()))
    headers = {"Authorization": f"Bearer {doc_token}"}
    resp = await client.get("/auth/me", headers=headers)
    assert resp.status_code == 401


async def test_refresh_token_rejected_on_auth_me(client, tenant_factory) -> None:
    """Refresh tokens (type=refresh) must be rejected on protected endpoints → 401."""
    info = await tenant_factory()
    refresh_token = info["refresh_token"]
    headers = {"Authorization": f"Bearer {refresh_token}"}
    resp = await client.get("/auth/me", headers=headers)
    assert resp.status_code == 401


async def test_login_pending_tenant_returns_403(client, db) -> None:
    """Login attempt while tenant status=pending_approval → 403."""
    from sqlalchemy import text

    from apps.api.auth import hash_password
    from apps.api.models.enums import TenantRole, TenantStatus
    from apps.api.models.tenant import Tenant
    from apps.api.models.user import User

    tenant = Tenant(
        name="Pending Co",
        slug="pending-co-test",
        status=TenantStatus.PENDING_APPROVAL,
    )
    db.add(tenant)
    await db.flush()
    await db.execute(text(f"SET LOCAL app.tenant_id = '{tenant.id}'"))

    user = User(
        tenant_id=tenant.id,
        email="owner@pendingco.example.com",
        password_hash=hash_password("MyPass123!"),
        full_name="Pending Owner",
        role=TenantRole.COMPANY_OWNER,
    )
    db.add(user)
    await db.commit()

    resp = await client.post(
        "/auth/login",
        json={"email": "owner@pendingco.example.com", "password": "MyPass123!"},
    )
    assert resp.status_code == 403
    assert "pending" in resp.json()["detail"].lower()


async def test_no_token_returns_401(client) -> None:
    """Missing Authorization header → 401 on protected endpoints."""
    resp = await client.get("/auth/me")
    assert resp.status_code == 401


async def test_invalid_token_returns_401(client) -> None:
    """Malformed token → 401."""
    resp = await client.get("/auth/me", headers={"Authorization": "Bearer notavalidjwt"})
    assert resp.status_code == 401


async def test_platform_login_and_me(client, platform_admin_factory) -> None:
    """Happy path: platform admin can hit /auth/platform/me."""
    info = await platform_admin_factory()
    headers = {"Authorization": f"Bearer {info['access_token']}"}
    resp = await client.get("/auth/platform/me", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_platform"] is True


async def test_tenant_login_and_me(client, tenant_factory) -> None:
    """Happy path: tenant user can hit /auth/me."""
    info = await tenant_factory()
    headers = {"Authorization": f"Bearer {info['access_token']}"}
    resp = await client.get("/auth/me", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_platform"] is False
    assert "tenant_id" in data


async def test_same_email_two_tenants(client, tenant_factory, db) -> None:
    """Same email in two tenants: bcrypt disambiguates by password.

    - login(pwA) → 200, token tenant_id == tenant_a
    - login(pwB) → 200, token tenant_id == tenant_b
    - login(wrong) → 401, login_failed audit row committed
    """
    from jose import jwt as jose_jwt

    from apps.api.config import settings

    shared_email = "john@example.com"
    pw_a = "PasswordAlpha1!"
    pw_b = "PasswordBeta2@"

    info_a = await tenant_factory(owner_email=shared_email, password=pw_a)
    info_b = await tenant_factory(owner_email=shared_email, password=pw_b)

    tenant_a_id = str(info_a["tenant"].id)
    tenant_b_id = str(info_b["tenant"].id)

    # login with pwA must resolve to tenant_a
    resp_a = await client.post("/auth/login", json={"email": shared_email, "password": pw_a})
    assert resp_a.status_code == 200, resp_a.text
    claims_a = jose_jwt.decode(
        resp_a.json()["access_token"], settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
    )
    assert claims_a["tenant_id"] == tenant_a_id

    # login with pwB must resolve to tenant_b
    resp_b = await client.post("/auth/login", json={"email": shared_email, "password": pw_b})
    assert resp_b.status_code == 200, resp_b.text
    claims_b = jose_jwt.decode(
        resp_b.json()["access_token"], settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
    )
    assert claims_b["tenant_id"] == tenant_b_id

    # wrong password → 401
    resp_bad = await client.post("/auth/login", json={"email": shared_email, "password": "wrongpassword"})
    assert resp_bad.status_code == 401

    # login_failed audit row must have been committed (independent session, survives rollback)
    from sqlalchemy import select

    from apps.api.models.audit_log import AuditLog
    from apps.api.models.enums import AuditAction

    result = await db.execute(
        select(AuditLog).where(AuditLog.action == AuditAction.LOGIN_FAILED)
    )
    rows = result.scalars().all()
    assert len(rows) >= 1
    assert any(r.metadata_after.get("email") == shared_email for r in rows)
