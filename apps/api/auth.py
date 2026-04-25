"""JWT encoding/decoding and bcrypt password helpers."""

from datetime import UTC, datetime, timedelta
from typing import Any

from jose import jwt
from passlib.context import CryptContext

from apps.api.config import settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------------------------------------------------------------------------
# Password helpers
# ---------------------------------------------------------------------------

def hash_password(plain: str) -> str:
    """Return bcrypt hash of *plain*."""
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if *plain* matches *hashed*."""
    return _pwd_context.verify(plain, hashed)


# ---------------------------------------------------------------------------
# Token helpers
# ---------------------------------------------------------------------------

def create_access_token(payload: dict[str, Any]) -> str:
    """Encode a short-lived access JWT."""
    now = datetime.now(UTC)
    data = {
        **payload,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_access_ttl_min),
    }
    return jwt.encode(data, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(payload: dict[str, Any]) -> str:
    """Encode a long-lived refresh JWT."""
    now = datetime.now(UTC)
    data = {
        **payload,
        "type": "refresh",
        "iat": now,
        "exp": now + timedelta(days=settings.jwt_refresh_ttl_days),
    }
    return jwt.encode(data, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    """Decode and verify a JWT.  Raises JWTError on failure."""
    return jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )


def make_token_pair(claims: dict[str, Any]) -> dict[str, str]:
    """Return {access_token, refresh_token, token_type} from *claims*."""
    return {
        "access_token": create_access_token(claims),
        "refresh_token": create_refresh_token(claims),
        "token_type": "bearer",
    }


# ---------------------------------------------------------------------------
# Document-request scoped tokens (type="doc_request")
# Distinct from user access tokens; rejected by all regular auth dependencies.
# ---------------------------------------------------------------------------

_DOC_REQUEST_TTL_MIN = 30


def encode_doc_request_token(document_request_id: str) -> str:
    """Issue a short-lived JWT scoped to one document request."""
    now = datetime.now(UTC)
    payload = {
        "type": "doc_request",
        "document_request_id": document_request_id,
        "iat": now,
        "exp": now + timedelta(minutes=_DOC_REQUEST_TTL_MIN),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_doc_request_token(token: str) -> dict[str, Any]:
    """Decode and return claims; raises JWTError on failure or wrong type."""
    from jose import JWTError

    payload = decode_token(token)
    if payload.get("type") != "doc_request":
        raise JWTError("Not a doc_request token")
    return payload
