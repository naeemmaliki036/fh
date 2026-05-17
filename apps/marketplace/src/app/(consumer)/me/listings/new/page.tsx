"use client";

import { useRouter } from "next/navigation";
import { ListingForm } from "@/components/ListingForm";
import { useCreateListing } from "@/hooks/mutations/useMyListingMutations";
import type { ListingFormValues } from "@/components/ListingForm";

export default function NewListingPage(): React.ReactElement {
  const router = useRouter();
  const { mutate, isPending } = useCreateListing();

  function handleSubmit(values: ListingFormValues): void {
    mutate(values, {
      onSuccess: (data) => {
        router.replace(`/me/listings/${data.id}/edit`);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Post a property</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your listing goes live immediately and stays active for 60 days.
        </p>
      </div>
      <ListingForm
        isPending={isPending}
        submitLabel="Post listing"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
