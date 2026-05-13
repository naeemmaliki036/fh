import { BaseRepository } from "./base.repository";
import type {
  AuditLog,
  AuditLogListResponse,
  AuditLogListParams,
} from "@/lib/types/audit-log";

export class AuditLogRepository extends BaseRepository<AuditLog> {
  protected readonly basePath = "/audit-logs";

  async listForEntity(
    params: AuditLogListParams,
  ): Promise<AuditLogListResponse> {
    const res = await this.client.get<AuditLogListResponse>(this.basePath, {
      params,
    });
    return res.data;
  }
}

export const auditLogRepository = new AuditLogRepository();
