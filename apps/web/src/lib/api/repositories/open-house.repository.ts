import { apiClient } from "../client";
import type {
  OpenHouse,
  OpenHouseCreate,
  OpenHouseUpdate,
  OpenHouseCancelRequest,
  OpenHouseListResponse,
  OpenHouseListParams,
} from "@/lib/types/open-house";

export const openHouseRepository = {
  async list(
    listingId: string,
    params: OpenHouseListParams = {},
  ): Promise<OpenHouseListResponse> {
    const res = await apiClient.get<OpenHouseListResponse>(
      `/listings/${listingId}/open-houses`,
      { params },
    );
    return res.data;
  },

  async create(listingId: string, data: OpenHouseCreate): Promise<OpenHouse> {
    const res = await apiClient.post<OpenHouse>(
      `/listings/${listingId}/open-houses`,
      data,
    );
    return res.data;
  },

  async update(id: string, data: OpenHouseUpdate): Promise<OpenHouse> {
    const res = await apiClient.patch<OpenHouse>(`/open-houses/${id}`, data);
    return res.data;
  },

  async cancel(id: string, data: OpenHouseCancelRequest = {}): Promise<OpenHouse> {
    const res = await apiClient.post<OpenHouse>(
      `/open-houses/${id}/cancel`,
      data,
    );
    return res.data;
  },
} as const;
