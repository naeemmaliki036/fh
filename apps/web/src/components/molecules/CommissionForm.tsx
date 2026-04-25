"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DealCommissionOverrideRequest } from "@/lib/types/deal";

const schema = z.object({
  commission_type: z.enum(["percentage", "fixed"]),
  commission_value: z.string().min(1, "Value required"),
  override_reason: z.string().min(5, "Reason must be at least 5 characters"),
});
type FormValues = z.infer<typeof schema>;

interface CommissionFormProps {
  isPending: boolean;
  onSubmit: (data: DealCommissionOverrideRequest) => void;
  onCancel: () => void;
}

export function CommissionForm({ isPending, onSubmit, onCancel }: CommissionFormProps): React.ReactElement {
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { commission_type: "percentage" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Controller name="commission_type" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
                <SelectItem value="fixed">Fixed amount</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-1.5">
          <Label>Value</Label>
          <Input {...register("commission_value")} placeholder="0" />
          {errors.commission_value && <p className="text-xs text-destructive">{errors.commission_value.message}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Override Reason *</Label>
        <Input {...register("override_reason")} placeholder="At least 5 characters" />
        {errors.override_reason && <p className="text-xs text-destructive">{errors.override_reason.message}</p>}
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : "Override"}</Button>
      </div>
    </form>
  );
}
