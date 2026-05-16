import axios, { type AxiosInstance } from "axios";

export function createMarketplaceClient(baseUrl: string): AxiosInstance {
  return axios.create({
    baseURL: baseUrl,
    timeout: 30_000,
    headers: { Accept: "application/json" },
  });
}

export type { AxiosInstance };
