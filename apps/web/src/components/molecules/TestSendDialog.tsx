"use client";

import { useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTestSendEmailTemplate } from "@/hooks/mutations/useEmailTemplateMutations";
import type { TestSendResponse } from "@/lib/types";

const schema = z.object({
  to_email: z.string().email("Valid email required"),
});

type FormValues = z.infer<typeof schema>;

interface TestSendDialogProps {
  templateId: string;
  variables: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestSendDialog({
  templateId,
  variables,
  open,
  onOpenChange,
}: TestSendDialogProps): ReactElement {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<TestSendResponse | null>(null);
  const { mutate: testSend, isPending } = useTestSendEmailTemplate();

  function onSubmit(values: FormValues): void {
    testSend(
      { id: templateId, data: { to_email: values.to_email, variables: varValues } },
      { onSuccess: (data) => setPreview(data) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test send</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>To email</Label>
            <Input type="email" {...register("to_email")} placeholder="recipient@example.com" />
            {errors.to_email && (
              <p className="text-xs text-destructive">{errors.to_email.message}</p>
            )}
          </div>

          {variables.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Variable values</p>
              {variables.map((v) => (
                <div key={v} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{`{${v}}`}</Label>
                  <Input
                    value={varValues[v] ?? ""}
                    onChange={(e) => setVarValues((prev) => ({ ...prev, [v]: e.target.value }))}
                    placeholder={`Value for ${v}`}
                  />
                </div>
              ))}
            </div>
          )}

          {preview && (
            <div className="space-y-2 rounded-md border p-3 bg-muted/30">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Preview
              </p>
              <div>
                <p className="text-xs text-muted-foreground">Subject</p>
                <p className="text-sm font-medium">{preview.subject_rendered}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Body</p>
                <div
                  className="text-sm prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: preview.body_html_rendered }}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending..." : "Send test"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
