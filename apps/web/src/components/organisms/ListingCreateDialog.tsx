"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ListingForm } from "@/components/molecules/ListingForm";
import { useCreateListing } from "@/hooks/mutations/useListingMutations";
import { extractPriceValidationError } from "@/lib/api/errors";
import type { ListingCreateRequest, ListingUpdateRequest } from "@/lib/types/listing";

interface ListingCreateDialogProps {
  propertyId: string;
  open: boolean;
  onClose: () => void;
}

export function ListingCreateDialog({ propertyId, open, onClose }: ListingCreateDialogProps): React.ReactElement {
  const [priceApiError, setPriceApiError] = useState<string | null>(null);
  const { mutate: create, isPending } = useCreateListing(propertyId);

  const handleSubmit = (data: ListingCreateRequest | ListingUpdateRequest): void => {
    setPriceApiError(null);
    create(data as ListingCreateRequest, {
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
        <DialogHeader><DialogTitle>New Listing</DialogTitle></DialogHeader>
        <ListingForm
          isPending={isPending}
          submitLabel="Create listing"
          onSubmit={handleSubmit}
          onCancel={onClose}
          priceApiError={priceApiError}
        />
      </DialogContent>
    </Dialog>
  );
}
