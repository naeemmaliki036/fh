import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  fetchLocationCountries,
  fetchLocationCities,
  fetchLocationAreas,
} from "@/lib/api/locations";
import { queryKeys } from "@/lib/queryKeys";
import type { LocationCountry, LocationCity, LocationArea } from "@fh/portal-types";

const ONE_HOUR = 60 * 60 * 1000;

export function useLocationCountries(): UseQueryResult<LocationCountry[]> {
  return useQuery({
    queryKey: queryKeys.locations.countries,
    queryFn: fetchLocationCountries,
    staleTime: ONE_HOUR,
  });
}

export function useLocationCities(
  countryId: string | undefined,
): UseQueryResult<LocationCity[]> {
  return useQuery({
    queryKey: queryKeys.locations.cities(countryId ?? ""),
    queryFn: () => fetchLocationCities(countryId!),
    enabled: Boolean(countryId),
    staleTime: ONE_HOUR,
  });
}

export function useLocationAreas(
  cityId: string | undefined,
): UseQueryResult<LocationArea[]> {
  return useQuery({
    queryKey: queryKeys.locations.areas(cityId ?? ""),
    queryFn: () => fetchLocationAreas(cityId!),
    enabled: Boolean(cityId),
    staleTime: ONE_HOUR,
  });
}
