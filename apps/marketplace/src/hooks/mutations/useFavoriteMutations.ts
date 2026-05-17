import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { toggleFavorite } from "@fh/api-client/src/consumer";
import { marketplaceAuthedApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useConsumer } from "@/lib/consumer-context";
import type { FavoriteToggleResponse } from "@fh/portal-types";

export function useToggleFavorite(): UseMutationResult<
  FavoriteToggleResponse,
  Error,
  string
> {
  const qc = useQueryClient();
  const { toggleFavoriteId } = useConsumer();

  return useMutation({
    mutationFn: (listingId: string) => toggleFavorite(marketplaceAuthedApi, listingId),
    onSuccess: (data, listingId) => {
      toggleFavoriteId(listingId, data.favorited);
      void qc.invalidateQueries({ queryKey: queryKeys.consumer.me });
      void qc.invalidateQueries({ queryKey: ["consumer", "my-favorites"] });
    },
    onError: () => {
      toast.error("Failed to update favorites.");
    },
  });
}
