"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { STEP_LABELS, STEP_COUNT } from "./wizard-schema";
import type { WizardStep } from "./wizard-schema";

interface WizardSidebarProps {
  currentStep: WizardStep;
  completedSteps: Set<number>;
}

export function WizardSidebar({ currentStep, completedSteps }: WizardSidebarProps): React.ReactElement {
  return (
    <nav className="w-48 flex-shrink-0">
      <ol className="space-y-1">
        {(Array.from({ length: STEP_COUNT }, (_, i) => i + 1) as WizardStep[]).map((step) => {
          const isDone = completedSteps.has(step);
          const isCurrent = step === currentStep;
          return (
            <li
              key={step}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm",
                isCurrent && "bg-primary/10 text-foreground font-medium",
                !isCurrent && isDone && "text-muted-foreground",
                !isCurrent && !isDone && "text-muted-foreground/50",
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
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
