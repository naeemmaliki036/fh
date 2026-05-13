"use client";

import { PropertyForm } from "@/components/molecules/PropertyForm";
import { useUpdateProperty } from "@/hooks/mutations/usePropertyMutations";
import type { Property, PropertyCreateRequest, PropertyUpdateRequest } from "@/lib/types/property";

interface PropertyOverviewPanelProps {
  property: Property;
}

export function PropertyOverviewPanel({ property }: PropertyOverviewPanelProps): React.ReactElement {
  const { mutate: update, isPending } = useUpdateProperty(property.id);

  const handleSubmit = (data: PropertyCreateRequest | PropertyUpdateRequest): void => {
    update(data as PropertyUpdateRequest);
  };

  return (
    <PropertyForm
      defaultValues={property}
      showStatus
      isPending={isPending}
      submitLabel="Save changes"
      onSubmit={handleSubmit}
      onCancel={() => { /* reset happens inside PropertyForm */ }}
    />
  );
}
