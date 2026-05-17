"use client";

import { ListingWizard } from "@/components/wizard/ListingWizard";

export default function NewListingPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Post a property</h1>
        <p className="text-sm text-slate-500 mt-1">
          Walk through the steps below — your progress is saved automatically.
        </p>
      </div>
      <ListingWizard />
    </div>
  );
}
