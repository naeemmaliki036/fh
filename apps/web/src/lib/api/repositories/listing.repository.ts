import { BaseRepository } from "./base.repository";
import type {
  Listing,
  ListingCreateRequest,
  ListingUpdateRequest,
  ListingListResponse,
  ListingListParams,
  ListingStatusChangeRequest,
  SubmitForReviewRequest,
  ReviewDecisionRequest,
} from "@/lib/types/listing";

export class ListingRepository extends BaseRepository<
  Listing,
  ListingCreateRequest,
  ListingUpdateRequest
> {
  protected readonly basePath = "/listings";

  async listListings(params?: ListingListParams): Promise<ListingListResponse> {
    const res = await this.client.get<ListingListResponse>(this.basePath, { params });
    return res.data;
  }

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

  async changeStatus(id: string, body: ListingStatusChangeRequest): Promise<Listing> {
    const res = await this.client.patch<Listing>(`${this.basePath}/${id}/status`, body);
    return res.data;
  }

  async submitForReview(id: string, body: SubmitForReviewRequest): Promise<Listing> {
    const res = await this.client.post<Listing>(`${this.basePath}/${id}/submit-for-review`, body);
    return res.data;
  }

  async reviewDecision(id: string, body: ReviewDecisionRequest): Promise<Listing> {
    const res = await this.client.post<Listing>(`${this.basePath}/${id}/review-decision`, body);
    return res.data;
  }

  async publishToMarket(id: string): Promise<Listing> {
    const res = await this.client.post<Listing>(`${this.basePath}/${id}/publish`);
    return res.data;
  }
}

export const listingRepository = new ListingRepository();
