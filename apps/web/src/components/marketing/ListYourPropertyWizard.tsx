"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { WizardStepNav } from "./wizard/WizardStepNav";
import { WizardStepContent } from "./wizard/WizardStepContent";
import type { WizardState, WizardStepId } from "./wizard/wizard-types";

const INITIAL_STATE: WizardState = {
  intent: null,
  rentFrequency: null,
  city: "",
  area: "",
  category: "residential",
  propertyType: null,
  bedrooms: null,
  sqft: "",
  furnishing: null,
  urgency: null,
  name: "",
  email: "",
  phone: "",
};

const ALL_STEPS: WizardStepId[] = [
  "intent", "rent-frequency", "location", "category-type",
  "bedrooms", "area-furnishing", "urgency", "contact",
];

function getVisibleSteps(state: WizardState): WizardStepId[] {
  return ALL_STEPS.filter((s) => {
    if (s === "rent-frequency") return state.intent === "rent";
    if (s === "bedrooms") {
      const skipTypes = new Set(["land", "plot", "other"]);
      return !skipTypes.has(state.propertyType ?? "");
    }
    return true;
  });
}

function isStepComplete(step: WizardStepId, state: WizardState): boolean {
  switch (step) {
    case "intent": return !!state.intent;
    case "rent-frequency": return state.intent !== "rent" || !!state.rentFrequency;
    case "location": return !!state.city;
    case "category-type": return !!state.propertyType;
    case "bedrooms": return state.bedrooms != null;
    case "area-furnishing": return !!state.sqft;
    case "urgency": return !!state.urgency;
    case "contact": return !!state.name && !!state.email && !!state.phone;
    default: return false;
  }
}

interface ListYourPropertyWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ListYourPropertyWizard({ open, onOpenChange }: ListYourPropertyWizardProps): React.ReactElement {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [currentStep, setCurrentStep] = useState<WizardStepId>("intent");
  const [submitted, setSubmitted] = useState(false);

  const steps = getVisibleSteps(state);
  const stepIdx = steps.indexOf(currentStep);

  const canJumpTo = useCallback((step: WizardStepId): boolean => {
    const targetIdx = steps.indexOf(step);
    if (targetIdx === -1) return false;
    // Can always jump back to completed or current
    if (targetIdx <= stepIdx) return true;
    // Jump forward only if all prior steps complete
    for (let i = 0; i < targetIdx; i++) {
      if (!isStepComplete(steps[i], state)) return false;
    }
    return true;
  }, [steps, stepIdx, state]);

  function handleNext(): void {
    if (stepIdx < steps.length - 1) {
      setCurrentStep(steps[stepIdx + 1]);
    }
  }

  function handleBack(): void {
    if (stepIdx > 0) {
      setCurrentStep(steps[stepIdx - 1]);
    }
  }

  function handleClose(): void {
    onOpenChange(false);
    // Reset after close animation
    setTimeout(() => {
      setState(INITIAL_STATE);
      setCurrentStep("intent");
      setSubmitted(false);
    }, 300);
  }

  // When intent changes and rent-frequency step disappears, adjust if needed
  function updateState(updates: Partial<WizardState>): void {
    setState((prev) => {
      const next = { ...prev, ...updates };
      // If we change intent away from rent and we're on rent-frequency, skip it
      if ("intent" in updates && updates.intent !== "rent" && currentStep === "rent-frequency") {
        const newSteps = getVisibleSteps(next);
        const fallback = newSteps[newSteps.indexOf("rent-frequency") - 1] ?? newSteps[0];
        setCurrentStep(fallback ?? "location");
      }
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-3xl p-0 overflow-hidden rounded-2xl shadow-2xl">
        <div className="flex h-[600px] max-h-[90vh]">
          {/* Left rail */}
          <WizardStepNav
            steps={steps}
            currentStep={currentStep}
            state={state}
            canJumpTo={canJumpTo}
            onJump={setCurrentStep}
            isStepComplete={isStepComplete}
          />

          {/* Right pane */}
          <WizardStepContent
            step={currentStep}
            state={state}
            onChange={updateState}
            onNext={handleNext}
            onBack={handleBack}
            onClose={handleClose}
            isLast={stepIdx === steps.length - 1}
            isFirst={stepIdx === 0}
            submitted={submitted}
            onSubmitted={() => setSubmitted(true)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
