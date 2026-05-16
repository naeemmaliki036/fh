import { BaseRepository } from "./base.repository";
import type {
  ListingInterestedCustomer,
  ListingInterestedCustomersResponse,
  LinkCustomerToListingRequest,
} from "@/lib/types/customer";

export class ListingInterestedCustomersRepository extends BaseRepository<ListingInterestedCustomer> {
  protected readonly basePath = "/listings";

  async list(listingId: string): Promise<ListingInterestedCustomersResponse> {
    const res = await this.client.get<ListingInterestedCustomersResponse>(
      `${this.basePath}/${listingId}/interested-customers`,
    );
    return res.data;
  }

  async link(listingId: string, body: LinkCustomerToListingRequest): Promise<ListingInterestedCustomer> {
    const res = await this.client.post<ListingInterestedCustomer>(
      `${this.basePath}/${listingId}/interested-customers`,
      body,
    );
    return res.data;
  }

  async unlink(listingId: string, customerId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/${listingId}/interested-customers/${customerId}`,
    );
  }
}

export const listingInterestedCustomersRepository = new ListingInterestedCustomersRepository();
