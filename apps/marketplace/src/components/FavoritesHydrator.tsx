"use client";

import { useEffect, useRef } from "react";
import { getMyFavorites } from "@fh/api-client/src/consumer";
import { marketplaceAuthedApi } from "@/lib/api";
import { useConsumer } from "@/lib/consumer-context";

/**
 * Fetches all favorite listing IDs on mount (when signed in) and loads them
 * into the consumer context so FavoriteButton can show filled hearts immediately.
 * Renders nothing — purely a side-effect component.
 */
export function FavoritesHydrator(): null {
  const { token, setFavoriteIds } = useConsumer();
  const fetched = useRef(false);

  useEffect(() => {
    if (!token || fetched.current) return;
    fetched.current = true;

    async function load(): Promise<void> {
      try {
        // Fetch page 1 (up to 100) to seed the Set — enough for typical users
        const res = await getMyFavorites(marketplaceAuthedApi, 1, 100);
        const ids = new Set(res.items.map((item) => item.id));
        setFavoriteIds(ids);
      } catch {
        // Non-fatal — favorites just won't be pre-filled
      }
    }

    void load();
  }, [token, setFavoriteIds]);

  return null;
}
