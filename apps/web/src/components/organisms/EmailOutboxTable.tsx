"use client";

import { useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useEmailOutbox } from "@/hooks/queries/useEmailOutbox";
import {
  useRetryEmailOutbox,
  useProcessEmailOutbox,
} from "@/hooks/mutations/useEmailOutboxMutations";
import { EmailOutboxStatusBadge } from "@/components/atoms/EmailOutboxStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import type { EmailOutboxStatus, EmailOutboxListParams } from "@/lib/types";
import { formatDate } from "@/lib/utils/format-date";

const STATUS_FILTERS: Array<{ value: EmailOutboxStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "queued", label: "Queued" },
  { value: "sent", label: "Sent" },
  { value: "delivered", label: "Delivered" },
  { value: "bounced", label: "Bounced" },
  { value: "failed", label: "Failed" },
];

const RETRYABLE: EmailOutboxStatus[] = ["failed", "bounced"];
const LIMIT_OPTIONS = [50, 100, 200] as const;

export function EmailOutboxTable(): ReactElement {
  const router = useRouter();
  const { currentPlatformUser } = useAuth();
  const isSuperAdmin = currentPlatformUser?.role === "super_admin";

  const [status, setStatus] = useState<EmailOutboxStatus | "all">("all");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState<50 | 100 | 200>(50);

  const params: EmailOutboxListParams = {
    status: status === "all" ? undefined : status,
    limit,
    q: q || undefined,
  };

  const { data, isLoading } = useEmailOutbox(params);
  const { mutate: retry, isPending: retrying } = useRetryEmailOutbox();
  const { mutate: process, isPending: processing } = useProcessEmailOutbox();

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((s) => (
          <Button
            key={s.value}
            size="sm"
            variant={status === s.value ? "default" : "outline"}
            onClick={() => setStatus(s.value)}
          >
            {s.label}
          </Button>
        ))}

        <div className="flex-1" />

        <Input
          placeholder="Search recipient..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-8 w-52"
        />

        <div className="flex items-center gap-1">
          {LIMIT_OPTIONS.map((l) => (
            <Button
              key={l}
              size="sm"
              variant={limit === l ? "default" : "outline"}
              onClick={() => setLimit(l)}
            >
              {l}
            </Button>
          ))}
        </div>

        {isSuperAdmin && (
          <Button
            size="sm"
            onClick={() => process()}
            disabled={processing}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${processing ? "animate-spin" : ""}`} />
            Process outbox
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Queued at</th>
                <th className="px-4 py-3 text-left font-medium">Recipient</th>
                <th className="px-4 py-3 text-left font-medium">Template key</th>
                <th className="px-4 py-3 text-left font-medium">Subject</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Attempts</th>
                <th className="px-4 py-3 text-left font-medium">Last error</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No messages found
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t hover:bg-muted/30 cursor-pointer"
                  onClick={() => router.push(`/email-outbox/${item.id}`)}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                    {formatDate(item.queued_at, undefined)}
                  </td>
                  <td className="px-4 py-3 max-w-[180px] truncate">{item.recipient_email}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.template_key}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground">
                    {item.subject_rendered}
                  </td>
                  <td className="px-4 py-3">
                    <EmailOutboxStatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-center">{item.attempts}</td>
                  <td className="px-4 py-3 max-w-[160px] truncate text-xs text-destructive">
                    {item.last_error ?? "—"}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {RETRYABLE.includes(item.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={retrying}
                        onClick={() => retry(item.id)}
                      >
                        Retry
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
