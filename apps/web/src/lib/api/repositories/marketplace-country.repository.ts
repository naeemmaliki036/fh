import { platformApiClient } from "../client";
import type {
  MarketplaceCountry,
  MarketplaceCountryListResponse,
  MarketplaceCountryCreateRequest,
  MarketplaceCountryUpdateRequest,
} from "@/lib/types";

const BASE = "/admin/marketplace-countries";

class MarketplaceCountryRepository {
  async list(): Promise<MarketplaceCountryListResponse> {
    const res = await platformApiClient.get<MarketplaceCountryListResponse>(BASE);
    return res.data;
  }

  async create(data: MarketplaceCountryCreateRequest): Promise<MarketplaceCountry> {
    const res = await platformApiClient.post<MarketplaceCountry>(BASE, data);
    return res.data;
  }

  async update(id: string, data: MarketplaceCountryUpdateRequest): Promise<MarketplaceCountry> {
    const res = await platformApiClient.patch<MarketplaceCountry>(`${BASE}/${id}`, data);
    return res.data;
  }

  async remove(id: string): Promise<void> {
    await platformApiClient.delete(`${BASE}/${id}`);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    await platformApiClient.post(`${BASE}/reorder`, { ordered_ids: orderedIds });
  }
}

export const marketplaceCountryRepository = new MarketplaceCountryRepository();
