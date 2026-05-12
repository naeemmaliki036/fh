"use client";

import { useQuery } from "@tanstack/react-query";
import { tenantPublicSiteRepository } from "@/lib/api/repositories";
import type { PublicSiteSettings } from "@/lib/types/public-site";
import { queryKeys } from "../../queryKeys";

export function usePublicSiteSettings() {
  return useQuery({
    queryKey: queryKeys.tenantPublicSite.settings,
    queryFn: (): Promise<PublicSiteSettings> =>
      tenantPublicSiteRepository.getSettings(),
    retry: false,
  });
}
