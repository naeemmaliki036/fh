import { BaseRepository } from "./base.repository";
import type {
  ListingPriceChangeRequest,
  ListingPriceHistoryEntry,
  ListingPriceHistoryResponse,
  ListingHeroMediaRequest,
} from "@/lib/types/listing-price";
import type { Listing } from "@/lib/types/listing";

export class ListingPriceRepository extends BaseRepository<ListingPriceHistoryEntry> {
  protected readonly basePath = "/listings";

  async changePrice(
    listingId: string,
    body: ListingPriceChangeRequest,
  ): Promise<Listing> {
    const res = await this.client.patch<Listing>(
      `${this.basePath}/${listingId}/price`,
      body,
    );
    return res.data;
  }

  async getHistory(listingId: string): Promise<ListingPriceHistoryResponse> {
    const res = await this.client.get<ListingPriceHistoryResponse>(
      `${this.basePath}/${listingId}/price-history`,
    );
    return res.data;
  }

  async setHeroMedia(
    listingId: string,
    body: ListingHeroMediaRequest,
  ): Promise<Listing> {
    const res = await this.client.patch<Listing>(
      `${this.basePath}/${listingId}/hero-media`,
      body,
    );
    return res.data;
  }
}

export const listingPriceRepository = new ListingPriceRepository();
