"use client";

import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { KindBadge } from "@/components/atoms/KindBadge";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { Button } from "@/components/ui/button";
import type { PrivateDocument, DownloadUrlResponse } from "@/lib/types/private-document";
import { formatDate } from "@/lib/utils/format-date";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentRowProps {
  doc: PrivateDocument;
  onDelete: (docId: string) => void;
  isDeleting: boolean;
  getDownloadUrl: (docId: string) => Promise<DownloadUrlResponse>;
  locale?: string | null;
}

export function DocumentRow({
  doc,
  onDelete,
  isDeleting,
  getDownloadUrl,
  locale,
}: DocumentRowProps): React.ReactElement {
  const handleDownload = async (): Promise<void> => {
    try {
      const { signed_url } = await getDownloadUrl(doc.id);
      window.open(signed_url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not get download link");
    }
  };

  const uploadedAt = formatDate(doc.created_at, locale);

  return (
    <tr className="border-b">
      <td className="px-3 py-2.5"><KindBadge kind={doc.kind} /></td>
      <td className="px-3 py-2.5 text-sm max-w-[200px] truncate" title={doc.original_filename}>
        {doc.original_filename}
      </td>
      <td className="px-3 py-2.5 text-sm text-muted-foreground">{formatBytes(doc.size_bytes)}</td>
      <td className="px-3 py-2.5 text-sm text-muted-foreground">{uploadedAt}</td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={handleDownload} title="Download">
            <Download className="h-4 w-4" />
          </Button>
          <ConfirmDialog
            trigger={
              <Button size="icon" variant="ghost" disabled={isDeleting} title="Delete">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            }
            title="Delete document?"
            description="This document is stored securely. Once deleted it cannot be recovered."
            confirmLabel="Delete"
            variant="destructive"
            onConfirm={() => onDelete(doc.id)}
          />
        </div>
      </td>
    </tr>
  );
}
