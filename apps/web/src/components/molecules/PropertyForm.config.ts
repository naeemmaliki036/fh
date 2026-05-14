import { z } from "zod";
import type { PropertyType, PropertyStatus } from "@/lib/types/property";

export const TYPES: PropertyType[] = [
  "apartment","villa","townhouse","penthouse",
  "office","retail","warehouse","plot","building","other",
];
export const STATUSES: PropertyStatus[] = [
  "draft","available","reserved","sold","rented","off_market",
];
export const PLOT_TYPES: PropertyType[] = ["plot"];
export const COMMERCIAL_TYPES: PropertyType[] = ["office","retail","warehouse"];
export const BUILDING_TYPES: PropertyType[] = ["building"];

export const propertyFormSchema = z.object({
  title: z.string().min(2, "Title required"),
  country: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  area: z.string().optional().nullable(),
  property_type: z.enum(TYPES as [PropertyType, ...PropertyType[]]),
  bedrooms: z.coerce.number().int().min(0).optional().nullable(),
  bathrooms: z.coerce.number().int().min(0).optional().nullable(),
  size_sqft: z.string().optional().nullable()
    .refine((v) => !v || /^\d+(\.\d+)?$/.test(v), "Must be a number"),
  price: z.string().optional().nullable()
    .refine((v) => !v || /^\d+(\.\d+)?$/.test(v), "Must be a number"),
  currency: z.string().optional().nullable(),
  internal_reference: z.string().optional().nullable(),
  address_line: z.string().optional().nullable(),
  tags: z.array(z.string()).max(5).optional(),
  description: z.string().optional(),
  status: z.enum(STATUSES as [PropertyStatus, ...PropertyStatus[]]).optional(),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

export const blank = (s: string | null | undefined): string | null =>
  s == null || s === "" ? null : s;
