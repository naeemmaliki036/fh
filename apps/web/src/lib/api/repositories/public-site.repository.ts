import axios from "axios";
import type {
  PublicTenantProfile,
  PublicListingListResponse,
  PublicListingDetail,
  PublicLeadCreate,
  PublicLeadResponse,
  PublicListingsParams,
  PublicAgentSnippet,
  PublicListingCard,
  SimilarListingsResponse,
  ListingStatsResponse,
} from "@/lib/types/public-site";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Bare axios instance — no auth interceptors, safe for public pages. */
const publicHttp = axios.create({ baseURL: API_BASE, timeout: 30_000 });

export const publicSiteRepository = {
  async getProfile(slug: string): Promise<PublicTenantProfile> {
    const res = await publicHttp.get<PublicTenantProfile>(
      `/public/sites/${slug}`,
    );
    return res.data;
  },

  async getListings(
    slug: string,
    params: PublicListingsParams = {},
  ): Promise<PublicListingListResponse> {
    const { page = 1, page_size = 12, ...rest } = params;
    const cleaned = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => v != null && v !== ""),
    );
    const res = await publicHttp.get<PublicListingListResponse>(
      `/public/sites/${slug}/listings`,
      { params: { page, page_size, ...cleaned } },
    );
    return res.data;
  },

  async getListingStats(slug: string): Promise<ListingStatsResponse> {
    const res = await publicHttp.get<ListingStatsResponse>(
      `/public/sites/${slug}/listings/stats`,
    );
    return res.data;
  },

  async getListing(slug: string, listingId: string): Promise<PublicListingDetail> {
    const res = await publicHttp.get<PublicListingDetail>(
      `/public/sites/${slug}/listings/${listingId}`,
    );
    return res.data;
  },

  async getAgents(slug: string): Promise<PublicAgentSnippet[]> {
    const res = await publicHttp.get<{ items: PublicAgentSnippet[] }>(
      `/public/sites/${slug}/agents`,
    );
    return res.data.items;
  },

  async createLead(slug: string, data: PublicLeadCreate): Promise<PublicLeadResponse> {
    const res = await publicHttp.post<PublicLeadResponse>(
      `/public/sites/${slug}/leads`,
      data,
    );
    return res.data;
  },

  async getSimilarListings(
    slug: string,
    listingId: string,
    limit: number = 4,
  ): Promise<PublicListingCard[]> {
    const res = await publicHttp.get<SimilarListingsResponse>(
      `/public/sites/${slug}/listings/${listingId}/similar`,
      { params: { limit } },
    );
    return res.data.items;
  },
} as const;
