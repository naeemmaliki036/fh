"use client";

import type { ReactElement } from "react";
import { useEmailOutboxItem } from "@/hooks/queries/useEmailOutbox";
import { useRetryEmailOutbox } from "@/hooks/mutations/useEmailOutboxMutations";
import { EmailOutboxStatusBadge } from "@/components/atoms/EmailOutboxStatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format-date";

interface EmailOutboxDetailProps {
  id: string;
}

const RETRYABLE = new Set(["failed", "bounced"]);

export function EmailOutboxDetail({ id }: EmailOutboxDetailProps): ReactElement {
  const { data: item, isLoading, error } = useEmailOutboxItem(id);
  const { mutate: retry, isPending } = useRetryEmailOutbox();

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (error || !item) return <p className="text-sm text-destructive">Failed to load message.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{item.subject_rendered}</h2>
          <p className="text-sm text-muted-foreground">{item.recipient_email}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <EmailOutboxStatusBadge status={item.status} />
          {RETRYABLE.has(item.status) && (
            <Button size="sm" disabled={isPending} onClick={() => retry(id)}>
              {isPending ? "Retrying..." : "Retry"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <InfoRow label="Template key" value={item.template_key} mono />
        <InfoRow label="Attempts" value={String(item.attempts)} />
        <InfoRow label="Queued at" value={formatDate(item.queued_at, undefined)} />
        <InfoRow label="Sent at" value={item.sent_at ? formatDate(item.sent_at, undefined) : "—"} />
        {item.last_error && (
          <div className="col-span-2">
            <InfoRow label="Last error" value={item.last_error} className="text-destructive" />
          </div>
        )}
      </div>

      {item.body_html_rendered && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            HTML body
          </p>
          <div className="rounded-md border overflow-auto max-h-96 p-4">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: item.body_html_rendered }}
            />
          </div>
        </div>
      )}

      {item.body_text_rendered && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Text body
          </p>
          <pre className="rounded-md border bg-muted/30 p-4 text-xs whitespace-pre-wrap overflow-auto max-h-48">
            {item.body_text_rendered}
          </pre>
        </div>
      )}

      {item.payload_json && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Payload JSON
          </p>
          <pre className="rounded-md border bg-muted/30 p-4 text-xs overflow-auto max-h-48">
            {JSON.stringify(item.payload_json, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string | null;
  mono?: boolean;
  className?: string;
}

function InfoRow({ label, value, mono, className }: InfoRowProps): ReactElement {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm ${mono ? "font-mono" : ""} ${className ?? ""}`}>{value ?? "—"}</p>
    </div>
  );
}
