"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagsInput } from "@/components/molecules/TagsInput";
import { Textarea } from "@/components/atoms/Textarea";
import { CURRENCIES } from "@/lib/constants/regions";
import { CITIES_BY_COUNTRY, AREAS_BY_CITY } from "@/lib/constants/locations";
import { useMyTenant } from "@/hooks/queries/useTenants";
import type {
  Property,
  PropertyCreateRequest,
  PropertyUpdateRequest,
  PropertyType,
  PropertyStatus,
} from "@/lib/types/property";

const TYPES: PropertyType[] = [
  "apartment","villa","townhouse","penthouse",
  "office","retail","warehouse","plot","building","other",
];
const STATUSES: PropertyStatus[] = ["draft","available","reserved","sold","rented","off_market"];
const PLOT_TYPES: PropertyType[] = ["plot"];
const COMMERCIAL_TYPES: PropertyType[] = ["office","retail","warehouse"];
const BUILDING_TYPES: PropertyType[] = ["building"];

const schema = z.object({
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

type FormValues = z.infer<typeof schema>;

interface PropertyFormProps {
  defaultValues?: Partial<Property>;
  showStatus?: boolean;
  isPending: boolean;
  submitLabel: string;
  onSubmit: (data: PropertyCreateRequest | PropertyUpdateRequest) => void;
  onCancel?: () => void;
}

const blank = (s: string | null | undefined): string | null =>
  s == null || s === "" ? null : s;

export function PropertyForm({ defaultValues, showStatus, isPending, submitLabel, onSubmit, onCancel }: PropertyFormProps): React.ReactElement {
  const { data: tenant } = useMyTenant();
  const operatingCountries = tenant?.operating_countries ?? [];

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      country: defaultValues?.country ?? (operatingCountries[0] ?? "AE"),
      city: defaultValues?.city ?? "",
      area: defaultValues?.area ?? "",
      property_type: defaultValues?.property_type ?? "apartment",
      bedrooms: defaultValues?.bedrooms ?? null,
      bathrooms: defaultValues?.bathrooms ?? null,
      size_sqft: defaultValues?.size_sqft ?? "",
      price: defaultValues?.price ?? "",
      currency: defaultValues?.currency ?? "AED",
      internal_reference: defaultValues?.internal_reference ?? "",
      address_line: defaultValues?.address_line ?? "",
      tags: defaultValues?.tags ?? [],
      description: defaultValues?.description ?? "",
      status: defaultValues?.status,
    },
  });

  const selectedCountry = watch("country");
  const selectedCity = watch("city");
  const selectedType = watch("property_type");
  const cityOptions = selectedCountry ? (CITIES_BY_COUNTRY[selectedCountry] ?? []) : [];
  const areaOptions = selectedCity ? (AREAS_BY_CITY[selectedCity] ?? []) : [];

  const isPlot = PLOT_TYPES.includes(selectedType);
  const isCommercial = COMMERCIAL_TYPES.includes(selectedType);
  const isBuilding = BUILDING_TYPES.includes(selectedType);
  const showBedrooms = !isPlot && !isCommercial && !isBuilding;
  const showBathrooms = !isPlot && !isBuilding;

  const handleFormSubmit = (v: FormValues): void => {
    onSubmit({
      ...v,
      bedrooms: showBedrooms ? (v.bedrooms ?? null) : null,
      bathrooms: showBathrooms ? (v.bathrooms ?? null) : null,
      size_sqft: blank(v.size_sqft), price: blank(v.price), currency: blank(v.currency),
      address_line: blank(v.address_line), city: blank(v.city), area: blank(v.area),
      country: blank(v.country), internal_reference: blank(v.internal_reference),
      description: v.description?.trim() || null,
      tags: v.tags && v.tags.length > 0 ? v.tags : null,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="form-title">Title *</Label>
          <Input id="form-title" {...register("title")} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        {/* Country → City → Area (cascading) */}
        <div className="space-y-1.5">
          <Label>Country</Label>
          <Controller name="country" control={control} render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={(v) => { field.onChange(v); setValue("city", ""); setValue("area", ""); }}>
              <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>
                {(operatingCountries.length > 0 ? operatingCountries : ["AE","SA"]).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-1.5">
          <Label>City</Label>
          <Controller name="city" control={control} render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={(v) => { field.onChange(v); setValue("area", ""); }} disabled={!selectedCountry || cityOptions.length === 0}>
              <SelectTrigger><SelectValue placeholder="City" /></SelectTrigger>
              <SelectContent>{cityOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-1.5">
          <Label>Area <span className="text-xs text-muted-foreground">(optional)</span></Label>
          {areaOptions.length > 0 ? (
            <Controller name="area" control={control} render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={!selectedCity}>
                <SelectTrigger><SelectValue placeholder="Area" /></SelectTrigger>
                <SelectContent>{areaOptions.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          ) : (
            <Input {...register("area")} placeholder="Free-text area" disabled={!selectedCity} />
          )}
        </div>

        {/* Type + optional Status */}
        <div className="space-y-1.5">
          <Label>Type *</Label>
          <Controller name="property_type" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </div>
        {showStatus && (
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Controller name="status" control={control} render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </div>
        )}

        {/* Conditional bedroom/bathroom fields */}
        {showBedrooms && <div className="space-y-1.5"><Label>Bedrooms <span className="text-xs text-muted-foreground">(optional)</span></Label><Input type="number" {...register("bedrooms")} /></div>}
        {showBathrooms && <div className="space-y-1.5"><Label>Bathrooms <span className="text-xs text-muted-foreground">(optional)</span></Label><Input type="number" {...register("bathrooms")} /></div>}

        <div className="space-y-1.5">
          <Label>{isPlot ? "Plot area (sqft)" : "Size (sqft)"} <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Input {...register("size_sqft")} />
          {errors.size_sqft && <p className="text-xs text-destructive">{errors.size_sqft.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Price <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Input {...register("price")} />
          {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Controller name="currency" control={control} render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-1.5"><Label>Internal Ref <span className="text-xs text-muted-foreground">(optional)</span></Label><Input {...register("internal_reference")} /></div>
        <div className="space-y-1.5 col-span-2"><Label>Address <span className="text-xs text-muted-foreground">(optional)</span></Label><Input {...register("address_line")} /></div>

        <div className="space-y-1.5 col-span-2">
          <Label>Tags <span className="text-xs text-muted-foreground">(max 5)</span></Label>
          <Controller name="tags" control={control} render={({ field }) => (
            <TagsInput value={field.value ?? []} onChange={field.onChange} />
          )} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Description <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Textarea {...register("description")} rows={3} />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={() => { reset(); onCancel(); }}>Discard changes</Button>}
        <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : submitLabel}</Button>
      </div>
    </form>
  );
}
