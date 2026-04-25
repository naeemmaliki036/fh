"""Storage interface — Protocol + StoredObject value object."""

from __future__ import annotations

from typing import BinaryIO, Protocol, runtime_checkable

from pydantic import BaseModel


class StoredObject(BaseModel):
    """Metadata returned after a successful put."""

    key: str
    size: int
    content_type: str
    etag: str | None = None


@runtime_checkable
class Storage(Protocol):
    """Duck-typed async storage contract.

    Two implementations exist: S3Storage (R2 / AWS S3) and LocalStorage (dev).
    """

    async def put_object(
        self,
        key: str,
        data: bytes | BinaryIO,
        content_type: str,
        metadata: dict[str, str] | None = None,
    ) -> StoredObject:
        """Upload *data* under *key*. Returns metadata about the stored object."""
        ...

    async def get_object(self, key: str) -> bytes:
        """Download and return the full object body."""
        ...

    async def delete_object(self, key: str) -> None:
        """Delete the object at *key*. Idempotent — no error if missing."""
        ...

    async def get_signed_url(
        self,
        key: str,
        expires_in: int = 900,
        method: str = "GET",
    ) -> str:
        """Return a pre-signed URL valid for *expires_in* seconds."""
        ...

    async def exists(self, key: str) -> bool:
        """Return True if the object exists."""
        ...

    @property
    def public_base_url(self) -> str | None:
        """CDN base URL for public storage; None means signed-URL-only."""
        ...
