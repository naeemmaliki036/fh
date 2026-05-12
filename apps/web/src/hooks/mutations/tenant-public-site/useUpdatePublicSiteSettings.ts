"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tenantPublicSiteRepository } from "@/lib/api/repositories";
import type { PublicSiteSettings, PublicSiteSettingsUpdate } from "@/lib/types/public-site";
import { queryKeys } from "../../queryKeys";

export function useUpdatePublicSiteSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: PublicSiteSettingsUpdate): Promise<PublicSiteSettings> =>
      tenantPublicSiteRepository.updateSettings(data),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.tenantPublicSite.settings, data);
      toast.success("Public site settings saved");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
