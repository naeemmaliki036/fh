"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OneTimeCodeBannerProps {
  code: string;
  publicUrl: string;
}

function CopyButton({ text }: { text: string }): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button type="button" size="sm" variant="outline" onClick={copy} className="gap-1.5">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function OneTimeCodeBanner({ code, publicUrl }: OneTimeCodeBannerProps): React.ReactElement {
  return (
    <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 space-y-4">
      <div className="flex items-start gap-2">
        <span className="text-amber-600 text-lg">!</span>
        <div>
          <p className="font-semibold text-amber-900">Save these now — shown once only</p>
          <p className="text-sm text-amber-700 mt-0.5">
            Share the verification code and link with your customer via a separate channel (call, SMS, WhatsApp).
            If the code is lost, regenerate it below.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-md bg-white border border-amber-200 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Verification Code</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-2xl font-mono font-bold tracking-widest text-amber-900">{code}</span>
            <CopyButton text={code} />
          </div>
        </div>

        <div className="rounded-md bg-white border border-amber-200 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Customer Link</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-mono break-all text-amber-900 flex-1">{publicUrl}</span>
            <CopyButton text={publicUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}
