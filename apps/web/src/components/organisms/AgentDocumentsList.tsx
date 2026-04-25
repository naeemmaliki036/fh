"use client";

import { useAgentDocuments } from "@/hooks/queries/useAgents";
import {
  useUploadAgentDocument,
  useDeleteAgentDocument,
} from "@/hooks/mutations/useAgentMutations";
import { agentRepository } from "@/lib/api/repositories";
import { DocumentUploader } from "@/components/molecules/DocumentUploader";
import { DocumentRow } from "@/components/molecules/DocumentRow";
import type { PrivateDocumentKind, DownloadUrlResponse } from "@/lib/types/private-document";

interface AgentDocumentsListProps {
  agentId: string;
}

export function AgentDocumentsList({ agentId }: AgentDocumentsListProps): React.ReactElement {
  const { data: docs, isLoading, error } = useAgentDocuments(agentId);
  const { mutate: upload, isPending: uploading } = useUploadAgentDocument(agentId);
  const { mutate: deleteDoc, isPending: deleting } = useDeleteAgentDocument(agentId);

  const handleUpload = (file: File, kind: PrivateDocumentKind): void => {
    upload({ file, kind });
  };

  const getDownloadUrl = (docId: string): Promise<DownloadUrlResponse> =>
    agentRepository.getDownloadUrl(agentId, docId);

  return (
    <div className="space-y-4">
      <DocumentUploader onUpload={handleUpload} isPending={uploading} />

      {isLoading && <p className="text-sm text-muted-foreground">Loading documents...</p>}
      {error && <p className="text-sm text-destructive">Failed to load documents.</p>}

      {!isLoading && docs && docs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border rounded-md bg-muted/20">
          <p className="text-sm font-medium">No documents yet</p>
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
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
