"""S3-compatible async storage — covers both AWS S3 and Cloudflare R2.

R2 differences vs S3:
  - Requires endpoint_url (e.g. https://<account>.r2.cloudflarestorage.com)
  - Region is not required (pass None or "auto")
  - Public CDN URL comes from a separate config key (cf_r2_public_base_url)
  - private S3 has public_base_url = None; callers must use signed URLs

Uses aioboto3 for non-blocking S3 operations. The boto3 session and client
are created lazily on first use to avoid import-time side effects.
"""

from __future__ import annotations

from typing import BinaryIO

from .interface import StoredObject


class S3Storage:
    """Async S3 / R2 storage backend."""

    def __init__(
        self,
        bucket: str,
        access_key: str,
        secret_key: str,
        *,
        endpoint_url: str | None = None,
        region: str | None = None,
        public_base_url: str | None = None,
    ) -> None:
        self._bucket = bucket
        self._access_key = access_key
        self._secret_key = secret_key
        self._endpoint_url = endpoint_url
        self._region = region
        self._public_base_url = public_base_url
        self._session: object | None = None  # aioboto3.Session, typed lazily

    @property
    def public_base_url(self) -> str | None:
        return self._public_base_url

    def _get_session(self) -> object:
        if self._session is None:
            import aioboto3  # lazy import — don't fail at startup if not installed
            self._session = aioboto3.Session(
                aws_access_key_id=self._access_key,
                aws_secret_access_key=self._secret_key,
                region_name=self._region,
            )
        return self._session

    def _client_kwargs(self) -> dict:
        kwargs: dict = {}
        if self._endpoint_url:
            kwargs["endpoint_url"] = self._endpoint_url
        return kwargs

    async def put_object(
        self,
        key: str,
        data: bytes | BinaryIO,
        content_type: str,
        metadata: dict[str, str] | None = None,
    ) -> StoredObject:
        session = self._get_session()
        body = data if isinstance(data, bytes) else data.read()
        extra: dict = {"ContentType": content_type}
        if metadata:
            extra["Metadata"] = metadata

        async with session.client("s3", **self._client_kwargs()) as client:  # type: ignore[union-attr]
            resp = await client.put_object(
                Bucket=self._bucket,
                Key=key,
                Body=body,
                **extra,
            )
        etag = resp.get("ETag", "").strip('"') or None
        return StoredObject(
            key=key,
            size=len(body),
            content_type=content_type,
            etag=etag,
        )

    async def get_object(self, key: str) -> bytes:
        session = self._get_session()
        async with session.client("s3", **self._client_kwargs()) as client:  # type: ignore[union-attr]
            resp = await client.get_object(Bucket=self._bucket, Key=key)
            return await resp["Body"].read()

    async def delete_object(self, key: str) -> None:
        session = self._get_session()
        async with session.client("s3", **self._client_kwargs()) as client:  # type: ignore[union-attr]
            await client.delete_object(Bucket=self._bucket, Key=key)

    async def get_signed_url(
        self,
        key: str,
        expires_in: int = 900,
        method: str = "GET",
    ) -> str:
        op = "get_object" if method.upper() == "GET" else "put_object"
        session = self._get_session()
        async with session.client("s3", **self._client_kwargs()) as client:  # type: ignore[union-attr]
            return await client.generate_presigned_url(
                op,
                Params={"Bucket": self._bucket, "Key": key},
                ExpiresIn=expires_in,
            )

    async def exists(self, key: str) -> bool:
        session = self._get_session()
        try:
            async with session.client("s3", **self._client_kwargs()) as client:  # type: ignore[union-attr]
                await client.head_object(Bucket=self._bucket, Key=key)
            return True
        except Exception:
            return False
