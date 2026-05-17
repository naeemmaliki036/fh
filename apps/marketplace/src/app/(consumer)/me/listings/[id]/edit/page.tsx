"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useMyListings } from "@/hooks/queries/useMyListings";
import { useUpdateListing, useDeleteListing } from "@/hooks/mutations/useMyListingMutations";
import { ListingForm } from "@/components/ListingForm";
import type { ListingFormValues } from "@/components/ListingForm";
import type { ConsumerListingPurpose } from "@fh/portal-types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditListingPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const router = useRouter();

  const { data, isLoading } = useMyListings();
  const listing = data?.items.find((l) => l.id === id) ?? null;

  const updateMut = useUpdateListing();
  const deleteMut = useDeleteListing();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 py-20 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  if (!listing) {
    return <p className="text-red-500 py-10 text-center">Listing not found.</p>;
  }

  const initial: Partial<ListingFormValues> = {
    title: listing.title,
    description: listing.description ?? undefined,
    property_type: listing.property_type,
    purpose: listing.purpose as ConsumerListingPurpose,
    price: listing.price,
    currency: listing.currency,
    country: listing.country,
    city: listing.city,
    area: listing.area ?? undefined,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    size_sqft: listing.size_sqft,
  };

  function handleSubmit(values: ListingFormValues): void {
    updateMut.mutate(
      { id, body: values },
      { onSuccess: () => router.replace("/me/listings") },
    );
  }

  function handleDelete(): void {
    if (!confirm("Archive this listing? It will be removed from public view.")) return;
    deleteMut.mutate(id, { onSuccess: () => router.replace("/me/listings") });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900">Edit listing</h1>
      <ListingForm
        initialValues={initial}
        isPending={updateMut.isPending}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        isDeletePending={deleteMut.isPending}
      />
    </div>
  );
}
