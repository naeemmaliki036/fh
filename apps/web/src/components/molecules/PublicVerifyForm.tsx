"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VerifyError {
  message: string;
  attemptsLeft?: number;
  locked?: boolean;
}

interface PublicVerifyFormProps {
  tenantName: string;
  isPending: boolean;
  error: VerifyError | null;
  onSubmit: (code: string) => void;
}

export function PublicVerifyForm({ tenantName, isPending, error, onSubmit }: PublicVerifyFormProps): React.ReactElement {
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (code.trim()) onSubmit(code.trim());
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">{tenantName} is requesting documents from you</p>
      </div>

      {error?.locked ? (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
          <p className="font-semibold text-destructive">Link locked</p>
          <p className="text-sm mt-1">Too many attempts. Contact your agent to get a new link.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono h-14"
            />
            <p className="text-xs text-muted-foreground text-center">
              Enter the 6-digit code your agent shared with you
            </p>
          </div>

          {error && !error.locked && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error.message}
              {error.attemptsLeft != null && (
                <span className="ml-1">({error.attemptsLeft} attempts remaining)</span>
              )}
            </div>
          )}

          <Button type="submit" className="w-full h-12 text-base" disabled={isPending || code.length !== 6}>
            {isPending ? "Verifying…" : "Verify"}
          </Button>
        </form>
      )}
    </div>
  );
}
