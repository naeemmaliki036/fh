"use client";

import { useForm, Controller, type Control, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TagsInput } from "@/components/molecules/TagsInput";
import { Textarea } from "@/components/atoms/Textarea";
import { SearchableSelect } from "@/components/molecules/SearchableSelect";
import { PropertyFormAttributes } from "@/components/molecules/PropertyFormAttributes";
import { PropertyFormAmenities } from "@/components/molecules/PropertyFormAmenities";
import { CURRENCIES } from "@/lib/constants/regions";
import { useMyTenant } from "@/hooks/queries/useTenants";
import { useLocationData } from "@/hooks/useLocationData";
import {
  propertyFormSchema, blank,
  TYPES, STATUSES, PLOT_TYPES, COMMERCIAL_TYPES, BUILDING_TYPES,
  type PropertyFormValues,
} from "@/components/molecules/PropertyForm.config";
import type {
  Property, PropertyCreateRequest, PropertyUpdateRequest,
} from "@/lib/types/property";

// ── Shared layout primitives ──────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }): React.ReactElement {
  return <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</h3>;
}
function Divider(): React.ReactElement {
  return <div className="border-t pt-4" />;
}

// ── Basic info section ────────────────────────────────────────────────────────
interface BasicInfoProps {
  register: UseFormRegister<PropertyFormValues>;
  control: Control<PropertyFormValues>;
  showStatus?: boolean;
  titleError?: string;
}
function BasicInfoSection({ register, control, showStatus, titleError }: BasicInfoProps): React.ReactElement {
  return (
    <div className="space-y-1.5">
      <SectionHeader label="Basic info" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="space-y-1 col-span-2 md:col-span-3">
          <Label htmlFor="form-title">Title *</Label>
          <Input id="form-title" {...register("title")} />
          {titleError && <p className="text-xs text-destructive">{titleError}</p>}
        </div>
        <div className="space-y-1">
          <Label>Type *</Label>
          <Controller name="property_type" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </div>
        {showStatus && (
          <div className="space-y-1">
            <Label>Status</Label>
            <Controller name="status" control={control} render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </div>
        )}
        <div className="space-y-1">
          <Label>Internal Ref <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Input {...register("internal_reference")} />
        </div>
        <div className="space-y-1 col-span-2 md:col-span-3">
          <Label>Tags <span className="text-xs text-muted-foreground">(max 5)</span></Label>
          <Controller name="tags" control={control} render={({ field }) => (
            <TagsInput value={field.value ?? []} onChange={field.onChange} />
          )} />
        </div>
      </div>
    </div>
  );
}

