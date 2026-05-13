"use client";

import { useQuery } from "@tanstack/react-query";
import { auditLogRepository } from "@/lib/api/repositories";
import type { AuditLogListResponse, AuditLogListParams } from "@/lib/types/audit-log";
import { queryKeys } from "../queryKeys";

/**
 * Fetch audit-log entries. When entityType + entityId are provided, the query
 * scopes to that record. When both are undefined, it returns the most recent
 * tenant-scoped activity (used by the dashboard Recent Activity widget).
 */
export function useAuditLog(
  entityType?: string,
  entityId?: string,
  limit?: number,
  params?: Omit<AuditLogListParams, "entity_type" | "entity_id" | "limit">,
) {
  return useQuery({
    queryKey: queryKeys.auditLogs.forEntity(entityType ?? "_recent", entityId ?? `${limit ?? "any"}`),
    queryFn: (): Promise<AuditLogListResponse> =>
      auditLogRepository.listForEntity({
        ...(entityType ? { entity_type: entityType } : {}),
        ...(entityId ? { entity_id: entityId } : {}),
        ...(limit ? { limit } : {}),
        ...(params ?? {}),
      }),
  });
}
