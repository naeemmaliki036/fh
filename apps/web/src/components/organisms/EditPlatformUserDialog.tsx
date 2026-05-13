"use client";

import { type ReactElement, type ReactNode, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useUpdatePlatformUser } from "@/hooks/mutations/usePlatformUserMutations";
import type { PlatformUser, PlatformRole, PlatformUserStatus } from "@/lib/types";

const ROLES: { value: PlatformRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "operations_admin", label: "Operations Admin" },
  { value: "finance_admin", label: "Finance Admin" },
  { value: "support_admin", label: "Support Admin" },
];

const schema = z.object({
  full_name: z.string().min(2),
  role: z.enum(["super_admin", "operations_admin", "finance_admin", "support_admin"]),
  status: z.enum(["active", "disabled"]),
});

type FormValues = z.infer<typeof schema>;

interface EditPlatformUserDialogProps {
  trigger: ReactNode;
  user: PlatformUser;
  isSelf: boolean;
}

export function EditPlatformUserDialog({
  trigger,
  user,
  isSelf,
}: EditPlatformUserDialogProps): ReactElement {
  const [open, setOpen] = useState(false);
  const { mutate: update, isPending } = useUpdatePlatformUser();
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: { full_name: user.full_name, role: user.role, status: user.status },
  });

  function onSubmit(data: FormValues): void {
    update({ id: user.id, data }, { onSuccess: () => { setOpen(false); reset(); } });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {user.full_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pu-name">Full name</Label>
            <Input id="pu-name" {...register("full_name")} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isSelf}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {isSelf && (
              <p className="text-xs text-muted-foreground">You cannot change your own role.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v as PlatformUserStatus)}
                  disabled={isSelf}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
