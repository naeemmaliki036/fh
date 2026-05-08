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

const schema = z.object({
  tenant_name: z.string().min(2, "Company name too short"),
  tenant_slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, hyphens"),
  owner_full_name: z.string().min(2, "Full name required"),
  owner_email: z.string().email("Invalid email"),
  owner_password: z.string().min(8, "Minimum 8 characters"),
  currency: z.string().default("AED"),
  timezone: z.string().default("Asia/Dubai"),
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

type SlugStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available" }
  | { kind: "taken" }
  | { kind: "invalid" };

export function SignupForm(): React.ReactElement {
  const { mutate: register, isPending } = useRegisterTenant();
  const [slugStatus, setSlugStatus] = useState<SlugStatus>({ kind: "idle" });
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
    defaultValues: { currency: "AED", timezone: "Asia/Dubai" },
  });

  const nameValue = watch("tenant_name");
  const slugValue = watch("tenant_slug");

  // Auto-suggest slug from name until the user manually edits the slug field.
  useEffect(() => {
    if (slugTouchedRef.current) return;
    setValue("tenant_slug", slugify(nameValue ?? ""), { shouldValidate: false });
  }, [nameValue, setValue]);

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
      <div className="space-y-1.5">
        <Label htmlFor="tenant_name">Company Name</Label>
        <Input id="tenant_name" placeholder="Acme Real Estate" {...field("tenant_name")} />
        {errors.tenant_name && <p className="text-xs text-destructive">{errors.tenant_name.message}</p>}
      </div>

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
        <SlugStatusLine status={slugStatus} />
        {errors.tenant_slug && <p className="text-xs text-destructive">{errors.tenant_slug.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="owner_full_name">Your Name</Label>
        <Input id="owner_full_name" placeholder="Jane Smith" {...field("owner_full_name")} />
        {errors.owner_full_name && <p className="text-xs text-destructive">{errors.owner_full_name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="owner_email">Your Email</Label>
        <Input id="owner_email" type="email" placeholder="jane@acme.com" {...field("owner_email")} />
        {errors.owner_email && <p className="text-xs text-destructive">{errors.owner_email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="owner_password">Password</Label>
        <Input id="owner_password" type="password" placeholder="Min 8 characters" {...field("owner_password")} />
        {errors.owner_password && <p className="text-xs text-destructive">{errors.owner_password.message}</p>}
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

function SlugStatusLine({ status }: { status: SlugStatus }): React.ReactElement | null {
  if (status.kind === "idle") return null;
  if (status.kind === "checking") return <p className="text-xs text-muted-foreground">Checking availability…</p>;
  if (status.kind === "available") return <p className="text-xs text-green-600">Slug is available</p>;
  if (status.kind === "taken") return <p className="text-xs text-destructive">Slug is already taken</p>;
  return <p className="text-xs text-destructive">Only lowercase letters, numbers, hyphens</p>;
}
