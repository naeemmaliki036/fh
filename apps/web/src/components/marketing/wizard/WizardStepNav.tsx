"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { WizardState, WizardStepId } from "./wizard-types";
import { STEP_LABELS } from "./wizard-types";

interface WizardStepNavProps {
  steps: WizardStepId[];
  currentStep: WizardStepId;
  state: WizardState;
  canJumpTo: (step: WizardStepId) => boolean;
  onJump: (step: WizardStepId) => void;
  isStepComplete: (step: WizardStepId, state: WizardState) => boolean;
}

export function WizardStepNav({
  steps,
  currentStep,
  state,
  canJumpTo,
  onJump,
  isStepComplete,
}: WizardStepNavProps): React.ReactElement {
  return (
    <nav className="w-52 shrink-0 border-r border-slate-100 bg-slate-50 flex flex-col justify-between py-6 px-3">
      <ol className="space-y-0.5">
        {steps.map((step, idx) => {
          const isCurrent = step === currentStep;
          const isDone = isStepComplete(step, state);
          const canJump = canJumpTo(step);

          return (
            <li key={step}>
              <button
                type="button"
                disabled={!canJump}
                onClick={() => canJump && onJump(step)}
                title={!canJump ? "Complete previous steps first" : undefined}
                className={cn(
                  "w-full text-left flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition",
                  isCurrent && "bg-blue-50 text-blue-700 font-bold",
                  !isCurrent && isDone && "text-slate-600 hover:bg-slate-100 cursor-pointer",
                  !isCurrent && !isDone && canJump && "text-slate-400 hover:bg-slate-100 cursor-pointer",
                  !isCurrent && !isDone && !canJump && "text-slate-300 cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-black",
                    isCurrent && "border-blue-600 bg-blue-600 text-white",
                    !isCurrent && isDone && "border-emerald-500 bg-emerald-500 text-white",
                    !isCurrent && !isDone && canJump && "border-slate-300 text-slate-400",
                    !isCurrent && !isDone && !canJump && "border-slate-200 text-slate-300",
                  )}
                >
                  {isDone && !isCurrent ? <Check className="h-3 w-3" /> : idx + 1}
                </span>
                <span className="leading-tight">{STEP_LABELS[step]}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
