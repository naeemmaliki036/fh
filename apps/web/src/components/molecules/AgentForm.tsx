"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Controller } from "react-hook-form";
import type { Agent, AgentCreateRequest, AgentUpdateRequest } from "@/lib/types";

const schema = z.object({
  full_name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || /^\+?[\d\s\-()]{7,20}$/.test(v), "Invalid phone number"),
  license_id: z.string().optional(),
  license_expiry_at: z.string().optional(),
  default_commission_type: z.enum(["percentage", "fixed"]),
  default_commission_value: z.string().regex(/^\d+(\.\d+)?$/, "Must be a number"),
}).superRefine((v, ctx) => {
  const n = Number(v.default_commission_value);
  if (Number.isFinite(n) && v.default_commission_type === "percentage" && n > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["default_commission_value"],
      message: "Percentage cannot exceed 100",
    });
  }
});

type FormValues = z.infer<typeof schema>;

interface AgentFormProps {
  defaultValues?: Partial<Agent>;
  isPending: boolean;
  submitLabel: string;
  onSubmit: (data: AgentCreateRequest | AgentUpdateRequest) => void;
  onCancel?: () => void;
}

export function AgentForm({ defaultValues, isPending, submitLabel, onSubmit, onCancel }: AgentFormProps): React.ReactElement {
  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: defaultValues?.full_name ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      license_id: defaultValues?.license_id ?? "",
      license_expiry_at: defaultValues?.license_expiry_at?.slice(0, 10) ?? "",
      default_commission_type: defaultValues?.default_commission_type ?? "percentage",
      default_commission_value: defaultValues?.default_commission_value ?? "0",
    },
  });

  const commissionType = watch("default_commission_type");
  const commissionValue = watch("default_commission_value");
  const showZeroWarning = commissionType === "percentage" && commissionValue === "0";

  const handleFormSubmit = (values: FormValues): void => {
    onSubmit({
      ...values,
      phone: values.phone || null,
      license_id: values.license_id || null,
      license_expiry_at: values.license_expiry_at || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="form-full_name">Full Name</Label>
          <Input id="form-full_name" {...register("full_name")} />
          {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="form-email">Email</Label>
          <Input id="form-email" type="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="form-phone">Phone</Label>
          <Input id="form-phone" {...register("phone")} placeholder="+971 50 123 4567" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="form-license_id">License ID</Label>
          <Input id="form-license_id" {...register("license_id")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="form-license_expiry_at">License Expiry</Label>
          <Input id="form-license_expiry_at" type="date" min={defaultValues ? undefined : new Date().toISOString().slice(0, 10)} {...register("license_expiry_at")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="form-commission_value">Commission</Label>
          <div className="flex gap-2">
            <Controller
              name="default_commission_type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <Input id="form-commission_value" className="flex-1" {...register("default_commission_value")} placeholder="0" step="0.01" />
          </div>
          {errors.default_commission_value && (
            <p className="text-xs text-destructive">{errors.default_commission_value.message}</p>
          )}
          {showZeroWarning && (
            <p className="text-xs text-amber-600">0% commission is unusual — confirm this is intentional.</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={() => { reset(); onCancel(); }}>
            Discard changes
          </Button>
        )}
        <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : submitLabel}</Button>
      </div>
    </form>
  );
}
