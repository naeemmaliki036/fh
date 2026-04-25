"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUploadAgentPhoto, useDeleteAgentPhoto } from "@/hooks/mutations/useAgentMutations";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

interface AgentPhotoUploaderProps {
  agentId: string;
  currentUrl: string | null;
}

export function AgentPhotoUploader({ agentId, currentUrl }: AgentPhotoUploaderProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate: upload, isPending: uploading } = useUploadAgentPhoto(agentId);
  const { mutate: removePhoto, isPending: removing } = useDeleteAgentPhoto(agentId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError(null);
    if (!ALLOWED_MIME.includes(file.type)) {
      setValidationError("Only JPEG, PNG, or WebP images are allowed");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setValidationError("File must be under 5 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => { setPreview(ev.target?.result as string); };
    reader.readAsDataURL(file);

    upload(file, {
      onSuccess: () => { setPreview(null); },
      onError: () => { setPreview(null); },
    });
  };

  const displayUrl = preview ?? currentUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="h-24 w-24 rounded-full border-2 border-border overflow-hidden bg-muted flex items-center justify-center">
        {displayUrl ? (
          <img src={displayUrl} alt="Agent photo" className="h-full w-full object-cover" />
        ) : (
          <span className="text-3xl text-muted-foreground">?</span>
        )}
      </div>

      {validationError && (
        <p className="text-xs text-destructive text-center">{validationError}</p>
      )}

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload photo"}
        </Button>
        {currentUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removePhoto()}
            disabled={removing}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
