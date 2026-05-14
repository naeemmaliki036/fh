"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CustomerPicker } from "@/components/molecules/CustomerPicker";
import { CustomerForm } from "@/components/molecules/CustomerForm";
import { useCreateCustomer } from "@/hooks/mutations/useCustomerMutations";
import type { WizardCustomer } from "./wizardTypes";
import type { CustomerSummary } from "@/lib/types/lead";

interface WizardStep1Props {
  value: WizardCustomer | null;
  onSelect: (customer: WizardCustomer) => void;
  onNext: () => void;
}

export function WizardStep1Customer({ value, onSelect, onNext }: WizardStep1Props): React.ReactElement {
  const [mode, setMode] = useState<"pick" | "create">("pick");
  const { mutate: createCustomer, isPending } = useCreateCustomer();

  const handlePickerChange = (cs: CustomerSummary | null): void => {
    if (!cs) return;
    onSelect({ id: cs.id, full_name: cs.full_name, phone: cs.phone });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Step 1 — Customer</h2>
        <p className="text-sm text-muted-foreground mt-1">Pick an existing customer or create a new one</p>
      </div>

      {!value && (
        <div className="flex gap-2">
          <Button size="sm" variant={mode === "pick" ? "default" : "outline"} onClick={() => setMode("pick")}>
            Pick existing
          </Button>
          <Button size="sm" variant={mode === "create" ? "default" : "outline"} onClick={() => setMode("create")}>
            Create new
          </Button>
        </div>
      )}

      {!value && mode === "pick" && (
        <CustomerPicker value={null} onChange={handlePickerChange} />
      )}

      {!value && mode === "create" && (
        <CustomerForm
          isPending={isPending}
          submitLabel="Create & select"
          onSubmit={(data) => {
            createCustomer(data as Parameters<typeof createCustomer>[0], {
              onSuccess: (created) => {
                onSelect({ id: created.id, full_name: created.full_name, phone: created.phone ?? null });
              },
            });
          }}
        />
      )}

      {value && (
        <div className="rounded-md border p-4 bg-muted/30 space-y-1">
          <p className="font-medium">{value.full_name}</p>
          {value.phone && <p className="text-sm text-muted-foreground">{value.phone}</p>}
          <button type="button" className="text-xs text-primary hover:underline" onClick={() => onSelect(null as unknown as WizardCustomer)}>
            Change
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!value}>Continue</Button>
      </div>
    </div>
  );
}
