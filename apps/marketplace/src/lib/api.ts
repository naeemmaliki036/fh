import { createMarketplaceClient } from "@fh/api-client";

export const marketplaceApi = createMarketplaceClient(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
);
