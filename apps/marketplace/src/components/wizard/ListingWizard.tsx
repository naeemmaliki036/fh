"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  useCreateDraft,
  usePatchDraft,
  useSubmitListing,
  extractMarketplacePriceError,
} from "@/hooks/mutations/useDraftListing";
import { StepPurposeType } from "./steps/StepPurposeType";
import { StepLocation } from "./steps/StepLocation";
import { StepDetails } from "./steps/StepDetails";
import { StepPhotos } from "./steps/StepPhotos";
import { StepPricing } from "./steps/StepPricing";
import { StepReview } from "./steps/StepReview";
import {
  INITIAL_WIZARD_STATE,
  STEP_LABELS,
  WIZARD_STEPS,
  type WizardFormState,
  type WizardStepId,
} from "./wizard-types";
import type { ConsumerListingItem, ConsumerListingMediaItem } from "@fh/portal-types";

interface ListingWizardProps {
  initialListing?: ConsumerListingItem;
  initialStep?: WizardStepId;
  isReApproval?: boolean;
}

function stateFromListing(listing: ConsumerListingItem): WizardFormState {
  return {
    purpose: listing.purpose,
    property_type: listing.property_type,
    country: listing.country,
    city: listing.city,
    area: listing.area,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    size_sqft: listing.size_sqft,
    furnishing_status: listing.furnishing_status,
    completion_status: listing.completion_status,
    parking_spaces: listing.parking_spaces,
    floor_number: listing.floor_number,
    view_orientation: listing.view_orientation,
    ownership_type: listing.ownership_type,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    currency: listing.currency,
  };
}

