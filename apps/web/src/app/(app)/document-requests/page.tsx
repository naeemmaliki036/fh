"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useDocumentRequests } from "@/hooks/queries/useDocumentRequests";
import { useCancelDocumentRequest } from "@/hooks/mutations/useDocumentRequestMutations";
import { DocRequestStatusBadge } from "@/components/atoms/DocRequestStatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DocRequestForm } from "@/components/molecules/DocRequestForm";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { useCreateDocumentRequest } from "@/hooks/mutations/useDocumentRequestMutations";
import type { DocumentRequestStatus, DocumentRequestCreate } from "@/lib/types/document-request";

const STATUSES: DocumentRequestStatus[] = ["pending","partial","complete","expired","canceled"];

function relativeDate(dateStr: string): string {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return "expired";
  if (diff === 0) return "today";
  return `in ${diff}d`;
}

export default function DocumentRequestsPage(): React.ReactElement {
  const [status, setStatus] = useState<DocumentRequestStatus | "all">("all");
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, error } = useDocumentRequests({
    status: status === "all" ? undefined : status,
  });
  const { mutate: cancel } = useCancelDocumentRequest();
  const { mutate: create, isPending } = useCreateDocumentRequest();
  const requests = data?.items ?? [];

  const handleCreate = (d: DocumentRequestCreate): void => {
    create(d, { onSuccess: () => setShowCreate(false) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Document Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">Send secure document collection links to customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/document-requests/new"><Plus className="mr-1.5 h-4 w-4" />Request documents (wizard)</Link></Button>
          <Button onClick={() => setShowCreate(true)}><Plus className="mr-1.5 h-4 w-4" />Quick request</Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={status} onValueChange={v => setStatus(v as DocumentRequestStatus | "all")}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground self-center">{data?.total ?? 0} requests</span>
      </div>

      {error && <p className="text-sm text-destructive">Failed to load requests.</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Title</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Progress</th>
              <th className="px-3 py-2 text-left font-medium">Expires</th>
              <th className="px-3 py-2 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} className="border-b">
                <td className="px-3 py-2.5 font-medium">{r.title}</td>
                <td className="px-3 py-2.5"><DocRequestStatusBadge status={r.status} /></td>
                <td className="px-3 py-2.5 text-muted-foreground">{r.uploaded_count}/{r.items_count}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{relativeDate(r.expires_at)}</td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/document-requests/${r.id}`}>Open</Link>
                    </Button>
                    {r.status === "pending" || r.status === "partial" ? (
                      <ConfirmDialog
                        trigger={<Button size="sm" variant="destructive">Cancel</Button>}
                        title="Cancel document request?"
                        description="The customer will not be able to upload any more documents. This cannot be undone."
                        confirmLabel="Cancel request"
                        variant="destructive"
                        onConfirm={() => cancel(r.id)}
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && requests.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No document requests yet</p>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Document Request</DialogTitle></DialogHeader>
          <DocRequestForm isPending={isPending} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
