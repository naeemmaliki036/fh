"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { STEP_LABELS, STEP_COUNT } from "./wizard-schema";
import type { WizardStep } from "./wizard-schema";

interface WizardSidebarProps {
  currentStep: WizardStep;
  completedSteps: Set<number>;
  onStepClick?: (step: WizardStep) => void;
}

export function WizardSidebar({ currentStep, completedSteps, onStepClick }: WizardSidebarProps): React.ReactElement {
  return (
    <nav className="w-48 flex-shrink-0">
      <ol className="space-y-1">
        {(Array.from({ length: STEP_COUNT }, (_, i) => i + 1) as WizardStep[]).map((step) => {
          const isDone = completedSteps.has(step);
          const isCurrent = step === currentStep;
          // Clickable if already completed, currently active, or is a prior step
          const isClickable = isCurrent || isDone || step < currentStep;

          return (
            <li key={step}>
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(step)}
                title={!isClickable ? "Complete previous steps first" : undefined}
                className={cn(
                  "w-full text-left flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  isCurrent && "bg-primary/10 text-foreground font-medium",
                  !isCurrent && isDone && "text-muted-foreground hover:bg-muted cursor-pointer",
                  !isCurrent && !isDone && step < currentStep && "text-muted-foreground hover:bg-muted cursor-pointer",
                  !isCurrent && !isDone && step > currentStep && "text-muted-foreground/50 cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold flex-shrink-0",
                    isCurrent && "border-primary bg-primary text-primary-foreground",
                    !isCurrent && isDone && "border-emerald-500 bg-emerald-500 text-white",
                    !isCurrent && !isDone && "border-muted-foreground/30 text-muted-foreground/50",
                  )}
                >
                  {isDone && !isCurrent ? <Check className="h-3 w-3" /> : step}
                </span>
                {STEP_LABELS[step]}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
