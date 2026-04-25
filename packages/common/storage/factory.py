"""Storage factory — returns singleton instances driven by config.

Selection logic:
  public  → S3Storage (R2) if CF_R2_BUCKET is set, else LocalStorage
  private → S3Storage (S3) if AWS_S3_BUCKET is set, else LocalStorage

Instances are module-level singletons: constructed once on first call.
"""

from __future__ import annotations

from pathlib import Path

from .interface import Storage

_public_storage: Storage | None = None
_private_storage: Storage | None = None


def get_public_storage() -> Storage:
    """Return the public media storage backend (R2 or local fallback)."""
    global _public_storage
    if _public_storage is not None:
        return _public_storage

    from apps.api.config import settings  # lazy — avoids circular import at package load

    if settings.cf_r2_bucket and settings.cf_r2_access_key_id:
        from .s3_storage import S3Storage

        _public_storage = S3Storage(
            bucket=settings.cf_r2_bucket,
            access_key=settings.cf_r2_access_key_id,
            secret_key=settings.cf_r2_secret_access_key,
            endpoint_url=settings.cf_r2_endpoint or None,
            region=None,  # R2 does not require a region
            public_base_url=settings.cf_r2_public_base_url or None,
        )
    else:
        from .local_storage import LocalStorage

        root = Path(settings.local_uploads_root) / "public"
        _public_storage = LocalStorage(
            root=root,
            kind="public",
            base_url="http://localhost:8000/_local-public",
        )

    return _public_storage


def get_private_storage() -> Storage:
    """Return the private document storage backend (S3 or local fallback)."""
    global _private_storage
    if _private_storage is not None:
        return _private_storage

    from apps.api.config import settings

    if settings.aws_s3_bucket and settings.aws_access_key_id:
        from .s3_storage import S3Storage

        _private_storage = S3Storage(
            bucket=settings.aws_s3_bucket,
            access_key=settings.aws_access_key_id,
            secret_key=settings.aws_secret_access_key,
            region=settings.aws_region or "us-east-1",
            public_base_url=None,  # private: always signed URLs
        )
    else:
        from .local_storage import LocalStorage

        root = Path(settings.local_uploads_root) / "private"
        _private_storage = LocalStorage(
            root=root,
            kind="private",
            base_url=None,  # private: no public base URL even locally
        )

    return _private_storage
