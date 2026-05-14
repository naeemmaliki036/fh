"use client";

import { useState } from "react";
import { WizardStep1Customer } from "@/components/organisms/doc-request-wizard/WizardStep1Customer";
import { WizardStep2Property } from "@/components/organisms/doc-request-wizard/WizardStep2Property";
import { WizardStep3Items } from "@/components/organisms/doc-request-wizard/WizardStep3Items";
import { WizardStep4Details } from "@/components/organisms/doc-request-wizard/WizardStep4Details";
import { WizardStep5Review } from "@/components/organisms/doc-request-wizard/WizardStep5Review";
import { useCreateDocumentRequest } from "@/hooks/mutations/useDocumentRequestMutations";
import type { WizardState, WizardStep, WizardItem, WizardCustomer } from "@/components/organisms/doc-request-wizard/wizardTypes";

const STEP_LABELS = ["Customer", "Property", "Documents", "Details", "Review"];

function StepIndicator({ current }: { current: WizardStep }): React.ReactElement {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEP_LABELS.map((label, idx) => {
        const step = (idx + 1) as WizardStep;
        const done = current > step;
        const active = current === step;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              done ? "bg-primary text-primary-foreground" :
              active ? "border-2 border-primary text-primary" :
              "border-2 border-muted text-muted-foreground"
            }`}>
              {idx + 1}
            </div>
            <span className={`text-xs hidden sm:inline ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {label}
            </span>
            {idx < STEP_LABELS.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

export default function NewDocumentRequestWizardPage(): React.ReactElement {
  const [step, setStep] = useState<WizardStep>(1);
  const [state, setState] = useState<WizardState>({
    customer: null,
    propertyId: null,
    propertyTitle: null,
    items: [],
    agentNote: "",
    expiresInDays: 7,
  });
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  const { mutate: create, isPending } = useCreateDocumentRequest();

  const handleSubmit = (): void => {
    if (!state.customer) return;
    create(
      {
        customer_id: state.customer.id,
        title: `Document request — ${state.customer.full_name}`,
        items: state.items,
        property_id: state.propertyId ?? null,
        agent_note: state.agentNote || null,
        instructions: state.agentNote || null,
        expires_in_days: state.expiresInDays,
      },
      {
        onSuccess: (data) => {
          setVerificationCode(data.verification_code);
          setPublicUrl(data.public_url);
        },
      },
    );
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Request Documents</h1>
      <StepIndicator current={verificationCode ? 5 : step} />

      {step === 1 && (
        <WizardStep1Customer
          value={state.customer}
          onSelect={(c: WizardCustomer) => setState((s) => ({ ...s, customer: c ?? null }))}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <WizardStep2Property
          propertyId={state.propertyId}
          onSelect={(id, title) => setState((s) => ({ ...s, propertyId: id, propertyTitle: title }))}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <WizardStep3Items
          items={state.items}
          onChange={(items: WizardItem[]) => setState((s) => ({ ...s, items }))}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <WizardStep4Details
          agentNote={state.agentNote}
          expiresInDays={state.expiresInDays}
          onChangeNote={(v) => setState((s) => ({ ...s, agentNote: v }))}
          onChangeDays={(v) => setState((s) => ({ ...s, expiresInDays: v }))}
          onNext={() => setStep(5)}
          onBack={() => setStep(3)}
        />
      )}
      {step === 5 && (
        <WizardStep5Review
          state={state}
          verificationCode={verificationCode}
          publicUrl={publicUrl}
          isPending={isPending}
          onSubmit={handleSubmit}
          onBack={() => setStep(4)}
        />
      )}
    </div>
  );
}
