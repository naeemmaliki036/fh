"use client";

import { type Control, Controller, useWatch } from "react-hook-form";
import { AmenityPicker } from "@/components/molecules/AmenityPicker";
import type { PropertyFormValues } from "@/components/molecules/PropertyForm.config";

interface Props {
  control: Control<PropertyFormValues>;
}

export function PropertyFormAmenities({ control }: Props): React.ReactElement {
  const propertyType = useWatch({ control, name: "property_type" });

  return (
    <Controller
      name="amenities"
      control={control}
      render={({ field }) => (
        <AmenityPicker
          propertyType={propertyType}
          value={field.value ?? []}
          onChange={field.onChange}
        />
      )}
    />
  );
}
