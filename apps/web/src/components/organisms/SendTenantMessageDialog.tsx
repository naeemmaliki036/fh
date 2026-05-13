"use client";

import { type ReactElement, type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSendTenantMessage } from "@/hooks/mutations/useSendTenantMessage";

const schema = z.object({
  subject: z.string().min(1, "Required").max(200, "Max 200 characters"),
  body_text: z.string().min(1, "Required").max(5000, "Max 5000 characters"),
});

type FormValues = z.infer<typeof schema>;

interface SendTenantMessageDialogProps {
  tenantId: string;
  tenantName: string;
  trigger: ReactNode;
}

export function SendTenantMessageDialog({
  tenantId,
  tenantName,
  trigger,
}: SendTenantMessageDialogProps): ReactElement {
  const [open, setOpen] = useState(false);
  const { mutate: send, isPending } = useSendTenantMessage(tenantId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { subject: "", body_text: "" },
  });

  function onSubmit(values: FormValues): void {
    send(values, {
      onSuccess: () => {
        setOpen(false);
        reset();
      },
    });
  }

  function handleOpenChange(next: boolean): void {
    if (!next) reset();
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send message to {tenantName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="msg-subject">Subject</Label>
            <Input
              id="msg-subject"
              placeholder="Important update regarding your account"
              {...register("subject")}
            />
            {errors.subject && (
              <p className="text-xs text-destructive">{errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="msg-body">Message</Label>
            <textarea
              id="msg-body"
              rows={8}
              placeholder="Write your message here. It will be sent as plain text wrapped in the standard email template."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              {...register("body_text")}
            />
            {errors.body_text && (
              <p className="text-xs text-destructive">{errors.body_text.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending..." : "Send message"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
