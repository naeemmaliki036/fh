"use client";

import { useQuery } from "@tanstack/react-query";
import { locationsRepository, adminLocationsRepository } from "@/lib/api/repositories";
import { queryKeys } from "../queryKeys";

const ONE_HOUR = 60 * 60 * 1000;

/** Full location tree — long stale time, use for client-side caching. */
export function useLocationTree() {
  return useQuery({
    queryKey: queryKeys.locations.tree,
    queryFn: () => locationsRepository.getFullTree(),
    staleTime: ONE_HOUR,
  });
}

/** Active countries with city + area counts. */
export function useCountries() {
  return useQuery({
    queryKey: queryKeys.locations.countries,
    queryFn: () => locationsRepository.getCountries(),
    staleTime: ONE_HOUR,
  });
}

/** Active cities for a country. */
export function useCities(countryId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.locations.cities(countryId ?? ""),
    queryFn: () => locationsRepository.getCities(countryId!),
    enabled: Boolean(countryId),
    staleTime: ONE_HOUR,
  });
}

/** Active areas for a city. */
export function useAreas(cityId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.locations.areas(cityId ?? ""),
    queryFn: () => locationsRepository.getAreas(cityId!),
    enabled: Boolean(cityId),
    staleTime: ONE_HOUR,
  });
}

// ---- Platform-admin queries (all = active + inactive) ----

export function useAdminCountries() {
  return useQuery({
    queryKey: queryKeys.locations.adminCountries,
    queryFn: () => adminLocationsRepository.listCountries(),
    staleTime: 30_000,
  });
}

export function useAdminCities(countryId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.locations.adminCities(countryId ?? ""),
    queryFn: () => adminLocationsRepository.listCities(countryId!),
    enabled: Boolean(countryId),
    staleTime: 30_000,
  });
}

export function useAdminAreas(cityId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.locations.adminAreas(cityId ?? ""),
    queryFn: () => adminLocationsRepository.listAreas(cityId!),
    enabled: Boolean(cityId),
    staleTime: 30_000,
  });
}
