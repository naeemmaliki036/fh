"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegisterTenant } from "@/hooks/mutations/useAuthMutations";
import { authRepository } from "@/lib/api/repositories/auth.repository";
import { SlugStatusIndicator, type SlugStatus } from "@/components/molecules/SlugStatusIndicator";
import { CountrySelectField } from "@/components/molecules/CountrySelectField";

const schema = z.object({
  tenant_name: z.string().min(2, "Company name too short"),
  tenant_slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, hyphens"),
  owner_full_name: z.string().min(2, "Full name required"),
  owner_email: z.string().email("Invalid email"),
  owner_password: z.string().min(8, "Minimum 8 characters"),
  contact_phone: z.string().min(5, "Phone too short").max(32, "Phone too long"),
  contact_email: z.string().email("Invalid contact email"),
  currency: z.string().default("AED"),
  timezone: z.string().default("Asia/Dubai"),
  office_country: z.string().optional(),
  office_city: z.string().optional(),
  signup_notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function SignupForm(): React.ReactElement {
  const { mutate: register, isPending } = useRegisterTenant();
  const [slugStatus, setSlugStatus] = useState<SlugStatus>({ kind: "idle" });
  const [mirrorContact, setMirrorContact] = useState(true);
  const slugTouchedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register: field,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: "AED",
      timezone: "Asia/Dubai",
      contact_email: "",
      office_country: "",
      office_city: "",
      signup_notes: "",
    },
  });

  const officeCountryValue = watch("office_country");

  const nameValue = watch("tenant_name");
  const slugValue = watch("tenant_slug");
  const ownerEmail = watch("owner_email");

  // Auto-suggest slug from name until the user manually edits the slug field.
  useEffect(() => {
    if (slugTouchedRef.current) return;
    setValue("tenant_slug", slugify(nameValue ?? ""), { shouldValidate: false });
  }, [nameValue, setValue]);

  // Mirror owner_email → contact_email when toggle is on.
  useEffect(() => {
    if (!mirrorContact) return;
    setValue("contact_email", ownerEmail ?? "", { shouldValidate: false });
  }, [ownerEmail, mirrorContact, setValue]);

  // Debounced uniqueness check.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!slugValue || slugValue.length < 2) {
      setSlugStatus({ kind: "idle" });
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slugValue)) {
      setSlugStatus({ kind: "invalid" });
      return;
    }
    setSlugStatus({ kind: "checking" });
    debounceRef.current = setTimeout(() => {
      authRepository
        .checkSlug(slugValue)
        .then((res) => {
          if (!res.valid_format) setSlugStatus({ kind: "invalid" });
          else if (res.available) setSlugStatus({ kind: "available" });
          else setSlugStatus({ kind: "taken" });
        })
        .catch(() => setSlugStatus({ kind: "idle" }));
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [slugValue]);

  const onSubmit = (data: FormValues): void => {
    register(data);
  };

  const slugFieldProps = field("tenant_slug");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Company Name */}
      <div className="space-y-1.5">
        <Label htmlFor="tenant_name">Company Name</Label>
        <Input id="tenant_name" placeholder="Acme Real Estate" {...field("tenant_name")} />
        {errors.tenant_name && (
          <p className="text-xs text-destructive">{errors.tenant_name.message}</p>
        )}
      </div>

      {/* Slug */}
      <div className="space-y-1.5">
        <Label htmlFor="tenant_slug">Slug</Label>
        <Input
          id="tenant_slug"
          placeholder="acme-real-estate"
          {...slugFieldProps}
          onChange={(e) => {
            slugTouchedRef.current = true;
            slugFieldProps.onChange(e);
          }}
        />
        <SlugStatusIndicator status={slugStatus} />
        {errors.tenant_slug && (
          <p className="text-xs text-destructive">{errors.tenant_slug.message}</p>
        )}
      </div>

      {/* Owner Name */}
      <div className="space-y-1.5">
        <Label htmlFor="owner_full_name">Your Name</Label>
        <Input id="owner_full_name" placeholder="Jane Smith" {...field("owner_full_name")} />
        {errors.owner_full_name && (
          <p className="text-xs text-destructive">{errors.owner_full_name.message}</p>
        )}
      </div>

      {/* Owner Email */}
      <div className="space-y-1.5">
        <Label htmlFor="owner_email">Your Email</Label>
        <Input
          id="owner_email"
          type="email"
          placeholder="jane@acme.com"
          {...field("owner_email")}
        />
        {errors.owner_email && (
          <p className="text-xs text-destructive">{errors.owner_email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="owner_password">Password</Label>
        <Input
          id="owner_password"
          type="password"
          placeholder="Min 8 characters"
          {...field("owner_password")}
        />
        {errors.owner_password && (
          <p className="text-xs text-destructive">{errors.owner_password.message}</p>
        )}
      </div>

      {/* Contact Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="contact_phone">Contact Phone</Label>
        <Input id="contact_phone" type="tel" placeholder="+971 50 000 0000" {...field("contact_phone")} />
        {errors.contact_phone && (
          <p className="text-xs text-destructive">{errors.contact_phone.message}</p>
        )}
      </div>

      {/* Contact Email (with mirror toggle) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="contact_email">Contact Email</Label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-input accent-primary"
              checked={mirrorContact}
              onChange={(e) => {
                const checked = e.target.checked;
                setMirrorContact(checked);
                if (checked) {
                  setValue("contact_email", ownerEmail ?? "", { shouldValidate: false });
                }
              }}
            />
            <span className="text-xs text-muted-foreground">Same as owner email</span>
          </label>
        </div>
        <Input
          id="contact_email"
          type="email"
          placeholder="contact@acme.com"
          disabled={mirrorContact}
          {...field("contact_email")}
        />
        {errors.contact_email && (
          <p className="text-xs text-destructive">{errors.contact_email.message}</p>
        )}
      </div>

      {/* Main office section */}
      <div className="pt-2 border-t border-slate-100">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Main office (optional)
        </p>
        <div className="space-y-4">
          <CountrySelectField
            id="office_country"
            label="Country"
            value={officeCountryValue ?? ""}
            onChange={(v) => setValue("office_country", v, { shouldValidate: false })}
          />
          <div className="space-y-1.5">
            <Label htmlFor="office_city">City</Label>
            <Input id="office_city" placeholder="Dubai" {...field("office_city")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signup_notes">Notes for our team</Label>
            <textarea
              id="signup_notes"
              rows={2}
              placeholder="Anything you'd like us to know..."
              {...field("signup_notes")}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || slugStatus.kind === "taken" || slugStatus.kind === "invalid"}
      >
        {isPending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
