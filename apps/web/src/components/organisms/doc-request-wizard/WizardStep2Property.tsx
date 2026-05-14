"use client";

import { Button } from "@/components/ui/button";
import { PropertyPicker } from "@/components/molecules/PropertyPicker";

interface WizardStep2Props {
  propertyId: string | null;
  onSelect: (id: string | null, title: string | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export function WizardStep2Property({ propertyId, onSelect, onNext, onBack }: WizardStep2Props): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Step 2 — Property (optional)</h2>
        <p className="text-sm text-muted-foreground mt-1">Link this request to a property in your portfolio</p>
      </div>

      <PropertyPicker value={propertyId} onChange={(id) => onSelect(id, null)} />

      {propertyId && (
        <button type="button" className="text-xs text-muted-foreground hover:underline" onClick={() => onSelect(null, null)}>
          Clear property selection
        </button>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}
