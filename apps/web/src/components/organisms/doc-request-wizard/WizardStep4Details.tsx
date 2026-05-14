"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
          <Label htmlFor="expires-days">Expires in (days)</Label>
          <Input
            id="expires-days"
            type="number"
            min={1}
            max={90}
            value={expiresInDays}
            onChange={(e) => onChangeDays(Math.max(1, Math.min(90, parseInt(e.target.value, 10) || 7)))}
            className="w-32"
          />
          <p className="text-xs text-muted-foreground">Between 1 and 90 days</p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Review & send</Button>
      </div>
    </div>
  );
}
