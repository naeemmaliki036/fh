"use client";

import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PrivateDocumentKind } from "@/lib/types/private-document";

const MAX_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const DOC_KINDS: { value: PrivateDocumentKind; label: string }[] = [
  { value: "rera_id", label: "RERA ID" },
  { value: "passport", label: "Passport" },
  { value: "emirates_id", label: "Emirates ID" },
  { value: "trade_license", label: "Trade License" },
  { value: "noc", label: "NOC" },
  { value: "contract", label: "Contract" },
  { value: "kyc", label: "KYC" },
  { value: "other", label: "Other" },
];

const KIND_VALUES = DOC_KINDS.map((d) => d.value) as [PrivateDocumentKind, ...PrivateDocumentKind[]];
const schema = z.object({ kind: z.enum(KIND_VALUES) });
type FormValues = z.infer<typeof schema>;

interface DocumentUploaderProps {
  onUpload: (file: File, kind: PrivateDocumentKind) => void;
  isPending: boolean;
  defaultKind?: PrivateDocumentKind;
}

export function DocumentUploader({ onUpload, isPending, defaultKind }: DocumentUploaderProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { kind: defaultKind },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    setFileError(null);
    setSelectedFile(null);
    if (!file) return;
    if (!ALLOWED_MIME.includes(file.type)) { setFileError("Unsupported file type"); return; }
    if (file.size > MAX_SIZE_BYTES) { setFileError("File must be under 20 MB"); return; }
    setSelectedFile(file);
  };

  const onSubmit = (values: FormValues): void => {
    if (!selectedFile) { setFileError("Please select a file"); return; }
    onUpload(selectedFile, values.kind);
    setSelectedFile(null);
    reset();
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-md border p-4 bg-muted/30">
      <p className="text-sm font-medium">Upload Document</p>
      <div className="flex gap-3 items-end">
        <div className="space-y-1.5 flex-1">
          <Label>Document Type</Label>
          <Controller
            name="kind"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {DOC_KINDS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.kind && <p className="text-xs text-destructive">{errors.kind.message}</p>}
        </div>
        <div className="space-y-1.5 flex-1">
          <Label>File</Label>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            onChange={handleFileSelect}
            className="block w-full text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-input file:text-sm file:bg-background file:text-foreground cursor-pointer"
          />
          {fileError && <p className="text-xs text-destructive">{fileError}</p>}
          {selectedFile && <p className="text-xs text-muted-foreground">{selectedFile.name}</p>}
        </div>
        <Button type="submit" disabled={isPending || !selectedFile} size="sm">
          {isPending ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </form>
  );
}
