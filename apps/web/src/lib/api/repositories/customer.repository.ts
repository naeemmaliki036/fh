import { BaseRepository } from "./base.repository";
import { ApiError } from "../errors";
import type {
  Customer,
  CustomerCreateRequest,
  CustomerUpdateRequest,
  CustomerListResponse,
  CustomerListParams,
} from "@/lib/types/customer";
import { CustomerConflictError } from "@/lib/types/customer";
import type {
  PrivateDocument,
  PrivateDocumentListResponse,
  PrivateDocumentKind,
  DownloadUrlResponse,
} from "@/lib/types/private-document";

export class CustomerRepository extends BaseRepository<
  Customer,
  CustomerCreateRequest,
  CustomerUpdateRequest
> {
  protected readonly basePath = "/customers";

  async listCustomers(params?: CustomerListParams): Promise<CustomerListResponse> {
    const res = await this.client.get<CustomerListResponse>(this.basePath, { params });
    return res.data;
  }

  override async create(data: CustomerCreateRequest): Promise<Customer> {
    try {
      const res = await this.client.post<Customer>(this.basePath, data);
      return res.data;
    } catch (err) {
      if (err instanceof ApiError && err.isConflict) {
        const existingId = (err.extras.existing_customer_id as string | undefined) ?? "";
        throw new CustomerConflictError(err.message, existingId);
      }
      throw err;
    }
  }

  async listDocuments(id: string): Promise<PrivateDocument[]> {
    const res = await this.client.get<PrivateDocumentListResponse>(
      `${this.basePath}/${id}/documents`,
    );
    return res.data.items;
  }

  async uploadDocument(id: string, file: File, kind: PrivateDocumentKind): Promise<PrivateDocument> {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    const res = await this.client.postForm<PrivateDocument>(
      `${this.basePath}/${id}/documents`,
      form,
    );
    return res.data;
  }

  async getDownloadUrl(id: string, docId: string): Promise<DownloadUrlResponse> {
    const res = await this.client.get<DownloadUrlResponse>(
      `${this.basePath}/${id}/documents/${docId}/download`,
    );
    return res.data;
  }

  async deleteDocument(id: string, docId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${id}/documents/${docId}`);
  }
}

export const customerRepository = new CustomerRepository();
