"use client";

import { Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { WizardState } from "./wizardTypes";

interface WizardStep5Props {
  state: WizardState;
  verificationCode: string | null;
  publicUrl: string | null;
  isPending: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

function CopyButton({ text }: { text: string }): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const handle = (): void => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={handle} className="ml-2 text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

export function WizardStep5Review({ state, verificationCode, publicUrl, isPending, onSubmit, onBack }: WizardStep5Props): React.ReactElement {
  if (verificationCode && publicUrl) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border-2 border-green-500 p-6 text-center space-y-4">
          <CheckCircle className="h-10 w-10 text-green-600 mx-auto" />
          <h2 className="text-xl font-bold">Request sent!</h2>
          <p className="text-sm text-muted-foreground">Share the verification code and link with your customer via WhatsApp or SMS.</p>
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">4-digit verification code</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-mono font-bold tracking-widest">{verificationCode}</span>
              <CopyButton text={verificationCode} />
            </div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-sm break-all flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{publicUrl}</span>
            <CopyButton text={publicUrl} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Step 5 — Review & Send</h2>
        <p className="text-sm text-muted-foreground mt-1">Confirm the details before sending</p>
      </div>

      <div className="rounded-md border divide-y text-sm">
        <div className="px-4 py-3 flex justify-between">
          <span className="text-muted-foreground">Customer</span>
          <span className="font-medium">{state.customer?.full_name ?? "—"}</span>
        </div>
        <div className="px-4 py-3 flex justify-between">
          <span className="text-muted-foreground">Property</span>
          <span className="font-medium">{state.propertyTitle ?? "None"}</span>
        </div>
        <div className="px-4 py-3 flex justify-between">
          <span className="text-muted-foreground">Documents</span>
          <span className="font-medium">{state.items.length} item(s)</span>
        </div>
        <div className="px-4 py-3 flex justify-between">
          <span className="text-muted-foreground">Expires in</span>
          <span className="font-medium">{state.expiresInDays} days</span>
        </div>
        {state.agentNote && (
          <div className="px-4 py-3">
            <p className="text-muted-foreground">Note</p>
            <p className="mt-1">{state.agentNote}</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Items</p>
        <ul className="space-y-1">
          {state.items.map((it, i) => (
            <li key={i} className="text-sm text-muted-foreground">• {it.label}</li>
          ))}
        </ul>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isPending}>Back</Button>
        <Button onClick={onSubmit} disabled={isPending}>
          {isPending ? "Sending…" : "Send document request"}
        </Button>
      </div>
    </div>
  );
}
