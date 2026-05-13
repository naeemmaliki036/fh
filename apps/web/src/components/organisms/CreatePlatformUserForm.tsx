"use client";

import { type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreatePlatformUser } from "@/hooks/mutations/usePlatformUserMutations";
import type { PlatformRole } from "@/lib/types";

const ROLES: { value: PlatformRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "operations_admin", label: "Operations Admin" },
  { value: "finance_admin", label: "Finance Admin" },
  { value: "support_admin", label: "Support Admin" },
];

const schema = z
  .object({
    email: z.string().email("Valid email required"),
    full_name: z.string().min(2, "Min 2 characters"),
    role: z.enum(["super_admin", "operations_admin", "finance_admin", "support_admin"]),
    password: z.string().min(8, "Min 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormValues = z.infer<typeof schema>;

export function CreatePlatformUserForm(): ReactElement {
  const router = useRouter();
  const { mutate: create, isPending } = useCreatePlatformUser();
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "operations_admin" },
  });

  function onSubmit(data: FormValues): void {
    create(
      { email: data.email, full_name: data.full_name, role: data.role, password: data.password },
      { onSuccess: () => router.push("/users") },
    );
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>New platform user</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pu-email">Email</Label>
            <Input id="pu-email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pu-fullname">Full name</Label>
            <Input id="pu-fullname" {...register("full_name")} />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pu-password">Password</Label>
            <Input id="pu-password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pu-confirm">Confirm password</Label>
            <Input id="pu-confirm" type="password" {...register("confirm_password")} />
            {errors.confirm_password && (
              <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create user"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