// ── Location section ──────────────────────────────────────────────────────────
interface LocationProps {
  register: UseFormRegister<PropertyFormValues>;
  control: Control<PropertyFormValues>;
  setValue: UseFormSetValue<PropertyFormValues>;
  operatingCountries: string[];
  cityOptions: { value: string; label: string }[];
  areaOptions: { value: string; label: string }[];
  selectedCountry: string | null | undefined;
  selectedCity: string | null | undefined;
}
function LocationSection({
  register, control, setValue, operatingCountries,
  cityOptions, areaOptions, selectedCountry, selectedCity,
}: LocationProps): React.ReactElement {
  return (
    <div className="space-y-1.5">
      <SectionHeader label="Location" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label>Country</Label>
          <Controller name="country" control={control} render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={(v) => { field.onChange(v); setValue("city",""); setValue("area",""); }}>
              <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>
                {(operatingCountries.length > 0 ? operatingCountries : ["AE","SA"]).map(
                  (c) => <SelectItem key={c} value={c}>{c}</SelectItem>
                )}
              </SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-1">
          <Label>City</Label>
          <Controller name="city" control={control} render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={(v) => { field.onChange(v); setValue("area",""); }} disabled={!selectedCountry || cityOptions.length === 0}>
              <SelectTrigger><SelectValue placeholder="City" /></SelectTrigger>
              <SelectContent>{cityOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-1">
          <Label>Area <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Controller name="area" control={control} render={({ field }) => (
            <SearchableSelect value={field.value ?? ""} onChange={field.onChange} options={areaOptions} placeholder="Area" disabled={!selectedCity} allowFreeText />
          )} />
        </div>
        <div className="space-y-1 col-span-2 md:col-span-3">
          <Label>Address <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Input {...register("address_line")} />
        </div>
      </div>
    </div>
  );
}

// ── Public API ────────────────────────────────────────────────────────────────
interface PropertyFormProps {
  defaultValues?: Partial<Property>;
  showStatus?: boolean;
  isPending: boolean;
  submitLabel: string;
  onSubmit: (data: PropertyCreateRequest | PropertyUpdateRequest) => void;
  onCancel?: () => void;
}

export function PropertyForm({ defaultValues, showStatus, isPending, submitLabel, onSubmit, onCancel }: PropertyFormProps): React.ReactElement {
  const { data: tenant } = useMyTenant();
  const operatingCountries = tenant?.operating_countries ?? [];

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
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
      amenities: defaultValues?.amenities ?? [],
      furnishing_status: defaultValues?.furnishing_status ?? null,
      completion_status: defaultValues?.completion_status ?? null,
      ownership_type: defaultValues?.ownership_type ?? null,
      view_orientation: defaultValues?.view_orientation ?? null,
      service_charge_aed_sqft: defaultValues?.service_charge_aed_sqft ?? "",
      rera_permit_number: defaultValues?.rera_permit_number ?? "",
      plot_area_sqft: defaultValues?.plot_area_sqft ?? null,
      parking_spaces: defaultValues?.parking_spaces ?? null,
      floor_level: defaultValues?.floor_level ?? null,
      fit_out_status: defaultValues?.fit_out_status ?? null,
      ceiling_height_m: defaultValues?.ceiling_height_m ?? "",
      handover_year: defaultValues?.handover_year ?? null,
      handover_quarter: defaultValues?.handover_quarter ?? null,
      payment_plan: defaultValues?.payment_plan ?? null,
    },
  });

  const { citiesByCountry, areasByCity } = useLocationData();
  const selectedCountry = watch("country");
  const selectedCity = watch("city");
  const selectedType = watch("property_type");
  const cityOptions = selectedCountry ? (citiesByCountry[selectedCountry] ?? []) : [];
  const areaOptions = selectedCity ? (areasByCity[selectedCity] ?? []) : [];

  const isPlot = PLOT_TYPES.includes(selectedType);
  const isCommercial = COMMERCIAL_TYPES.includes(selectedType);
  const isBuilding = BUILDING_TYPES.includes(selectedType);
  const showBedrooms = !isPlot && !isCommercial && !isBuilding;
  const showBathrooms = !isPlot && !isBuilding;

  const handleFormSubmit = (v: PropertyFormValues): void => {
    onSubmit({
      ...v,
      bedrooms: showBedrooms ? (v.bedrooms ?? null) : null,
      bathrooms: showBathrooms ? (v.bathrooms ?? null) : null,
      size_sqft: blank(v.size_sqft), price: blank(v.price), currency: blank(v.currency),
      address_line: blank(v.address_line), city: blank(v.city), area: blank(v.area),
      country: blank(v.country), internal_reference: blank(v.internal_reference),
      description: v.description?.trim() || null,
      tags: v.tags && v.tags.length > 0 ? v.tags : null,
      amenities: v.amenities && v.amenities.length > 0 ? v.amenities : null,
      service_charge_aed_sqft: blank(v.service_charge_aed_sqft),
      rera_permit_number: blank(v.rera_permit_number),
      ceiling_height_m: blank(v.ceiling_height_m),
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <BasicInfoSection register={register} control={control} showStatus={showStatus} titleError={errors.title?.message} />
      <Divider />
      <LocationSection register={register} control={control} setValue={setValue} operatingCountries={operatingCountries} cityOptions={cityOptions} areaOptions={areaOptions} selectedCountry={selectedCountry} selectedCity={selectedCity} />
      <Divider />

      {/* Property details */}
      <div className="space-y-1.5">
        <SectionHeader label="Property details" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {showBedrooms && <div className="space-y-1"><Label>Bedrooms <span className="text-xs text-muted-foreground">(optional)</span></Label><Input type="number" {...register("bedrooms")} /></div>}
          {showBathrooms && <div className="space-y-1"><Label>Bathrooms <span className="text-xs text-muted-foreground">(optional)</span></Label><Input type="number" {...register("bathrooms")} /></div>}
          <div className="space-y-1">
            <Label>{isPlot ? "Plot area (sqft)" : "Size (sqft)"} <span className="text-xs text-muted-foreground">(optional)</span></Label>
            <Input {...register("size_sqft")} />
            {errors.size_sqft && <p className="text-xs text-destructive">{errors.size_sqft.message}</p>}
          </div>
        </div>
      </div>
      <Divider />

      {/* Attributes */}
      <div className="space-y-1.5">
        <SectionHeader label="Attributes" />
        <PropertyFormAttributes control={control} register={register} />
      </div>
      <Divider />

      {/* Amenities */}
      <div className="space-y-1.5">
        <SectionHeader label="Amenities" />
        <PropertyFormAmenities control={control} />
      </div>
      <Divider />

      {/* Pricing */}
      <div className="space-y-1.5">
        <SectionHeader label="Pricing" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Price <span className="text-xs text-muted-foreground">(whole number)</span></Label>
            <Input type="number" min="0" step="1" inputMode="numeric" {...register("price")} />
            {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Currency</Label>
            <Controller name="currency" control={control} render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </div>
        </div>
      </div>
      <Divider />

      {/* Description */}
      <div className="space-y-1.5">
        <SectionHeader label="Description" />
        <Textarea {...register("description")} rows={3} />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={() => { reset(); onCancel(); }}>Discard changes</Button>}
        <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : submitLabel}</Button>
      </div>
    </form>
  );
}
