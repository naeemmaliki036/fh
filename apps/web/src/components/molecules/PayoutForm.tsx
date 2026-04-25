"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DealCommissionPayoutRequest } from "@/lib/types/deal";

const schema = z.object({
  amount: z.string().min(1, "Amount required"),
  paid_at: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface PayoutFormProps {
  remaining: string;
  currency: string;
  isPending: boolean;
  onSubmit: (data: DealCommissionPayoutRequest) => void;
  onCancel: () => void;
}

export function PayoutForm({ remaining, currency, isPending, onSubmit, onCancel }: PayoutFormProps): React.ReactElement {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const handleFormSubmit = (v: FormValues): void => {
    onSubmit({ amount: v.amount, paid_at: v.paid_at || null });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Amount *</Label>
        <Input {...register("amount")} placeholder="0" />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        <p className="text-xs text-muted-foreground">
          Remaining: {currency} {remaining}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label>Paid At (optional)</Label>
        <Input type="datetime-local" {...register("paid_at")} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isPending}>{isPending ? "Recording…" : "Record payout"}</Button>
      </div>
    </form>
  );
}
