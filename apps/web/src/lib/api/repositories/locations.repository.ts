import { platformApiClient } from "../client";
import { apiClient } from "../client";
import type {
  Area,
  AreaBulkCreateRequest,
  AreaCreateRequest,
  AreaUpdateRequest,
  City,
  CityCreateRequest,
  CityUpdateRequest,
  Country,
  CountryCreateRequest,
  CountryTree,
  CountryUpdateRequest,
  CountryWithCounts,
} from "@/lib/types/location";

// ---- Public read (no auth) ----

export const locationsRepository = {
  async getCountries(): Promise<CountryWithCounts[]> {
    const res = await apiClient.get<CountryWithCounts[]>("/locations/countries");
    return res.data;
  },

  async getCities(countryId: string): Promise<City[]> {
    const res = await apiClient.get<City[]>(`/locations/countries/${countryId}/cities`);
    return res.data;
  },

  async getAreas(cityId: string): Promise<Area[]> {
    const res = await apiClient.get<Area[]>(`/locations/cities/${cityId}/areas`);
    return res.data;
  },

  async getFullTree(): Promise<CountryTree[]> {
    const res = await apiClient.get<CountryTree[]>("/locations/all");
    return res.data;
  },
};

// ---- Platform-admin write (platform JWT) ----

export const adminLocationsRepository = {
  // Countries
  async listCountries(): Promise<CountryWithCounts[]> {
    const res = await platformApiClient.get<CountryWithCounts[]>("/admin/locations/countries");
    return res.data;
  },

  async createCountry(data: CountryCreateRequest): Promise<Country> {
    const res = await platformApiClient.post<Country>("/admin/locations/countries", data);
    return res.data;
  },

  async updateCountry(id: string, data: CountryUpdateRequest): Promise<Country> {
    const res = await platformApiClient.patch<Country>(`/admin/locations/countries/${id}`, data);
    return res.data;
  },

  async deleteCountry(id: string): Promise<void> {
    await platformApiClient.delete(`/admin/locations/countries/${id}`);
  },

  // Cities
  async listCities(countryId: string): Promise<City[]> {
    const res = await platformApiClient.get<City[]>(
      `/admin/locations/countries/${countryId}/cities`
    );
    return res.data;
  },

  async createCity(countryId: string, data: CityCreateRequest): Promise<City> {
    const res = await platformApiClient.post<City>(
      `/admin/locations/countries/${countryId}/cities`, data
    );
    return res.data;
  },

  async updateCity(id: string, data: CityUpdateRequest): Promise<City> {
    const res = await platformApiClient.patch<City>(`/admin/locations/cities/${id}`, data);
    return res.data;
  },

  async deleteCity(id: string): Promise<void> {
    await platformApiClient.delete(`/admin/locations/cities/${id}`);
  },

  // Areas
  async listAreas(cityId: string): Promise<Area[]> {
    const res = await platformApiClient.get<Area[]>(`/admin/locations/cities/${cityId}/areas`);
    return res.data;
  },

  async createArea(cityId: string, data: AreaCreateRequest): Promise<Area> {
    const res = await platformApiClient.post<Area>(
      `/admin/locations/cities/${cityId}/areas`, data
    );
    return res.data;
  },

  async updateArea(id: string, data: AreaUpdateRequest): Promise<Area> {
    const res = await platformApiClient.patch<Area>(`/admin/locations/areas/${id}`, data);
    return res.data;
  },

  async deleteArea(id: string): Promise<void> {
    await platformApiClient.delete(`/admin/locations/areas/${id}`);
  },

  async bulkCreateAreas(data: AreaBulkCreateRequest): Promise<Area[]> {
    const res = await platformApiClient.post<Area[]>("/admin/locations/areas/bulk", data);
    return res.data;
  },
};
