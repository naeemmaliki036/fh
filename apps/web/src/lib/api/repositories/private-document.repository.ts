import { BaseRepository } from "./base.repository";
import type {
  PendingDocumentQueueItem,
  PendingDocumentQueueResponse,
  PendingDocumentQueueParams,
  RejectDocumentRequest,
} from "@/lib/types/customer";
import type { PrivateDocument } from "@/lib/types/private-document";

export class PrivateDocumentRepository extends BaseRepository<PrivateDocument> {
  protected readonly basePath = "/private-documents";

  async listPending(params?: PendingDocumentQueueParams): Promise<PendingDocumentQueueResponse> {
    const res = await this.client.get<PendingDocumentQueueResponse>(
      `${this.basePath}/pending`,
      { params },
    );
    return res.data;
  }

  async approve(id: string): Promise<PrivateDocument> {
    const res = await this.client.patch<PrivateDocument>(`${this.basePath}/${id}/approve`);
    return res.data;
  }

  async reject(id: string, body: RejectDocumentRequest): Promise<PrivateDocument> {
    const res = await this.client.patch<PrivateDocument>(`${this.basePath}/${id}/reject`, body);
    return res.data;
  }
}

export const privateDocumentRepository = new PrivateDocumentRepository();
