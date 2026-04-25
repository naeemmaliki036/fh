"use client";

import { useQuery } from "@tanstack/react-query";
import { agentRepository } from "@/lib/api/repositories";
import type { Agent, AgentListResponse, AgentListParams } from "@/lib/types";
import type { PrivateDocument } from "@/lib/types/private-document";
import { queryKeys } from "../queryKeys";

export function useAgents(params?: AgentListParams) {
  return useQuery({
    queryKey: queryKeys.agents.list(params as Record<string, unknown> | undefined),
    queryFn: (): Promise<AgentListResponse> => agentRepository.listAgents(params),
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: queryKeys.agents.detail(id),
    queryFn: (): Promise<Agent> => agentRepository.getById(id),
    enabled: !!id,
  });
}

export function useAgentDocuments(agentId: string) {
  return useQuery({
    queryKey: queryKeys.agents.documents(agentId),
    queryFn: (): Promise<PrivateDocument[]> => agentRepository.listDocuments(agentId),
    enabled: !!agentId,
  });
}
