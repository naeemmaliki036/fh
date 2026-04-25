"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ListingForm } from "@/components/molecules/ListingForm";
import { useUpdateListing } from "@/hooks/mutations/useListingMutations";
import type { Listing, ListingCreateRequest, ListingUpdateRequest } from "@/lib/types/listing";

interface ListingFormDialogProps {
  propertyId: string;
  listing: Listing;
  open: boolean;
  onClose: () => void;
}

export function ListingFormDialog({ propertyId, listing, open, onClose }: ListingFormDialogProps): React.ReactElement {
  const { mutate: update, isPending } = useUpdateListing(propertyId);

  const handleSubmit = (data: ListingCreateRequest | ListingUpdateRequest): void => {
    update({ id: listing.id, ...(data as ListingUpdateRequest) }, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Listing</DialogTitle></DialogHeader>
        <ListingForm defaultValues={listing} isPending={isPending} submitLabel="Save changes" onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}
