import { BaseRepository } from "./base.repository";
import type {
  Agent,
  AgentCreateRequest,
  AgentUpdateRequest,
  AgentListResponse,
  AgentListParams,
  PhotoUploadResponse,
  AgentStatusChangeRequest,
} from "@/lib/types/agent";
import type {
  PrivateDocument,
  PrivateDocumentListResponse,
  PrivateDocumentKind,
  DownloadUrlResponse,
} from "@/lib/types/private-document";

export class AgentRepository extends BaseRepository<Agent, AgentCreateRequest, AgentUpdateRequest> {
  protected readonly basePath = "/agents";

  async listAgents(params?: AgentListParams): Promise<AgentListResponse> {
    const res = await this.client.get<AgentListResponse>(this.basePath, { params });
    return res.data;
  }

  async uploadPhoto(id: string, file: File): Promise<PhotoUploadResponse> {
    const form = new FormData();
    form.append("file", file);
    const res = await this.client.postForm<PhotoUploadResponse>(
      `${this.basePath}/${id}/photo`,
      form,
    );
    return res.data;
  }

  async deletePhoto(id: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${id}/photo`);
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

  async changeStatus(id: string, body: AgentStatusChangeRequest): Promise<Agent> {
    const res = await this.client.patch<Agent>(`${this.basePath}/${id}/status`, body);
    return res.data;
  }
}

export const agentRepository = new AgentRepository();
