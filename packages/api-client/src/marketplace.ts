import type { AxiosInstance } from "axios";
import type {
  MarketplaceListingItem,
  MarketplaceListingDetail,
  MarketplaceAgencyItem,
  MarketplaceAgencyDetail,
  MarketplaceStats,
  MarketplaceListingsParams,
  MarketplaceListingsResponse,
  MarketplaceAgenciesResponse,
} from "@fh/portal-types";

const BASE = "/marketplace";

export async function getListings(
  c: AxiosInstance,
  params?: MarketplaceListingsParams,
): Promise<MarketplaceListingsResponse> {
  const res = await c.get<MarketplaceListingsResponse>(`${BASE}/listings`, { params });
  return res.data;
}

export async function getListing(
  c: AxiosInstance,
  listingId: string,
): Promise<MarketplaceListingDetail> {
  const res = await c.get<MarketplaceListingDetail>(`${BASE}/listings/${listingId}`);
  return res.data;
}

export async function getAgencies(
  c: AxiosInstance,
  page?: number,
  pageSize?: number,
  q?: string,
): Promise<MarketplaceAgenciesResponse> {
  const res = await c.get<MarketplaceAgenciesResponse>(`${BASE}/agencies`, {
    params: { page, page_size: pageSize, q },
  });
  return res.data;
}

export async function getAgency(
  c: AxiosInstance,
  slug: string,
): Promise<MarketplaceAgencyDetail> {
  const res = await c.get<MarketplaceAgencyDetail>(`${BASE}/agencies/${slug}`);
  return res.data;
}

export async function getAgencyListings(
  c: AxiosInstance,
  slug: string,
  params?: Omit<MarketplaceListingsParams, "tenant_slug">,
): Promise<MarketplaceListingsResponse> {
  const res = await c.get<MarketplaceListingsResponse>(
    `${BASE}/agencies/${slug}/listings`,
    { params },
  );
  return res.data;
}

export async function getStats(c: AxiosInstance): Promise<MarketplaceStats> {
  const res = await c.get<MarketplaceStats>(`${BASE}/stats`);
  return res.data;
}

export async function getFeatured(c: AxiosInstance): Promise<MarketplaceListingItem[]> {
  const res = await c.get<MarketplaceListingItem[]>(`${BASE}/featured`);
  return res.data;
}
