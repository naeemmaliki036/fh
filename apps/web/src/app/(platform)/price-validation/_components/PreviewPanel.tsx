"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePriceValidationPreview } from "@/hooks/queries/usePriceValidationRules";
import type { PriceValidationPurpose, PriceValidationPreviewParams } from "@/lib/types";

const PURPOSES: Array<{ value: PriceValidationPurpose; label: string }> = [
  { value: "sale", label: "Sale" },
  { value: "rent_long", label: "Long-term rent" },
  { value: "rent_short", label: "Short-term rent" },
];

function fmt(amount: string | null, currency: string): string {
  if (!amount) return "—";
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat("en-AE", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
}

export function PreviewPanel(): React.ReactElement {
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [purpose, setPurpose] = useState<PriceValidationPurpose>("sale");
  const [currency, setCurrency] = useState("AED");
  const [submitted, setSubmitted] = useState(false);

  const params: PriceValidationPreviewParams = {
    country: country.trim() || undefined,
    city: city.trim() || undefined,
    purpose,
    currency: currency.trim() || "AED",
  };

  const { data, isFetching, error } = usePriceValidationPreview(params, submitted);

  function handlePreview(): void {
    setSubmitted(true);
  }

  return (
    <div className="rounded-md border p-4 space-y-4">
      <h2 className="text-sm font-semibold">Preview effective limits</h2>
      <p className="text-xs text-muted-foreground">
        Test how rules stack for a given scope. Matches rules from most-specific to global.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label htmlFor="prev-country">Country (ISO)</Label>
          <Input
            id="prev-country"
            value={country}
            onChange={(e) => { setCountry(e.target.value.toUpperCase().slice(0, 2)); setSubmitted(false); }}
            placeholder="AE"
            maxLength={2}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="prev-city">City</Label>
          <Input
            id="prev-city"
            value={city}
            onChange={(e) => { setCity(e.target.value); setSubmitted(false); }}
            placeholder="Dubai"
          />
        </div>
        <div className="space-y-1">
          <Label>Purpose</Label>
          <Select value={purpose} onValueChange={(v) => { setPurpose(v as PriceValidationPurpose); setSubmitted(false); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PURPOSES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="prev-currency">Currency</Label>
          <Input
            id="prev-currency"
            value={currency}
            onChange={(e) => { setCurrency(e.target.value.toUpperCase().slice(0, 8)); setSubmitted(false); }}
            placeholder="AED"
            maxLength={8}
          />
        </div>
      </div>

      <Button size="sm" onClick={handlePreview} disabled={isFetching}>
        {isFetching ? "Fetching..." : "Preview"}
      </Button>

      {error && (
        <p className="text-xs text-destructive">{(error as Error).message}</p>
      )}

      {data && (
        <div className="space-y-3">
          <div className="rounded-md bg-muted p-3 flex gap-6 text-sm">
            <span>
              <span className="text-muted-foreground text-xs">Effective min: </span>
              <span className="font-semibold">{fmt(data.effective_min_amount, data.currency)}</span>
            </span>
            <span>
              <span className="text-muted-foreground text-xs">Effective max: </span>
              <span className="font-semibold">{fmt(data.effective_max_amount, data.currency)}</span>
            </span>
          </div>

          {data.sources.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Contributing rules</p>
              <div className="rounded-md border overflow-hidden text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground uppercase tracking-wide">
                      <th className="px-3 py-1.5 text-left">Scope</th>
                      <th className="px-3 py-1.5 text-left">Purpose</th>
                      <th className="px-3 py-1.5 text-left">Min</th>
                      <th className="px-3 py-1.5 text-left">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sources.map((s) => {
                      const scope = s.country
                        ? s.city
                          ? `${s.country} / ${s.city}`
                          : s.country
                        : "Global";
                      return (
                        <tr key={s.rule_id} className="border-t hover:bg-muted/30">
                          <td className="px-3 py-1.5 font-mono">{scope}</td>
                          <td className="px-3 py-1.5">{s.purpose ?? "any"}</td>
                          <td className="px-3 py-1.5">{fmt(s.min_amount, data.currency)}</td>
                          <td className="px-3 py-1.5">{fmt(s.max_amount, data.currency)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.sources.length === 0 && (
            <p className="text-xs text-muted-foreground">No rules match this scope — no price limits enforced.</p>
          )}
        </div>
      )}
    </div>
  );
}
