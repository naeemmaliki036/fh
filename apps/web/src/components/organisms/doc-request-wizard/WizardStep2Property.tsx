"use client";

import { Button } from "@/components/ui/button";
import { PropertyPicker } from "@/components/molecules/PropertyPicker";
import { useProperties } from "@/hooks/queries/useProperties";

interface WizardStep2Props {
  propertyId: string | null;
  onSelect: (id: string | null, title: string | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export function WizardStep2Property({ propertyId, onSelect, onNext, onBack }: WizardStep2Props): React.ReactElement {
  const { data } = useProperties({ limit: 1, q: undefined });
  void data; // query is called inside PropertyPicker anyway

  const handleChange = (id: string | null): void => {
    onSelect(id, null); // title will be derived via query in parent if needed
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Step 2 — Property (optional)</h2>
        <p className="text-sm text-muted-foreground mt-1">Link this request to a property in your portfolio</p>
      </div>

      <PropertyPicker value={propertyId} onChange={handleChange} />

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
