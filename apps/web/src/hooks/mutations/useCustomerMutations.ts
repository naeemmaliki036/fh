"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { customerRepository } from "@/lib/api/repositories";
import type {
  Customer,
  CustomerCreateRequest,
  CustomerUpdateRequest,
} from "@/lib/types";
import { CustomerConflictError } from "@/lib/types";
import type { PrivateDocument, PrivateDocumentKind } from "@/lib/types/private-document";
import { queryKeys } from "../queryKeys";

interface CreateCustomerCallbacks {
  onConflict?: (existingId: string, message: string) => void;
}

export function useCreateCustomer(callbacks?: CreateCustomerCallbacks) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerCreateRequest): Promise<Customer> =>
      customerRepository.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.customers.all });
      toast.success("Customer created");
    },
    onError: (err: Error) => {
      if (err instanceof CustomerConflictError) {
        callbacks?.onConflict?.(err.existingCustomerId, err.message);
        return;
      }
      toast.error(err.message);
    },
  });
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerUpdateRequest): Promise<Customer> =>
      customerRepository.update(id, data),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.customers.detail(id), data);
      qc.invalidateQueries({ queryKey: queryKeys.customers.all });
      toast.success("Customer updated");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<void> => customerRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.customers.all });
      toast.success("Customer disabled");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useUploadCustomerDocument(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, kind }: { file: File; kind: PrivateDocumentKind }): Promise<PrivateDocument> =>
      customerRepository.uploadDocument(customerId, file, kind),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.customers.documents(customerId) });
      toast.success("Document uploaded");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useDeleteCustomerDocument(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string): Promise<void> =>
      customerRepository.deleteDocument(customerId, docId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.customers.documents(customerId) });
      toast.success("Document deleted");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}
