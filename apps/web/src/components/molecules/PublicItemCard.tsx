"use client";

import { useRef, useState } from "react";
import { CheckCircle, Lock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KindBadge } from "@/components/atoms/KindBadge";
import { publicDocumentRequestRepository } from "@/lib/api/repositories";
import type { PublicItemResponse } from "@/lib/types/public-document-request";

function relTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface PublicItemCardProps {
  item: PublicItemResponse;
  token: string;
  jwt: string;
  onUploadSuccess: () => void;
  isLocked: boolean;
}

export function PublicItemCard({ item, token, jwt, onUploadSuccess, isLocked }: PublicItemCardProps): React.ReactElement {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      await publicDocumentRequestRepository.upload(token, item.id, file, jwt);
      onUploadSuccess();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <KindBadge kind={item.kind} />
        {item.is_required && (
          <span className="text-xs text-destructive font-medium">Required</span>
        )}
      </div>

      <p className="font-medium">{item.label}</p>

      {item.uploaded ? (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-md px-3 py-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">
            Uploaded {item.uploaded_at ? relTime(item.uploaded_at) : ""}
          </span>
        </div>
      ) : isLocked ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span className="text-sm">Verify your code to upload</span>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={handleFile}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base gap-2"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload file"}
          </Button>
          {uploadError && (
            <p className="text-xs text-destructive">{uploadError}</p>
          )}
        </div>
      )}
    </div>
  );
}
