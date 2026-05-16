import type { PropertyType } from "./property";

export interface Amenity {
  key: string;
  label: string;
  applies_to: PropertyType[];
}

export interface AmenityCategory {
  key: string;
  label: string;
  items: Amenity[];
}

export interface AmenityCatalog {
  categories: AmenityCategory[];
}
