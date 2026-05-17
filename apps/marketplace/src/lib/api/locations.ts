import { marketplaceApi } from "@/lib/api";
import type { LocationCountry, LocationCity, LocationArea } from "@fh/portal-types";

export async function fetchLocationCountries(): Promise<LocationCountry[]> {
  const res = await marketplaceApi.get<LocationCountry[]>("/locations/countries");
  return res.data;
}

export async function fetchLocationCities(countryId: string): Promise<LocationCity[]> {
  const res = await marketplaceApi.get<LocationCity[]>(
    `/locations/countries/${countryId}/cities`,
  );
  return res.data;
}

export async function fetchLocationAreas(cityId: string): Promise<LocationArea[]> {
  const res = await marketplaceApi.get<LocationArea[]>(
    `/locations/cities/${cityId}/areas`,
  );
  return res.data;
}
