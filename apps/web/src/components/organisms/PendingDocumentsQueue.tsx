"use client";

import { useState } from "react";
import Link from "next/link";
import { KindBadge } from "@/components/atoms/KindBadge";
import { RejectDocumentDialog } from "@/components/molecules/RejectDocumentDialog";
import { Button } from "@/components/ui/button";
import { usePendingDocuments } from "@/hooks/queries/usePendingDocuments";
import { useApproveDocument, useRejectDocument } from "@/hooks/mutations/usePrivateDocumentMutations";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function entityLink(type: string, id: string): string {
  if (type === "customer") return `/customers/${id}`;
  if (type === "lead") return `/leads/${id}`;
  if (type === "deal") return `/deals/${id}`;
  if (type === "agent") return `/agents/${id}`;
  return "#";
}

interface PendingDocumentsQueueProps {
  entityType?: string;
  assignedToMe?: boolean;
}

export function PendingDocumentsQueue({
  entityType,
  assignedToMe,
}: PendingDocumentsQueueProps): React.ReactElement {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const { data, isLoading, error } = usePendingDocuments({
    entity_type: entityType,
    assigned_to_me: assignedToMe || undefined,
  });
  const { mutate: approve, isPending: approving } = useApproveDocument();
  const { mutate: reject, isPending: rejecting } = useRejectDocument();

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading queue…</p>;
  if (error) return <p className="text-sm text-destructive">Failed to load pending documents.</p>;

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="rounded-md border bg-muted/20 py-12 text-center">
        <p className="text-sm font-medium">No pending documents</p>
        <p className="text-xs text-muted-foreground mt-1">All caught up!</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">File</th>
              <th className="px-3 py-2 text-left font-medium">Kind</th>
              <th className="px-3 py-2 text-left font-medium">Entity</th>
              <th className="px-3 py-2 text-left font-medium">Size</th>
              <th className="px-3 py-2 text-left font-medium">Uploaded</th>
              <th className="px-3 py-2 text-left font-medium">Uploader</th>
              <th className="px-3 py-2 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((doc) => (
              <tr key={doc.id} className="border-b last:border-0">
                <td className="px-3 py-2.5 max-w-[160px] truncate" title={doc.original_filename}>
                  {doc.original_filename}
                </td>
                <td className="px-3 py-2.5"><KindBadge kind={doc.kind} /></td>
                <td className="px-3 py-2.5">
                  <Link
                    href={entityLink(doc.entity_type, doc.entity_id)}
                    className="text-primary hover:underline"
                  >
                    <span className="capitalize text-xs text-muted-foreground">{doc.entity_type}: </span>
                    {doc.entity_name ?? doc.entity_id}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{formatBytes(doc.size_bytes)}</td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString("en-AE")}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{doc.uploader_name ?? "—"}</td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                      disabled={approving}
                      onClick={() => approve(doc.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                      disabled={rejecting}
                      onClick={() => setRejectingId(doc.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RejectDocumentDialog
        open={rejectingId !== null}
        onOpenChange={(open) => { if (!open) setRejectingId(null); }}
        isPending={rejecting}
        onConfirm={(reason) => {
          if (rejectingId) {
            reject({ id: rejectingId, body: { reason } });
            setRejectingId(null);
          }
        }}
      />
    </>
  );
}
