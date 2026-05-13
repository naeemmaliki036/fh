import { tenantApiClient } from "../client";

export type PublicSitePurpose = "logo" | "hero" | "team_photo";

export interface PublicSiteUploadResponse {
  url: string;
}

/**
 * Upload a public-site asset (logo, hero image, or team photo).
 *
 * Sends multipart/form-data to POST /tenants/me/public-site/uploads.
 * Returns the public CDN URL to store back in the public_site_config blob.
 */
export async function uploadPublicSiteAsset(
  file: File,
  purpose: PublicSitePurpose,
): Promise<PublicSiteUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("purpose", purpose);

  const res = await tenantApiClient.post<PublicSiteUploadResponse>(
    "/tenants/me/public-site/uploads",
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return res.data;
}
