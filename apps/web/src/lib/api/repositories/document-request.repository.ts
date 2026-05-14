import { BaseRepository } from "./base.repository";
import type {
  DocumentRequest,
  DocumentRequestCreate,
  DocumentRequestCreateResponse,
  DocumentRequestListResponse,
  DocumentRequestListParams,
  RegenerateCodeResponse,
} from "@/lib/types/document-request";

export class DocumentRequestRepository extends BaseRepository<
  DocumentRequest,
  DocumentRequestCreate,
  never
> {
  protected readonly basePath = "/document-requests";

  override async create(data: DocumentRequestCreate): Promise<DocumentRequestCreateResponse> {
    const res = await this.client.post<DocumentRequestCreateResponse>(this.basePath, data);
    return res.data;
  }

  async listRequests(params?: DocumentRequestListParams): Promise<DocumentRequestListResponse> {
    const res = await this.client.get<DocumentRequestListResponse>(this.basePath, { params });
    return res.data;
  }

  async cancel(id: string): Promise<DocumentRequest> {
    const res = await this.client.post<DocumentRequest>(`${this.basePath}/${id}/cancel`);
    return res.data;
  }

  async regenerateCode(id: string): Promise<RegenerateCodeResponse> {
    const res = await this.client.post<RegenerateCodeResponse>(
      `${this.basePath}/${id}/regenerate-code`,
    );
    return res.data;
  }

  async reopen(id: string): Promise<DocumentRequest> {
    const res = await this.client.post<DocumentRequest>(`${this.basePath}/${id}/reopen`);
    return res.data;
  }
}

export const documentRequestRepository = new DocumentRequestRepository();
