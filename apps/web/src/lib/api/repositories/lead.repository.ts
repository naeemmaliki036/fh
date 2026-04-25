import { BaseRepository } from "./base.repository";
import { ApiError } from "../errors";
import type {
  Lead,
  LeadCreateRequest,
  LeadUpdateRequest,
  LeadListResponse,
  LeadListParams,
  LeadTransitionRequest,
  LeadAssignRequest,
} from "@/lib/types/lead";
import { LeadConflictError } from "@/lib/types/lead";
import type {
  LeadActivity,
  LeadActivityCreateRequest,
  LeadActivityListResponse,
} from "@/lib/types/lead-activity";

interface ActivityParams {
  skip?: number;
  limit?: number;
}

export class LeadRepository extends BaseRepository<Lead, LeadCreateRequest, LeadUpdateRequest> {
  protected readonly basePath = "/leads";

  async listLeads(params?: LeadListParams): Promise<LeadListResponse> {
    const res = await this.client.get<LeadListResponse>(this.basePath, { params });
    return res.data;
  }

  override async create(data: LeadCreateRequest): Promise<Lead> {
    try {
      const res = await this.client.post<Lead>(this.basePath, data);
      return res.data;
    } catch (err) {
      if (err instanceof ApiError && err.isConflict) {
        const existingId = (err.extras.existing_customer_id as string | undefined) ?? "";
        throw new LeadConflictError(err.message, existingId);
      }
      throw err;
    }
  }

  async transition(id: string, body: LeadTransitionRequest): Promise<Lead> {
    const res = await this.client.post<Lead>(`${this.basePath}/${id}/transition`, body);
    return res.data;
  }

  async assign(id: string, body: LeadAssignRequest): Promise<Lead> {
    const res = await this.client.post<Lead>(`${this.basePath}/${id}/assign`, body);
    return res.data;
  }

  async listActivities(id: string, params?: ActivityParams): Promise<LeadActivity[]> {
    const res = await this.client.get<LeadActivityListResponse>(
      `${this.basePath}/${id}/activities`,
      { params },
    );
    return res.data.items;
  }

  async addActivity(id: string, body: LeadActivityCreateRequest): Promise<LeadActivity> {
    const res = await this.client.post<LeadActivity>(
      `${this.basePath}/${id}/activities`,
      body,
    );
    return res.data;
  }

  async deleteActivity(id: string, activityId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${id}/activities/${activityId}`);
  }
}

export const leadRepository = new LeadRepository();
