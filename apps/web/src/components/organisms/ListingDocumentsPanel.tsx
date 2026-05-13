"use client";

import { useRef, useState, type ReactElement } from "react";
import { Trash2, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListingDocuments } from "@/hooks/queries/useListingDocuments";
import {
  useUploadListingDocument,
  useDeleteListingDocument,
} from "@/hooks/mutations/useListingDocumentMutations";
import type { ListingDocument, ListingDocumentKind } from "@/lib/types/listing-document";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp";

const KINDS: { value: ListingDocumentKind; label: string }[] = [
  { value: "brochure", label: "Brochure" },
  { value: "floor_plan", label: "Floor Plan" },
  { value: "payment_plan", label: "Payment Plan" },
  { value: "other", label: "Other" },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ListingDocumentsPanelProps {
  listingId: string;
}

export function ListingDocumentsPanel({ listingId }: ListingDocumentsPanelProps): ReactElement {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileErr, setFileErr] = useState<string | null>(null);
  const [kind, setKind] = useState<ListingDocumentKind>("brochure");
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ListingDocument | null>(null);

  const { data, isLoading, error } = useListingDocuments(listingId);
  const { mutate: upload, isPending: uploading } = useUploadListingDocument(listingId);
  const { mutate: remove, isPending: deleting } = useDeleteListingDocument(listingId);

  const docs = data?.items ?? [];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFileErr(null);
    setSelectedFile(null);
    const f = e.target.files?.[0];
    if (!f) return;
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(f.type)) {
      setFileErr("Only PDF or image files (png/jpg/webp) are allowed");
      return;
    }
    if (f.size > MAX_BYTES) {
      setFileErr("Max file size is 5 MB");
      return;
    }
    setSelectedFile(f);
  };

  const handleUpload = (): void => {
    if (!selectedFile) return;
    upload(
      { file: selectedFile, kind, name: name.trim() || undefined },
      {
        onSuccess: () => {
          setSelectedFile(null);
          setName("");
          if (fileRef.current) fileRef.current.value = "";
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      {/* Upload form */}
      <div className="rounded-md border p-4 bg-muted/30 space-y-3">
        <p className="text-sm font-medium">Upload Document</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Kind</label>
            <Select value={kind} onValueChange={(v) => setKind(v as ListingDocumentKind)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Display name (optional)</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q1 Brochure"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium">File</label>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              onChange={handleFile}
              className="block w-full text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-input file:text-sm file:bg-background cursor-pointer"
            />
            {fileErr && <p className="text-xs text-destructive">{fileErr}</p>}
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                {selectedFile.name} ({formatBytes(selectedFile.size)})
              </p>
            )}
          </div>
        </div>
        <Button size="sm" onClick={handleUpload} disabled={uploading || !selectedFile}>
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>

      {/* List */}
      {isLoading && <p className="text-sm text-muted-foreground">Loading documents...</p>}
      {error && <p className="text-sm text-destructive">Failed to load documents.</p>}

      {!isLoading && docs.length === 0 && (
        <div className="py-8 border rounded-md bg-muted/20 text-center text-muted-foreground">
          <p className="text-sm">No documents uploaded yet.</p>
        </div>
      )}

      <div className="divide-y rounded-md border overflow-hidden">
        {docs.map((doc) => (
          <div key={doc.id} className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {doc.name ?? doc.storage_key.split("/").pop()}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-xs py-0">{doc.kind.replace("_", " ")}</Badge>
                <span className="text-xs text-muted-foreground">{formatBytes(doc.size_bytes)}</span>
                {doc.uploaded_by_name && (
                  <span className="text-xs text-muted-foreground">by {doc.uploaded_by_name}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button asChild size="icon" variant="ghost" className="h-7 w-7">
                <a href={doc.url} target="_blank" rel="noopener noreferrer" download>
                  <Download className="h-3.5 w-3.5" />
                </a>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setDeleteTarget(doc)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove document?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.name ?? "This document"} will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => {
                if (deleteTarget) remove(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
