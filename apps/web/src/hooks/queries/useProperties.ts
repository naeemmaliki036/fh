"use client";

import { useQuery } from "@tanstack/react-query";
import { propertyRepository } from "@/lib/api/repositories";
import { listingRepository } from "@/lib/api/repositories";
import type { Property, PropertyListResponse, PropertyListParams, PropertyAgentDetail } from "@/lib/types/property";
import type { Media } from "@/lib/types/media";
import type { ListingListResponse } from "@/lib/types/listing";
import { queryKeys } from "../queryKeys";

export function useProperties(params?: PropertyListParams) {
  return useQuery({
    queryKey: queryKeys.properties.list(params as Record<string, unknown> | undefined),
    queryFn: (): Promise<PropertyListResponse> => propertyRepository.listProperties(params),
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: queryKeys.properties.detail(id),
    queryFn: (): Promise<Property> => propertyRepository.getById(id),
    enabled: !!id,
  });
}

export function usePropertyMedia(propertyId: string) {
  return useQuery({
    queryKey: queryKeys.properties.media(propertyId),
    queryFn: (): Promise<Media[]> => propertyRepository.listMedia(propertyId),
    enabled: !!propertyId,
  });
}

export function usePropertyListings(propertyId: string) {
  return useQuery({
    queryKey: queryKeys.properties.listings(propertyId),
    queryFn: (): Promise<ListingListResponse> =>
      listingRepository.listForProperty(propertyId),
    enabled: !!propertyId,
  });
}

export function usePropertyAgents(propertyId: string) {
  return useQuery({
    queryKey: queryKeys.properties.agents(propertyId),
    queryFn: (): Promise<PropertyAgentDetail[]> =>
      propertyRepository.listPropertyAgents(propertyId),
    enabled: !!propertyId,
  });
}
