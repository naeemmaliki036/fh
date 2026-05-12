import { tenantApiClient } from "../client";
import type { PublicSiteSettings, PublicSiteSettingsUpdate } from "@/lib/types/public-site";

export const tenantPublicSiteRepository = {
  async getSettings(): Promise<PublicSiteSettings> {
    const res = await tenantApiClient.get<PublicSiteSettings>(
      "/tenants/me/public-site",
    );
    return res.data;
  },

  async updateSettings(data: PublicSiteSettingsUpdate): Promise<PublicSiteSettings> {
    const res = await tenantApiClient.patch<PublicSiteSettings>(
      "/tenants/me/public-site",
      data,
    );
    return res.data;
  },
} as const;
