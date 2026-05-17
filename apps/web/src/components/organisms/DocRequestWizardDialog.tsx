"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { WizardStep1Customer } from "@/components/organisms/doc-request-wizard/WizardStep1Customer";
import { WizardStep2Property } from "@/components/organisms/doc-request-wizard/WizardStep2Property";
import { WizardStep3Items } from "@/components/organisms/doc-request-wizard/WizardStep3Items";
import { WizardStep4Details } from "@/components/organisms/doc-request-wizard/WizardStep4Details";
import { WizardStep5Review } from "@/components/organisms/doc-request-wizard/WizardStep5Review";
import { useCreateDocumentRequest } from "@/hooks/mutations/useDocumentRequestMutations";
import type {
  WizardState,
  WizardStep,
  WizardItem,
  WizardCustomer,
} from "@/components/organisms/doc-request-wizard/wizardTypes";

interface PrefillCustomer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  phone_normalized: string | null;
}

interface DocRequestWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillCustomer?: PrefillCustomer | null;
}

export function DocRequestWizardDialog({
  open,
  onOpenChange,
  prefillCustomer,
}: DocRequestWizardDialogProps): React.ReactElement {
  const initialCustomer: WizardCustomer | null = prefillCustomer
    ? { id: prefillCustomer.id, full_name: prefillCustomer.full_name, phone: prefillCustomer.phone }
    : null;

  const [step, setStep] = useState<WizardStep>(prefillCustomer ? 2 : 1);
  const [state, setState] = useState<WizardState>({
    customer: initialCustomer,
    propertyId: null,
    propertyTitle: null,
    items: [],
    agentNote: "",
    expiresInDays: 7,
    sendEmail: true,
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
        send_email: state.sendEmail,
      },
      {
        onSuccess: (data) => {
          setVerificationCode(data.verification_code);
          setPublicUrl(data.public_url);
        },
      },
    );
  };

  const handleClose = (v: boolean): void => {
    if (!v) {
      setStep(prefillCustomer ? 2 : 1);
      setState({
        customer: initialCustomer,
        propertyId: null,
        propertyTitle: null,
        items: [],
        agentNote: "",
        expiresInDays: 7,
        sendEmail: true,
      });
      setVerificationCode(null);
      setPublicUrl(null);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Request Documents</DialogTitle>
        </DialogHeader>

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
            onBack={() => setStep(prefillCustomer ? 1 : 1)}
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
            sendEmail={state.sendEmail}
            onChangeNote={(v) => setState((s) => ({ ...s, agentNote: v }))}
            onChangeDays={(v) => setState((s) => ({ ...s, expiresInDays: v }))}
            onChangeSendEmail={(v) => setState((s) => ({ ...s, sendEmail: v }))}
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
      </DialogContent>
    </Dialog>
  );
}
