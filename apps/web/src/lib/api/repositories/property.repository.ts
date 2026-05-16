import { BaseRepository } from "./base.repository";
import type {
  Property,
  PropertyCreateRequest,
  PropertyUpdateRequest,
  PropertyListResponse,
  PropertyListParams,
  PropertyAgentAssignment,
  PropertyAgentAssignRequest,
  PropertyAgentPatchRequest,
  PropertyStatusChangeRequest,
  PropertyAgentDetail,
  PropertyAgentCommissionOverrideRequest,
} from "@/lib/types/property";
import type { Media, MediaListResponse, MediaKind } from "@/lib/types/media";

export class PropertyRepository extends BaseRepository<
  Property,
  PropertyCreateRequest,
  PropertyUpdateRequest
> {
  protected readonly basePath = "/properties";

  async listProperties(params?: PropertyListParams): Promise<PropertyListResponse> {
    const res = await this.client.get<PropertyListResponse>(this.basePath, { params });
    return res.data;
  }

  async assignAgent(id: string, body: PropertyAgentAssignRequest): Promise<PropertyAgentAssignment> {
    const res = await this.client.post<PropertyAgentAssignment>(
      `${this.basePath}/${id}/agents`,
      body,
    );
    return res.data;
  }

  async updateAgentAssignment(
    id: string,
    agentId: string,
    body: PropertyAgentPatchRequest,
  ): Promise<PropertyAgentAssignment> {
    const res = await this.client.patch<PropertyAgentAssignment>(
      `${this.basePath}/${id}/agents/${agentId}`,
      body,
    );
    return res.data;
  }

  async unassignAgent(id: string, agentId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${id}/agents/${agentId}`);
  }

  async listMedia(id: string): Promise<Media[]> {
    const res = await this.client.get<MediaListResponse>(
      `${this.basePath}/${id}/media`,
    );
    return res.data.items;
  }

  async uploadMedia(id: string, file: File, kind: MediaKind, altText?: string): Promise<Media> {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    if (altText) form.append("alt_text", altText);
    const res = await this.client.postForm<Media>(`${this.basePath}/${id}/media`, form);
    return res.data;
  }

  async reorderMedia(id: string, orderedIds: string[]): Promise<Media[]> {
    const res = await this.client.post<MediaListResponse>(
      `${this.basePath}/${id}/media/reorder`,
      { ordered_ids: orderedIds },
    );
    return res.data.items;
  }

  async changeStatus(id: string, body: PropertyStatusChangeRequest): Promise<Property> {
    const res = await this.client.patch<Property>(`${this.basePath}/${id}/status`, body);
    return res.data;
  }

  async listPropertyAgents(id: string): Promise<PropertyAgentDetail[]> {
    const res = await this.client.get<PropertyAgentDetail[]>(`${this.basePath}/${id}/agents`);
    return res.data;
  }

  async setCommissionOverride(
    id: string,
    agentId: string,
    body: PropertyAgentCommissionOverrideRequest,
  ): Promise<PropertyAgentDetail> {
    const res = await this.client.put<PropertyAgentDetail>(
      `${this.basePath}/${id}/agents/${agentId}/commission-override`,
      body,
    );
    return res.data;
  }

  async clearCommissionOverride(id: string, agentId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${id}/agents/${agentId}/commission-override`);
  }
}

export const propertyRepository = new PropertyRepository();
