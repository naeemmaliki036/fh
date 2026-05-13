"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatListingPrice } from "@/lib/utils/format-listing-price";
import type { DealCommissionPayoutRequest } from "@/lib/types/deal";

function _maxDateTimeLocal(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

type _PayoutSchemaProps = { remaining: number };

const _makeSchema = ({ remaining }: _PayoutSchemaProps) =>
  z.object({
    amount: z
      .string()
      .min(1, "Amount required")
      .refine((s) => Number(s) > 0, "Must be a positive number")
      .refine(
        (s) => !Number.isFinite(remaining) || Number(s) <= remaining + 1e-6,
        `Cannot exceed remaining (${remaining})`,
      ),
    paid_at: z.string().optional(),
  });
type FormValues = { amount: string; paid_at?: string };

interface PayoutFormProps {
  remaining: string;
  currency: string;
  isPending: boolean;
  onSubmit: (data: DealCommissionPayoutRequest) => void;
  onCancel: () => void;
}

export function PayoutForm({ remaining, currency, isPending, onSubmit, onCancel }: PayoutFormProps): React.ReactElement {
  const remainingNum = Number(remaining);
  const schema = _makeSchema({ remaining: remainingNum });
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });
  const maxDt = _maxDateTimeLocal();

  const handleFormSubmit = (v: FormValues): void => {
    onSubmit({ amount: v.amount, paid_at: v.paid_at || null });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Amount *</Label>
        <Input {...register("amount")} type="number" min="0.01" step="0.01" max={remainingNum || undefined} placeholder="0" />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        <p className="text-xs text-muted-foreground">
          Remaining: {formatListingPrice(remaining, currency)}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label>Paid At (optional)</Label>
        <Input type="datetime-local" max={maxDt} {...register("paid_at")} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isPending}>{isPending ? "Recording…" : "Record payout"}</Button>
      </div>
    </form>
  );
}
