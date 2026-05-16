"use client";

import { useState } from "react";
import { toast } from "sonner";
import { isValidPhone } from "@/lib/utils/phone";
import {
  StepIntent, StepRentFrequency, StepLocation, StepCategoryType,
  StepBedrooms, StepAreaFurnishing, StepUrgency, StepContact,
} from "./WizardSteps";
import type { WizardState, WizardStepId } from "./wizard-types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface WizardStepContentProps {
  step: WizardStepId;
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  isFirst: boolean;
  isLast: boolean;
  submitted: boolean;
  onSubmitted: () => void;
}

function buildMessage(s: WizardState): string {
  const lines: string[] = [];
  if (s.intent) lines.push(`Intent: ${s.intent === "sell" ? "Sell" : "Rent"}`);
  if (s.intent === "rent" && s.rentFrequency) lines.push(`Rent period: ${s.rentFrequency}`);
  if (s.city) lines.push(`City: ${s.city}`);
  if (s.area) lines.push(`Area: ${s.area}`);
  if (s.propertyType) lines.push(`Property type: ${s.propertyType}`);
  if (s.bedrooms) lines.push(`Bedrooms: ${s.bedrooms}`);
  if (s.sqft) lines.push(`Size: ${s.sqft} sqft`);
  if (s.furnishing) lines.push(`Furnishing: ${s.furnishing}`);
  if (s.urgency) lines.push(`Urgency: ${s.urgency.replace("_", " ")}`);
  return lines.join("\n");
}

export function WizardStepContent({
  step,
  state,
  onChange,
  onNext,
  onBack,
  onClose,
  isFirst,
  isLast,
  submitted,
  onSubmitted,
}: WizardStepContentProps): React.ReactElement {
  const [submitting, setSubmitting] = useState(false);
  const [contactErrors, setContactErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  async function handleSubmit(): Promise<void> {
    const errs: { name?: string; email?: string; phone?: string } = {};
    if (!state.name.trim() || state.name.trim().length < 2) errs.name = "Name required";
    if (!EMAIL_RE.test(state.email)) errs.email = "Valid email required";
    if (!state.phone || !isValidPhone(state.phone)) errs.phone = "Valid phone required";
    setContactErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        full_name: state.name.trim(),
        email: state.email.trim(),
        phone: state.phone,
        message: buildMessage(state),
        company_name: "Listing enquiry",
        country: "UAE",
        team_size: "1-5",
      };
      const res = await fetch(`${API_BASE}/marketing/demo-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onSubmitted();
    } catch {
      toast.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <span className="text-emerald-600 text-3xl">✓</span>
        </div>
        <h3 className="text-xl font-black text-slate-900">Request received!</h3>
        <p className="text-sm text-slate-500 max-w-xs">
          Our team will review your details and reach out within one business day.
        </p>
        <button onClick={onClose} className="mt-2 text-sm font-bold text-blue-600 hover:underline">Close</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-7 py-6">
        {step === "intent" && <StepIntent state={state} onChange={onChange} />}
        {step === "rent-frequency" && <StepRentFrequency state={state} onChange={onChange} />}
        {step === "location" && <StepLocation state={state} onChange={onChange} />}
        {step === "category-type" && <StepCategoryType state={state} onChange={onChange} />}
        {step === "bedrooms" && <StepBedrooms state={state} onChange={onChange} />}
        {step === "area-furnishing" && <StepAreaFurnishing state={state} onChange={onChange} />}
        {step === "urgency" && <StepUrgency state={state} onChange={onChange} />}
        {step === "contact" && (
          <StepContact state={state} onChange={onChange} errors={contactErrors} />
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between px-7 py-4 border-t border-slate-100">
        <div className="flex gap-2">
          {!isFirst && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Back
            </button>
          )}
          {!isLast && (
            <button
              type="button"
              onClick={onNext}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 transition"
            >
              Continue
            </button>
          )}
          {isLast && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {submitting ? "Sending..." : "Submit"}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600 hover:underline transition"
        >
          Save &amp; exit
        </button>
      </div>
    </div>
  );
}
