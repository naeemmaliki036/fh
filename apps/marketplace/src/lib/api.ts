import { createMarketplaceClient } from "@fh/api-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const marketplaceApi = createMarketplaceClient(API_BASE);

// Authenticated client for consumer endpoints.
// The interceptor reads the token from localStorage at request time so it
// always uses the freshest value without needing React context.
export const marketplaceAuthedApi = createMarketplaceClient(API_BASE);

const TOKEN_KEY = "mp_consumer_token";

marketplaceAuthedApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
