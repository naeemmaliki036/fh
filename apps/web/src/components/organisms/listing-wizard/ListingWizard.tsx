"use client";

import { useState, useCallback, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { listingRepository } from "@/lib/api/repositories";
import { toast } from "sonner";
import { WizardSidebar } from "./WizardSidebar";
import { Step1Property } from "./Step1Property";
import { Step2Purpose } from "./Step2Purpose";
import { Step3Pricing } from "./Step3Pricing";
import { Step4Content } from "./Step4Content";
import { Step5Media } from "./Step5Media";
import { Step6Documents } from "./Step6Documents";
import { Step7Review } from "./Step7Review";
import { WizardStatusBanner } from "./WizardStatusBanner";
import { wizardSchema, STEP_COUNT } from "./wizard-schema";
import type { WizardFormValues, WizardStep } from "./wizard-schema";
import type { Listing } from "@/lib/types/listing";

interface ListingWizardProps {
  mode: "create" | "edit";
  initial?: Listing;
  initialStep?: WizardStep;
}

function buildDefaults(listing?: Listing): Partial<WizardFormValues> {
  if (!listing) return { purpose: "sale", currency: "AED", listing_tier: "standard", tags: [] };
  return {
    property_id: listing.property_id,
    purpose: listing.purpose,
    rent_period: listing.rent_period ?? null,
    valid_from: listing.valid_from?.slice(0, 10) ?? null,
    valid_until: listing.valid_until?.slice(0, 10) ?? null,
    price: listing.price,
    currency: listing.currency,
    listing_tier: listing.listing_tier,
    title: listing.title,
    short_description: listing.short_description ?? null,
    description: listing.description ?? null,
    tags: listing.tags ?? [],
  };
}

export function ListingWizard({ mode, initial, initialStep }: ListingWizardProps): ReactElement {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>(initialStep ?? 1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [savedListingId, setSavedListingId] = useState<string | null>(initial?.id ?? null);
  const [isSaving, setIsSaving] = useState(false);

  const { control, register, handleSubmit, getValues, formState: { errors } } = useForm<WizardFormValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: buildDefaults(initial),
    mode: "onChange",
  });

  const listingId = savedListingId;
  const listingStatus = initial?.status ?? null;
  const isLocked = listingStatus === "pending_review" || listingStatus === "approved";

  const markDone = useCallback((step: number) => {
    setCompletedSteps((prev) => new Set(prev).add(step));
  }, []);

  const goTo = (step: WizardStep): void => {
    markDone(currentStep);
    setCurrentStep(step);
  };

  const handleSaveDraft = async (): Promise<void> => {
    const values = getValues();
    setIsSaving(true);
    try {
      if (!listingId) {
        const created = await listingRepository.createForProperty(values.property_id, {
          purpose: values.purpose,
          title: values.title,
          short_description: values.short_description,
          price: values.price,
          currency: values.currency,
          description: values.description,
          rent_period: values.rent_period,
          listing_tier: values.listing_tier,
          valid_from: values.valid_from,
          valid_until: values.valid_until,
          status: "draft",
        });
        setSavedListingId(created.id);
        toast.success("Draft created");
        router.push(`/listings/${created.id}/edit?step=${currentStep}`);
      } else {
        await listingRepository.update(listingId, {
          purpose: values.purpose,
          title: values.title,
          short_description: values.short_description,
          price: values.price,
          currency: values.currency,
          description: values.description,
          rent_period: values.rent_period,
          listing_tier: values.listing_tier,
          valid_from: values.valid_from,
          valid_until: values.valid_until,
        });
        toast.success("Draft saved");
      }
      markDone(currentStep);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmit = handleSubmit(async () => {
    await handleSaveDraft();
  });

  const prev = currentStep > 1 ? (currentStep - 1) as WizardStep : null;
  const next = currentStep < STEP_COUNT ? (currentStep + 1) as WizardStep : null;

  return (
    <div className="flex gap-8">
      <WizardSidebar currentStep={currentStep} completedSteps={completedSteps} onStepClick={goTo} />

      <div className="flex-1 min-w-0 space-y-6">
        {initial && <WizardStatusBanner listing={initial} />}

        <form onSubmit={onSubmit} className="space-y-6">
          {currentStep === 1 && (
            <Step1Property control={control} disabled={isLocked} />
          )}
          {currentStep === 2 && (
            <Step2Purpose control={control} disabled={isLocked} />
          )}
          {currentStep === 3 && (
            <Step3Pricing
              control={control}
              register={(name) => register(name)}
              errors={errors}
              disabled={isLocked}
            />
          )}
          {currentStep === 4 && (
            <Step4Content control={control} register={register} errors={errors} disabled={isLocked} />
          )}
          {currentStep === 5 && (
            <Step5Media
              listingId={listingId}
              propertyId={initial?.property_id ?? getValues("property_id") ?? null}
              heroMediaId={initial?.hero_media_id ?? null}
            />
          )}
          {currentStep === 6 && (
            <Step6Documents listingId={listingId} />
          )}
          {currentStep === 7 && (
            <Step7Review
              values={getValues()}
              listingId={listingId}
              status={listingStatus}
              reviewNotes={initial?.review_notes}
              onSaveDraft={handleSaveDraft}
              isSaving={isSaving}
            />
          )}

          {currentStep !== 7 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex gap-2">
                {prev && (
                  <Button type="button" variant="outline" onClick={() => goTo(prev)}>
                    Back
                  </Button>
                )}
                {next && (
                  <Button type="button" onClick={() => goTo(next)}>
                    Continue
                  </Button>
                )}
              </div>
              {!isLocked && (
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving…" : "Save as Draft"}
                </Button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
