"use client";

import { Controller } from "react-hook-form";
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
import { CURRENCIES } from "@/lib/constants/regions";
import type { WizardFormValues } from "./wizard-schema";
import type { ListingTier } from "@/lib/types/listing";

const TIERS: ListingTier[] = ["standard", "premium", "featured"];
const TIER_LABELS: Record<ListingTier, string> = {
  standard: "Standard",
  premium: "Premium",
  featured: "Featured",
};

interface Step3PricingProps {
  control: Control<WizardFormValues>;
  register: (name: "price") => object;
  errors: Partial<Record<"price", { message?: string }>>;
  disabled?: boolean;
}

export function Step3Pricing({ control, register, errors, disabled }: Step3PricingProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Pricing</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Set the listing price, currency, and display tier.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="wizard-price">Price <span className="text-xs text-muted-foreground">(whole number)</span></Label>
          <Input
            id="wizard-price"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            {...register("price")}
            disabled={disabled}
            placeholder="e.g. 1500000"
          />
          {errors.price && (
            <p className="text-xs text-destructive">{errors.price.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5 col-span-2">
          <Label>Listing Tier</Label>
          <Controller
            name="listing_tier"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIERS.map((t) => (
                    <SelectItem key={t} value={t}>{TIER_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
    </div>
  );
}
