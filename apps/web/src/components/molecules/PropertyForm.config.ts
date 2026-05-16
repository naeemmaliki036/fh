import { z } from "zod";
import type { PropertyType, PropertyStatus, FurnishingStatus, CompletionStatus, OwnershipType, ViewOrientation, FloorLevel, FitOutStatus } from "@/lib/types/property";

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

export const FURNISHING_STATUSES: FurnishingStatus[] = ["furnished","semi_furnished","unfurnished"];
export const COMPLETION_STATUSES: CompletionStatus[] = ["ready","off_plan"];
export const OWNERSHIP_TYPES: OwnershipType[] = ["freehold","leasehold","gcc_only"];
export const VIEW_ORIENTATIONS: ViewOrientation[] = [
  "sea","marina","canal","lake","creek","city","garden","pool","golf","landmark","partial","none",
];
export const FLOOR_LEVELS: FloorLevel[] = ["low","mid","high"];
export const FIT_OUT_STATUSES: FitOutStatus[] = ["fitted","shell_and_core","partially_fitted"];

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
    .refine((v) => !v || /^\d+$/.test(v), "Must be a whole number (no decimals)"),
  currency: z.string().optional().nullable(),
  internal_reference: z.string().optional().nullable(),
  address_line: z.string().optional().nullable(),
  tags: z.array(z.string()).max(5).optional(),
  description: z.string().optional(),
  status: z.enum(STATUSES as [PropertyStatus, ...PropertyStatus[]]).optional(),
  amenities: z.array(z.string()).optional(),
  // Attributes
  furnishing_status: z.enum(FURNISHING_STATUSES as [FurnishingStatus, ...FurnishingStatus[]]).optional().nullable(),
  completion_status: z.enum(COMPLETION_STATUSES as [CompletionStatus, ...CompletionStatus[]]).optional().nullable(),
  ownership_type: z.enum(OWNERSHIP_TYPES as [OwnershipType, ...OwnershipType[]]).optional().nullable(),
  view_orientation: z.enum(VIEW_ORIENTATIONS as [ViewOrientation, ...ViewOrientation[]]).optional().nullable(),
  service_charge_aed_sqft: z.string().optional().nullable()
    .refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), "Up to 2 decimal places"),
  rera_permit_number: z.string().optional().nullable(),
  plot_area_sqft: z.coerce.number().int().min(0).optional().nullable(),
  parking_spaces: z.coerce.number().int().min(0).optional().nullable(),
  floor_level: z.enum(FLOOR_LEVELS as [FloorLevel, ...FloorLevel[]]).optional().nullable(),
  fit_out_status: z.enum(FIT_OUT_STATUSES as [FitOutStatus, ...FitOutStatus[]]).optional().nullable(),
  ceiling_height_m: z.string().optional().nullable()
    .refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), "Up to 2 decimal places"),
  handover_year: z.coerce.number().int().min(2000).max(2060).optional().nullable(),
  handover_quarter: z.coerce.number().int().min(1).max(4).optional().nullable(),
  payment_plan: z.boolean().optional().nullable(),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

export const blank = (s: string | null | undefined): string | null =>
  s == null || s === "" ? null : s;
