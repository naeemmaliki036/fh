import { BaseRepository } from "./base.repository";
import type {
  Listing,
  ListingCreateRequest,
  ListingUpdateRequest,
  ListingListResponse,
} from "@/lib/types/listing";

export class ListingRepository extends BaseRepository<
  Listing,
  ListingCreateRequest,
  ListingUpdateRequest
> {
  protected readonly basePath = "/listings";

  async listForProperty(propertyId: string): Promise<ListingListResponse> {
    const res = await this.client.get<ListingListResponse>(
      `/properties/${propertyId}/listings`,
    );
    return res.data;
  }

  async createForProperty(propertyId: string, body: ListingCreateRequest): Promise<Listing> {
    const res = await this.client.post<Listing>(
      `/properties/${propertyId}/listings`,
      body,
    );
    return res.data;
  }

  async activate(id: string): Promise<Listing> {
    const res = await this.client.post<Listing>(`${this.basePath}/${id}/activate`);
    return res.data;
  }

  async pause(id: string): Promise<Listing> {
    const res = await this.client.post<Listing>(`${this.basePath}/${id}/pause`);
    return res.data;
  }

  async archive(id: string): Promise<Listing> {
    const res = await this.client.post<Listing>(`${this.basePath}/${id}/archive`);
    return res.data;
  }
}

export const listingRepository = new ListingRepository();
