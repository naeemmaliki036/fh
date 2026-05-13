import axios from "axios";
import type {
  PublicTenantProfile,
  PublicListingListResponse,
  PublicListingDetail,
  PublicLeadCreate,
  PublicLeadResponse,
  PublicListingsParams,
  PublicAgentSnippet,
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
    const res = await publicHttp.get<PublicListingListResponse>(
      `/public/sites/${slug}/listings`,
      {
        params: {
          page: params.page ?? 1,
          page_size: params.page_size ?? 12,
          ...(params.min_price != null && { min_price: params.min_price }),
          ...(params.max_price != null && { max_price: params.max_price }),
          ...(params.beds != null && { beds: params.beds }),
          ...(params.property_type && { property_type: params.property_type }),
        },
      },
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
} as const;
