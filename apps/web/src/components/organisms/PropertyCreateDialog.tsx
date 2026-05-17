"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PropertyForm } from "@/components/molecules/PropertyForm";
import { useCreateProperty } from "@/hooks/mutations/usePropertyMutations";
import { extractPriceValidationError } from "@/lib/api/errors";
import type { PropertyCreateRequest, PropertyUpdateRequest } from "@/lib/types/property";

interface PropertyCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

export function PropertyCreateDialog({ open, onClose }: PropertyCreateDialogProps): React.ReactElement {
  const [priceApiError, setPriceApiError] = useState<string | null>(null);
  const { mutate: create, isPending } = useCreateProperty();

  const handleSubmit = (data: PropertyCreateRequest | PropertyUpdateRequest): void => {
    setPriceApiError(null);
    create(data as PropertyCreateRequest, {
      onSuccess: onClose,
      onError: (err) => {
        const pvErr = extractPriceValidationError(err);
        if (pvErr) setPriceApiError(pvErr);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Property</DialogTitle></DialogHeader>
        <PropertyForm
          isPending={isPending}
          submitLabel="Create property"
          onSubmit={handleSubmit}
          onCancel={onClose}
          priceApiError={priceApiError}
        />
      </DialogContent>
    </Dialog>
  );
}
