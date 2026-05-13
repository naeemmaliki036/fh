"""Public-site asset upload service.

Handles logo, hero image and team-photo uploads for the tenant public site.
Files go to Cloudflare R2 (or local fallback) under:
    public/{tenant_id}/site/{purpose}/{uuid}-{safe_name}.{ext}

Returns the public CDN URL so the caller can store it in public_site_config.
"""

import re
import uuid as uuid_mod
from uuid import UUID

from fastapi import UploadFile

from apps.api.models.enums import TenantRole
from packages.common.storage import get_public_storage
from packages.common.utils.error_handlers import bad_request, forbidden

_ALLOWED_MIME = {"image/png", "image/jpeg", "image/webp"}
_MAX_BYTES = 5 * 1024 * 1024  # 5 MB
_ALLOWED_PURPOSES = {"logo", "hero", "team_photo"}
_ALLOWED_ROLES = {TenantRole.COMPANY_OWNER.value, TenantRole.COMPANY_ADMIN.value}

_MIME_EXT: dict[str, str] = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
}


def _slugify(name: str) -> str:
    """Return a filesystem-safe slug from a filename stem."""
    stem = name.rsplit(".", 1)[0] if "." in name else name
    slug = re.sub(r"[^a-zA-Z0-9_-]", "_", stem)
    return slug[:60] or "file"


class PublicSiteUploadService:
    """Stateless service — no DB interaction, no session needed."""

    def _require_admin(self, role: str) -> None:
        if role not in _ALLOWED_ROLES:
            raise forbidden("company_owner or company_admin required")

    def _public_url(self, key: str) -> str:
        storage = get_public_storage()
        if storage.public_base_url:
            return f"{storage.public_base_url}/{key}"
        return f"/_local-public/{key}"

    async def upload(
        self,
        *,
        tenant_id: UUID,
        current_user: dict,
        file: UploadFile,
        purpose: str,
    ) -> str:
        """Validate, store, and return the public CDN URL.

        Raises bad_request / forbidden on validation failure.
        Returns the public URL string.
        """
        self._require_admin(current_user.get("role", ""))

        if purpose not in _ALLOWED_PURPOSES:
            raise bad_request(
                f"Invalid purpose '{purpose}'. Allowed: {sorted(_ALLOWED_PURPOSES)}"
            )

        mime = file.content_type or ""
        if mime not in _ALLOWED_MIME:
            raise bad_request(
                f"Unsupported content type '{mime}'. "
                "Allowed: image/png, image/jpeg, image/webp"
            )

        data = await file.read()
        if len(data) > _MAX_BYTES:
            raise bad_request("File exceeds 5 MB limit")

        ext = _MIME_EXT[mime]
        safe_stem = _slugify(file.filename or "upload")
        file_id = uuid_mod.uuid4()
        key = f"public/{tenant_id}/site/{purpose}/{file_id}-{safe_stem}.{ext}"

        storage = get_public_storage()
        await storage.put_object(key, data, mime)

        return self._public_url(key)
