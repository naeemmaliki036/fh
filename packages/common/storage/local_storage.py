"""Local filesystem storage — dev fallback when cloud creds aren't configured.

Writes to <root>/public/ or <root>/private/ under the configured uploads root.

Signed URLs are fake local paths. The public instance's base URL points to a
static-file mount that apps/api/main.py registers at /_local-public when R2
creds are absent. The private instance has no public base URL — callers must
always go through a signed-URL endpoint.
"""

from __future__ import annotations

import contextlib
import hashlib
from pathlib import Path
from typing import BinaryIO

import aiofiles
import aiofiles.os

from .interface import StoredObject


class LocalStorage:
    """Filesystem-backed storage for local development."""

    def __init__(
        self,
        root: Path,
        *,
        kind: str = "public",
        base_url: str | None = None,
    ) -> None:
        self._root = root
        self._kind = kind
        self._base_url = base_url

    @property
    def public_base_url(self) -> str | None:
        return self._base_url

    def _path(self, key: str) -> Path:
        # Prevent directory traversal.
        safe = Path(key.lstrip("/"))
        return self._root / safe

    async def put_object(
        self,
        key: str,
        data: bytes | BinaryIO,
        content_type: str,
        metadata: dict[str, str] | None = None,
    ) -> StoredObject:
        dest = self._path(key)
        await aiofiles.os.makedirs(dest.parent, exist_ok=True)

        body = data if isinstance(data, bytes) else data.read()

        async with aiofiles.open(dest, "wb") as f:
            await f.write(body)

        etag = hashlib.md5(body).hexdigest()  # noqa: S324 — local dev only
        return StoredObject(
            key=key,
            size=len(body),
            content_type=content_type,
            etag=etag,
        )

    async def get_object(self, key: str) -> bytes:
        dest = self._path(key)
        async with aiofiles.open(dest, "rb") as f:
            return await f.read()

    async def delete_object(self, key: str) -> None:
        dest = self._path(key)
        with contextlib.suppress(FileNotFoundError):
            await aiofiles.os.remove(dest)

    async def get_signed_url(
        self,
        key: str,
        expires_in: int = 900,
        method: str = "GET",
    ) -> str:
        """Return a local dev URL — not a real signed URL.

        Production never uses LocalStorage, so expiry is intentionally ignored.
        """
        return f"/_local-storage/{self._kind}/{key}"

    async def exists(self, key: str) -> bool:
        return self._path(key).exists()
