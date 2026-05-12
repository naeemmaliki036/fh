"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { publicSiteRepository } from "@/lib/api/repositories";
import type { PublicLeadCreate, PublicLeadResponse } from "@/lib/types/public-site";

interface UseCreatePublicLeadOptions {
  slug: string;
  onSuccess?: () => void;
}

export function useCreatePublicLead({ slug, onSuccess }: UseCreatePublicLeadOptions) {
  return useMutation({
    mutationFn: (data: PublicLeadCreate): Promise<PublicLeadResponse> =>
      publicSiteRepository.createLead(slug, data),
    onSuccess: () => {
      toast.success("Message sent! We'll be in touch shortly.");
      onSuccess?.();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { status: number } };
      if (axiosErr.response?.status === 429) {
        toast.error("Too many requests — please wait a moment before trying again.");
        return;
      }
      toast.error("Failed to send message. Please try again.");
    },
  });
}
