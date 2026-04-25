"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegisterTenant } from "@/hooks/mutations/useAuthMutations";

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

export function SignupForm(): React.ReactElement {
  const { mutate: register, isPending } = useRegisterTenant();

  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currency: "AED", timezone: "Asia/Dubai" },
  });

  const onSubmit = (data: FormValues): void => {
    register(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="tenant_name">Company Name</Label>
        <Input id="tenant_name" placeholder="Acme Real Estate" {...field("tenant_name")} />
        {errors.tenant_name && <p className="text-xs text-destructive">{errors.tenant_name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tenant_slug">Slug</Label>
        <Input id="tenant_slug" placeholder="acme-re" {...field("tenant_slug")} />
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

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
