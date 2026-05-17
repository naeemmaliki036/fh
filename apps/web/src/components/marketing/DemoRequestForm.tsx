"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { PhoneInput } from "@/components/molecules/PhoneInput";
import { isValidPhone } from "@/lib/utils/phone";
import { CountrySelectField } from "@/components/molecules/CountrySelectField";

const demoSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  company_name: z.string().min(1, "Company name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().refine(isValidPhone, "Invalid phone number"),
  country: z.string().optional(),
  team_size: z.enum(["1-5", "6-20", "21-50", "50+"], { required_error: "Select team size" }),
  message: z.string().optional(),
});

type DemoFormValues = z.infer<typeof demoSchema>;

interface SelectFieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  selectProps: React.SelectHTMLAttributes<HTMLSelectElement>;
}

function SelectField({ id, label, error, children, required, selectProps }: SelectFieldProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-[#0a0a0a]">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <select
        id={id}
        {...selectProps}
        className={cn(
          "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0f766e] disabled:opacity-50",
          error ? "border-red-400" : "border-input",
        )}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function DemoRequestForm(): React.ReactElement {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DemoFormValues>({
    resolver: zodResolver(demoSchema),
    defaultValues: { phone: "" },
  });

  async function onSubmit(data: DemoFormValues): Promise<void> {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${base}/marketing/demo-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSubmitted(true);
      reset();
      toast.success("Thanks! We'll be in touch within one business day.");
    } catch {
      toast.error("Submission failed. Please try again or email us directly.");
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#0f766e]/10 flex items-center justify-center">
          <span className="text-3xl">✓</span>
        </div>
        <h3 className="text-2xl font-bold text-[#0a0a0a]">Request received!</h3>
        <p className="text-[#4a4a4a] text-sm max-w-xs">
          We&apos;ll review your request and reach out within one business day to confirm your demo slot.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-2 text-sm text-[#0f766e] font-semibold hover:underline"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <h2 className="text-2xl font-extrabold text-[#0a0a0a] mb-1">Book your demo</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="full_name" className="text-sm font-medium text-[#0a0a0a]">
            Full name <span className="text-red-500">*</span>
          </Label>
          <Input id="full_name" placeholder="Ahmed Al Rashidi" {...register("full_name")} className={errors.full_name ? "border-red-400" : ""} />
          {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="company_name" className="text-sm font-medium text-[#0a0a0a]">
            Company <span className="text-red-500">*</span>
          </Label>
          <Input id="company_name" placeholder="Al Noor Realty" {...register("company_name")} className={errors.company_name ? "border-red-400" : ""} />
          {errors.company_name && <p className="text-xs text-red-500">{errors.company_name.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-sm font-medium text-[#0a0a0a]">
          Work email <span className="text-red-500">*</span>
        </Label>
        <Input id="email" type="email" placeholder="ahmed@alnoor.ae" {...register("email")} className={errors.email ? "border-red-400" : ""} />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone" className="text-sm font-medium text-[#0a0a0a]">
          Phone <span className="text-red-500">*</span>
        </Label>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneInput
              id="phone"
              value={field.value}
              onChange={field.onChange}
              error={errors.phone?.message}
            />
          )}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Controller
          name="country"
          control={control}
          render={({ field }) => (
            <CountrySelectField
              id="country"
              label="Country"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.country?.message}
            />
          )}
        />

        <SelectField
          id="team_size"
          label="Team size"
          required
          error={errors.team_size?.message}
          selectProps={register("team_size")}
        >
          <option value="">Select size</option>
          <option value="1-5">1–5 people</option>
          <option value="6-20">6–20 people</option>
          <option value="21-50">21–50 people</option>
          <option value="50+">50+ people</option>
        </SelectField>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message" className="text-sm font-medium text-[#0a0a0a]">
          Anything specific you want to see? <span className="text-[#8a8a8a] font-normal">(optional)</span>
        </Label>
        <textarea
          id="message"
          rows={3}
          placeholder="We manage 5 agents and 200+ listings across Dubai and Abu Dhabi..."
          {...register("message")}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0f766e] resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-[#0f766e] hover:bg-[#0e6b63] text-white h-12 font-semibold text-base shadow-lg shadow-[#0f766e]/20 disabled:opacity-60"
      >
        {isSubmitting ? "Sending..." : "Request demo"}
      </Button>

      <p className="text-xs text-center text-[#8a8a8a]">
        By submitting you agree to our Privacy Policy. No spam.
      </p>
    </form>
  );
}
