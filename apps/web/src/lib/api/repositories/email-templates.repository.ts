import { platformApiClient } from "../client";
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
    const res = await platformApiClient.get<EmailTemplateListResponse>(this.basePath, { params });
    return res.data;
  }

  async getById(id: string): Promise<EmailTemplate> {
    const res = await platformApiClient.get<EmailTemplate>(`${this.basePath}/${id}`);
    return res.data;
  }

  async create(data: EmailTemplateCreateRequest): Promise<EmailTemplate> {
    const res = await platformApiClient.post<EmailTemplate>(this.basePath, data);
    return res.data;
  }

  async update(id: string, data: EmailTemplateUpdateRequest): Promise<EmailTemplate> {
    const res = await platformApiClient.patch<EmailTemplate>(`${this.basePath}/${id}`, data);
    return res.data;
  }

  async remove(id: string): Promise<void> {
    await platformApiClient.delete(`${this.basePath}/${id}`);
  }

  async testSend(id: string, data: TestSendRequest): Promise<TestSendResponse> {
    const res = await platformApiClient.post<TestSendResponse>(
      `${this.basePath}/${id}/test-send`,
      data,
    );
    return res.data;
  }
}

export const emailTemplatesRepository = new EmailTemplatesRepository();
