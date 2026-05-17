"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import { useMyTenant } from "@/hooks/queries/useTenants";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WizardStep4Props {
  agentNote: string;
  expiresInDays: number;
  sendEmail: boolean;
  onChangeNote: (v: string) => void;
  onChangeDays: (v: number) => void;
  onChangeSendEmail: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export function WizardStep4Details({
  agentNote,
  expiresInDays,
  sendEmail,
  onChangeNote,
  onChangeDays,
  onChangeSendEmail,
  onNext,
  onBack,
}: WizardStep4Props): React.ReactElement {
  const { data: tenant } = useMyTenant();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLoadDefault = (): void => {
    if (!tenant?.document_request_default_instructions) return;
    // If there's already content, ask before overwriting
    const stripped = agentNote.replace(/<[^>]*>/g, "").trim();
    if (stripped.length > 0) {
      setConfirmOpen(true);
    } else {
      onChangeNote(tenant.document_request_default_instructions);
    }
  };

  const confirmLoadDefault = (): void => {
    if (tenant?.document_request_default_instructions) {
      onChangeNote(tenant.document_request_default_instructions);
    }
    setConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Step 4 — Details</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add an optional note and set the expiry window
        </p>
      </div>

      <div className="space-y-4">
        {/* Agent Note */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="agent-note">Agent Note (shown to customer)</Label>
            {tenant?.document_request_default_instructions && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleLoadDefault}
              >
                Load default instructions
              </Button>
            )}
          </div>
          <RichTextEditor
            value={agentNote}
            onChange={onChangeNote}
            placeholder="Optional instructions for the customer…"
            minHeight={160}
          />
        </div>

        {/* Expiry slider */}
        <div className="space-y-1.5">
          <Label htmlFor="expires-days">
            Link expires in (days):{" "}
            <span className="font-semibold">{expiresInDays}</span>
          </Label>
          <input
            id="expires-days"
            type="range"
            min={7}
            max={14}
            step={1}
            value={expiresInDays}
            onChange={(e) =>
              onChangeDays(
                Math.max(7, Math.min(14, parseInt(e.target.value, 10) || 7)),
              )
            }
            className="w-full accent-primary"
          />
          <p className="text-xs text-muted-foreground">
            Link will expire on{" "}
            <strong>
              {new Date(
                Date.now() + expiresInDays * 86_400_000,
              ).toLocaleDateString("en-AE", {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })}
            </strong>
          </p>
        </div>

        {/* Send-mode toggle */}
        <div className="space-y-1.5">
          <Label>Delivery mode</Label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="send-mode"
                checked={sendEmail}
                onChange={() => onChangeSendEmail(true)}
                className="accent-primary"
              />
              <span className="text-sm">Send email to customer</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="send-mode"
                checked={!sendEmail}
                onChange={() => onChangeSendEmail(false)}
                className="accent-primary"
              />
              <span className="text-sm">
                Create link only (I&apos;ll share it manually)
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Review &amp; send</Button>
      </div>

      {/* Confirm overwrite dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace current text?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Replace current text with default instructions?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmLoadDefault}>Replace</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
