"use client";

import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, FileText, X, Loader2 } from "lucide-react";
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentUploader({ onUpload, isPending, defaultKind }: DocumentUploaderProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { kind: defaultKind },
  });

  function validateAndSet(file: File | null): void {
    setFileError(null);
    setSelectedFile(null);
    if (!file) return;
    if (!ALLOWED_MIME.includes(file.type)) { setFileError("Unsupported file type"); return; }
    if (file.size > MAX_SIZE_BYTES) { setFileError("File must be under 20 MB"); return; }
    setSelectedFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>): void {
    validateAndSet(e.target.files?.[0] ?? null);
  }

  function handleDrop(e: React.DragEvent): void {
    e.preventDefault();
    setDragging(false);
    validateAndSet(e.dataTransfer.files?.[0] ?? null);
  }

  function clearFile(): void {
    setSelectedFile(null);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const onSubmit = (values: FormValues): void => {
    if (!selectedFile) { setFileError("Please select a file"); return; }
    onUpload(selectedFile, values.kind);
    setSelectedFile(null);
    reset();
    if (inputRef.current) inputRef.current.value = "";
  };

  const dropZoneCls = [
    "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 px-6",
    "text-center transition cursor-pointer",
    dragging
      ? "border-primary bg-primary/5"
      : selectedFile
      ? "border-emerald-300 bg-emerald-50/40"
      : "border-slate-200 hover:border-primary/50 hover:bg-muted/40",
  ].join(" ");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <Upload className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">Upload a document</p>
      </div>

      {/* Document type */}
      <div className="space-y-1.5">
        <Label>Document Type</Label>
        <Controller
          name="kind"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="Choose what kind of document this is" /></SelectTrigger>
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

      {/* File drop zone */}
      <div className="space-y-1.5">
        <Label>File</Label>
        {selectedFile ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/40 px-4 py-3">
            <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="rounded-full p-1 hover:bg-emerald-100 text-emerald-700"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            className={dropZoneCls}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-6 w-6 text-slate-400" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium">
                <span className="text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, JPG, PNG, WEBP, DOC, DOCX · max 20 MB
              </p>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
        {fileError && <p className="text-xs text-destructive">{fileError}</p>}
      </div>

      <Button type="submit" disabled={isPending || !selectedFile} className="w-full sm:w-auto">
        {isPending ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading…</> : "Upload document"}
      </Button>
    </form>
  );
}
