"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomerPicker } from "@/components/molecules/CustomerPicker";
import { PropertyPicker } from "@/components/molecules/PropertyPicker";
import { CURRENCIES } from "@/lib/constants/regions";
import type { CustomerSummary } from "@/lib/types/lead";
import type { Agent } from "@/lib/types";
import type { DealCreateRequest, DealType } from "@/lib/types/deal";

const DEAL_TYPES: DealType[] = ["sale", "rent_short", "rent_long"];

const _numericString = z
  .string()
  .min(1, "Value required")
  .refine((s) => Number(s) > 0, "Must be a positive number");

const schema = z
  .object({
    deal_type: z.enum(DEAL_TYPES as [DealType, ...DealType[]]),
    property_id: z.string().min(1, "Property required"),
    primary_agent_id: z.string().min(1, "Agent required"),
    secondary_agent_id: z.string().optional(),
    primary_commission_pct: z.string().optional(),
    secondary_commission_pct: z.string().optional(),
    transaction_value: _numericString,
    transaction_currency: z.string().min(3).max(3),
    expected_close_at: z.string().optional(),
    notes: z.string().optional(),
    commission_override: z.boolean().default(false),
    commission_type: z.enum(["percentage", "fixed"]).optional(),
    commission_value: z.string().optional(),
    commission_override_reason: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.commission_override) {
      if (!v.commission_type || !v.commission_value) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["commission_value"], message: "Type and value required" });
        return;
      }
      const n = Number(v.commission_value);
      if (!Number.isFinite(n) || n <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["commission_value"], message: "Must be positive" });
      } else if (v.commission_type === "percentage" && n > 100) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["commission_value"], message: "Percentage ≤ 100" });
      }
    }
    if (v.secondary_agent_id && v.secondary_agent_id !== "") {
      if (v.secondary_agent_id === v.primary_agent_id) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["secondary_agent_id"], message: "Must differ from primary agent" });
      }
      const p = Number(v.primary_commission_pct);
      const s = Number(v.secondary_commission_pct);
      if (!Number.isFinite(p) || !Number.isFinite(s) || p + s !== 100) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["primary_commission_pct"], message: "Split must sum to 100" });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

interface DealFormProps {
  agents: Agent[];
  isPending: boolean;
  onSubmit: (data: DealCreateRequest) => void;
  onCancel?: () => void;
}

export function DealForm({ agents, isPending, onSubmit, onCancel }: DealFormProps): React.ReactElement {
  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      deal_type: "sale",
      transaction_currency: "AED",
      commission_override: false,
      primary_commission_pct: "50",
      secondary_commission_pct: "50",
    },
  });

  const isOverride = watch("commission_override");
  const secondaryId = watch("secondary_agent_id");
  const hasSecondary = !!secondaryId && secondaryId !== "";

  const handleFormSubmit = (v: FormValues): void => {
    if (!customer) return;
    const req: DealCreateRequest = {
      deal_type: v.deal_type,
      customer_id: customer.id,
      property_id: v.property_id,
      primary_agent_id: v.primary_agent_id,
      transaction_value: v.transaction_value,
      transaction_currency: v.transaction_currency,
      expected_close_at: v.expected_close_at || null,
      notes: v.notes || null,
    };
    if (v.secondary_agent_id && v.secondary_agent_id !== "") {
      req.secondary_agent_id = v.secondary_agent_id;
      req.primary_commission_pct = Number(v.primary_commission_pct);
      req.secondary_commission_pct = Number(v.secondary_commission_pct);
    }
    if (isOverride && v.commission_type && v.commission_value) {
      req.commission_type = v.commission_type;
      req.commission_value = v.commission_value;
      req.commission_override_reason = v.commission_override_reason || null;
    }
    onSubmit(req);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Customer *</Label>
        <CustomerPicker value={customer} onChange={setCustomer} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Deal Type</Label>
          <Controller name="deal_type" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DEAL_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </div>

        <div className="space-y-1.5 col-span-2">
          <Label>Property *</Label>
          <Controller name="property_id" control={control} render={({ field }) => (
            <PropertyPicker value={field.value ?? null} onChange={(id) => field.onChange(id ?? "")} />
          )} />
        </div>

        <div className="space-y-1.5">
          <Label>Primary Agent *</Label>
          <Controller name="primary_agent_id" control={control} render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
              <SelectContent>{agents.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </div>

        <div className="space-y-1.5">
          <Label>Secondary Agent (optional)</Label>
          <Controller name="secondary_agent_id" control={control} render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
          {errors.secondary_agent_id && <p className="text-xs text-destructive">{errors.secondary_agent_id.message}</p>}
        </div>

        {hasSecondary && (
          <div className="col-span-2 grid grid-cols-2 gap-3 rounded-md border p-3 bg-muted/20">
            <div className="space-y-1.5">
              <Label>Primary % share</Label>
              <Input type="number" min="0" max="100" step="1" {...register("primary_commission_pct")} placeholder="50" />
              {errors.primary_commission_pct && <p className="text-xs text-destructive">{errors.primary_commission_pct.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Secondary % share</Label>
              <Input type="number" min="0" max="100" step="1" {...register("secondary_commission_pct")} placeholder="50" />
            </div>
            <p className="col-span-2 text-xs text-muted-foreground">Primary + secondary must sum to 100</p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Expected Close</Label>
          <Input type="date" {...register("expected_close_at")} />
        </div>
        <div className="space-y-1.5">
          <Label>Transaction Value *</Label>
          <Input {...register("transaction_value")} type="number" min="0" step="0.01" placeholder="0" />
          {errors.transaction_value && <p className="text-xs text-destructive">{errors.transaction_value.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Controller name="transaction_currency" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" {...register("commission_override")} />
          Override commission (defaults to agent rate)
        </label>
      </div>

      {isOverride && (
        <div className="grid grid-cols-2 gap-4 rounded-md border p-3 bg-muted/20">
          <div className="space-y-1.5">
            <Label>Commission Type</Label>
            <Controller name="commission_type" control={control} render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="percentage">%</SelectItem><SelectItem value="fixed">Fixed</SelectItem></SelectContent>
              </Select>
            )} />
          </div>
          <div className="space-y-1.5">
            <Label>Commission Value</Label>
            <Input {...register("commission_value")} type="number" min="0" step="0.01" placeholder="0" />
            {errors.commission_value && <p className="text-xs text-destructive">{errors.commission_value.message}</p>}
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Override Reason</Label>
            <Input {...register("commission_override_reason")} placeholder="Reason for override" />
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={isPending || !customer}>
          {isPending ? "Creating…" : "Create deal"}
        </Button>
      </div>
    </form>
  );
}
