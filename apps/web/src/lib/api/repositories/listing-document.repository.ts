import { BaseRepository } from "./base.repository";
import type {
  ListingDocument,
  ListingDocumentListResponse,
  ListingDocumentKind,
} from "@/lib/types/listing-document";

export class ListingDocumentRepository extends BaseRepository<ListingDocument> {
  protected readonly basePath = "/listings";

  async list(listingId: string): Promise<ListingDocumentListResponse> {
    const res = await this.client.get<ListingDocumentListResponse>(
      `${this.basePath}/${listingId}/documents`,
    );
    return res.data;
  }

  async upload(
    listingId: string,
    file: File,
    kind: ListingDocumentKind,
    name?: string,
  ): Promise<ListingDocument> {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    if (name) form.append("name", name);
    const res = await this.client.postForm<ListingDocument>(
      `${this.basePath}/${listingId}/documents`,
      form,
    );
    return res.data;
  }

  async remove(listingId: string, docId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/${listingId}/documents/${docId}`,
    );
  }
}

export const listingDocumentRepository = new ListingDocumentRepository();
