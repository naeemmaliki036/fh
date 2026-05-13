"use client";

import { type ReactElement, type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResetPlatformUserPassword } from "@/hooks/mutations/usePlatformUserMutations";

const schema = z
  .object({
    new_password: z.string().min(8, "Min 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.new_password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

interface ResetPasswordDialogProps {
  trigger: ReactNode;
  userId: string;
  userName: string;
}

export function ResetPasswordDialog({
  trigger,
  userId,
  userName,
}: ResetPasswordDialogProps): ReactElement {
  const [open, setOpen] = useState(false);
  const { mutate: reset, isPending } = useResetPlatformUserPassword();
  const { register, handleSubmit, reset: resetForm, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  function onSubmit(data: FormValues): void {
    reset(
      { id: userId, data: { new_password: data.new_password } },
      { onSuccess: () => { setOpen(false); resetForm(); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password for {userName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-pwd">New password</Label>
            <Input id="new-pwd" type="password" {...register("new_password")} />
            {errors.new_password && (
              <p className="text-xs text-destructive">{errors.new_password.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pwd">Confirm password</Label>
            <Input id="confirm-pwd" type="password" {...register("confirm")} />
            {errors.confirm && (
              <p className="text-xs text-destructive">{errors.confirm.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Resetting..." : "Reset password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
