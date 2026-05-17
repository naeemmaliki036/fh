"use client";

import { useState } from "react";
import { useMyTenant } from "@/hooks/queries/useTenants";
import { useUpdateMyTenant } from "@/hooks/mutations/useTenantMutations";
import { useAuth } from "@/contexts/AuthContext";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Same default HTML as migration 0051 — kept in sync as a constant
const PLATFORM_DEFAULT_INSTRUCTIONS =
  "<p>Hello,</p>" +
  "<p>We are requesting the documents listed below to complete the " +
  "verification process for your transaction with us. These details " +
  "are required by our compliance team and the regulator, and they " +
  "help us serve you faster.</p>" +
  "<p><strong>Please make sure each document is clear, legible, and " +
  "current (not expired).</strong></p>" +
  "<p>If you have any questions, reply to the email you received " +
  "or contact your agent. Thank you for your cooperation.</p>";

const OWNER_ROLES = new Set(["company_owner", "company_admin"]);

export default function DocumentRequestDefaultsPage(): React.ReactElement {
  const { data: tenant, isLoading } = useMyTenant();
  const { mutate: update, isPending } = useUpdateMyTenant();
  const { currentUser } = useAuth();

  const canEdit = !!(currentUser && OWNER_ROLES.has(currentUser.role));

  // Local draft — initialised from tenant once loaded
  const [draft, setDraft] = useState<string | null>(null);

  // Once the tenant data arrives, seed the draft (only the first time)
  const value =
    draft !== null
      ? draft
      : (tenant?.document_request_default_instructions ?? "");

  const handleSave = (): void => {
    update({
      document_request_default_instructions: value,
    });
  };

  const handleReset = (): void => {
    setDraft(PLATFORM_DEFAULT_INSTRUCTIONS);
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Document Request Defaults
      </h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Default Instructions</CardTitle>
          <CardDescription>
            This text is pre-loaded when an agent clicks &quot;Load default
            instructions&quot; on the new document request wizard. Uses rich
            text formatting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RichTextEditor
            value={value}
            onChange={(html) => setDraft(html)}
            placeholder="Enter default instructions for customers…"
            minHeight={220}
            disabled={!canEdit}
          />

          {canEdit && (
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={isPending}>
                {isPending ? "Saving…" : "Save"}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={isPending}>
                Reset to default
              </Button>
            </div>
          )}

          {!canEdit && (
            <p className="text-xs text-muted-foreground">
              View-only — contact a company owner or admin to change.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
