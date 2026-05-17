"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  PriceValidationRule,
  PriceValidationRuleCreateRequest,
  PriceValidationRuleUpdateRequest,
  PriceValidationPurpose,
} from "@/lib/types";

const PURPOSES: Array<{ value: PriceValidationPurpose | ""; label: string }> = [
  { value: "", label: "Any purpose" },
  { value: "sale", label: "Sale" },
  { value: "rent_long", label: "Long-term rent" },
  { value: "rent_short", label: "Short-term rent" },
];

interface CreateProps {
  mode: "create";
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PriceValidationRuleCreateRequest) => void;
  isPending: boolean;
}

interface EditProps {
  mode: "edit";
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PriceValidationRuleUpdateRequest) => void;
  isPending: boolean;
  rule: PriceValidationRule;
}

type Props = CreateProps | EditProps;

interface FormState {
  country: string;
  city: string;
  purpose: PriceValidationPurpose | "";
  currency: string;
  min_amount: string;
  max_amount: string;
  notes: string;
  enabled: boolean;
  display_order: string;
}

function blank(v: string): string | null {
  return v.trim() || null;
}

function initState(rule?: PriceValidationRule): FormState {
  if (!rule) {
    return { country: "", city: "", purpose: "", currency: "AED", min_amount: "", max_amount: "", notes: "", enabled: true, display_order: "" };
  }
  return {
    country: rule.country ?? "",
    city: rule.city ?? "",
    purpose: rule.purpose ?? "",
    currency: rule.currency,
    min_amount: rule.min_amount ?? "",
    max_amount: rule.max_amount ?? "",
    notes: rule.notes ?? "",
    enabled: rule.enabled,
    display_order: String(rule.display_order),
  };
}

export function PriceValidationRuleDialog(props: Props): React.ReactElement {
  const { mode, open, onClose, isPending } = props;
  const [form, setForm] = useState<FormState>(initState);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValidationError(null);
    setForm(mode === "edit" ? initState(props.rule) : initState());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidationError(null);
  }

  function validate(): boolean {
    if (!form.min_amount.trim() && !form.max_amount.trim()) {
      setValidationError("At least one of Min amount or Max amount is required.");
      return false;
    }
    if (form.min_amount.trim() && form.max_amount.trim()) {
      const min = parseFloat(form.min_amount);
      const max = parseFloat(form.max_amount);
      if (!isNaN(min) && !isNaN(max) && max < min) {
        setValidationError("Max amount must be greater than or equal to Min amount.");
        return false;
      }
    }
    return true;
  }

  function buildPayload(): PriceValidationRuleCreateRequest {
    return {
      country: blank(form.country),
      city: blank(form.city),
      purpose: form.purpose || null,
      currency: form.currency.trim() || "AED",
      min_amount: blank(form.min_amount),
      max_amount: blank(form.max_amount),
      notes: blank(form.notes),
      enabled: form.enabled,
      display_order: form.display_order.trim() ? Number(form.display_order) : null,
    };
  }

  function handleSubmit(): void {
    if (!validate()) return;
    const payload = buildPayload();
    if (mode === "create") {
      (props as CreateProps).onSubmit(payload);
    } else {
      (props as EditProps).onSubmit(payload);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add rule" : "Edit rule"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pv-country">Country (ISO, blank = global)</Label>
              <Input
                id="pv-country"
                value={form.country}
                onChange={(e) => set("country", e.target.value.toUpperCase().slice(0, 2))}
                placeholder="AE"
                maxLength={2}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pv-city">City (blank = country-wide)</Label>
              <Input
                id="pv-city"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Dubai"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Purpose</Label>
              <Select value={form.purpose} onValueChange={(v) => set("purpose", v as PriceValidationPurpose | "")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PURPOSES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="pv-currency">Currency</Label>
              <Input
                id="pv-currency"
                value={form.currency}
                onChange={(e) => set("currency", e.target.value.toUpperCase().slice(0, 8))}
                placeholder="AED"
                maxLength={8}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pv-min">Min amount</Label>
              <Input
                id="pv-min"
                value={form.min_amount}
                onChange={(e) => set("min_amount", e.target.value)}
                placeholder="100000"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pv-max">Max amount</Label>
              <Input
                id="pv-max"
                value={form.max_amount}
                onChange={(e) => set("max_amount", e.target.value)}
                placeholder="50000000"
              />
            </div>
          </div>

          {validationError && (
            <p className="text-xs text-destructive">{validationError}</p>
          )}

          <div className="space-y-1">
            <Label htmlFor="pv-notes">Notes (optional)</Label>
            <Input
              id="pv-notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="e.g. Regulatory floor for residential sales"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="pv-order">Display order (blank = end)</Label>
            <Input
              id="pv-order"
              type="number"
              min={1}
              value={form.display_order}
              onChange={(e) => set("display_order", e.target.value)}
              placeholder="1"
            />
          </div>

          <div className="flex items-center gap-3">
            <ToggleSwitch checked={form.enabled} onCheckedChange={(v) => set("enabled", v)} id="pv-enabled" />
            <Label htmlFor="pv-enabled">Enabled</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : mode === "create" ? "Add" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
