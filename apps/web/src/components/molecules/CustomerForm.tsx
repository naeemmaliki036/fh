"use client";

import { useForm, Controller } from "react-hook-form";
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
import { NATIONALITIES, LANGUAGES } from "@/lib/constants/regions";
import { Textarea } from "@/components/atoms/Textarea";
import type { Customer, CustomerCreateRequest, CustomerUpdateRequest, CustomerSource } from "@/lib/types";
import type { Agent } from "@/lib/types";

const SOURCES: { value: CustomerSource; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "portal", label: "Portal" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "walk_in", label: "Walk-in" },
  { value: "import", label: "Import" },
  { value: "other", label: "Other" },
];

const SOURCE_VALUES = SOURCES.map((s) => s.value) as [CustomerSource, ...CustomerSource[]];

const schema = z.object({
  full_name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  language: z.string().optional(),
  preferred_currency: z.string().optional(),
  source: z.enum(SOURCE_VALUES),
  notes: z.string().optional(),
  assigned_agent_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CustomerFormProps {
  defaultValues?: Partial<Customer>;
  agents?: Agent[];
  isPending: boolean;
  submitLabel: string;
  onSubmit: (data: CustomerCreateRequest | CustomerUpdateRequest) => void;
  onCancel?: () => void;
}

export function CustomerForm({ defaultValues, agents, isPending, submitLabel, onSubmit, onCancel }: CustomerFormProps): React.ReactElement {
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: defaultValues?.full_name ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      nationality: defaultValues?.nationality ?? "",
      language: defaultValues?.language ?? "",
      preferred_currency: defaultValues?.preferred_currency ?? "",
      source: defaultValues?.source ?? "manual",
      notes: defaultValues?.notes ?? "",
      assigned_agent_id: defaultValues?.assigned_agent_id ?? "",
    },
  });

  const handleFormSubmit = (values: FormValues): void => {
    onSubmit({
      ...values,
      email: values.email || null,
      phone: values.phone || null,
      nationality: values.nationality || null,
      language: values.language || null,
      preferred_currency: values.preferred_currency || null,
      notes: values.notes || null,
      assigned_agent_id: values.assigned_agent_id || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
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
          <Label>Nationality</Label>
          <Controller
            name="nationality"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Select nationality" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {NATIONALITIES.map((n) => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Language</Label>
          <Controller
            name="language"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Preferred Currency</Label>
          <Input {...register("preferred_currency")} placeholder="e.g. AED" maxLength={3} />
        </div>
        <div className="space-y-1.5">
          <Label>Source</Label>
          <Controller
            name="source"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        {agents && (
          <div className="space-y-1.5 col-span-2">
            <Label>Assigned Agent</Label>
            <Controller
              name="assigned_agent_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="No agent" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No agent</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}
        <div className="space-y-1.5 col-span-2">
          <Label>Notes</Label>
          <Textarea {...register("notes")} rows={3} />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : submitLabel}</Button>
      </div>
    </form>
  );
}
