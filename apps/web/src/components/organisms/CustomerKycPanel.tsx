"use client";

import { useCustomerDocuments } from "@/hooks/queries/useCustomers";
import {
  useUploadCustomerDocument,
  useDeleteCustomerDocument,
} from "@/hooks/mutations/useCustomerMutations";
import { customerRepository } from "@/lib/api/repositories";
import { useMyTenant } from "@/hooks/queries/useTenants";
import { DocumentUploader } from "@/components/molecules/DocumentUploader";
import { DocumentRow } from "@/components/molecules/DocumentRow";
import type { PrivateDocumentKind, DownloadUrlResponse } from "@/lib/types/private-document";

interface CustomerKycPanelProps {
  customerId: string;
}

export function CustomerKycPanel({ customerId }: CustomerKycPanelProps): React.ReactElement {
  const { data: tenant } = useMyTenant();
  const { data: docs, isLoading, error } = useCustomerDocuments(customerId);
  const { mutate: upload, isPending: uploading } = useUploadCustomerDocument(customerId);
  const { mutate: deleteDoc, isPending: deleting } = useDeleteCustomerDocument(customerId);

  const handleUpload = (file: File, kind: PrivateDocumentKind): void => {
    upload({ file, kind });
  };

  const getDownloadUrl = (docId: string): Promise<DownloadUrlResponse> =>
    customerRepository.getDownloadUrl(customerId, docId);

  return (
    <div className="space-y-4">
      <DocumentUploader onUpload={handleUpload} isPending={uploading} defaultKind="kyc" />

      {isLoading && <p className="text-sm text-muted-foreground">Loading documents...</p>}
      {error && <p className="text-sm text-destructive">Failed to load documents.</p>}

      {!isLoading && docs && docs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border rounded-md bg-muted/20">
          <p className="text-sm font-medium">No KYC documents yet</p>
          <p className="text-xs mt-1">Upload a document above</p>
        </div>
      )}

      {docs && docs.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Type</th>
                <th className="px-3 py-2 text-left font-medium">File</th>
                <th className="px-3 py-2 text-left font-medium">Size</th>
                <th className="px-3 py-2 text-left font-medium">Uploaded</th>
                <th className="px-3 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  onDelete={deleteDoc}
                  isDeleting={deleting}
                  getDownloadUrl={getDownloadUrl}
                  locale={tenant?.locale}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
