"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { agentRepository } from "@/lib/api/repositories";
import type { Agent, AgentCreateRequest, AgentUpdateRequest, PhotoUploadResponse } from "@/lib/types";
import type { PrivateDocument, PrivateDocumentKind } from "@/lib/types/private-document";
import { queryKeys } from "../queryKeys";

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AgentCreateRequest): Promise<Agent> => agentRepository.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents.all });
      toast.success("Agent created");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useUpdateAgent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AgentUpdateRequest): Promise<Agent> => agentRepository.update(id, data),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.agents.detail(id), data);
      qc.invalidateQueries({ queryKey: queryKeys.agents.all });
      toast.success("Agent updated");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<void> => agentRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents.all });
      toast.success("Agent disabled");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useUploadAgentPhoto(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File): Promise<PhotoUploadResponse> =>
      agentRepository.uploadPhoto(agentId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents.detail(agentId) });
      qc.invalidateQueries({ queryKey: queryKeys.agents.all });
      toast.success("Photo uploaded");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useDeleteAgentPhoto(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (): Promise<void> => agentRepository.deletePhoto(agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents.detail(agentId) });
      qc.invalidateQueries({ queryKey: queryKeys.agents.all });
      toast.success("Photo removed");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useUploadAgentDocument(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, kind }: { file: File; kind: PrivateDocumentKind }): Promise<PrivateDocument> =>
      agentRepository.uploadDocument(agentId, file, kind),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents.documents(agentId) });
      toast.success("Document uploaded");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useDeleteAgentDocument(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string): Promise<void> => agentRepository.deleteDocument(agentId, docId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents.documents(agentId) });
      toast.success("Document deleted");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}
