"use client";

import { useState } from "react";
import { toast } from "sonner";

interface PublicSiteUrlPanelProps {
  slug: string;
}

export function PublicSiteUrlPanel({ slug }: PublicSiteUrlPanelProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${slug}`
      : `/p/${slug}`;

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("URL copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Public URL</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-sm">
          {publicUrl}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="h-9 shrink-0 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 shrink-0 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted transition-colors inline-flex items-center"
        >
          View
        </a>
      </div>
    </div>
  );
}
