"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle, Circle } from "lucide-react";
import { useDocumentRequest } from "@/hooks/queries/useDocumentRequests";
import {
  useCancelDocumentRequest,
  useRegenerateDocumentRequestCode,
  useReopenDocumentRequest,
} from "@/hooks/mutations/useDocumentRequestMutations";
import { DocRequestStatusBadge } from "@/components/atoms/DocRequestStatusBadge";
import { KindBadge } from "@/components/atoms/KindBadge";
import { OneTimeCodeBanner } from "@/components/molecules/OneTimeCodeBanner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queryKeys";
import type { DocumentRequestCreateResponse } from "@/lib/types/document-request";

interface PageProps { params: Promise<{ id: string }> }

export default function DocumentRequestDetailPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const sp = useSearchParams();
  const justCreated = sp.get("just_created") === "1";
  const qc = useQueryClient();

  const { data: request, isLoading, error } = useDocumentRequest(id);
  const { mutate: cancel, isPending: canceling } = useCancelDocumentRequest();
  const { mutate: regenerate, isPending: regenerating, data: regenData } = useRegenerateDocumentRequestCode();
  const { mutate: reopen, isPending: reopening } = useReopenDocumentRequest();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // One-time create data from query cache (set by mutation before redirect)
  const cached = qc.getQueryData<DocumentRequestCreateResponse>(queryKeys.docRequests.detail(id));
  const oneTimeCode = justCreated ? cached?.verification_code : undefined;
  const oneTimeUrl = justCreated ? cached?.public_url : undefined;
  const regenCode = regenData?.verification_code;

  if (isLoading) return <p className="text-sm text-muted-foreground p-6">Loading…</p>;
  if (error || !request) return (
    <div className="p-6 space-y-3">
      <p className="text-sm text-destructive">Request not found.</p>
      <Button asChild variant="outline" size="sm">
        <Link href="/document-requests"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
      </Button>
    </div>
  );

  const isActive = request.status === "pending" || request.status === "partial";

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm"><Link href="/document-requests"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h1 className="text-xl font-semibold">{request.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <DocRequestStatusBadge status={request.status} />
            <span className="text-xs text-muted-foreground">
              {request.uploaded_count}/{request.items_count} uploaded
            </span>
          </div>
        </div>
      </div>

      {/* One-time banner — create flow */}
      {oneTimeCode && oneTimeUrl && (
        <OneTimeCodeBanner code={oneTimeCode} publicUrl={oneTimeUrl} />
      )}

      {/* Regenerate code result */}
      {regenCode && cached?.public_url && (
        <OneTimeCodeBanner code={regenCode} publicUrl={cached.public_url} />
      )}

      {/* Items list */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Requested Documents</p>
        {request.instructions && (
          <p className="text-sm text-muted-foreground">{request.instructions}</p>
        )}
        <div className="space-y-2">
          {request.items.sort((a, b) => a.ordering - b.ordering).map(item => (
            <div key={item.id} className="flex items-center gap-3 rounded-md border p-3">
              {item.uploaded_at
                ? <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                : <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              }
              <KindBadge kind={item.kind} />
              <span className="flex-1 text-sm">{item.label}</span>
              {item.is_required && <span className="text-xs text-muted-foreground">Required</span>}
              {item.uploaded_at && (
                <span className="text-xs text-green-600">
                  Uploaded {new Date(item.uploaded_at).toLocaleDateString("en-AE")}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {isActive && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={regenerating}
            onClick={() => regenerate(request.id)}
          >
            {regenerating ? "Regenerating…" : "Regenerate Code"}
          </Button>
          <Button variant="destructive" onClick={() => setShowCancelDialog(true)}>
            Cancel Request
          </Button>
        </div>
      )}

      {request.status === "complete" && (
        <Button
          variant="outline"
          disabled={reopening}
          onClick={() => reopen(request.id)}
        >
          {reopening ? "Reopening…" : "Re-open for more documents"}
        </Button>
      )}

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancel this request?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">The customer link will stop working. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Keep it</Button>
            <Button
              variant="destructive"
              disabled={canceling}
              onClick={() => { cancel(request.id); setShowCancelDialog(false); }}
            >
              {canceling ? "Canceling…" : "Yes, cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
