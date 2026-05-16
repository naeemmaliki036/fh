import type { AxiosInstance } from "axios";
import type {
  MarketplaceCountryItem,
  MarketplaceListingItem,
  MarketplaceListingDetail,
  MarketplaceAgencyDetail,
  MarketplaceStats,
  MarketplaceListingsParams,
  MarketplaceListingsResponse,
  MarketplaceAgenciesResponse,
} from "@fh/portal-types";

const BASE = "/marketplace";

export async function getCountries(
  c: AxiosInstance,
): Promise<{ countries: MarketplaceCountryItem[] }> {
  const res = await c.get<{ countries: MarketplaceCountryItem[] }>(`${BASE}/countries`);
  return res.data;
}

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
  country?: string,
): Promise<MarketplaceAgenciesResponse> {
  const res = await c.get<MarketplaceAgenciesResponse>(`${BASE}/agencies`, {
    params: { page, page_size: pageSize, q, country },
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

export async function getStats(
  c: AxiosInstance,
  country?: string,
): Promise<MarketplaceStats> {
  const res = await c.get<MarketplaceStats>(`${BASE}/stats`, {
    params: country ? { country } : undefined,
  });
  return res.data;
}

export async function getFeatured(
  c: AxiosInstance,
  country?: string,
): Promise<MarketplaceListingItem[]> {
  const res = await c.get<MarketplaceListingItem[]>(`${BASE}/featured`, {
    params: country ? { country } : undefined,
  });
  return res.data;
}
