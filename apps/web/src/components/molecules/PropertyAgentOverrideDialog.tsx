"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import type { PropertyAgentCommissionOverrideRequest } from "@/lib/types/property";

const schema = z
  .object({
    commission_type: z.enum(["percentage", "fixed"]),
    commission_value: z.string().min(1, "Value required"),
  })
  .superRefine((v, ctx) => {
    const n = Number(v.commission_value);
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["commission_value"],
        message: "Must be a non-negative number",
      });
      return;
    }
    if (v.commission_type === "percentage" && n > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["commission_value"],
        message: "Percentage cannot exceed 100",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

interface PropertyAgentOverrideDialogProps {
  open: boolean;
  agentName: string;
  onOpenChange: (open: boolean) => void;
  onSave: (data: PropertyAgentCommissionOverrideRequest) => void;
  isPending: boolean;
}

export function PropertyAgentOverrideDialog({
  open,
  agentName,
  onOpenChange,
  onSave,
  isPending,
}: PropertyAgentOverrideDialogProps): React.ReactElement {
  const { register, handleSubmit, control, watch, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { commission_type: "percentage", commission_value: "" },
    });

  const commissionType = watch("commission_type");

  const handleFormSubmit = (values: FormValues): void => {
    onSave({
      commission_type: values.commission_type,
      commission_value: Number(values.commission_value),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set commission override — {agentName}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This rate replaces the agent&apos;s default for any deal created on this property.
        </p>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Controller
                name="commission_type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed (AED)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Value</Label>
              <Input
                {...register("commission_value")}
                type="number"
                min="0"
                max={commissionType === "percentage" ? "100" : undefined}
                step={commissionType === "percentage" ? "0.01" : "1"}
                placeholder="0"
              />
              {errors.commission_value && (
                <p className="text-xs text-destructive">{errors.commission_value.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save override"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
