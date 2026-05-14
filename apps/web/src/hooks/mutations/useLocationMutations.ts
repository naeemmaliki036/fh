"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminLocationsRepository } from "@/lib/api/repositories";
import { queryKeys } from "../queryKeys";
import type {
  CountryCreateRequest, CountryUpdateRequest,
  CityCreateRequest, CityUpdateRequest,
  AreaCreateRequest, AreaUpdateRequest,
  AreaBulkCreateRequest,
} from "@/lib/types/location";

// ---- Countries ----

export function useCreateCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CountryCreateRequest) => adminLocationsRepository.createCountry(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.locations.adminCountries });
      toast.success("Country added");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useUpdateCountry(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CountryUpdateRequest) => adminLocationsRepository.updateCountry(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.locations.adminCountries });
      toast.success("Country updated");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useDeleteCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminLocationsRepository.deleteCountry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.locations.adminCountries });
      toast.success("Country deleted");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

// ---- Cities ----

export function useCreateCity(countryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CityCreateRequest) =>
      adminLocationsRepository.createCity(countryId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.locations.adminCities(countryId) });
      toast.success("City added");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useUpdateCity(cityId: string, countryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CityUpdateRequest) => adminLocationsRepository.updateCity(cityId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.locations.adminCities(countryId) });
      toast.success("City updated");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useDeleteCity(countryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminLocationsRepository.deleteCity(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.locations.adminCities(countryId) });
      toast.success("City deleted");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

// ---- Areas ----

export function useCreateArea(cityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AreaCreateRequest) => adminLocationsRepository.createArea(cityId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.locations.adminAreas(cityId) });
      toast.success("Area added");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useUpdateArea(areaId: string, cityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AreaUpdateRequest) => adminLocationsRepository.updateArea(areaId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.locations.adminAreas(cityId) });
      toast.success("Area updated");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useDeleteArea(cityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminLocationsRepository.deleteArea(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.locations.adminAreas(cityId) });
      toast.success("Area deleted");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useBulkCreateAreas(cityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AreaBulkCreateRequest) => adminLocationsRepository.bulkCreateAreas(data),
    onSuccess: (areas) => {
      qc.invalidateQueries({ queryKey: queryKeys.locations.adminAreas(cityId) });
      toast.success(`${areas.length} area(s) imported`);
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}
