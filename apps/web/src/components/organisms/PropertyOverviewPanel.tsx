"use client";

import { useState } from "react";
import { PropertyForm } from "@/components/molecules/PropertyForm";
import { useUpdateProperty } from "@/hooks/mutations/usePropertyMutations";
import { extractPriceValidationError } from "@/lib/api/errors";
import type { Property, PropertyCreateRequest, PropertyUpdateRequest } from "@/lib/types/property";

interface PropertyOverviewPanelProps {
  property: Property;
}

export function PropertyOverviewPanel({ property }: PropertyOverviewPanelProps): React.ReactElement {
  const [priceApiError, setPriceApiError] = useState<string | null>(null);
  const { mutate: update, isPending } = useUpdateProperty(property.id);

  const handleSubmit = (data: PropertyCreateRequest | PropertyUpdateRequest): void => {
    setPriceApiError(null);
    update(data as PropertyUpdateRequest, {
      onError: (err) => {
        const pvErr = extractPriceValidationError(err);
        if (pvErr) setPriceApiError(pvErr);
      },
    });
  };

  return (
    <PropertyForm
      defaultValues={property}
      showStatus
      isPending={isPending}
      submitLabel="Save changes"
      onSubmit={handleSubmit}
      onCancel={() => { /* reset happens inside PropertyForm */ }}
      priceApiError={priceApiError}
    />
  );
}
