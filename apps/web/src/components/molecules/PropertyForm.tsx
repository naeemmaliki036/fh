"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/atoms/Textarea";
import { PropertyFormAttributes } from "@/components/molecules/PropertyFormAttributes";
import { PropertyFormAmenities } from "@/components/molecules/PropertyFormAmenities";
import { useMyTenant } from "@/hooks/queries/useTenants";
import { useLocationData } from "@/hooks/useLocationData";
import {
  propertyFormSchema, blank,
  PLOT_TYPES, COMMERCIAL_TYPES, BUILDING_TYPES,
  type PropertyFormValues,
} from "@/components/molecules/PropertyForm.config";
import {
  BasicInfoSection, LocationSection, PropertyDetailsSection,
  PricingSection, SectionHeader, Divider,
} from "@/components/molecules/PropertyFormSections";
import type { Property, PropertyCreateRequest, PropertyUpdateRequest } from "@/lib/types/property";

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
      latitude: defaultValues?.latitude ?? null,
      longitude: defaultValues?.longitude ?? null,
      build_year: defaultValues?.build_year ?? null,
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
      <BasicInfoSection register={register} control={control} showStatus={showStatus} titleError={errors.title?.message} refError={errors.internal_reference?.message} currentRef={defaultValues?.internal_reference} />
      <Divider />
      <LocationSection register={register} control={control} setValue={setValue} operatingCountries={operatingCountries} cityOptions={cityOptions} areaOptions={areaOptions} selectedCountry={selectedCountry} selectedCity={selectedCity} />
      <Divider />
      <PropertyDetailsSection register={register} showBedrooms={showBedrooms} showBathrooms={showBathrooms} isPlot={isPlot} sizeError={errors.size_sqft?.message} buildYearError={errors.build_year?.message} />
      <Divider />
      <div className="space-y-1.5"><SectionHeader label="Attributes" /><PropertyFormAttributes control={control} register={register} /></div>
      <Divider />
      <div className="space-y-1.5"><SectionHeader label="Amenities" /><PropertyFormAmenities control={control} /></div>
      <Divider />
      <PricingSection register={register} control={control} priceError={errors.price?.message} />
      <Divider />
      <div className="space-y-1.5"><SectionHeader label="Description" /><Textarea {...register("description")} rows={3} /></div>
      <div className="flex gap-2 justify-end pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={() => { reset(); onCancel(); }}>Discard changes</Button>}
        <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : submitLabel}</Button>
      </div>
    </form>
  );
}
