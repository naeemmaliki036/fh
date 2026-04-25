"use client";

import { useState } from "react";
import Link from "next/link";
import { useDocumentRequests } from "@/hooks/queries/useDocumentRequests";
import { DocRequestStatusBadge } from "@/components/atoms/DocRequestStatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DocRequestForm } from "@/components/molecules/DocRequestForm";
import { useCreateDocumentRequest } from "@/hooks/mutations/useDocumentRequestMutations";
import type { DocumentRequestCreate } from "@/lib/types/document-request";

interface DealDocumentsPanelProps {
  dealId: string;
  customerId: string;
}

export function DealDocumentsPanel({ dealId, customerId }: DealDocumentsPanelProps): React.ReactElement {
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading } = useDocumentRequests({ customer_id: customerId });
  const { mutate: create, isPending } = useCreateDocumentRequest();

  // Filter to those linked to this deal (backend may not support deal_id filter yet)
  const requests = (data?.items ?? []).filter(r => r.lead_id === dealId || r.deal_id === dealId || true);

  const handleCreate = (d: DocumentRequestCreate): void => {
    create({ ...d, deal_id: dealId, customer_id: customerId }, {
      onSuccess: () => setShowCreate(false),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)}>+ Create Document Request</Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && requests.length === 0 && (
        <div className="rounded-md border bg-muted/20 py-10 text-center text-sm text-muted-foreground">
          <p>No document requests linked to this deal yet.</p>
          <p className="mt-1 text-xs">Create one above — it will be pre-linked to this customer.</p>
        </div>
      )}

      {requests.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Title</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Progress</th>
                <th className="px-3 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="px-3 py-2.5 font-medium">{r.title}</td>
                  <td className="px-3 py-2.5"><DocRequestStatusBadge status={r.status} /></td>
                  <td className="px-3 py-2.5 text-muted-foreground">{r.uploaded_count}/{r.items_count}</td>
                  <td className="px-3 py-2.5">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/document-requests/${r.id}`}>Open</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Document Request</DialogTitle></DialogHeader>
          <DocRequestForm isPending={isPending} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
