"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { KindBadge } from "@/components/atoms/KindBadge";
import { RejectDocumentDialog } from "@/components/molecules/RejectDocumentDialog";
import { DocumentUploader } from "@/components/molecules/DocumentUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useApproveDocument, useRejectDocument } from "@/hooks/mutations/usePrivateDocumentMutations";
import { useUploadCustomerDocument } from "@/hooks/mutations/useCustomerMutations";
import type { PendingDocument } from "@/lib/types/customer";
import type { PrivateDocumentKind } from "@/lib/types/private-document";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocTableProps {
  docs: PendingDocument[];
  canModerate: boolean;
  customerId: string;
}

function DocTable({ docs, canModerate, customerId }: DocTableProps): React.ReactElement {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const { mutate: approve, isPending: approving } = useApproveDocument(customerId);
  const { mutate: reject, isPending: rejecting } = useRejectDocument(customerId);

  if (docs.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No documents in this category.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">File</th>
              <th className="px-3 py-2 text-left font-medium">Kind</th>
              <th className="px-3 py-2 text-left font-medium">Size</th>
              <th className="px-3 py-2 text-left font-medium">Uploaded</th>
              <th className="px-3 py-2 text-left font-medium">Uploader</th>
              {canModerate && <th className="px-3 py-2 text-left font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.id} className="border-b last:border-0">
                <td className="px-3 py-2.5 max-w-[180px] truncate" title={doc.original_filename}>
                  {doc.original_filename}
                </td>
                <td className="px-3 py-2.5"><KindBadge kind={doc.kind} /></td>
                <td className="px-3 py-2.5 text-muted-foreground">{formatBytes(doc.size_bytes)}</td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString("en-AE")}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{doc.uploader_name ?? "—"}</td>
                {canModerate && doc.status === "pending" && (
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
                )}
                {canModerate && doc.status !== "pending" && <td className="px-3 py-2.5" />}
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

interface CustomerDocumentsPanelProps {
  customerId: string;
  documents: PendingDocument[];
  canModerate: boolean;
}

export function CustomerDocumentsPanel({
  customerId,
  documents,
  canModerate,
}: CustomerDocumentsPanelProps): React.ReactElement {
  const [showUploader, setShowUploader] = useState(false);
  const { mutate: upload, isPending: uploading } = useUploadCustomerDocument(customerId);

  const approved = documents.filter((d) => d.status === "approved");
  const pending = documents.filter((d) => d.status === "pending");
  const rejected = documents.filter((d) => d.status === "rejected");

  const handleUpload = (file: File, kind: PrivateDocumentKind): void => {
    upload({ file, kind });
    setShowUploader(false);
  };

  return (
    <div className="space-y-4">
      {canModerate && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setShowUploader((v) => !v)}>
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Upload document
          </Button>
        </div>
      )}
      {showUploader && (
        <DocumentUploader onUpload={handleUpload} isPending={uploading} defaultKind="kyc" />
      )}

      <Tabs defaultValue="approved">
        <TabsList>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="approved" className="pt-3">
          <DocTable docs={approved} canModerate={false} customerId={customerId} />
        </TabsContent>
        <TabsContent value="pending" className="pt-3">
          <DocTable docs={pending} canModerate={canModerate} customerId={customerId} />
        </TabsContent>
        <TabsContent value="rejected" className="pt-3">
          <DocTable docs={rejected} canModerate={false} customerId={customerId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
