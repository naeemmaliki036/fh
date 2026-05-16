import axios from "axios";
import { API_BASE_URL } from "../client";
import type {
  MarketplaceListingItem,
  MarketplaceListingDetail,
  MarketplaceAgencyItem,
  MarketplaceAgencyDetail,
  MarketplaceStats,
  MarketplaceListingsParams,
  MarketplaceListingsResponse,
  MarketplaceAgenciesResponse,
} from "@/lib/types/marketplace";

// Public marketplace endpoints — no auth required.
// Uses a plain axios instance (no interceptors, no token).
const publicClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

const BASE = "/marketplace";

export class MarketplaceRepository {
  async getListings(
    params?: MarketplaceListingsParams,
  ): Promise<MarketplaceListingsResponse> {
    const res = await publicClient.get<MarketplaceListingsResponse>(
      `${BASE}/listings`,
      { params },
    );
    return res.data;
  }

  async getListing(listingId: string): Promise<MarketplaceListingDetail> {
    const res = await publicClient.get<MarketplaceListingDetail>(
      `${BASE}/listings/${listingId}`,
    );
    return res.data;
  }

  async getAgencies(
    page?: number,
    pageSize?: number,
    q?: string,
  ): Promise<MarketplaceAgenciesResponse> {
    const res = await publicClient.get<MarketplaceAgenciesResponse>(
      `${BASE}/agencies`,
      { params: { page, page_size: pageSize, q } },
    );
    return res.data;
  }

  async getAgency(slug: string): Promise<MarketplaceAgencyDetail> {
    const res = await publicClient.get<MarketplaceAgencyDetail>(
      `${BASE}/agencies/${slug}`,
    );
    return res.data;
  }

  async getAgencyListings(
    slug: string,
    params?: Omit<MarketplaceListingsParams, "tenant_slug">,
  ): Promise<MarketplaceListingsResponse> {
    const res = await publicClient.get<MarketplaceListingsResponse>(
      `${BASE}/agencies/${slug}/listings`,
      { params },
    );
    return res.data;
  }

  async getStats(): Promise<MarketplaceStats> {
    const res = await publicClient.get<MarketplaceStats>(`${BASE}/stats`);
    return res.data;
  }

  async getFeatured(): Promise<MarketplaceListingItem[]> {
    const res = await publicClient.get<MarketplaceListingItem[]>(
      `${BASE}/featured`,
    );
    return res.data;
  }
}

export const marketplaceRepository = new MarketplaceRepository();
