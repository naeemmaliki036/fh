"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface WizardStep4Props {
  agentNote: string;
  expiresInDays: number;
  onChangeNote: (v: string) => void;
  onChangeDays: (v: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function WizardStep4Details({
  agentNote,
  expiresInDays,
  onChangeNote,
  onChangeDays,
  onNext,
  onBack,
}: WizardStep4Props): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Step 4 — Details</h2>
        <p className="text-sm text-muted-foreground mt-1">Add an optional note and set the expiry window</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="agent-note">Agent Note (shown to customer)</Label>
          <textarea
            id="agent-note"
            rows={4}
            value={agentNote}
            onChange={(e) => onChangeNote(e.target.value)}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            placeholder="Optional instructions for the customer…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expires-days">
            Link expires in (days): <span className="font-semibold">{expiresInDays}</span>
          </Label>
          <input
            id="expires-days"
            type="range"
            min={7}
            max={14}
            step={1}
            value={expiresInDays}
            onChange={(e) => onChangeDays(Math.max(7, Math.min(14, parseInt(e.target.value, 10) || 7)))}
            className="w-full accent-primary"
          />
          <p className="text-xs text-muted-foreground">
            Link will expire on{" "}
            <strong>
              {new Date(Date.now() + expiresInDays * 86_400_000).toLocaleDateString("en-AE", {
                year: "numeric", month: "short", day: "2-digit",
              })}
            </strong>
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Review & send</Button>
      </div>
    </div>
  );
}
