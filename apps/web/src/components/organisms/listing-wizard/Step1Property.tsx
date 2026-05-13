"use client";

import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
import { PropertyPicker } from "@/components/molecules/PropertyPicker";
import type { WizardFormValues } from "./wizard-schema";

interface Step1PropertyProps {
  control: Control<WizardFormValues>;
  disabled?: boolean;
}

export function Step1Property({ control, disabled }: Step1PropertyProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Select Property</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose the property this listing represents on the market.
        </p>
      </div>

      <Controller
        name="property_id"
        control={control}
        render={({ field, fieldState }) => (
          <div className="space-y-1.5">
            <fieldset disabled={disabled}>
              <PropertyPicker
                value={field.value || null}
                onChange={(id) => field.onChange(id ?? "")}
              />
            </fieldset>
            {fieldState.error && (
              <p className="text-xs text-destructive">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />
    </div>
  );
}
