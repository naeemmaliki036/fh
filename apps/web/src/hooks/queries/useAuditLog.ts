"use client";

import { useQuery } from "@tanstack/react-query";
import { auditLogRepository } from "@/lib/api/repositories";
import type { AuditLogListResponse, AuditLogListParams } from "@/lib/types/audit-log";
import { queryKeys } from "../queryKeys";

export function useAuditLog(
  entityType: string,
  entityId: string,
  params?: Omit<AuditLogListParams, "entity_type" | "entity_id">,
) {
  return useQuery({
    queryKey: queryKeys.auditLogs.forEntity(entityType, entityId),
    queryFn: (): Promise<AuditLogListResponse> =>
      auditLogRepository.listForEntity({ entity_type: entityType, entity_id: entityId, ...params }),
    enabled: !!entityType && !!entityId,
  });
}