export function ListingWizard({
  initialListing,
  initialStep = "purpose-type",
  isReApproval = false,
}: ListingWizardProps): React.ReactElement {
  const router = useRouter();
  const [step, setStep] = useState<WizardStepId>(initialStep);
  const [form, setForm] = useState<WizardFormState>(
    initialListing ? stateFromListing(initialListing) : INITIAL_WIZARD_STATE,
  );
  const [draftId, setDraftId] = useState<string | null>(initialListing?.id ?? null);
  const [media, setMedia] = useState<ConsumerListingMediaItem[]>(initialListing?.media ?? []);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [reviewPriceError, setReviewPriceError] = useState<string | null>(null);

  const createDraft = useCreateDraft();
  const patchDraft = usePatchDraft();
  const submitMut = useSubmitListing();

  const updateForm = useCallback((updates: Partial<WizardFormState>): void => {
    setForm((prev) => ({ ...prev, ...updates }));
    if ("price" in updates || "currency" in updates) {
      setPriceError(null);
    }
  }, []);

  const stepIdx = WIZARD_STEPS.indexOf(step);

  async function saveOrPatch(overrides?: Partial<WizardFormState>): Promise<string> {
    const merged = { ...form, ...overrides };
    const payload = {
      purpose: merged.purpose,
      property_type: merged.property_type,
      country: merged.country,
      city: merged.city,
      area: merged.area ?? undefined,
      bedrooms: merged.bedrooms,
      bathrooms: merged.bathrooms,
      size_sqft: merged.size_sqft,
      furnishing_status: merged.furnishing_status ?? undefined,
      completion_status: merged.completion_status ?? undefined,
      parking_spaces: merged.parking_spaces,
      floor_number: merged.floor_number,
      view_orientation: merged.view_orientation ?? undefined,
      ownership_type: merged.ownership_type ?? undefined,
      title: merged.title ?? undefined,
      description: merged.description ?? undefined,
      price: merged.price,
      currency: merged.currency,
    };

    if (draftId) {
      await patchDraft.mutateAsync({ id: draftId, body: payload });
      setSavedAt(new Date());
      return draftId;
    } else {
      const draft = await createDraft.mutateAsync(payload);
      setDraftId(draft.id);
      setSavedAt(new Date());
      return draft.id;
    }
  }

  async function goToPhotos(): Promise<void> {
    try {
      await saveOrPatch();
      setStep("photos");
    } catch (err) {
      const pvErr = extractMarketplacePriceError(err);
      if (pvErr) setPriceError(pvErr);
    }
  }

  function handleNext(): void {
    const next = WIZARD_STEPS[stepIdx + 1];
    if (!next) return;
    if (next === "photos") {
      void goToPhotos();
      return;
    }
    setPriceError(null);
    setStep(next);
  }

  function handleBack(): void {
    const prev = WIZARD_STEPS[stepIdx - 1];
    if (prev) setStep(prev);
  }

  function handleSaveDraft(): void {
    setReviewPriceError(null);
    void saveOrPatch()
      .then(() => router.replace("/me/listings"))
      .catch((err) => {
        const pvErr = extractMarketplacePriceError(err);
        if (pvErr) setReviewPriceError(pvErr);
      });
  }

  function handleSubmit(): void {
    if (!draftId) return;
    setReviewPriceError(null);
    void saveOrPatch()
      .then((id) => {
        submitMut.mutate(id, {
          onSuccess: () => router.replace("/me/listings"),
          onError: (err) => {
            const pvErr = extractMarketplacePriceError(err);
            if (pvErr) setReviewPriceError(pvErr);
          },
        });
      })
      .catch((err) => {
        const pvErr = extractMarketplacePriceError(err);
        if (pvErr) setReviewPriceError(pvErr);
      });
  }

  const isSaving = createDraft.isPending || patchDraft.isPending;

  return (
    <div className="flex flex-col gap-6">
      {isReApproval && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 font-medium">
          Editing this listing will require re-approval before it goes live again.
        </div>
      )}

      {/* Step indicator */}
      <nav className="flex items-center gap-1 overflow-x-auto pb-1">
        {WIZARD_STEPS.map((s, idx) => {
          const done = idx < stepIdx;
          const current = s === step;
          return (
            <div key={s} className="flex items-center gap-1 shrink-0">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black border",
                  current && "border-teal-600 bg-teal-600 text-white",
                  done && "border-emerald-500 bg-emerald-500 text-white",
                  !current && !done && "border-slate-300 text-slate-400",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : idx + 1}
              </span>
              <span className={cn("text-xs font-semibold hidden sm:block", current ? "text-teal-700" : done ? "text-emerald-600" : "text-slate-400")}>
                {STEP_LABELS[s]}
              </span>
              {idx < WIZARD_STEPS.length - 1 && (
                <span className="w-4 h-px bg-slate-200 mx-1 hidden sm:block" />
              )}
            </div>
          );
        })}
      </nav>

      {/* Saved indicator */}
      {savedAt && (
        <p className="text-[11px] text-emerald-600 -mt-3 inline-flex items-center gap-1">
          <Check className="h-3 w-3" /> Draft saved
        </p>
      )}

      {/* Step content */}
      <div className="max-w-xl">
        {step === "purpose-type" && (
          <StepPurposeType state={form} onChange={updateForm} onNext={handleNext} />
        )}
        {step === "location" && (
          <StepLocation
            state={form}
            onChange={updateForm}
            onNext={handleNext}
            onBack={handleBack}
            onSaveDraft={handleSaveDraft}
            isSaving={isSaving}
          />
        )}
        {step === "details" && (
          <StepDetails
            state={form}
            onChange={updateForm}
            onNext={handleNext}
            onBack={handleBack}
            onSaveDraft={handleSaveDraft}
            isSaving={isSaving}
          />
        )}
        {step === "photos" && draftId && (
          <StepPhotos
            listingId={draftId}
            media={media}
            onMediaChange={setMedia}
            onNext={handleNext}
            onBack={handleBack}
            onSaveDraft={handleSaveDraft}
            isSaving={isSaving}
          />
        )}
        {step === "pricing" && (
          <StepPricing
            state={form}
            onChange={updateForm}
            onNext={handleNext}
            onBack={handleBack}
            priceApiError={priceError}
            onSaveDraft={handleSaveDraft}
            isSaving={isSaving}
          />
        )}
        {step === "review" && (
          <StepReview
            state={form}
            media={media}
            isSaving={isSaving}
            isSubmitting={submitMut.isPending}
            onSaveDraft={handleSaveDraft}
            onSubmit={handleSubmit}
            onBack={handleBack}
            priceError={reviewPriceError}
            onGoToPricing={() => setStep("pricing")}
          />
        )}
      </div>
    </div>
  );
}
