"use client";

/**
 * Returns location data in the same shape as the legacy TS constants
 * (CITIES_BY_COUNTRY / AREAS_BY_CITY), sourced from the API.
 */

import { useMemo } from "react";
import { useLocationTree } from "./queries/useLocations";
import type { CountryTree } from "@/lib/types/location";

export interface LocationData {
  citiesByCountry: Record<string, { value: string; label: string }[]>;
  areasByCity: Record<string, { value: string; label: string }[]>;
  isLoading: boolean;
}

function treeToMaps(tree: CountryTree[]): {
  citiesByCountry: Record<string, { value: string; label: string }[]>;
  areasByCity: Record<string, { value: string; label: string }[]>;
} {
  const citiesByCountry: Record<string, { value: string; label: string }[]> = {};
  const areasByCity: Record<string, { value: string; label: string }[]> = {};

  for (const country of tree) {
    citiesByCountry[country.code] = country.cities.map((c) => ({
      value: c.slug,
      label: c.label,
    }));
    for (const city of country.cities) {
      areasByCity[city.slug] = city.areas.map((a) => ({
        value: a.slug,
        label: a.label,
      }));
    }
  }

  return { citiesByCountry, areasByCity };
}

export function useLocationData(): LocationData {
  const { data: tree, isLoading } = useLocationTree();

  const maps = useMemo(() => {
    if (!tree || tree.length === 0) {
      return { citiesByCountry: {}, areasByCity: {} };
    }
    return treeToMaps(tree);
  }, [tree]);

  return { ...maps, isLoading };
}
