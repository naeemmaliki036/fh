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
import { PhoneInput } from "@/components/molecules/PhoneInput";
import { isValidPhone } from "@/lib/utils/phone";
import { CustomerCompanyFields } from "@/components/molecules/CustomerCompanyFields";
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

export const customerFormSchema = z
  .object({
    customer_type: z.enum(["individual", "company"]),
    full_name: z.string().min(2, "Name required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().min(1, "Phone required").refine((v) => isValidPhone(v), "Invalid phone number"),
    nationality: z.string().optional(),
    language: z.string().optional(),
    preferred_currency: z.string().optional(),
    source: z.enum(SOURCE_VALUES),
    notes: z.string().optional(),
    assigned_agent_id: z.string().optional(),
    company_trade_license: z.string().max(64).optional(),
    contact_person_name: z.string().optional(),
    contact_person_designation: z.string().max(128).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.customer_type === "company") {
      if (!v.contact_person_name || v.contact_person_name.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contact_person_name"],
          message: "Contact person name required (min 2 chars)",
        });
      }
    }
  });

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  defaultValues?: Partial<Customer>;
  agents?: Agent[];
  isPending: boolean;
  submitLabel: string;
  onSubmit: (data: CustomerCreateRequest | CustomerUpdateRequest) => void;
  onCancel?: () => void;
}

export function CustomerForm({
  defaultValues,
  agents,
  isPending,
  submitLabel,
  onSubmit,
  onCancel,
}: CustomerFormProps): React.ReactElement {
  const { register, handleSubmit, control, watch, formState: { errors } } =
    useForm<CustomerFormValues>({
      resolver: zodResolver(customerFormSchema),
      defaultValues: {
        customer_type: defaultValues?.customer_type ?? "individual",
        full_name: defaultValues?.full_name ?? "",
        email: defaultValues?.email ?? "",
        phone: defaultValues?.phone ?? "",
        nationality: defaultValues?.nationality ?? "",
        language: defaultValues?.language ?? "",
        preferred_currency: defaultValues?.preferred_currency ?? "",
        source: defaultValues?.source ?? "manual",
        notes: defaultValues?.notes ?? "",
        assigned_agent_id: defaultValues?.assigned_agent_id ?? "",
        company_trade_license: defaultValues?.company_trade_license ?? "",
        contact_person_name: defaultValues?.contact_person_name ?? "",
        contact_person_designation: defaultValues?.contact_person_designation ?? "",
      },
    });

  const customerType = watch("customer_type");
  const isCompany = customerType === "company";

  const handleFormSubmit = (values: CustomerFormValues): void => {
    const companyFields =
      values.customer_type === "company"
        ? {
            company_trade_license: values.company_trade_license || null,
            contact_person_name: values.contact_person_name || null,
            contact_person_designation: values.contact_person_designation || null,
          }
        : {
            company_trade_license: null,
            contact_person_name: null,
            contact_person_designation: null,
          };

    onSubmit({
      customer_type: values.customer_type,
      full_name: values.full_name,
      email: values.email || null,
      phone: values.phone,
      nationality: values.nationality || null,
      language: values.language || null,
      preferred_currency: values.preferred_currency || null,
      source: values.source,
      notes: values.notes || null,
      assigned_agent_id: values.assigned_agent_id || null,
      ...companyFields,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Type selector */}
      <div className="space-y-1.5">
        <Label>Customer type</Label>
        <Controller
          name="customer_type"
          control={control}
          render={({ field }) => (
            <div className="inline-flex rounded-lg border p-1 gap-1">
              {(["individual", "company"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => field.onChange(t)}
                  className={
                    field.value === t
                      ? "rounded-md px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground"
                      : "rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                  }
                >
                  {t === "individual" ? "Individual" : "Company"}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="form-full_name">
            {isCompany ? "Company name" : "Full name"}
          </Label>
          <Input
            id="form-full_name"
            {...register("full_name")}
            placeholder={isCompany ? "e.g. Marina Holdings LLC" : ""}
          />
          {errors.full_name && (
            <p className="text-xs text-destructive">{errors.full_name.message}</p>
          )}
        </div>

        {isCompany && (
          <CustomerCompanyFields register={register} errors={errors} />
        )}

        <div className="space-y-1.5">
          <Label htmlFor="form-email">Email</Label>
          <Input id="form-email" type="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="form-phone">Phone *</Label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                id="form-phone"
                value={field.value ?? ""}
                onChange={field.onChange}
                error={errors.phone?.message}
              />
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Nationality</Label>
          <Controller
            name="nationality"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? "__none__"} onValueChange={(v) => field.onChange(v === "__none__" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Select nationality" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {NATIONALITIES.map((n) => (
                    <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                  ))}
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
              <Select value={field.value ?? "__none__"} onValueChange={(v) => field.onChange(v === "__none__" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
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
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
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
                <Select value={field.value ?? "__none__"} onValueChange={(v) => field.onChange(v === "__none__" ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="No agent" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No agent</SelectItem>
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
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
