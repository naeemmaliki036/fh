import { anyApiClient } from "../client";
import type {
  EmailTemplate,
  EmailTemplateCreateRequest,
  EmailTemplateUpdateRequest,
  EmailTemplateListParams,
  EmailTemplateListResponse,
  TestSendRequest,
  TestSendResponse,
} from "@/lib/types/email";

export class EmailTemplatesRepository {
  private readonly basePath = "/admin/email-templates";

  async list(params: EmailTemplateListParams = {}): Promise<EmailTemplateListResponse> {
    const res = await anyApiClient.get<EmailTemplateListResponse>(this.basePath, { params });
    return res.data;
  }

  async getById(id: string): Promise<EmailTemplate> {
    const res = await anyApiClient.get<EmailTemplate>(`${this.basePath}/${id}`);
    return res.data;
  }

  async create(data: EmailTemplateCreateRequest): Promise<EmailTemplate> {
    const res = await anyApiClient.post<EmailTemplate>(this.basePath, data);
    return res.data;
  }

  async update(id: string, data: EmailTemplateUpdateRequest): Promise<EmailTemplate> {
    const res = await anyApiClient.patch<EmailTemplate>(`${this.basePath}/${id}`, data);
    return res.data;
  }

  async remove(id: string): Promise<void> {
    await anyApiClient.delete(`${this.basePath}/${id}`);
  }

  async testSend(id: string, data: TestSendRequest): Promise<TestSendResponse> {
    const res = await anyApiClient.post<TestSendResponse>(
      `${this.basePath}/${id}/test-send`,
      data,
    );
    return res.data;
  }
}

export const emailTemplatesRepository = new EmailTemplatesRepository();
