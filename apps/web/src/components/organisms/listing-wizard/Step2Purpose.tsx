"use client";

import { Controller, useWatch } from "react-hook-form";
import type { Control } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WizardFormValues } from "./wizard-schema";
import type { ListingPurpose, RentPeriod } from "@/lib/types/listing";

const PURPOSES: ListingPurpose[] = ["sale", "rent_short", "rent_long"];
const RENT_PERIODS: RentPeriod[] = ["daily", "weekly", "monthly", "quarterly", "yearly"];
const PURPOSE_LABELS: Record<ListingPurpose, string> = {
  sale: "For Sale",
  rent_short: "Short-term Rent",
  rent_long: "Long-term Rent",
};
const PERIOD_LABELS: Record<RentPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

interface Step2PurposeProps {
  control: Control<WizardFormValues>;
  disabled?: boolean;
}

export function Step2Purpose({ control, disabled }: Step2PurposeProps): React.ReactElement {
  const purpose = useWatch({ control, name: "purpose" });
  const isRent = purpose === "rent_short" || purpose === "rent_long";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Purpose & Validity</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Set the listing purpose and optional validity window.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Purpose</Label>
          <Controller
            name="purpose"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PURPOSES.map((p) => (
                    <SelectItem key={p} value={p}>{PURPOSE_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {isRent && (
          <div className="space-y-1.5 col-span-2">
            <Label>Rent Period</Label>
            <Controller
              name="rent_period"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {RENT_PERIODS.map((p) => (
                      <SelectItem key={p} value={p}>{PERIOD_LABELS[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Valid From</Label>
          <Controller
            name="valid_from"
            control={control}
            render={({ field }) => (
              <Input
                type="date"
                value={field.value ?? ""}
                onChange={field.onChange}
                disabled={disabled}
              />
            )}
          />
          <p className="text-xs text-muted-foreground">Leave blank for no start date</p>
        </div>

        <div className="space-y-1.5">
          <Label>Valid Until</Label>
          <Controller
            name="valid_until"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  type="date"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={disabled}
                />
                {fieldState.error && (
                  <p className="text-xs text-destructive">{fieldState.error.message}</p>
                )}
              </>
            )}
          />
          <p className="text-xs text-muted-foreground">Leave blank for no expiry</p>
        </div>
      </div>
    </div>
  );
}
