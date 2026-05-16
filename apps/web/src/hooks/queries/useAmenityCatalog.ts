"use client";

import { useQuery } from "@tanstack/react-query";
import { propertyRepository } from "@/lib/api/repositories";
import type { AmenityCatalog } from "@/lib/types/amenity";
import { queryKeys } from "../queryKeys";

export function useAmenityCatalog() {
  return useQuery<AmenityCatalog>({
    queryKey: queryKeys.properties.amenityCatalog,
    queryFn: (): Promise<AmenityCatalog> => propertyRepository.getAmenityCatalog(),
    staleTime: Infinity,
  });
}
