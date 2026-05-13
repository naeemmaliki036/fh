"""Public-site asset upload router.

POST /tenants/me/public-site/uploads
    - Accepts multipart: file + purpose (logo|hero|team_photo)
    - Validates MIME and size in service layer
    - Returns {url: str} — the public CDN URL

RBAC: company_owner | company_admin only (enforced in service).
"""

from fastapi import APIRouter, File, Form, UploadFile

from apps.api.dependencies import CurrentUser, TenantContext
from apps.api.services.public_site_upload_service import PublicSiteUploadService

router = APIRouter()


@router.post("", summary="Upload a public-site asset (logo / hero / team_photo)")
async def upload_public_site_asset(
    tenant_id: TenantContext,
    current_user: CurrentUser,
    file: UploadFile = File(..., description="Image file (PNG / JPEG / WebP, max 5 MB)"),
    purpose: str = Form(..., description="logo | hero | team_photo"),
) -> dict[str, str]:
    """Upload an image for the public-site customization editor.

    Returns ``{"url": "<cdn_url>"}`` — store it directly in the config blob.
    """
    svc = PublicSiteUploadService()
    url = await svc.upload(
        tenant_id=tenant_id,
        current_user=current_user,
        file=file,
        purpose=purpose,
    )
    return {"url": url}
