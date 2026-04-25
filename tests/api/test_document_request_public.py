"""Public document-request flow tests.

Tests the unauthenticated customer-facing flow:
1. Anonymous GET works.
2. Wrong code 4×, then 5th attempt → 423 + status=canceled.
3. Correct code returns doc-request JWT; using it on /auth/me is rejected.
4. Upload before verifying → 401.
"""





# ---------------------------------------------------------------------------
# Helpers — create a doc request via the admin API
# ---------------------------------------------------------------------------

async def _make_doc_request(client, headers: dict, customer_id: str) -> tuple[str, str]:
    """Return (token, verification_code) for a freshly-created doc request."""
    resp = await client.post(
        "/document-requests",
        json={
            "customer_id": customer_id,
            "title": "KYC Documents",
            "expires_in_days": 7,
            "items": [
                {"kind": "passport", "label": "Passport copy", "is_required": True},
            ],
        },
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    return data["token"], data["verification_code"]


async def _make_customer(client, headers: dict) -> dict:
    resp = await client.post(
        "/customers",
        json={"full_name": "Doc Test Customer", "source": "manual"},
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

async def test_anonymous_get_returns_200(client, tenant_factory) -> None:
    info = await tenant_factory()
    headers = {"Authorization": f"Bearer {info['access_token']}"}
    customer = await _make_customer(client, headers)
    token, _ = await _make_doc_request(client, headers, customer["id"])

    resp = await client.get(f"/public/document-requests/{token}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["verified"] is False
    assert len(data["items"]) == 1


async def test_wrong_code_five_times_cancels_request(client, tenant_factory) -> None:
    """5 wrong attempts → 423 on the last, and request status becomes 'canceled'."""
    info = await tenant_factory()
    headers = {"Authorization": f"Bearer {info['access_token']}"}
    customer = await _make_customer(client, headers)
    token, _ = await _make_doc_request(client, headers, customer["id"])

    wrong_code = "000000"  # very unlikely to be right
    for attempt in range(1, 6):
        resp = await client.post(
            f"/public/document-requests/{token}/verify",
            json={"code": wrong_code},
        )
        if attempt < 5:
            assert resp.status_code == 401, f"Attempt {attempt}: expected 401, got {resp.status_code}"
        else:
            assert resp.status_code == 423, f"5th attempt should be 423, got {resp.status_code}"

    # After 5 failures the request must be canceled
    status_resp = await client.get(f"/public/document-requests/{token}")
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "canceled"


async def test_correct_code_returns_token(client, tenant_factory) -> None:
    """Correct code → returns access_token in response."""
    info = await tenant_factory()
    headers = {"Authorization": f"Bearer {info['access_token']}"}
    customer = await _make_customer(client, headers)
    token, code = await _make_doc_request(client, headers, customer["id"])

    resp = await client.post(
        f"/public/document-requests/{token}/verify",
        json={"code": code},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


async def test_doc_request_token_rejected_on_auth_me(client, tenant_factory) -> None:
    """A doc-request JWT (type=doc_request) must be rejected by /auth/me → 401."""
    info = await tenant_factory()
    headers = {"Authorization": f"Bearer {info['access_token']}"}
    customer = await _make_customer(client, headers)
    token, code = await _make_doc_request(client, headers, customer["id"])

    verify_resp = await client.post(
        f"/public/document-requests/{token}/verify",
        json={"code": code},
    )
    assert verify_resp.status_code == 200
    doc_access_token = verify_resp.json()["access_token"]

    # Use doc_request token on /auth/me — must be rejected
    resp = await client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {doc_access_token}"},
    )
    assert resp.status_code == 401


async def test_upload_before_verify_returns_401(client, tenant_factory) -> None:
    """Uploading without a valid verified JWT → 401."""
    info = await tenant_factory()
    headers = {"Authorization": f"Bearer {info['access_token']}"}
    customer = await _make_customer(client, headers)
    token, _ = await _make_doc_request(client, headers, customer["id"])

    # Get the item id from the anonymous GET
    resp = await client.get(f"/public/document-requests/{token}")
    item_id = resp.json()["items"][0]["id"]

    dummy_file = b"fake pdf content"
    upload_resp = await client.post(
        f"/public/document-requests/{token}/items/{item_id}/upload",
        files={"file": ("doc.pdf", dummy_file, "application/pdf")},
        # No Authorization header — should fail
    )
    assert upload_resp.status_code == 401
