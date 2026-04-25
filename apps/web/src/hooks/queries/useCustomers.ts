"use client";

import { useQuery } from "@tanstack/react-query";
import { customerRepository } from "@/lib/api/repositories";
import type { Customer, CustomerListResponse, CustomerListParams } from "@/lib/types";
import type { PrivateDocument } from "@/lib/types/private-document";
import { queryKeys } from "../queryKeys";

export function useCustomers(params?: CustomerListParams) {
  return useQuery({
    queryKey: queryKeys.customers.list(params as Record<string, unknown> | undefined),
    queryFn: (): Promise<CustomerListResponse> => customerRepository.listCustomers(params),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: (): Promise<Customer> => customerRepository.getById(id),
    enabled: !!id,
  });
}

export function useCustomerDocuments(customerId: string) {
  return useQuery({
    queryKey: queryKeys.customers.documents(customerId),
    queryFn: (): Promise<PrivateDocument[]> => customerRepository.listDocuments(customerId),
    enabled: !!customerId,
  });
}
