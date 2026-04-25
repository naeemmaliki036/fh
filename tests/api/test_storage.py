"""LocalStorage round-trip tests.

Uses pytest's tmp_path fixture — no real cloud credentials needed.
S3Storage tests are skipped (need real/mocked aioboto3 — deferred to Phase 2).
"""

from pathlib import Path

import pytest

from packages.common.storage.local_storage import LocalStorage


@pytest.fixture
def storage(tmp_path: Path) -> LocalStorage:
    return LocalStorage(tmp_path, kind="private", base_url=None)


async def test_put_and_get_roundtrip(storage: LocalStorage) -> None:
    body = b"hello world"
    obj = await storage.put_object("docs/test.txt", body, "text/plain")
    assert obj.key == "docs/test.txt"
    assert obj.size == len(body)

    retrieved = await storage.get_object("docs/test.txt")
    assert retrieved == body


async def test_exists_reflects_writes(storage: LocalStorage) -> None:
    assert not await storage.exists("no/such/file.bin")
    await storage.put_object("present.bin", b"\x00\x01", "application/octet-stream")
    assert await storage.exists("present.bin")


async def test_delete_removes_object(storage: LocalStorage) -> None:
    await storage.put_object("to_delete.txt", b"bye", "text/plain")
    assert await storage.exists("to_delete.txt")
    await storage.delete_object("to_delete.txt")
    assert not await storage.exists("to_delete.txt")


async def test_delete_nonexistent_is_idempotent(storage: LocalStorage) -> None:
    """delete_object on a missing key must not raise."""
    await storage.delete_object("ghost/file.txt")  # should not raise


async def test_get_signed_url_returns_local_scheme(storage: LocalStorage) -> None:
    url = await storage.get_signed_url("contracts/nda.pdf", expires_in=300)
    assert "nda.pdf" in url
    assert url.startswith("/_local-storage/")


async def test_put_with_binaryio(storage: LocalStorage, tmp_path: Path) -> None:
    """put_object must also accept a file-like BinaryIO object."""
    import io
    data = b"file-like content"
    bio = io.BytesIO(data)
    obj = await storage.put_object("stream.bin", bio, "application/octet-stream")
    assert obj.size == len(data)
    result = await storage.get_object("stream.bin")
    assert result == data


async def test_etag_is_md5_hex(storage: LocalStorage) -> None:
    import hashlib
    body = b"checksum me"
    obj = await storage.put_object("etag_test.bin", body, "text/plain")
    expected = hashlib.md5(body).hexdigest()
    assert obj.etag == expected


async def test_directory_traversal_is_blocked(storage: LocalStorage, tmp_path: Path) -> None:
    """Keys with leading slashes must not escape the root directory."""
    await storage.put_object("/../../escape.txt", b"x", "text/plain")
    # The file must land inside tmp_path, not at the filesystem root
    escaped = Path("/../../escape.txt")
    assert not escaped.exists()
