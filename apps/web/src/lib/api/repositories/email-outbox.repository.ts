import { anyApiClient } from "../client";
import type {
  EmailOutboxItem,
  EmailOutboxListParams,
  EmailOutboxListResponse,
  ProcessOutboxResponse,
} from "@/lib/types/email";

export class EmailOutboxRepository {
  private readonly basePath = "/admin/email-outbox";

  async list(params: EmailOutboxListParams = {}): Promise<EmailOutboxListResponse> {
    const res = await anyApiClient.get<EmailOutboxListResponse>(this.basePath, { params });
    return res.data;
  }

  async getById(id: string): Promise<EmailOutboxItem> {
    const res = await anyApiClient.get<EmailOutboxItem>(`${this.basePath}/${id}`);
    return res.data;
  }

  async retry(id: string): Promise<EmailOutboxItem> {
    const res = await anyApiClient.post<EmailOutboxItem>(`${this.basePath}/${id}/retry`);
    return res.data;
  }

  async process(): Promise<ProcessOutboxResponse> {
    const res = await anyApiClient.post<ProcessOutboxResponse>(`${this.basePath}/process`);
    return res.data;
  }
}

export const emailOutboxRepository = new EmailOutboxRepository();
